from typing import Protocol, runtime_checkable
from app.intelligence.schemas import CompanionMessage, SentimentResult


@runtime_checkable
class IntelligenceProvider(Protocol):
    """Protocol defining the seam for AI-driven capabilities."""

    async def generate_companion_reply(
        self,
        user_name: str,
        messages: list[CompanionMessage],
        risk_level: str,
        interests: list[str],
    ) -> str:
        """Generate an empathetic, context-aware companion response."""
        ...

    async def analyze_sentiment(self, text: str) -> SentimentResult:
        """Evaluate the emotional valence and sentiment category of a reflection."""
        ...

    async def rank_resources(
        self,
        interest: str,
        preference: str,
        resources: list[dict],
    ) -> list[int]:
        """Rank resource candidate indices from most to least relevant."""
        ...
