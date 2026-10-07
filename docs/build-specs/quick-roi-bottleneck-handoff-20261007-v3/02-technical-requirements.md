# Technical requirements document

Build: quick-roi-bottleneck-handoff-20261007-v3. Reconciles the implemented Bottleneck Finder and supersedes ../quick-roi-bottleneck-20261007-v2. Earlier concept and implementation packs are preserved.

## Architecture and rationale
The new quick-roi-site/ Next.js subapplication statically exports its root route. This is the selected route over adding a route to the main app (would couple deployment) or using an unrelated standalone framework (would duplicate the design system). It imports components/quick-roi-app.tsx, lib/quick-roi.ts and the actual existing UI controls/styles.
Next 16.2.12 and React 19.2.8 use the parent locked dependency tree. The app adds no dependency. The child stylesheet imports the original globals and maps the additional shared brand/surface tokens into one Tailwind compilation context. Root TypeScript excludes the child's generated .next/out artifacts. The original app entry and render.yaml are unchanged.

## Contracts and data handling
TR-001 / PR-001–005: pure local numeric parsing/calculation, model 1.0.0, finite bounded values and ordered scenarios. All UI content is React escaped.
TR-002 / PR-006: state is React memory only. No analytics, storage, API, server action or application network request. Hosting receives ordinary asset requests, not entered process values. Handoff is a fixed HTTPS anchor with noopener noreferrer.
TR-003 / PR-007–008: reuse Button/Input/Tabs, shared system font stack, tokens and source PNG. Base UI tab focus uses arrows and Enter activation. Numeric fields have labels, units, descriptions and errors. Reduced-motion CSS and result-scroll branches are implemented.

## Deployment and operation
TR-004 / PR-009: Render static_site srv-db3501qd0e5s73f57f2g, https://biopilot-quick-roi.onrender.com/ . Branch codex/biopilot-quick-roi-20261007. Build npm ci && npm run build:quick; publish only quick-roi-site/out. Automatic deploys are off. Reviewed app commit 9b2899088fc2da2029f48098064652827f9f2e47 deployed live as dep-db35022d0e5s73f57ht0 on 2026-10-07.
No server runtime, database, secret configuration or copied full-tool environment is required. Existing comprehensive service srv-d7kes6po3t8c73cm1s6g still tracks codex/patch-bioprocessing-dependencies.

## Security and reliability
Production HTTPS, HSTS, MIME-sniffing protection, framing denial, referrer/device policy and CSP were checked on the live response. CSP allows Next inline hydration/style, but denies external scripts, connections, forms and framing. Static output contains no API/admin routes or source maps. Invalid inputs hide stale results and preserve entries.
DeepSec 2.3.10 local scan ran across the scoped new app/shared controls: nine candidate matches, all manually triaged as generic false positives or intended-public exports. AI processing/revalidation was not run. The shared parent dependency audit still reports advisories (34 in the local full tree, including tooling and server packages). The new static site has no exposed Next server, image optimization, ImageResponse, proxy or MCP surface; affected utilities are not driven by user-supplied build input. Broader dependency upgrades remain maintenance work; do not represent the repository as audit-clean.

## Verification and limits
TR-005 / PR-010: quick static build and original full-app build pass, lint passes, six meaningful model tests pass, tested source matches committed source byte-for-byte. Fresh temporary locked install was used after existing local dependency reads stalled. Browser checks cover all three public results, desktop/mobile, recovery, keyboard, editable assumptions and live full-tool handoff. No performance SLA, penetration-test assurance or full WCAG certification is claimed. Client scenarios and benefit realization remain unvalidated.
