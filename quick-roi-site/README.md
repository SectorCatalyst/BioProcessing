# BioPilot Quick ROI — Bottleneck Finder

A separate anonymous first-stage tool for batch review, failed runs and technology transfer. The existing comprehensive assessment remains the next sales step.

## Run and build
From the repository root: `npm ci`, then `npm run dev:quick` (port 3011) or `npm run build:quick`.
The static deployment artifact is `quick-roi-site/out`. Only that directory is published.
Run model checks with `npm run test:quick-model` on Node 22.18+ or 24+, and source checks with `npm run lint`.
The parent locked dependencies, actual UI primitives, fonts, colors and original logo are reused. No additional app dependency or database is introduced.

## Model boundaries
Three inputs are visible per selected lane. Batch review and transfer monetize recovered hands-on time at the loaded labor rate; this is capacity value, not cash savings. Failed runs apply a user-entered addressable share to net avoidable loss costs before the reduction scenario. Lanes are never summed.
The initial 10–25% range is an editable illustrative scenario, not measured BioPilot performance. Zero is valid. Investment, implementation costs, benefit realization and evidence confidence are deferred to the full assessment. No ROI percentage is implied.

## Privacy and handoff
Entered values stay in React memory in the current tab. No contact capture, analytics, cookies, persistent storage or application requests are used.
The full-business-case link opens `https://bioprocessing-roi.onrender.com/` in a new tab with no input transfer. A manual consultation or detailed assessment can follow; this app sends no messages.

## Isolated deployment
Branch: `codex/biopilot-quick-roi-20261007`.
Configuration: `../render.quick-roi-20261007.yaml`. Render static site; build at repo root with `npm ci && npm run build:quick`, publish `quick-roi-site/out`. Automatic deployments are disabled; deploy a reviewed commit explicitly. The existing `render.yaml` and full calculator service are unchanged.
Security headers cover CSP, framing, MIME sniffing, referrers and device permissions. Next inline hydration/styles require the documented inline exception; no outbound connections or form submissions are allowed.

## Validation limits
This is a usable public preview, not empirical proof of conversion uplift or BioPilot benefit. Validate the scenario range and buyer comprehension in prospective-client sessions before quoting modeled values as a business commitment. Analytics are intentionally deferred for the anonymous first preview.
