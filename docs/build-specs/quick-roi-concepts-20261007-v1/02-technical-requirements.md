# Technical requirements document

Build: BioPilot Quick ROI — concept evaluation v1
Date: 2026-10-07
Branch: codex/biopilot-quick-roi-20261007
Baseline: 2bb6adf, current BioPilot assessment model 2.2.1
Status: proposed concepts; no calculator implementation or deployment yet.


## Baseline
The repository is Next.js 16 / React 19 / TypeScript with Tailwind and existing reusable input/button primitives. app/page.tsx mounts BioPilotFitAssessmentApp. The current calculation module is lib/biopilot-fit-assessment.ts, model 2.2.1. render.yaml targets an existing production service and a different deployment branch; do not reuse that service as a new-preview deployment without explicit configuration isolation.

## Recommended architecture
Use this repository on the new branch, add a client-side Quick ROI component and a pure calculation module, and expose a /quick-roi route in a separate preview service. Reuse existing fonts, approved logo and accessible primitives. Keep phase-one arithmetic deterministic and browser-local; no LLM, paid API, database or new chart library is required.

Routes considered: (1) existing stack plus an isolated preview service, recommended for brand/model reuse; (2) standalone static microsite, smaller payload but duplicated styling/model governance; (3) a quick mode inside the current live assessment, less isolation and contrary to the requested separate release surface. No route is implemented yet.

## Technical requirements
- TR-001 -> PR-001/007: input state and result calculations run locally, without lead/progress POST requests before voluntary next-stage action.
- TR-002 -> PR-003/004: use a typed pure model with named range assumptions and capacity/cash/investment categories. Do not reuse fit-score uplift as verified empirical improvement.
- TR-003 -> PR-005: carry only explicitly chosen inputs into the next stage. Prefer local/session transfer or a clear handoff; do not put customer financial inputs or contact details in URLs.
- TR-004 -> PR-006: keep original entrypoint and existing assessment intact; new preview service points only at this branch and returns its own verified URL. Public hostname availability is unresolved.
- TR-005 -> PR-008: support finite nonnegative values, formatting, whole-number count validation, accessible names, visible focus, error recovery and narrow-width reflow. Meaning must not depend on color alone.
- TR-006: no server calls for ordinary recalculation. Performance target is immediate feedback; actual payload, rendering and input latency are to be measured on the built version.
- TR-007: any later optional lead endpoint reuses authorized first-party guards and separate development configuration. No production notification tests or real customer details are used during preview QA.

## Verification plan
Use the repository's established build/lint checks after implementation. Add focused pure-model checks for units, zero values, range ordering, exact example arithmetic, nonfinite input rejection and separation of capacity from cash. Browser-check result-before-contact, assumptions, next-stage action, keyboard flow and desktop/mobile states. Verify the new service URL against the intended branch before declaring a public preview. Concept images alone establish none of these checks.
