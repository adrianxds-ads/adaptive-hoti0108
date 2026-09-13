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

**Question bank loaded; quiz interface still in bootstrap.** The bank contains 130 audited official question instances across 10 assessments. Original IDs, wording, options, academic/platform answer distinctions and ambiguity metadata are preserved. No generated questions are included.

Canonical source: `HOTI0108_MF1074_3_BANCO_130_MASTER.json` in Drive, `#HOTI0108/04_EXAMENES_TESTS_Y_SIMULACROS/00_BANCO_TECNICO_APP`. The source SHA-256 is recorded in `docs/HOTI0108_MF1074_3_BANCO_130_AUDITORIA.txt`; it applies to the original master bytes, before adding the application envelope fields. Future quiz scoring must preserve the two special cases documented there.

## Data contract

- `data/questions-mf1074.json` → official question bank
- `data/manuals-index.json` → canonical manual map
- `data/progress-schema.json` → local progress contract
- `content/UFxxxx/` → structured official-manual knowledge packages

See `docs/ADAPTIVE_HOTI_SPEC.md` for architecture rules.
