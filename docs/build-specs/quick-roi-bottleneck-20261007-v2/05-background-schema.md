# Background schema

Build: BioPilot Quick ROI — concept evaluation v1
Date: 2026-10-07
Branch: codex/biopilot-quick-roi-20261007
Baseline: 2bb6adf, current BioPilot assessment model 2.2.1
Status: selected Bottleneck Finder; implementation-ready; no calculator implementation or deployment yet.


## Supporting context
The supplied goal is an easier first sales-stage tool, with the existing comprehensive assessment offered later. The 2026-10-06 comparison files in reviews/thermo-comparison-20261006-01 are the evidence baseline. The current app has a separate fit/modeling layer; its fit score is not empirical proof of a financial uplift. Keep this distinction in the new tool.

## Current versus proposed data model
Current: BioPilotAssessmentInputs, evidence metadata, scoped subscription model and report persistence exist in the comprehensive assessment. Proposed quick stage: a separate minimal browser-local input model and deterministic result object. No new database is needed for concept evaluation or the initial anonymous estimate.

Proposed input union:
- modelVersion: string, required, unique for the eventual implemented quick model.
- conceptId: batch_snapshot | bottleneck_finder | team_time_back.
- laneId: review | failure | transfer, required only for the bottleneck concept.
- annualRuns: nonnegative integer for batch/review lane.
- hoursPerRun: finite nonnegative number, scoped to review/data-assembly work; no recovery or transfer overlap.
- loadedHourlyRate: finite nonnegative currency/hour, explicit user value or visible editable assumption.
- teamMembers: nonnegative integer for weekly concept.
- hoursPerPersonPerWeek: finite nonnegative number for weekly concept.
- workingWeeksPerYear: finite number, illustrative default 48, exposed as an assumption.
- baselineEventsPerYear and netAvoidableCostPerEvent: optional measured inputs for a later failure lane; not total product selling value.
- transfersPerYear and hoursPerTransfer: scoped inputs for the transfer lane.
- improvementLow/improvementHigh: visible scenario fractions with 0 <= low <= high <= 1. The 0.10/0.25 mockup values are illustrative, not validated BioPilot effectiveness.
- attributableShare: separate fraction for any event-risk lane. Do not assume 1.
- annualInvestment: optional amount for investment context; do not infer public product pricing from an internal default.
- cashRealizationShare: optional explicit fraction of capacity savings actually monetizable. Default capacity is not cash.
- inputSources: field-to-user/example/planning-assumption labels.
- contact: absent before a voluntary next-stage action.

Proposed outputs:
- baselineEffortHours and recoveredHoursLow/High.
- capacityValueLow/High = recovered hours × loaded hourly rate.
- cashSavingsLow/High only if a defensible cash-realization basis exists.
- investmentComparison/ROI only with stated cost horizon, investment and cash basis; otherwise omitted.
- dominantDriver, scenarioExplanation, warnings and nextStageUrl.

## Invariants and lifecycle
Do not double-count team-hours, batch-review effort, failed-run recovery or transferred effort. Allow zero opportunity. Currency units and horizon must agree. The displayed range is a planning scenario, not a probability interval. Use no browser history, credentials, real contact details or private financial inputs in generated concepts. Proposed input state lives in memory/session only; retention and voluntary lead-save rules will be specified when that slice is selected. Never transmit financial/contact fields in URL parameters.

## Configuration and integration
Proposed /quick-roi route and separate preview service; exact public URL unresolved. Deep-assessment target is the existing assessment entry, subject to a later handoff review. No secret values are copied. If an optional lead path is later added, use first-party guarded endpoints with preview-specific configuration and explicit user action. No migration or seeding is required at concept stage.

## Selected implementation decision — 2026-10-07
The user selected Bottleneck Finder and explicitly required continuity with the larger calculator. This version supersedes the concept pack. Implement only Bottleneck Finder: three alternative lanes, three numeric inputs per lane, immediate anonymous result, then a link to the existing detailed assessment. Use shared existing design tokens and source logo. The 10–25% reduction is an editable illustrative planning scenario, never a validated BioPilot improvement claim.

## Selected typed model
QuickLane = review | failure | transfer. A separate field-value record belongs to each lane. Review/transfer require count, hours and loaded hourly cost. Failure requires failedRunsPerYear, netAvoidableCostPerRun and addressableSharePercent. Defaults are example data and remain visibly labelled.

Reduction assumptions are reductionLowPercent and reductionHighPercent, default 10 and 25, with 0 <= low <= high <= 100. Review baseline effort = runs × hours/run; transfer baseline effort = transfers × hours/package. Recovered effort = baseline × reduction fraction; capacity value = recovered effort × hourly cost. Failure baseline loss = failed runs × net avoidable impact; addressable events = failed runs × addressable share; modeled avoided events/value = addressable events/loss × reduction fraction. This is avoided-loss potential, never guaranteed cash or 100% prevention.

Outputs include lane, result kind (capacity | avoided_loss), low/high values, effort/event range, before/after workload where meaningful, and arithmetic explanations. Version string records the selected quick-model version. There are no persisted entities, database migrations, lead POSTs, tracking identifiers, cookies or customer-input URL parameters. The full-assessment URL is a fixed verified public destination.
