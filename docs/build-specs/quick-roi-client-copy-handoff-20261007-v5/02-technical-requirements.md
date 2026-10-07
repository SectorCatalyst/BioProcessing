# Technical requirements document

Build: quick-roi-client-copy-handoff-20261007-v5. Baselines: ../quick-roi-bottleneck-handoff-20261007-v3/02-technical-requirements.md and ../quick-roi-client-copy-20261007-v4/02-technical-requirements.md.

## Implemented delta
Changed visible copy/layout in components/quick-roi-app.tsx, field help/title content in lib/quick-roi.ts and metadata in quick-roi-site/app/layout.tsx. Removed Info import and explanatory card. Replaced editedLanes with per-lane editedFields for truthful example status. No change to numeric functions, dependency/lockfile, shared styling, data transport or backend.

## Verification
Quick production build, TypeScript and lint pass in the clean locked installation. Source calculation/parsing/formatting functions are byte-identical to the prior commit; existing arithmetic test evidence is retained. Manual browser checks cover exact subtitle, all three paths, partial/full edits, errors, scenario recovery and 390px layout without overflow. Existing CSP remains on the live HTTP200 response. No new HTML-insertion, URL-input, persistence or submission path appears in the diff.

## Release
App commit 846616024e152a3b544d8cd28a995b0e45f1d60a on codex/biopilot-quick-roi-20261007. Quick static service srv-db3501qd0e5s73f57f2g; deploy dep-db35cv9srm7s73e5uj8g live at 2026-10-07T14:27:46Z. URL https://biopilot-quick-roi.onrender.com/ . The original full calculator service/configuration was not changed. Automatic deployments remain off.

## Existing limits
Baseline shared dependency advisories, local-only DeepSec candidate triage, unperformed AI scan/penetration/accessibility certification and unvalidated benefit/conversion assumptions remain documented in the v3 pack. This copy revision does not remediate or expand those surfaces.
