# Implementation plan

Build: quick-roi-compact-inputs-20261007-v7. Status: implementation-ready. Baseline: [../quick-roi-client-copy-final-20261007-v6](../quick-roi-client-copy-final-20261007-v6/build-spec-manifest.json).

1. Capture baseline result dimensions and preserve user screenshot context. Draft and validate all six documents before source changes.
2. PR-001–002: Apply compact classes and stronger subheading; preserve established brand tokens.
3. PR-003–004: Replace actual example defaults with grey placeholders; add conditional per-field clear controls and focus recovery, including optional scenario inputs.
4. PR-005: Build/lint and run existing meaningful model/parser tests in the clean locked temporary checkout. Inspect blank/partial/valid/cleared/recovered state and all lanes in browser. Compare equal-size screenshots and measure action positions; adjust if the core still exceeds the desktop target.
5. Commit/push this isolated branch, deploy the exact reviewed commit to the quick-site service, and verify live UI. Preserve all prior output files.
6. Create a fresh final six-document snapshot with actual checks, screenshots, commit/deploy IDs and limitations; validate and link it in handoff.

Implementation is pending in this draft. Rollback: redeploy app commit 846616024e152a3b544d8cd28a995b0e45f1d60a to this quick service only. Owner: Codex. No change to original calculator deployment.
