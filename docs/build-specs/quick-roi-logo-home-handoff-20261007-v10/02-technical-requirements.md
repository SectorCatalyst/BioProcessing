# Technical requirements document

Build: quick-roi-logo-home-handoff-20261007-v10. Status: handoff-ready. Draft baseline: [../quick-roi-logo-home-20261007-v9/build-spec-manifest.json](../quick-roi-logo-home-20261007-v9/build-spec-manifest.json).

Wrap the existing logo image in a native same-origin anchor href="/". A normal document navigation reinitializes all React tab state. This avoids maintaining a second reset implementation across lane values, ready/attempted arrays, scenario text and disclosure state. Preserve standard new-tab/modifier behavior.

Use a44px minimum link height and visible branded focus. Reduce header vertical padding to retain existing compact height. No packages, backend, storage, numerical model or deployment configuration change.

Verify quick static build and lint; browser keyboard and pointer navigation, reset across lanes/scenario/errors, initial/desktop/mobile bounds. Deploy only quick static service srv-db3501qd0e5s73f57f2g. Original full calculator untouched. No new network endpoint: navigation uses existing page origin.

## Verified outcome

Quick static build/type checks and lint passed. The deliberate native anchor has a narrow documented Next lint exception because full document navigation is the reset contract. App commit882066b3c5b9d6aae483fa0548c59ceaebdfbc5b is live via dep-db387nh42hec738tcvig at2026-10-07T17:40:41.201022Z. No model tests repeated because numeric code is unchanged; meaningful browser tests cover the new navigation. Evidence: ../../../design-qa-logo-home-20261007-v1.md.
