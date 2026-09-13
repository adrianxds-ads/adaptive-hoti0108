# Adaptive HOTI0108 · Bootstrap audit v0.2

Date: 2026-09-13
Reference: Adaptive English v2.4, bootstrap commit `6a6f78c9a91179c00240da2127d7429fde5cc9d9`.

## Verdict

The repository is technically healthy and the data architecture is sound, but the current screen is only a bootstrap shell. It uses the correct AVS 2.0 family, yet it is not intended to be the final visual clone of Adaptive English.

## Already correct

- AVS 2.0 copied from the working English app.
- PWA manifest and installable icon set present.
- GitHub Pages deployed successfully.
- HOTI storage namespace separated from English.
- Questions, manuals and progress kept as independent layers.
- Official-only question-bank policy established.
- MF1074_3 / UF0080 / UF0081 / UF0082 hierarchy established.
- Service worker changed to the same network-first update strategy used by Adaptive English to reduce stale-cache problems.

## Fidelity gap

The bootstrap currently reproduces colour language and general panel styling only. It does not yet reproduce the full Adaptive English interaction shell: dashboard density, HUD, 2×2 answer board, 10-second timer, sound/haptics, target, results, errors, statistics, import/export, coach or adaptive review.
## 1:1 components to inherit from Adaptive English

- Forest/teal/blue/indigo/amber/gold ambient progression.
- Main dashboard composition and typography hierarchy.
- Coverage and mastery bars.
- Six-card statistics grid.
- Level/session counter.
- Fixed quiz HUD and countdown clock.
- Four large coloured answer cards in a 2×2 grid.
- Correct/incorrect AVS semantics, dwell timing, sound and haptics.
- Adaptive TARGET and end-of-level score presentation.
- Statistics screen, expandable performance graph and error review.
- Export/import/reset progress controls.
- Mobile-first PWA behaviour and offline fallback.

## HOTI substitutions

- `AE Rating` → `Exam Readiness` / HOTI performance signal.
- `Keys mastered` → mastered exam concepts or mapped topics.
- `Unique phrases` → unique official questions seen.
- `Repeated phrases` → repeated official questions.
- English micro-lesson → official-manual explanation linked to UF/UD/page.
- Grammar-skill ranking → UF/UD/topic ranking.
- Campaign readiness → readiness for the current MF1074_3 exam.
- Typical Learner model and English reading-load analytics are not inherited by default.

## Next implementation gate

Do not invent HOTI content to make the UI look complete. Build the cloned interaction shell against an empty bank, then connect the verified official question bank when available.