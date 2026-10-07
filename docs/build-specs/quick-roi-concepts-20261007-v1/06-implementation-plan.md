# Implementation plan

Build: BioPilot Quick ROI — concept evaluation v1
Date: 2026-10-07
Branch: codex/biopilot-quick-roi-20261007
Baseline: 2bb6adf, current BioPilot assessment model 2.2.1
Status: proposed concepts; no calculator implementation or deployment yet.


## Current stage and recommendation
Initial concept evaluation is the requested stage. The new branch has been created from 2bb6adf. Recommend Batch Value Snapshot as the first build, with the other two mockups testing pain-first relevance and easier weekly-effort input. All six documents are drafted before implementation. Calculator code, a server and deployment wait for concept selection.

## Ordered work and gates
1. Inspect baseline, comparison evidence, UI doctrine, approved logo and current deployment configuration. PR-001/004/006. Completed source review; visual references inspected.
2. Create the new branch and a unique specification pack. PR-006. Branch created; pack drafted with no prior outputs overwritten.
3. Generate three independently displayed concept images with actual visual references and illustrative data. PR-002/003/004/005. Pending at pack creation. Review them for readable text, mathematical consistency, contact-after-value and brand treatment.
4. User evaluates and chooses or refines a direction. This is concept selection, not deployment approval. Create a new specification snapshot reflecting that choice; preserve this pack.
5. Implement a pure quick-estimate module and the selected minimal UI in the existing stack. PR-001/002/003/004/007/008; TR-001/002/005/006. No fit-score uplift is presented as validated causal effect.
6. Add an optional next-stage handoff after the result. PR-005; TR-003/007. Verify initial results remain usable without contact submission.
7. Run build/lint, focused model/unit checks and browser desktop/mobile/keyboard/error-state verification. Record actual evidence, not checklist assertions. PR-001 through PR-008.
8. Create an isolated preview deployment tied to the new branch. PR-006; TR-004. Verify its live URL and branch parity. Existing production service and URL remain outside this release.
9. Reconcile a new final six-document snapshot with implementation and checks; hand off working URL, scope, model limits and artifacts.

## Risks and mitigation
- An attractive estimate could overstate bankable value: show capacity/cash distinction, explicit scenarios and zero/low cases.
- Too many inputs could repeat the full assessment's friction: cap required fields and test completion/comprehension.
- Separate pricing/model assumptions could drift: version the quick model, document defaults, and avoid unapproved public price claims.
- Live side effects could contaminate production: preview isolation, no early API posts, no production contacts/notifications in QA.
- A public hostname might not be available: choose the actual service name at deployment and return only its verified URL.

## Verification status at concept-pack creation
Verified: current branch baseline, original entrypoint/model, supplied comparison evidence and inspected source images.
Not yet verified: generated-image quality, working calculator, mobile/keyboard behavior, empirical uplift, conversion performance, preview URL, deployment parity or contact handoff.
Deferred by stage: implementation and public deployment until a direction is selected.
