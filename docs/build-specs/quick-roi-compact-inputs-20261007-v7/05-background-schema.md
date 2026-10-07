# Background schema

Build: quick-roi-compact-inputs-20261007-v7. Status: implementation-ready. Baseline: [../quick-roi-client-copy-final-20261007-v6](../quick-roi-client-copy-final-20261007-v6/build-spec-manifest.json).

Quick ROI model 1.0.0 estimates one lane of capacity or avoidable loss; it does not calculate investment ROI. Baseline domain formulas, limits and detailed-stage contact capture are unchanged.

No backend/database exists. allInputs is Record<QuickLaneId, QuickRawInputs>, initialized {review:{}, failure:{}, transfer:{}}. Blank/missing strings are invalid process inputs. field.example numbers (100/20/145; 5/80000/25; 3/78/145) become UI placeholders only. Remove editedFields and example-status derivations.

laneId defaults review. readyLanes and attempted remain per-lane arrays. lowText/highText remain actual scenario defaults 10/25; assumptionsOpen defaults false. Clearing any process field writes an empty string. Result derives only from ready + valid process inputs + valid range, so cleared entries never leave a stale result.

All state is transient in this tab; no persistence, tracking, submission or integration is added. FULL_ROI_URL and static Render service configuration are unchanged. No migration is needed.
