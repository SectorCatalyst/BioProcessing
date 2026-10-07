# Technical requirements document

Build: BioPilot Quick ROI — concept evaluation v1
Date: 2026-10-07
Branch: codex/biopilot-quick-roi-20261007
Baseline: 2bb6adf, current BioPilot assessment model 2.2.1
Status: selected Bottleneck Finder; implementation-ready; no calculator implementation or deployment yet.


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

## Selected implementation decision — 2026-10-07
The user selected Bottleneck Finder and explicitly required continuity with the larger calculator. This version supersedes the concept pack. Implement only Bottleneck Finder: three alternative lanes, three numeric inputs per lane, immediate anonymous result, then a link to the existing detailed assessment. Use shared existing design tokens and source logo. The 10–25% reduction is an editable illustrative planning scenario, never a validated BioPilot improvement claim.

## Architecture revision
Implement a small Next.js static-export subapplication in quick-roi-site, reusing the parent's installed and locked Next/React dependencies, shared app/globals.css, components/ui primitives and a new pure lib/quick-roi.ts module. This replaces the earlier proposed dynamic /quick-roi preview route. The original app/page.tsx and production Render blueprint stay unchanged. The static application publishes at the root of its own free Render static site, eliminating server wake-up latency. No new dependency is required.

Build from the repository root with the existing lockfile and a separate quick build command. Only quick-roi-site/app is the subapplication's route tree; original API routes and report persistence are excluded. Exported files are public and contain no environment secrets. Render's static-site header rules supply nosniff, a strict referrer policy, denied camera/microphone/location permissions and a scoped CSP/frame policy. Deployment uses the existing Render account through environment credentials without logging them.

The existing UI primitives are already Base UI/shadcn-compatible and Lucide matches the source icons. No prototype starter is needed because this is an existing-codebase extension with a deliberate static release entry.
