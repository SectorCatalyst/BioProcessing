# Technical requirements document

Build: quick-roi-compact-inputs-handoff-20261007-v8. Status: handoff-ready. Draft baseline: [../quick-roi-compact-inputs-20261007-v7](../quick-roi-compact-inputs-20261007-v7/build-spec-manifest.json). Evidence: [current QA](../../../design-qa-compact-inputs-20261007-v1.md).

Implemented in components/quick-roi-app.tsx using existing Next 16.2.12 static export, React 19.2.8, Tailwind 4, Base UI controls and Lucide X. No dependencies, numeric model, original calculator or hosting configuration changed.

TR-001 / PR-001–002: Header/main/tabs/form/result padding and gaps reduced; headline and section hierarchy scaled to a compact tool. Dark semibold subheading. Inputs/buttons and clear targets remain 44px or larger.
TR-002 / PR-003: Process state initializes empty; example values are placeholder attributes only. Existing parseQuickInputs rejects blanks and calculateQuickRoi remains unchanged.
TR-003 / PR-004: Clear writes empty state and focuses the field. Ready + validity gates derived results; stale estimates disappear. Obsolete actual-example status state removed.
TR-004 / PR-005: Source commit 352867108d76c5b6b40b67a5de6509b120e822c8 deployed to quick static service srv-db3501qd0e5s73f57f2g via dep-db35u66gekts739jjqr0; live 2026-10-07T15:03:50.754535Z. HTTP200 and CSP connect-src/form-action none verified. Original service untouched.

Quick build/type checks, lint and six model/parser tests passed in clean locked workspace. Browser verification covers empty, errors, entry, clear, recovery, lanes and responsive bounds. Existing dependency advisories remain baseline limitations; no new network/storage surface. Formal assistive-technology audit was not run.
