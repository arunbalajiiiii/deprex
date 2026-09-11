# 0001: Deep Intelligence Provider Seam with Gemini Adapter

We replaced direct Anthropic SDK calls scattered across HTTP routers with a unified Intelligence Provider protocol at a deep seam. We adopted Google Gemini (`gemini-2.5-flash`) via structured outputs for production, backed by an in-memory double for zero-cost offline testing and dependency injection via FastAPI.

## Considered Options
- Direct Anthropic/Gemini SDK calls in `ai.py` and `journal.py` (rejected: duplicates prompt logic, leaks external failure modes, prevents offline testing).
- Global mock flags (rejected: couples test state to runtime configuration).
- Protocol with `GeminiAdapter` and `InMemoryIntelligenceAdapter` (accepted: satisfies the two-adapter rule and decouples HTTP layer from AI provider).
