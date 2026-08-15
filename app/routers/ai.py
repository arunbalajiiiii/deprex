from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from google import genai
from google.genai import types
import json

from app.models.database import get_db, User
from app.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/ai", tags=["ai"])

# Initialize Google GenAI client (resolves key from settings or GEMINI_API_KEY env)
client = genai.Client(api_key=settings.GEMINI_API_KEY or None)


# ── Schemas ────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str       # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    risk: Optional[float] = 0.2
    interests: Optional[list[str]] = []


class PersonaliseRequest(BaseModel):
    interest: str
    description: str            # user's free text
    resources: list[dict]       # [{title, note, cta, ...}, ...]


# ── Chat ───────────────────────────────────────────────────────────────────────

@router.post("/chat")
async def chat(
    body: ChatRequest,
    user: User = Depends(get_current_user),
):
    """Send a chat message. API key never leaves the server."""
    risk_label = (
        "high" if body.risk > 0.6 else
        "moderate" if body.risk > 0.35 else
        "low"
    )
    interests_str = ", ".join(body.interests) if body.interests else "general"

    system = (
        f"You are a compassionate AI mental health support companion for {user.name}. "
        f"Their interests include: {interests_str}. "
        f"Their current risk level is {risk_label}. "
        "Be warm, empathetic, and non-clinical. Never diagnose. "
        "Reference their interests naturally when helpful. "
        "If risk is high, gently encourage professional help and mention 988 once. "
        "Keep responses concise — 2 to 4 sentences unless more depth is clearly needed."
    )

    # Convert chat history to Gemini's format ("user" and "model")
    contents = []
    for m in body.messages[-20:]:
        role = "model" if m.role == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=m.content)]))

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system,
                max_output_tokens=400,
            )
        )
        return {"reply": response.text}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")


# ── Personalise resources ─────────────────────────────────────────────────────

@router.post("/personalise")
async def personalise_resources(
    body: PersonaliseRequest,
    user: User = Depends(get_current_user),
):
    """
    Given a user's free-text description of what they enjoy about an interest,
    return the resource list reordered from most to least relevant.
    """
    if not body.description.strip() or not body.resources:
        return {"order": list(range(len(body.resources)))}

    resource_list = "\n".join(
        f"{i+1}. \"{r['title']}\" — {r.get('note','')}"
        for i, r in enumerate(body.resources)
    )

    prompt = (
        f"A user likes \"{body.interest}\". They described their preference as:\n"
        f"\"{body.description}\"\n\n"
        f"Available resources:\n{resource_list}\n\n"
        f"Return a JSON array of the resource numbers ordered from most to least relevant "
        f"for this user. Example: [3,1,4,2]."
    )

    try:
        # Use Structured Outputs to guarantee a list of integers
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=list[int],
            )
        )
        order = json.loads(response.text)
        # Convert 1-indexed to 0-indexed, clamp to valid range
        order_0 = [n - 1 for n in order if 0 < n <= len(body.resources)]
        # Append any missing indices
        included = set(order_0)
        for i in range(len(body.resources)):
            if i not in included:
                order_0.append(i)

        return {"order": order_0}
    except Exception:
        return {"order": list(range(len(body.resources)))}


# ── Conversational Onboarding ──────────────────────────────────────────────────

class OnboardMessage(BaseModel):
    role: str       # "user" or "assistant"
    content: str


class OnboardRequest(BaseModel):
    messages: list[OnboardMessage]


class SubInterestItem(BaseModel):
    interest: str
    description: str


class OnboardResponseSchema(BaseModel):
    reply: str
    complete: bool
    interests: list[str]
    sub_interests: list[SubInterestItem]


@router.post("/onboard/chat")
async def onboard_chat(body: OnboardRequest):
    """
    Onboarding assistant chat. Warmly interview the user to learn about their context,
    interests, and specific preferences, and output structured interests when done.
    """
    system_prompt = (
        "You are a warm, compassionate AI onboarding guide for the Deprex mental health support platform. "
        "Your goal is to converse with the user to discover their hobbies, interests, and what they enjoy "
        "about them. Use these to suggest specific stress-relief and mindfulness activities. "
        "Keep the conversation natural, friendly, and structured. Ask one warm question at a time. "
        "Once you have identified between 3 and 5 specific interests (e.g. Chess, Reading Books, Painting Miniatures, etc.) "
        "and understood what the user enjoys about them (their sub-interests), transition to completion. "
        "\n\n"
        "When onboarding is complete, set \"complete\": true, list the specific interests in the \"interests\" array, "
        "and provide their detailed sub-interest descriptions in the \"sub_interests\" array of objects, e.g., [{\"interest\": \"Chess\", \"description\": \"Solving tactical puzzles\"}]."
    )

    contents = []
    for m in body.messages:
        role = "model" if m.role == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=m.content)]))

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=OnboardResponseSchema,
            )
        )
        data = json.loads(response.text)
        sub_interests_dict = {}
        if isinstance(data.get("sub_interests"), list):
            for item in data["sub_interests"]:
                if isinstance(item, dict) and "interest" in item and "description" in item:
                    sub_interests_dict[item["interest"]] = item["description"]
        elif isinstance(data.get("sub_interests"), dict):
            sub_interests_dict = data["sub_interests"]

        return {
            "reply": data.get("reply", ""),
            "complete": data.get("complete", False),
            "interests": data.get("interests", []),
            "sub_interests": sub_interests_dict
        }
    except Exception as e:
        return {
            "reply": f"AI service error: {str(e)}",
            "complete": False,
            "interests": [],
            "sub_interests": {}
        }


