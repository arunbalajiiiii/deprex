import logging
from app.config import settings
from app.intelligence.provider import IntelligenceProvider
from app.intelligence.gemini import GeminiAdapter
from app.intelligence.in_memory import InMemoryIntelligenceAdapter

logger = logging.getLogger(__name__)

_singleton_instance: IntelligenceProvider | None = None


def get_intelligence() -> IntelligenceProvider:
    """FastAPI dependency provider for the IntelligenceProvider seam."""
    global _singleton_instance
    if _singleton_instance is not None:
        return _singleton_instance

    api_key = (settings.GEMINI_API_KEY or "").strip()
    if api_key and api_key != "your_gemini_api_key_here":
        _singleton_instance = GeminiAdapter(api_key=api_key, model=settings.GEMINI_MODEL)
    else:
        logger.warning("GEMINI_API_KEY not set or is placeholder. Using InMemoryIntelligenceAdapter for local dev/testing.")
        _singleton_instance = InMemoryIntelligenceAdapter()

    return _singleton_instance


def reset_intelligence_dependency() -> None:
    """Helper for test suites to reset singleton state."""
    global _singleton_instance
    _singleton_instance = None
