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
