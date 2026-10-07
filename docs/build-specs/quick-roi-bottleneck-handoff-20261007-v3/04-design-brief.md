# Design brief document

Build: quick-roi-bottleneck-handoff-20261007-v3. Reconciles the implemented Bottleneck Finder and supersedes ../quick-roi-bottleneck-20261007-v2. Earlier concept and implementation packs are preserved.

## Selected direction and continuity
Bottleneck Finder is the approved concept. Retain the exact Yokogawa logo PNG, the existing calculator's navy/blue palette, system font stack, subtle grid background, large clear headings, rounded inputs and blue primary action. The generated selected mock is a layout reference; the actual larger calculator's brand tokens and asset are authoritative.

## Audience and emotional brief
Prospective process, technical and commercial stakeholders should feel curiosity at the question, confidence that the result is inspectable, and control over whether to go deeper. The failure cost is a misleading financial claim or a form that asks for too much before proving useful. A three-choice entry, editable examples, explicit units, visible range and disclosed formulas create a low-effort first step without overstating evidence.

## Journey and cue map
| Moment | Intended response | Concrete cue |
|---|---|---|
| Arrive | Recognize the brand and relevant problem | Exact source logo and question about bioprocess value |
| Choose | Identify a familiar friction point | Three large bottleneck tabs with selection circles |
| Enter | Feel capable of completing the task | Only three fields; defaults, units and short helpers |
| Estimate | Understand the scale and its limits | Large annual range, hours/loss context and scenario caveat |
| Inspect | Trust the reasoning | Expandable assumptions, formulas and editable reductions |
| Continue | Choose a useful next step | Full business case CTA after the result |

## Concrete treatment
Desktop follows the selected three-choice row and side-by-side form/opportunity layout, with a 0.86/1.14 column ratio and strong figure emphasis. Mobile stacks form before result and preserves the three tabs. Fields are at least 56px high and primary actions at least 52px. Standard Lucide circles/arrows are used for familiar controls. No decorative raster asset or custom logo reconstruction is introduced.
Typography and background deliberately follow the existing production app rather than approximating the generated mock's inferred font or plain white canvas. Extra helper text, units and evidence/privacy caveats support meaningful decisions. Full-business-case value ranges are not treated as promised savings.

## Skills and implementation foundations
premium-ui-stack coordinated UI Doctrine, UX Laws, emotional design and proportionate QA; build-spec-harness governed the six-document pack. Existing shadcn-compatible Base UI primitives, Yokogawa branding guidance, Product Design image-to-code/design QA and secure-software-builder shaped implementation and validation. No optional component or animation package was added.

## Validation and doctrine exception
The source mock and matched 1487×1058 result were viewed together at original density; earlier token and inset issues were corrected and re-compared. 390px and 320px views, large values, keyboard, form/range errors and public deployment were exercised. Current design-qa.md reports passed. Screen-reader certification, OS reduced-motion exercise and buyer research were not performed.
Analytics instrumentation is intentionally deferred for the anonymous first preview, preserving the user's results-before-contact goal. Use consented client sessions to measure understanding, completion and deeper-tool interest; add aggregate analytics only after deciding the measurement/privacy approach. No conversion increase is claimed.
