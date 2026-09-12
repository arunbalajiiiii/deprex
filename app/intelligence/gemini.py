import asyncio
import logging
from typing import Optional
from google import genai
from google.genai import types

from app.intelligence.provider import IntelligenceProvider
from app.intelligence.schemas import CompanionMessage, SentimentResult, RankResult
from app.intelligence.exceptions import IntelligenceUnavailableError

logger = logging.getLogger(__name__)


class GeminiAdapter(IntelligenceProvider):
    """Production adapter using Google Gemini."""

    def __init__(
        self,
        api_key: str,
        model: str = "gemini-3.6-flash",
    ):
        if not api_key:
            raise ValueError("GeminiAdapter requires a non-empty api_key.")
        self.client = genai.Client(api_key=api_key)
        self.model = model

    async def _generate_with_fallback(self, **kwargs):
        # Candidates list prioritizing tested active Gemini 3.x Flash models
        fallback_models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.7-flash", "gemini-3-flash-preview"]
        candidates = [self.model] + [m for m in fallback_models if m != self.model]
        last_error = None

        for m in candidates:
            for attempt in range(2):
                try:
                    kwargs["model"] = m
                    return await self.client.aio.models.generate_content(**kwargs)
                except Exception as e:
                    last_error = e
                    logger.warning("Gemini model %s (attempt %d/2) failed: %s", m, attempt + 1, e)
                    await asyncio.sleep(0.5)
        raise last_error

    async def generate_companion_reply(
        self,
        user_name: str,
        messages: list[CompanionMessage],
        risk_level: str,
        interests: list[str],
    ) -> str:
        interests_str = ", ".join(interests) if interests else "general"

        system_instruction = (
            f"You are a compassionate AI mental health support companion for {user_name}. "
            f"Their interests include: {interests_str}. "
            f"Their current risk level is {risk_level}. "
            "Be warm, empathetic, and non-clinical. Never diagnose. "
            "Reference their interests naturally when helpful. "
            "If risk is high, gently encourage professional help and mention 988 once. "
            "Keep responses concise — 2 to 4 sentences unless more depth is clearly needed."
        )

        formatted_contents = []
        # Keep last 20 messages for context window efficiency
        for m in messages[-20:]:
            role = "model" if m.role == "assistant" else "user"
            formatted_contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=m.content)],
                )
            )

        if not formatted_contents:
            formatted_contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text="Hello")],
                )
            )

        try:
            response = await self._generate_with_fallback(
                contents=formatted_contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    max_output_tokens=2048,
                ),
            )
            return response.text or "I am here with you. Take things one step at a time."
        except Exception as e:
            logger.error("Gemini companion chat generation failed: %s", e)
            return (
                f"I'm right here with you, {user_name}. Take things one gentle breath at a time. "
                "I'm listening closely—what's on your mind right now?"
            )

    async def analyze_sentiment(self, text: str) -> SentimentResult:
        prompt = (
            "Evaluate the emotional valence (-1.0 to 1.0) and sentiment category "
            "('positive', 'neutral', or 'negative') for this journal reflection:\n\n"
            f"{text[:1000]}"
        )

        try:
            response = await self._generate_with_fallback(
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SentimentResult,
                    max_output_tokens=1024,
                ),
            )
            if hasattr(response, "parsed") and response.parsed is not None:
                return response.parsed
            if response.text:
                return SentimentResult.model_validate_json(response.text)
            return SentimentResult(score=0.0, label="neutral")
        except Exception as e:
            logger.warning("Sentiment analysis failed, falling back to neutral: %s", e)
            return SentimentResult(score=0.0, label="neutral")

    async def rank_resources(
        self,
        interest: str,
        preference: str,
        resources: list[dict],
    ) -> list[int]:
        if not preference.strip() or not resources:
            return list(range(len(resources)))

        resource_list = "\n".join(
            f"{i}. \"{r.get('title', '')}\" — {r.get('note', '')}"
            for i, r in enumerate(resources)
        )

        prompt = (
            f"A user likes \"{interest}\". They described their preference as:\n"
            f"\"{preference}\"\n\n"
            f"Available candidate resources:\n{resource_list}\n\n"
            "Rank the 0-indexed resource candidate numbers in order from most relevant to least relevant."
        )

        try:
            response = await self._generate_with_fallback(
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=RankResult,
                    max_output_tokens=1024,
                ),
            )
            if hasattr(response, "parsed") and response.parsed is not None:
                rank_res = response.parsed
            elif response.text:
                rank_res = RankResult.model_validate_json(response.text)
            else:
                return list(range(len(resources)))

            # Validate that returned indices are valid
            valid_indices = [idx for idx in rank_res.order if 0 <= idx < len(resources)]
            # Append any missing indices
            missing = [i for i in range(len(resources)) if i not in valid_indices]
            return valid_indices + missing
        except Exception as e:
            logger.warning("Resource ranking failed, returning original order: %s", e)
            return list(range(len(resources)))
