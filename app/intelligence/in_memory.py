from app.intelligence.provider import IntelligenceProvider
from app.intelligence.schemas import CompanionMessage, SentimentResult
from app.intelligence.exceptions import IntelligenceUnavailableError


class InMemoryIntelligenceAdapter(IntelligenceProvider):
    """Deterministic, zero-cost in-memory test double for automated test runs."""

    def __init__(self, simulate_outage: bool = False):
        self.simulate_outage = simulate_outage

    async def generate_companion_reply(
        self,
        user_name: str,
        messages: list[CompanionMessage],
        risk_level: str,
        interests: list[str],
    ) -> str:
        if self.simulate_outage:
            raise IntelligenceUnavailableError("Simulated upstream provider is unavailable.")

        if not messages:
            return f"Hello {user_name}, I'm here for you."

        last_message = messages[-1].content.lower()

        if "simulate_error" in last_message:
            raise IntelligenceUnavailableError("Simulated companion service is unavailable.")

        if risk_level == "high":
            return (
                f"I hear you, {user_name}, and I want you to know you're not alone. "
                "Please remember that support is available 24/7 at 988. I'm right here with you."
            )

        interest_text = f" You might also find some solace in {interests[0]}." if interests else ""
        return f"Thank you for sharing that with me, {user_name}. Take things one gentle step at a time.{interest_text}"

    async def analyze_sentiment(self, text: str) -> SentimentResult:
        if self.simulate_outage:
            # Non-critical operations fall back to neutral
            return SentimentResult(score=0.0, label="neutral")

        lower = text.lower()
        positive_words = ["happy", "good", "great", "calm", "peace", "hope", "love", "better", "grateful"]
        negative_words = ["sad", "depressed", "hopeless", "down", "anxious", "pain", "hurt", "terrible", "crying"]

        pos_count = sum(1 for w in positive_words if w in lower)
        neg_count = sum(1 for w in negative_words if w in lower)

        if pos_count > neg_count:
            return SentimentResult(score=0.7, label="positive")
        elif neg_count > pos_count:
            return SentimentResult(score=-0.7, label="negative")
        return SentimentResult(score=0.0, label="neutral")

    async def rank_resources(
        self,
        interest: str,
        preference: str,
        resources: list[dict],
    ) -> list[int]:
        if not resources:
            return []

        if not preference.strip():
            return list(range(len(resources)))

        # Prioritize items matching preference words
        pref_words = set(preference.lower().split())
        scored = []
        for i, res in enumerate(resources):
            title_words = set(res.get("title", "").lower().split())
            note_words = set(res.get("note", "").lower().split())
            matches = len(pref_words & (title_words | note_words))
            scored.append((-matches, i))

        scored.sort()
        return [idx for _, idx in scored]
