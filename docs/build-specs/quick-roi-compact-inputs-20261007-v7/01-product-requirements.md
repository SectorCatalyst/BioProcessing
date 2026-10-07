# Product requirements document

Build: quick-roi-compact-inputs-20261007-v7. Status: implementation-ready. Baseline: [../quick-roi-client-copy-final-20261007-v6](../quick-roi-client-copy-final-20261007-v6/build-spec-manifest.json).

Prospective bioprocess clients need a quick estimate with a compact, familiar interface. User screenshot shows the final field and action below the visible screen. Latest user instructions add a prominent subheading, grey suggestions rather than actual initial values, and clear controls.

- PR-001: Closed-assumptions initial and standard result states should place all three process fields and both primary actions within a 1280×800 desktop viewport. Measure actual rendered coordinates; no fixed-height clipping. Mobile may scroll naturally.
- PR-002: Preserve exact subheading “Choose one bottleneck. Get a quick estimate”; use bold, darker text.
- PR-003: All three lanes start empty; existing example numbers appear as grey placeholder hints only. Blank inputs cannot calculate an estimate and must not silently use examples.
- PR-004: Every populated process text field has an accessible clear control. Clearing returns the placeholder, retains other entries, and hides any stale result. Optional scenario inputs also offer clearing and retain Reset reduction range.
- PR-005: Keep model 1.0.0, brand continuity, lane-specific entry retention, validation, and detailed-assessment contact handoff.

Assumption: “one full screen” means normal desktop size with assumptions closed, not forcing mobile, zoomed or expanded-detail content into a fixed height. No contact collection or new analytics is included.
