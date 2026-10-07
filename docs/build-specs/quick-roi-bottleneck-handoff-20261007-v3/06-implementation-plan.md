# Implementation plan

Build: quick-roi-bottleneck-handoff-20261007-v3. Reconciles the implemented Bottleneck Finder and supersedes ../quick-roi-bottleneck-20261007-v2. Earlier concept and implementation packs are preserved.

## Completed sequence and ownership
Codex implemented the user-selected Bottleneck Finder; the user supplied product direction and continuity constraints.
1. Preserved the original concepts and drafted six implementation documents before code (v1/v2 packs).
2. Created codex/biopilot-quick-roi-20261007 from baseline 2bb6adf; kept the main app entry and hosting configuration intact (PR-009).
3. Built the three-lane pure model, numeric validation and memory-only UI; separated capacity from loss avoidance and disclosed scenario limits (PR-001–006).
4. Reused actual shared controls, CSS tokens and source logo in a separate static Next subapp. Corrected initial token compilation and layout issues after screenshot comparison (PR-007/008).
5. Verified model, original/quick builds, lint, local interaction/mobile QA and scoped security. Source copied to the clean verification install matches the final committed files byte-for-byte (PR-010).
6. Committed/pushed app source as 9b2899088fc2da2029f48098064652827f9f2e47; created the separate Render static service, deployed and verified the public URL and deeper assessment handoff (PR-009).
7. Reconciled this six-document handoff pack and preserved prior artifacts.

## Acceptance evidence
| Gate | Result and evidence |
|---|---|
| Model | Six tests pass: effort arithmetic, addressability-first failure, zero cases, transfer scope, invalid input and range ordering |
| Source | Lint and TypeScript build checks pass; git diff whitespace check passes |
| Integration | Full original app build passes including existing route generation/postbuild; quick static export contains only root/404/not-found HTML |
| Visual/interaction | design-qa.md passed after fixes; reviews/bottleneck-qa-20261007-v1/ records desktop, mobile, error/range/keyboard/state checks |
| Security | Local DeepSec candidate scan and manual triage; live CSP/HSTS/other headers checked; no API/admin output or source maps; exact logo verified |
| Public release | Render deploy dep-db35022d0e5s73f57ht0 live at 2026-10-07T14:01:07Z; public HTTP 200; all three estimates verified with no console errors |
| Handoff | Actual CTA opens full assessment at fixed root URL with blank contact fields, no entered values transferred; live-full-handoff-v1.jpg |
| Isolation | Existing comprehensive service remains on codex/patch-bioprocessing-dependencies; no existing service altered |

## Release controls and recovery
Live URL: https://biopilot-quick-roi.onrender.com/ . New service srv-db3501qd0e5s73f57f2g publishes only quick-roi-site/out. Automatic deploys are disabled. Documentation-only commits do not change the deployed app. A future code revision requires build/browser checks and an explicit reviewed deployment. Roll back by redeploying a prior good quick-site commit; the full calculator can remain available throughout.

## Deferred and unverified work
No required quick-tool behavior remains blocked. Deferred: empirical reduction validation, prospective-client comprehension/conversion research, analytics instrumentation, exports, contact handoff integration and deeper-input transfer. Full AI DeepSec processing/revalidation, penetration testing, formal accessibility certification and performance benchmarking were not performed.
The shared full dependency tree has existing audit advisories (local: 2 critical, 24 high, 8 moderate). The new static app has no affected server/API/proxy features; no vulnerable parser receives untrusted build content. Preserve this exposure distinction without claiming an audit-clean repository. Broader package upgrades should be handled as a separate coordinated maintenance revision before further dynamic releases; see security-review-v2.md.

## Evidence index
../../../reviews/bottleneck-qa-20261007-v1/live-desktop-result-v2.jpg (1487px desktop, full-page height 1136px), live-mobile-result-v1.jpg (390px), live-full-handoff-v1.jpg, live-http-check-v1.json, render-creation-v1.json, dependency-audit-v1.json, deepsec-local-scan-v1.json and security-review-v2.md. Earlier captures/packs remain available. The final manifest lists the six current documents and app deployment identity.
