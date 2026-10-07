# Background schema

Build: quick-roi-client-copy-handoff-20261007-v5. Baselines: ../quick-roi-bottleneck-handoff-20261007-v3/05-background-schema.md and ../quick-roi-client-copy-20261007-v4/05-background-schema.md.

## Context and content
The user clarified taste first, comprehensive offering with contact capture second. The subheading is Choose one bottleneck. Get a quick estimate. Client-copy records cover input helpers, result labels, assumptions and metadata. The broader contact-intake implementation is existing and unchanged.

## State delta
editedFields: Record<QuickLaneId, QuickFieldKey[]> stores unique edited keys per lane. isExample means the active lane has no edited key; hasExamples means fewer edited keys than the lane's field count. This drives Example values / Includes example values / Your process data and expanded-assumption context. A user's edit changes presentation status only, never the calculation formula.

## Unchanged schema/invariants
Model1.0.0, lane IDs, all three defaults/field bounds, ReductionRange(10,25), valid input/result structures, event readiness, error behavior and USD formatting retain the v3 definitions. FULL_ROI_URL remains the fixed full-assessment root with no entered values in its URL. No database, backend payload, storage, analytics, migration or new environment variable exists. All quick values remain transient browser memory.
