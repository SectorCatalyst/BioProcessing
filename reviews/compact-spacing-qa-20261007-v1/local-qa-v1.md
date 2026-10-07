# Compact inputs local verification

Build-spec baseline: ../../docs/build-specs/quick-roi-compact-inputs-20261007-v7/build-spec-manifest.json. Final code is components/quick-roi-app.tsx. Local static export built with existing locked dependencies in the clean temporary verification workspace; build, lint, and all six model/parser tests passed.

## Visual review

Matched 1280×800 result comparison: before-desktop-result-v1.jpg (1280×1121 full page) and after-desktop-result-v2.jpg (1280×800). Both use review 100 / 20 / 145 and closed assumptions; the old site held these examples as actual values, while the revised test entered them explicitly. Viewed together at original resolution. Brand/logo/palette/grid retained; hierarchy reduced proportionately; spacing and padding tightened; existing controls reused; unchanged formulas and result/capacity qualifications retained. Clear buttons and empty placeholders are the intentional functional changes.

Final 1280×720 result is after-desktop-720-result-v2.jpg, with whole page 720px; estimate button bottom 630.875px, business-case button bottom 573.664px, footer bottom 698.664px. Baseline estimate action was 992.266px: 361.391px higher after this revision. No fixed-height clipping or page scale trick.

Mobile 390px result before final outer-margin-only adjustment is after-mobile-result-v1.jpg; width equals viewport, 44×44 clear targets. Long failed-run labels also checked at 390px without horizontal overflow. Initial and other lane screenshots remain preserved. Earlier v1 images are intermediate evidence; v2 desktop images represent final spacing.

## Interaction and access

Blank inputs do not calculate or reveal the business-case CTA; validation focuses first invalid input. Synthetic inputs in all three lanes yielded the existing expected values. Keyboard clear returned placeholders, preserved other fields, hid stale result and focused the cleared field. Per-lane values persist through tab switches. Scenario clear produces a range error; Reset reduction range restores valid defaults and result. Field/clear/button targets remain at least 44px; persistent labels, helper text, focus styles and reduced-motion behavior retained. No formal screen-reader or client conversion study performed.

## Data and security

Manual diff review: no new network requests, persistence, credentials, tracking, contact form or model changes. Standard external anchor retains fixed full-calculator URL, noopener/noreferrer and new-tab labeling. Broader dependency advisories are inherited and remain documented in the baseline; no claim of clean repository-wide audit. No client/contact details entered or form submitted.

Local result: passed. Deployment/live verification remains the next gate.
