# Product requirements document

Build: BioPilot Quick ROI — concept evaluation v1
Date: 2026-10-07
Branch: codex/biopilot-quick-roi-20261007
Baseline: 2bb6adf, current BioPilot assessment model 2.2.1
Status: selected Bottleneck Finder; implementation-ready; no calculator implementation or deployment yet.


## Context and objective
The intended users are prospective bioprocess development/manufacturing clients arriving from email, an event, a partner referral or a campaign. They should see a relevant, understandable value estimate with very little effort, then voluntarily move into the existing deeper assessment at a later sales stage.

The 2026-10-06 review established that the current public assessment asks for six contact fields and consent before showing process value. Thermo Fisher asks for five numbers plus region, gives an estimate, then offers a contact form. The review also found that extra input detail does not validate benefit assumptions.

## Requirements and acceptance
- PR-001: Show a usable initial estimate before contact capture. Acceptance: a new visitor reaches a result without name, email, account or consent-to-contact.
- PR-002: Ask at most five required operating inputs in phase one. Acceptance: count the inputs on the selected concept; optional details do not block results. Intended completion target is about one minute, to be tested rather than claimed as measured.
- PR-003: Give a directional range with an understandable driver. Acceptance: the result shows recovered effort and its potential economic value, identifies the scope and explains the scenario assumptions nearby.
- PR-004: Keep capacity distinct from cash. Acceptance: salary-based recovered effort is labelled capacity value; cash ROI is not displayed unless investment and monetizable savings are supplied. No automatic 100% failure prevention or full sampling elimination assumption.
- PR-005: Offer the existing broader assessment after results. Acceptance: one clear 'Explore full ROI' action explains the next stage; declining leaves the estimate usable. Optional contact details are collected only after value has been shown.
- PR-006: Isolate the work. Acceptance: development is on the new branch, with a separate preview deployment and URL after a direction is selected. Existing public entry and assessment are retained.
- PR-007: Make unknowns easy. Acceptance: optional hourly cost can use an editable, conspicuously labelled planning assumption; uncertain failure data does not force a guess.
- PR-008: Support phones and accessible input. Acceptance: controls remain labelled, keyboard-operable, readable at narrow widths and recoverable after input errors.

## Three concepts for evaluation
A. Batch Value Snapshot: annual runs, review/data-assembly hours per run and loaded hourly cost. A fourth optional investment input can support an investment comparison after the value preview. The sample uses 100 runs × 20 hours × $145; a clearly illustrative 10–25% reduction gives 200–500 recovered hours and $29,000–$72,500 capacity value. Previously recommended first build because it offers a direct input-to-value connection.
B. Bottleneck Finder: first select batch review, failed/degraded runs or technology transfer. Then answer three relevant questions. The review lane uses the same arithmetic as A. Other lanes require measured baseline and explicitly attributable improvement before monetization; they must never be added together automatically. Strongest when campaigns start from a known customer pain; tradeoff is an extra choice and multiple model paths.
C. Team Time Back: team members in scope, manual data/review hours per person per week and loaded hourly cost. Uses an exposed working-weeks assumption. Sample: 8 people × 3 hours/week × 48 weeks; a 10–25% planning reduction gives about 115–288 hours and $16,704–$41,760 capacity value. Easiest when customers do not know batch economics; tradeoff is less process specificity and a need to prevent overlap in team-hour estimates.

## Boundaries and open decisions
This turn produces concept mockups and a proposed specification pack, not a working calculator. Selection comes before implementation. No public pricing, conversion improvement, realized savings or benefit-validation claims are approved by these concepts. The 10–25% range is an illustrative scenario for design evaluation, not a calibrated BioPilot promise. The selected design, validated default assumptions, investment presentation and exact public hostname remain open.

## Evaluation measures
During prototype testing measure time to first result, errors, comprehension of capacity versus cash, and voluntary transition into the deeper assessment. During an authorized release measure start/result/deeper-assessment completion and qualified opportunities, not raw email volume alone. Tracking is proposed, not activated.

## Selected implementation decision — 2026-10-07
The user selected Bottleneck Finder and explicitly required continuity with the larger calculator. This version supersedes the concept pack. Implement only Bottleneck Finder: three alternative lanes, three numeric inputs per lane, immediate anonymous result, then a link to the existing detailed assessment. Use shared existing design tokens and source logo. The 10–25% reduction is an editable illustrative planning scenario, never a validated BioPilot improvement claim.

## Implementation acceptance additions
PR-009: Offer batch review, failed runs and tech transfer as mutually exclusive lanes. Each lane keeps its own inputs; no cross-lane benefit sum.
PR-010: Failure lane asks annual failed/degraded runs, net avoidable impact per run and the share related to data/workflow gaps. The reduction range applies only to that addressable share. Zero opportunity is valid.
PR-011: The selected source mockup is docs/concepts/quick-roi-20261007-v1/bottleneck-finder.png. Production copy must replace mock-only framing and unsupported assumption language with concise, truthful guidance.
PR-012: Deploy a distinct static site from this branch; no production API or database is part of the quick tool. Confirm live URL, model output and full-assessment link before completion.
