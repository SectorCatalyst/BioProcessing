# Compact inputs design QA

Current six-document pack: [v8](docs/build-specs/quick-roi-compact-inputs-handoff-20261007-v8/build-spec-manifest.json). Source commit 352867108d76c5b6b40b67a5de6509b120e822c8; isolated quick site only.

## Evidence and verdict

Visual comparison: [baseline](reviews/compact-spacing-qa-20261007-v1/before-desktop-result-v1.jpg) and [final](reviews/compact-spacing-qa-20261007-v1/after-desktop-result-v2.jpg), same 1280×800 viewport, review inputs100/20/145, assumptions closed. Viewed together at original resolution. Intentional differences: compact spacing/type scale; bold exact subheading; X clear controls; initial examples become grey placeholders. Brand/logo/palette, content/formulas, result hierarchy, UI primitives and responsive flow preserved.

Five surfaces: composition/hierarchy passed; typography/color/assets passed; spacing/alignment/density passed; controls/focus/state behavior passed; content/model fidelity passed. No new unrequested marketing copy.

[Final 1280×720](reviews/compact-spacing-qa-20261007-v1/after-desktop-720-result-v2.jpg): whole page720px; estimate action y630.875, business action y573.664, footer y698.664. Baseline estimate action y992.266. [Metrics](reviews/compact-spacing-qa-20261007-v1/local-verification-v1.json). All lanes checked at1280×800. Natural mobile scrolling at390px, no horizontal overflow and44×44 clear controls; long failed-run labels also checked. Mobile screenshot represents code before the final outer-margin-only tightening; all other styles and input behavior are identical.

Blank, partial, submitted, valid, cleared and recovered states pass. Placeholder examples are never silently used. Keyboard clear focuses the emptied input, preserves others and removes stale result. Lane entries retained; range clear/reset works. Build/type check, lint and6 model/parser tests pass. [Detailed local checks](reviews/compact-spacing-qa-20261007-v1/local-qa-v1.md).

## Release

Render [live evidence](reviews/compact-spacing-qa-20261007-v1/render-deploy-live-v1.json): dep-db35u66gekts739jjqr0, source3528671, live2026-10-07T15:03:50.754535Z. [HTTP checks](reviews/compact-spacing-qa-20261007-v1/live-http-check-v1.json) confirm200, compact input classes, requested subheading and placeholders; CSP retains connect-src/form-action none. [Published initial view](reviews/compact-spacing-qa-20261007-v1/live-native-initial-v1.jpg),1280×800, inspected actual app tab: all process values blank, hints visible, calculate action on screen.

## Limits and doctrine

Expanded assumptions, mobile, validation errors and zoom can require normal scrolling. No forced-height clipping. No formal screen-reader or conversion study. Anonymous-stage analytics remains deferred; feedback is the current iteration signal. Existing broader dependency advisories are unchanged and documented in the baseline. Manual diff review shows no new network/storage or contact capture; no contact details entered or forms submitted. Original full calculator untouched.

final result: passed
