# Implementation plan

Build: quick-roi-compact-inputs-handoff-20261007-v8. Status: handoff-ready. Draft baseline: [../quick-roi-compact-inputs-20261007-v7](../quick-roi-compact-inputs-20261007-v7/build-spec-manifest.json). Evidence: [current QA](../../../design-qa-compact-inputs-20261007-v1.md).

Completed: preserved baseline screenshots and all earlier outputs; drafted all six v7 documents and checked them before source changes. Updated compact classes and subheading (PR-001–002), empty placeholder-only defaults and named clear controls (PR-003–004).

Completed: clean locked-install static build/type checks and lint passed; all six existing numerical/parser tests passed. Browser checks confirmed blank validation/focus, synthetic results in all lanes, lane retention, clear recovery and scenario reset. Final desktop fit verified at 1280×720; mobile no horizontal overflow at 390px. Metrics/screenshots linked through current QA.

Completed: pushed reviewed source commit 352867108d76c5b6b40b67a5de6509b120e822c8 on codex/biopilot-quick-roi-20261007 and explicitly deployed only the quick service. Live status/source commit, HTTP200, CSP, grey placeholders, compact 44px inputs and bold subheading verified. Actual native-app screenshot inspected.

Handoff: this final snapshot reconciles all six documents. The original site/model and deployment remain untouched. Prior artifacts are preserved. Rollback remains redeploying 846616024e152a3b544d8cd28a995b0e45f1d60a to the quick service. Deferred: analytics/conversion measurement, inherited shared dependency remediation and formal assistive-technology study, as in baseline. No functional work is blocked.
