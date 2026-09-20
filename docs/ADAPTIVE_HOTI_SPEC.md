# Adaptive HOTI0108 · Architecture v0.1

## Reference implementation

Adaptive HOTI0108 is intentionally derived from **Adaptive English** and must preserve its established interaction language and **Adrián Visual System (AVS 2.0)**.

Reference repository: `adrianxds-ads/adaptive-english`
Reference commit at bootstrap: `6a6f78c9a91179c00240da2127d7429fde5cc9d9`

## Non-negotiable design rule

Do not redesign what already works in Adaptive English. Reuse its colour language, mobile-first PWA behaviour, answer interaction, timer, feedback, progression feel and game-like visual identity unless a HOTI-specific learning requirement makes a component irrelevant.

## Three independent layers

1. **QUESTIONS** — official exam/test questions, literal wording, options and verified answer.
2. **KNOWLEDGE** — official manuals mapped as MF → UF → UD → section → page → excerpt.
3. **PROGRESS** — attempts, correctness, latency, exposure and mastery signals.

These layers must remain separable so a question bank or manual can be replaced without destroying user progress.

## Official-source policy

The main HOTI question bank is **official-only**. Generated questions, if ever added, must live in a visibly separate practice mode and must never be labelled as official.

## Initial scope

`HOTI0108 → MF1074_3 → UF0080 + UF0081 + UF0082`

Manual filenames are canonical and mirror the Google Drive naming convention.

## Planned metrics

Keep only metrics that help exam preparation: coverage, first-attempt accuracy, recent accuracy, average response time, automaticity, repeated misses, mastery by UF/UD, and an exam-readiness indicator. English-specific grammar metrics are not inherited by default.

## Multi-module and document-ingestion rule

HOTI0108 is the application root. Modules are independent study domains: question banks, manual packages and progress must never be merged across MF codes by accident. `data/course-state.json` is the app-facing course registry; `data/manuals-index.json` is the source/publication registry.

Document intake has two states: **staged original** and **published manual**. Staging records the original bytes, UF assignment, size, import time and SHA-256. Publication is allowed only after the ingestion pipeline has preserved the full source, page order and source hash. AI-derived summaries, notes, flashcards or generated practice material are downstream study aids and never replace the official source layer.

## MAQUETA 11 sequence contract

The app and document workflow share one **operational itinerary address**:

`MÓDULO.UF.UD.ACTIVIDAD`

Example: `2.1.1.1`.

The first digit is the Maqueta 11 / itinerary module position, not the normative ordinal from the certificate. Therefore MF0268_3 can be `M02` operationally while remaining **Módulo Formativo 3** officially. Both identities must be stored separately.

Campus is authoritative for live activity counts. UF0049 is currently validated as 5 + 5 + 6 = 16 activities. UF0077 activity totals must remain unknown until direct Campus validation; applications must never infer or display 20 as confirmed. A manual belongs to a UF, a test to a UF or UD, and an activity to exactly one UD.
