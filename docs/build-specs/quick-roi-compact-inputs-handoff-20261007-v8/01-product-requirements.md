# Product requirements document

Build: quick-roi-compact-inputs-handoff-20261007-v8. Status: handoff-ready. Draft baseline: [../quick-roi-compact-inputs-20261007-v7](../quick-roi-compact-inputs-20261007-v7/build-spec-manifest.json). Evidence: [current QA](../../../design-qa-compact-inputs-20261007-v1.md).

The quick calculator is now compact enough for a normal desktop screen and asks visitors to enter their own figures. This responds to the user screenshot and requested stronger subheading, clear controls and grey example hints.

- PR-001 complete: At 1280×720, closed-assumptions review result fills one page with estimate action at y630.875, business-case action y573.664 and footer y698.664. At 1280×800, all lanes and the initial state fit. Mobile scrolls naturally; no content clipping is used.
- PR-002 complete: Exact requested subheading remains, now dark and semibold.
- PR-003 complete: Each lane starts with empty process values. Grey e.g. hints display the former examples; missing entries are invalid and never silently calculated.
- PR-004 complete: Populated process/scenario inputs show named clear controls. Keyboard clearing empties/refocuses a field, preserves other values and hides incomplete estimates. Reset reduction range recovers 10–25.
- PR-005 complete: Model, branding, per-lane entry retention and comprehensive-stage contact handoff remain.

Scope excludes forcing expanded assumptions, errors, mobile or arbitrary zoom into a single screen. No new tracking or contact capture is added. Future conversion improvement is unmeasured.
