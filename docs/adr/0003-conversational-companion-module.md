# 0003: Persistent Conversational Companion and Deterministic Crisis Interventions

We established a deep Companion module that maintains persistent conversational history in the `ChatMessage` table and enforces a deterministic Crisis Guardrail layer for acute self-harm expressions, bypassing probabilistic LLM calls to immediately deliver 988 Lifeline details and record audit events.

## Considered Options
- Stateless ephemeral chat in browser memory (rejected: conversations are lost across page reloads and devices, no audit trail).
- Prompt-only crisis intervention (rejected: non-deterministic, introduces latency and hallucination risks during acute emergencies).
- Persistent ChatMessage store with deterministic crisis interception and server-loaded clinical context (accepted: guarantees persistent user history and deterministic crisis safety).
