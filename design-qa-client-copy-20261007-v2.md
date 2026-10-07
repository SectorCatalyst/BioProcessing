# Client-facing copy revision — design QA

## Source and rendered evidence
Source: reviews/client-copy-qa-20261007-v1/before-desktop-initial-v1.jpg (prior public initial state), plus the user-supplied screenshot of the unwanted Info card.
Implementation: reviews/client-copy-qa-20261007-v1/after-desktop-initial-v1.jpg.
Both desktop images are 1280×720 pixels at CSS viewport 1280×720, density 1, initial Batch review state. They were opened together in one comparison input at original resolution. No density normalization was needed. Copy/card removal is the expressly requested intentional difference, not fidelity drift.
Focused header, subtitle, example cue and placeholder regions were legible in the original-resolution pair; no separate crop was needed. Complete result evidence: after-transfer-result-v1.jpg (1280×1121 full page). Mobile: after-mobile-result-v1.jpg (390×1640), CSS viewport 390×844; document width 390, no horizontal overflow.

## Required fidelity surfaces
Fonts/typography: shared families, weights and scales unchanged; shortened helper/placeholder content wraps clearly.
Spacing/layout: exact existing grid, tabs, forms, result columns and action proportions retained. The Info card/icon and secondary header sentence are intentionally removed; a small empty value and instruction orient clients.
Colors/tokens: existing navy/blue, muted, border and surface tokens unchanged.
Image quality/assets: original logo file is unchanged; no new illustration or code-drawn brand asset.
Copy/content: exact user subtitle is Choose one bottleneck. Get a quick estimate. Removed wording about a useful first estimate, a long assessment, contact-free setup and the subsequent sales stage. Client language now covers process inputs, annual value and Build your business case. Necessary example, formula, scenario and cost/capacity qualifications remain.

## Interactions checked
All-example, mixed-example and fully edited labels correctly reflect per-field edits. Custom review inputs 120 runs, 10 hours, USD100 show USD12,000–30,000 and 120–300 hours. Blank input focuses its field, displays an error and removes a stale estimate. Failure and transfer outputs remain USD10,000–25,000 and USD3,400–8,500 respectively. Invalid reduction ordering hides the estimate; Reset reduction range recovers it. All three tabs and revised actions work. No local console errors/warnings.
The existing deeper link is unchanged and opens the contact intake for the comprehensive assessment; no contact detail was entered in this revision's tests. Live verification follows deployment.

## Findings and history
This revision's first paired comparison found no actionable P0/P1/P2 issue, and no further visual fix was made after it. The removal of the source card and shortening of content are approved changes. Prior design-qa.md and its evidence are preserved; this new uniquely named report follows the user's output-preservation instruction.

## Validation/limits
Quick static build and lint pass. Numeric parsing/calculation/formatting functions are byte-identical to the prior app commit; no new model test was added for this copy presentation revision. No dependency, URL, backend, submission or storage behavior changed. The original dependency/scanner limits remain documented in the baseline security review. Full assistive-technology certification and conversion research remain unperformed. Analytics remains deferred for the anonymous quick stage; the comprehensive tool handles contact capture.


## Final live evidence correction
The background-browser captures live-desktop-initial-v1.jpg (177px wide) and live-desktop-result-v1.jpg (192px wide) reflect offscreen tab sizing and are excluded from desktop/responsive fidelity evidence. They are preserved, not treated as production layout failures or valid desktop screenshots. The actual app-tab screenshot live-client-initial-v2.jpg is 865×1127 and visibly shows the revised initial page, exact subheading and removed Info card. It is a byte-identical copy of the previously misnamed live-client-result-v1.jpg, which shows an initial state rather than a computed result. Local paired before/after images remain the matched 1280×720 comparison. Mobile evidence remains the verified 390px local result capture.
Native keyboard activation opened the real full-assessment tab; live-handoff-contact-v1.jpg shows its blank contact intake. No details were entered or submitted. Deployment and public HTTP assertions are unchanged. This is an evidence-index correction only; the deployed app code remains 846616024e152a3b544d8cd28a995b0e45f1d60a.

final result: passed
