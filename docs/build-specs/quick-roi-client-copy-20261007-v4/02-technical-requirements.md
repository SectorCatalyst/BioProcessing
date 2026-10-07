# Technical requirements document

Build: quick-roi-client-copy-20261007-v4. Baseline: ../quick-roi-bottleneck-handoff-20261007-v3/02-technical-requirements.md.

## Delta implementation
Revise components/quick-roi-app.tsx visible strings and initial result layout, lib/quick-roi.ts field labels/helpers, and quick-roi-site/app/layout.tsx metadata. Remove the unused Info import. Replace the edited-lane boolean with per-lane edited-field keys to distinguish all-example, mixed and all-user-entered values accurately (CP-003).

## Invariants
Retain the same numeric model, three input fields per lane, reduction range, validation, result readiness, live updates, keyboard primitives and browser-only state. No submitted/stored data or new dependency. Existing CSP/hosting isolation stays in place.

## Verification/release
Mirror changed source into the existing clean locked verification installation; run the quick build and lint. Browser-check changed states, labels and responsive layout, then commit/push and trigger only the quick static service. Existing model test evidence remains authoritative because calculations are unchanged. Six reconciled handoff documents will record actual release and verification.
