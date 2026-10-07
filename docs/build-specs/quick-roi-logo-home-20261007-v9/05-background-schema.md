# Background schema

Build: quick-roi-logo-home-20261007-v9. Status: implementation-ready. Baseline: [../quick-roi-compact-inputs-handoff-20261007-v8/build-spec-manifest.json](../quick-roi-compact-inputs-handoff-20261007-v8/build-spec-manifest.json).

There is no backend/database. Home navigation reloads the document and reinitializes existing client state: laneId review; allInputs {review:{}, failure:{}, transfer:{}}; readyLanes []; attempted []; lowText "10"; highText "25"; assumptionsOpen false. Derived result null. No migration or persistence.

The header now owns a navigation link href="/", explicit accessible reset/home label and unchanged image asset. This is a normal GET of the existing static main page. No customer values are submitted or encoded in a URL.

Quick model1.0.0, examples-as-placeholders, all field limits and full-assessment URL remain authoritative baseline. The suggested estimate-panel layout is future presentation only and does not add data entities.
