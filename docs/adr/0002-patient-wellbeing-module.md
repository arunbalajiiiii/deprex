# 0002: Server-Side Clinical Invariants and Unified Wellbeing Summary

We unified scattered clinical assessment scoring, sentiment trends, and wellbeing event logging behind a single Patient Wellbeing module. The standardized PHQ-9 core remains server-enforced for valid clinical tracking, while Gemini contextualizes results into personalized reflection steps and atomic events are logged automatically.

## Considered Options
- Client-calculated scores and manual delta logging (rejected: clinical risk invariants leak to browser, prone to tampering or drift).
- Dynamically generated LLM screening questions (rejected: loses standardized PHQ-9 psychometric validity across sequential sessions).
- Unified Patient Wellbeing Module with server-side PHQ-9 invariants and Gemini contextual insights (accepted: preserves clinical rigor while providing personalized user reflections).
