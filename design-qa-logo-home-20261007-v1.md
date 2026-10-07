# Logo home/reset QA

Current six-document handoff: [v10](docs/build-specs/quick-roi-logo-home-handoff-20261007-v10/build-spec-manifest.json). Source882066b3c5b9d6aae483fa0548c59ceaebdfbc5b. Only quick-site logo navigation/header target changed; the right-side panel is a recommendation.

## Verification

Quick static build/type checks and lint passed in the clean locked workspace. Native anchor is intentional: full document navigation resets the entire ephemeral calculator. A narrow Next no-html-link-for-pages lint exception documents that need. No model/API/dependency change, new submission or storage.

Local browser tests: populate and calculate review100/20/145, failure5/80000/25, transfer3/78/145; alter range to invalid30/20; keyboard home activation resets review, blanks every lane, clears result/errors, closes assumptions, restores10/25 and scroll0. Checking previously populated failure/transfer confirms no retained entries or ready status. Separate pointer click clears partial/error state. [Local evidence](reviews/logo-home-qa-20261007-v1/local-qa-v1.json).

Matched1280×720 [baseline](reviews/compact-spacing-qa-20261007-v1/after-desktop-720-result-v2.jpg) and [new result](reviews/logo-home-qa-20261007-v1/desktop-result-v1.jpg) reviewed together at original resolution: composition, typography/color/assets, spacing/density, controls/access and model/content fidelity pass. Whole page720px, footer y698.664px; new logo target208×44px. Mobile width390px equals page width, logo44px tall. [Mobile view](reviews/logo-home-qa-20261007-v1/mobile-initial-v1.jpg). No new unit tests needed for a standard native anchor; numerical tests remain unchanged baseline evidence.

## Live evidence

[Render confirmation](reviews/logo-home-qa-20261007-v1/render-live-v1.json): dep-db387nh42hec738tcvig, exact source882066b, live2026-10-07T17:40:41.201022Z. Actual visible logo clicked in native app tab after synthetic review data and scenario15/30; [v2 reset record](reviews/logo-home-qa-20261007-v1/live-reset-check-v2.json) confirms empty process fields, default10/25, review tab, closed assumptions, no alerts and scroll0. [v2 screenshot](reviews/logo-home-qa-20261007-v1/live-after-reset-v2.jpg),865×851, inspected.

Preserve but exclude live-reset-check-v1.json and live-after-reset-v1.jpg: the earlier automation locator click did not activate the displayed logo and left populated state. Correct native pointer activation subsequently succeeded. This was an automation targeting failure; v1 is not reset proof. No contact details used or form submitted. Previous delayed documentation was included in the successful source push.

## Recommendation and limits

Recommend a softly tinted bounded estimate card with Annual value and Hours recovered/Avoided runs placeholders, concise prompt, actual output and existing before/after row after calculation. Keep current compact desktop height. No fabricated forecast/chart or extra sales narration. This remains advisory and has no claimed validation or conversion result.

Formal assistive-technology research, instrumentation and broader dependency remediation remain baseline limitations; no new doctrine exception. User feedback drives this small refinement.

final result: passed
