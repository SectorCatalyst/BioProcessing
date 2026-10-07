# Bottleneck Finder design QA

## Evidence
Source visual truth: `docs/concepts/quick-roi-20261007-v1/bottleneck-finder.png`.
Implementation: `reviews/bottleneck-qa-20261007-v1/desktop-result-v4.jpg`.
Both source and implementation are 1487×1058 pixels, compared together in one tool input at CSS viewport 1487×1058, device density 1, scroll 0. State: Batch review, defaults, estimate visible, assumptions collapsed. No density normalization was necessary.
Full-view evidence: paired source and desktop result. Focused regions were inspected at original resolution in that same pair; labels, inputs, headline, number hierarchy, before/after and both CTAs were legible without cropping. No separate crop was needed.
Mobile evidence: `reviews/bottleneck-qa-20261007-v1/mobile-result-v1.jpg`, 390px CSS width, full page; large-value check at 320px in `mobile-extreme-v1.jpg`. No horizontal overflow (document width exactly viewport width), obscured action or duplicate IDs.

## Comparison history
1. Initial capture `desktop-result-unscrolled-v1.jpg`: P1 unresolved brand tokens made the selected lane, results and outline CTA muted; P2 excessive insets narrowed the opportunity and reduced figure scale. Recorded as blocked in `qa-iteration-v1.md`.
2. `desktop-result-v2.jpg`: wider container and column/figure scales corrected the P2 layout issue. P1 token issue persisted because the separate stylesheet did not share the Tailwind compilation context.
3. One combined CSS import resolved shared custom tokens. `desktop-result-v4.jpg` is the top-aligned post-fix capture, reopened with the source. No actionable P0/P1/P2 finding remains. The subsequent responsive-only overflow guard leaves this default state unchanged.

## Required fidelity surfaces
- Fonts and typography: actual full-calculator system font stack and semibold hierarchy reused. The generated source is an approximate concept; retaining the existing app's real font stack takes precedence over its inferred font. Headline, labels and monetary result are readable; large values wrap safely.
- Spacing/layout rhythm: source inset, three choices, 0.86/1.14 form/result composition and large figure emphasis reproduced. Additional helper text and explicit units are intentional comprehension changes; buttons remain visible in the matched desktop state. Rounded inputs, cards and actions use the existing calculator treatment.
- Colors/tokens: exact shared navy, primary/brand blue, muted text, borders and surfaces map into the isolated stylesheet. Original subtle grid background is intentional continuity with the larger calculator, replacing the concept's plain white canvas.
- Image quality/asset fidelity: approved source PNG logo copied byte-for-byte, unchanged proportions and sharpness. Standard Lucide circles/arrows are used for familiar controls; no logo reconstruction or custom illustration is present.
- Copy/content: chosen question and three bottleneck paths retained. Explicit example, capacity versus cash, addressable loss, editable scenario and privacy language prevent unsupported claims. Contact details are not requested.

## Interactions and accessibility checks
All three estimates tested. Review: $29,000–$72,500 and 200–500 hours. Failure: $10,000–$25,000 with addressability applied first. Transfer: $3,400–$8,500 (rounded).
Keyboard arrows move tab focus; Enter selects the lane and submits its estimate. Blank input hides stale results and focuses the invalid field. Zero is valid and yields a clear zero-opportunity state. Input values and prior estimates survive lane switching. Invalid lower/upper reduction order hides results; restoring defaults recovers the estimate. On mobile, submission scrolls to the result. 390px and 320px large-value states were exercised; touch targets are at least 44px except noninteractive text. Reduced-motion paths are implemented (manual OS preference exercise was not performed).
Console logs checked: no errors/warnings in the local production preview. Full screen-reader and human conversion validation remain unperformed.

## Findings
No remaining actionable P0/P1/P2 findings. P3: client sessions should validate comprehension of the addressable-share input and whether the example range is useful. No empirically validated conversion claim is made.

## Doctrine exception
Analytics instrumentation is deferred for this anonymous preview to avoid collecting customer inputs or adding contact friction. Measure completion and handoff during consented client evaluation before deciding on anonymous aggregate analytics.

## Implementation checklist
- Brand, hierarchy and exact asset verified.
- Three lanes, failure scope, zero/errors, assumptions, keyboard and mobile checked.
- Local static build, existing app build, lint, six model tests and scoped static security review completed.
- Deployment behavior is verified separately in the release evidence.

final result: passed
