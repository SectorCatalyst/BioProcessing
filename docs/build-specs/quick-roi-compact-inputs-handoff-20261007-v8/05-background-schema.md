# Background schema

Build: quick-roi-compact-inputs-handoff-20261007-v8. Status: handoff-ready. Draft baseline: [../quick-roi-compact-inputs-20261007-v7](../quick-roi-compact-inputs-20261007-v7/build-spec-manifest.json). Evidence: [current QA](../../../design-qa-compact-inputs-20261007-v1.md).

No backend or database exists. Quick model 1.0.0 and field limits/formulas are unchanged: one bottleneck estimates capacity or avoidable loss, excluding investment and benefit timing.

allInputs: Record<QuickLaneId, QuickRawInputs>, initially {review:{}, failure:{}, transfer:{}}. Process values are strings; missing/empty strings are invalid. field.example is suggestion-only UI content (review 100/20/145; failure 5/80000/25; transfer 3/78/145). No examples enter a calculation unless a visitor types them. editedFields and example-status flags removed.

laneId defaults review; readyLanes and attempted are per-lane arrays. lowText/highText retain actual illustrative scenario defaults 10/25; assumptionsOpen defaults false. Clearing writes an empty string; result is calculated only with readiness, valid process values and valid range. Reset reduction range restores scenario defaults.

Everything stays in transient tab state. No persistence, migration, tracking, new network flow or contact form. FULL_ROI_URL and quick static Render configuration unchanged. Source/deploy IDs are recorded in the manifest and release evidence.
