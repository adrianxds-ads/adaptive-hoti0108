# Adaptive HOTI0108

Adaptive study PWA for the **HOTI0108 · Promoción Turística Local e Información al Visitante** certificate.

## Current scope

- `MF1074_3 · Información turística`
- `UF0080 · Organización del servicio de información turística local`
- `UF0081 · Gestión de la información y documentación turística local`
- `UF0082 · Información y atención al visitante`

## Design lineage

This app is the HOTI0108 sibling of **Adaptive English**, using the same **Adrián Visual System (AVS 2.0)** and the same core interaction philosophy.

Reference source: `adrianxds-ads/adaptive-english` at bootstrap commit `6a6f78c9a91179c00240da2127d7429fde5cc9d9`.

## Status

**Study and game/test modes are available.** The bank contains 130 audited official question instances across 10 assessments. Original IDs, wording, options, academic/platform answer distinctions and ambiguity metadata are preserved. No generated questions are included.

Canonical source: `HOTI0108_MF1074_3_BANCO_130_MASTER.json` in Drive, `#HOTI0108/04_EXAMENES_TESTS_Y_SIMULACROS/00_BANCO_TECNICO_APP`. The source SHA-256 is recorded in `docs/HOTI0108_MF1074_3_BANCO_130_AUDITORIA.txt`; it applies to the original master bytes, before adding the application envelope fields. Future quiz scoring must preserve the two special cases documented there.

## Data contract

- `data/questions-mf1074.json` → official question bank
- `data/manuals-index.json` → canonical manual map
- `data/progress-schema.json` → local progress contract
- `content/UFxxxx/` → structured official-manual knowledge packages

See `docs/ADAPTIVE_HOTI_SPEC.md` for architecture rules.

## Manual reader

`manuals.html` provides the complete scanned UF0080 (272 pages), UF0081 (256) and UF0082 (122) manuals: 650 pages. It includes a basic section index, page navigation, 100–300% zoom, one bookmark per manual and last-page memory stored separately from exam progress. Index search searches section titles only; no OCR/full-text search or editable text is claimed. PDF page numbering is distinct from the printed page references in the index. The exact original PDFs remain the master sources in Drive.

Rebuild page images with `python scripts/build_manual_pages.py <source-directory>` (PyMuPDF and Pillow). Source SHA-256 hashes in `data/manuals-index.json` enforce identity with the attached originals. Every original page is rendered, including blank pages and solutions; only exterior whitespace is trimmed. The reader fetches a single page at a time. Its separate cache keeps up to 36 visited page images for best-effort offline reading; it does not pre-download entire manuals.

## Study and game (v0.6)

The home page offers Study (one literal question, original A–D options, expandable answer, UF/assessment filters and saved position) and Game/Test (10/15/all questions, optional 30/60-second timer, immediate feedback, points, streaks, session resume and mistake review). Default timing is unlimited. Questions shuffle; options never shuffle.

Question and answer text comes directly from the audited bank. UF0081_UD2_Q07 uses C for the exam key; the academically supported B is neutral and unpenalized. UF0082_FINAL_Q08 is excluded from scoring for every selection because the platform key is unknown; A is displayed as the preserved academic key. Neither neutral case breaks a streak. Neutral attempts are excluded from accuracy denominators.

Progress is namespaced under `studyGame` inside the existing `adaptive_hoti0108_v1` storage object, preserving other fields and the independent manual reader storage. Answer disclosure in study mode never awards points or counts as a correct test response. Scores count practice, not official exam readiness. No questions/options are rewritten or generated.

## Multi-module course shell (v1.9)

The app now treats HOTI0108 as the stable root rather than MF1074_3. `data/course-state.json` records the active module and its academic milestones. MF0268_3 is active with UF0049 and UF0077; MF1074_3 remains a completed module whose audited 130-question bank is preserved unchanged.

The manual library is module-aware. Pending units can exist in the catalog before a manual is published. The document intake panel accepts PDF/TXT/MD/JSON originals, records the target UF, stores the original locally in IndexedDB and computes a SHA-256 fingerprint. A staged document is not presented as a validated manual until the existing ingestion pipeline has rendered and audited it.

This separation is deliberate: selecting a file is easy, but publication requires source identity, complete-page preservation and validation. The static GitHub Pages client never silently rewrites or summarizes an uploaded manual.

## Campus-master course map (v2.1)

The primary navigation follows the HOTI0108 operational itinerary: **M02 -> UF -> UD -> activity**. Sequence codes such as `2.1.1.1` are internal Maqueta 11 addresses, not normative module numbers. MF0268_3 is officially Module Formativo 3, while `M02` means the second module in the current course itinerary.

Campus evidence overrides older internal counts. UF0049 (`2.1`) has 3 UDs and **16 Campus-confirmed activities**: 5 + 5 + 6. UF0077 (`2.2`) has 8 UDs and a confirmed calendar, but its activity count remains **unknown** until the real Campus activity lists are inspected. The previous internal value of 20 is not rendered as fact.

MF1074_3 remains explicitly isolated as M01 archive. Its 130 audited questions, statistics and manual evidence are not presented as part of MF0268_3.

## Activity organizer (v2.2 · no API)

`activities.html` is the organizational center for coursework. Each Campus-confirmed activity has one canonical card keyed by its Maqueta 11 sequence. The card keeps academic identity, due date/status, manual links to Campus/Chat/Google Docs/final PDF, literal official-source fields and the student's three Maqueta 11 work areas.

Official source and student work are visually and structurally separated. Questions are stored as independent literal prompt/answer pairs. The app does not call ChatGPT or generate text. Local edits are persisted in `adaptive_hoti0108_activity_hub_v1`; untouched activities do not create empty local records. A JSON export provides a manual backup.

UF0077 does not create activity cards until its real Campus activity lists are validated. This prevents the old provisional count from becoming duplicated or fabricated coursework.

## UF0049 RAW manual (v2.3)

UF0049 now has a verified RAW PDF source plus the same rendered-page reader used by the archived manuals. The canonical app copy is `content/UF0049/source/HOTI0108_MF0268_3_UF0049_MANUAL_RAW.pdf`: 206 PDF pages, SHA-256 `0f3489ae0cbe8ea3e4231f020db9f40f9c6a53286d783b6b3a60be04989f1d5c`. The same bytes are stored in the canonical UF0049 Drive manual folder.

The reader exposes all 206 pages as WEBP images under `content/UF0049/pages/` and includes a direct **PDF RAW original** link. No OCR or semantic transcription has been used. A later structured JSON transcription is expected to become an additional source/study layer without replacing this RAW PDF.
