# Background schema

Build: quick-roi-client-copy-20261007-v4. Baseline: ../quick-roi-bottleneck-handoff-20261007-v3/05-background-schema.md.

## Context and unchanged model
The client's first-stage task is still choosing a bottleneck and estimating its potential annual value. The screenshot identifies excessive product narration in the initial placeholder. Numeric inputs, defaults, formulas, bounds, output types and model version 1.0.0 remain unchanged.

## State delta
editedFields: Record<QuickLaneId, QuickFieldKey[]> replaces editedLanes. Each lane stores unique keys touched by the visitor. isExample means no edited keys; hasExamples means fewer edited keys than the lane's three fields. This state drives concise truthful labels; it never leaves the tab or affects calculations.

## Content/configuration
Copy strings in the component, lane field records and metadata are revised. Initial placeholder has no Info illustration/card. FULL_ROI_URL, Render branch/service, static export, security headers and data retention are unchanged. There is no database, migration, analytics or backend payload.
