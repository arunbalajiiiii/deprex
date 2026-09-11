# Deprex Domain Model

Deprex provides conversational mental health support, emotional sentiment tracking, and curated relief resources.

## Language

**Companion**:
An empathetic AI persona providing non-clinical, compassionate dialogue tailored to user risk and interest preferences.
_Avoid_: Chatbot, bot, assistant, agent

**Intelligence Provider**:
The internal adapter delivering model reasoning, sentiment scoring, and resource personalization across seams.
_Avoid_: LLM service, AI client, third-party API

**Journal Entry**:
A user-written reflection evaluated for emotional valence and sentiment category.
_Avoid_: Diary note, post, blog

**Assessment**:
A structured mental health screening questionnaire (PHQ-9) assessing depression risk severity.
_Avoid_: Survey, quiz, test

**Relief Resource**:
A curated wellness activity, interactive tool, or external link associated with a user interest.
_Avoid_: Content item, media, perk

**Severity Band**:
The standardized PHQ-9 depression classification (Minimal, Mild, Moderate, Moderately Severe, Severe) derived server-side.
_Avoid_: Rating, category, tier

**Patient Wellbeing Summary**:
An aggregated clinical snapshot combining recent assessment risk, sentiment history, and current mental health trajectory.
_Avoid_: Profile, dashboard data, stats

**Crisis Guardrail**:
A deterministic safety filter intercepting explicit self-harm expressions to immediately trigger crisis lifeline intervention.
_Avoid_: Content moderator, censorship, keyword blocker

**Chat History**:
The persistent sequence of conversational exchanges between a User and their Companion recorded in the database.
_Avoid_: Logs, transcript, chat dump

**Resource Catalog**:
The curated, structured directory of wellness activities, breathing protocols, and interest resources.
_Avoid_: Static data, links list, constants
