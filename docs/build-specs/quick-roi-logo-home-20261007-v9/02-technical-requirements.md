# Technical requirements document

Build: quick-roi-logo-home-20261007-v9. Status: implementation-ready. Baseline: [../quick-roi-compact-inputs-handoff-20261007-v8/build-spec-manifest.json](../quick-roi-compact-inputs-handoff-20261007-v8/build-spec-manifest.json).

Wrap the existing logo image in a native same-origin anchor href="/". A normal document navigation reinitializes all React tab state. This avoids maintaining a second reset implementation across lane values, ready/attempted arrays, scenario text and disclosure state. Preserve standard new-tab/modifier behavior.

Use a44px minimum link height and visible branded focus. Reduce header vertical padding to retain existing compact height. No packages, backend, storage, numerical model or deployment configuration change.

Verify quick static build and lint; browser keyboard and pointer navigation, reset across lanes/scenario/errors, initial/desktop/mobile bounds. Deploy only quick static service srv-db3501qd0e5s73f57f2g. Original full calculator untouched. No new network endpoint: navigation uses existing page origin.
