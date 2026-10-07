# Technical requirements document

Build: quick-roi-compact-inputs-20261007-v7. Status: implementation-ready. Baseline: [../quick-roi-client-copy-final-20261007-v6](../quick-roi-client-copy-final-20261007-v6/build-spec-manifest.json).

Change components/quick-roi-app.tsx on codex/biopilot-quick-roi-20261007. Reuse Next 16.2.12 static export, React 19.2.8, Tailwind 4, existing Base UI controls, and Lucide X. No dependency changes, backend or database.

TR-001 / PR-001–002: Reduce explicit spacing/control sizes in this component; keep minimum 44px interactive targets and ordinary page flow. No scaling transform or hidden overflow.
TR-002 / PR-003: Initialize per-lane process records empty; derive placeholder from field.example. Existing parser remains sole validity boundary; no fallback default calculation.
TR-003 / PR-004: Clear via existing changeField and refocus the related input. Derived result becomes null while invalid; calculation attempts display validation. Remove obsolete example-data status now that placeholders are never values.
TR-004 / PR-005: Preserve static Render service srv-db3501qd0e5s73f57f2g, URL and contact handoff. Explicit commit deploy; original calculator service untouched. No new network/storage surface. Baseline dependency advisory limitations remain as recorded in v6.

Verify clean locked-install quick build, lint, existing parser/model tests, browser empty/entry/clear/recovery/tab states, responsive screenshots and rendered dimensions. Test with synthetic numbers only.