# ── Custom AI Mindfulness Guide ────────────────────────────────────────────────

class CustomGuideRequest(BaseModel):
    interest: str
    description: str


@router.post("/custom-guide")
async def custom_guide(body: CustomGuideRequest):
    """
    Generate a personalized mindfulness guide for a custom interest that is not in the static catalog.
    """
    prompt = (
        f"The user enjoys the activity: \"{body.interest}\".\n"
        f"Here is what they enjoy about it or how they practice it: \"{body.description}\".\n\n"
        f"Generate a customized, compassionate mindfulness guide on how they can use this interest "
        f"to relieve stress and practice mindfulness. Keep it concise, structured in 3 to 4 bullet points, "
        f"and output ONLY the bullet points in plain text/markdown. No introductory or concluding remarks."
    )
    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
        )
        return {"guide": response.text.strip()}
    except Exception as e:
        return {"guide": f"• Engage in {body.interest} with full present-moment awareness.\n• Focus on the sensory details and flow of the activity.\n• Use the natural rhythm of the task to anchor your mind."}


# ── AI Resource Generator for Any Interest / Refresh ───────────────────────────

class ResourceItemSchema(BaseModel):
    type: str     # "embed" or "link"
    title: str
    note: str
    thumb: str    # emoji
    url: str
    cta: str


class GenerateResourcesResponseSchema(BaseModel):
    resources: list[ResourceItemSchema]


class GenerateResourcesRequest(BaseModel):
    interest: str
    description: Optional[str] = ""
    exclude_titles: Optional[list[str]] = []


@router.post("/generate-resources")
async def generate_resources(body: GenerateResourcesRequest):
    """
    Generate 4 fresh, high-quality, interest-tailored online resources using Gemini.
    """
    exclude_str = (
        f"Do NOT include resources with these titles: {', '.join(body.exclude_titles)}."
        if body.exclude_titles else ""
    )
    pref_str = (
        f"User preference / sub-interest: '{body.description}'."
        if body.description and body.description.strip() else ""
    )

    prompt = (
        f"Generate 4 distinct, working, high-quality online resources or activities for someone who enjoys '{body.interest}'.\n"
        f"{pref_str}\n"
        f"{exclude_str}\n\n"
        f"Provide real, accessible web resources (free web games, interactive apps, tutorials, videos, or tools).\n"
        f"Return exactly 4 resources."
    )

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction="You are an expert AI resource curator for mental wellness and hobbies. Provide practical, high-quality, safe web resources.",
                response_mime_type="application/json",
                response_schema=GenerateResourcesResponseSchema,
            )
        )
        data = json.loads(response.text)
        return {"resources": data.get("resources", [])}
    except Exception as e:
        print("Generate resources error:", e)
        return {"resources": [
            { "type": "link", "title": f"Explore {body.interest} Online", "note": f"Find interactive games, tutorials, and communities for {body.interest}.", "thumb": "🎯", "url": f"https://www.google.com/search?q={body.interest}+online+game+or+tool", "cta": "Explore Now" },
            { "type": "embed", "title": f"{body.interest} Guided Session", "note": f"A peaceful video guide focused on {body.interest}.", "thumb": "🧘", "url": "https://www.youtube.com/embed/n6RbW2BAMBY", "cta": "Watch Guide" },
            { "type": "link", "title": f"Interactive {body.interest} Practice", "note": f"Practice and enjoy {body.interest} online.", "thumb": "✨", "url": f"https://www.google.com/search?q={body.interest}+free+interactive", "cta": "Start Practice" },
            { "type": "link", "title": "Nature Soundscapes", "note": "Listen to soothing ambient nature sounds for deep grounding.", "thumb": "🌊", "url": "https://mynoise.net/NoiseMachines/rainNoiseGenerator.php", "cta": "Listen Now" }
        ]}
