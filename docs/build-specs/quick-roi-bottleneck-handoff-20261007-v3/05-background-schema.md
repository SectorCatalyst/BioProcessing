# Background schema

Build: quick-roi-bottleneck-handoff-20261007-v3. Reconciles the implemented Bottleneck Finder and supersedes ../quick-roi-bottleneck-20261007-v2. Earlier concept and implementation packs are preserved.

## Context and sources
The objective is an initial prospect-facing tool followed by the existing comprehensive BioPilot fit assessment and business case. Thermo's simple ROI experience inspired the lower-friction entry; no Thermo formula or performance claim is copied. User selection of Bottleneck Finder supersedes the earlier concept recommendation. Operating defaults and reductions are explicitly illustrative.

## Real backend and ownership
There is no backend, database, account, submission endpoint, queue or migration in the quick tool. The deployment serves static assets. Each visitor owns transient browser-tab state; values are lost on reload or close and never placed in a URL. Existing full-tool backend records and notifications are outside this state model.

## Content/input schema
QuickLaneId is review | failure | transfer. Each lane defines label, formTitle, resultTitle and three QuickField records (key, label, help, unit, example, max, optional integer flag).
| Lane | Main inputs and defaults | Bounds/invariants |
|---|---|---|
| review | eventsPerYear=100, hoursPerEvent=20, hourlyRate=145 USD | events whole 0–1,000,000; hours 0–100,000; rate 0–10,000 |
| failure | eventsPerYear=5, costPerEvent=80,000 USD, addressableSharePercent=25 | events annual average 0–1,000,000 (fractional allowed); net avoidable cost 0–1,000,000,000; share 0–100 |
| transfer | eventsPerYear=3, hoursPerEvent=78, hourlyRate=145 USD | events whole 0–1,000,000; hours/rate as review |
Raw values are strings in a per-lane partial record. Parsing returns numeric fields, per-field errors and a valid flag. Blank, nonfinite, negative, oversized and malformed grouped values are rejected; properly grouped currency text is accepted. Zero is valid. USD is the current fixed display currency.

## Scenario/result schema
ReductionRange has low=10 and high=25 by default. Both must be finite 0–100 with low≤high; there is no evidence that these are measured BioPilot improvements.
QuickResult identifies modelVersion=1.0.0, laneId, kind=capacity|avoided_loss, reduction, baselineEffort, baselineLoss, addressableLoss, recoveredHoursLow/High, avoidedEventsLow/High, annualValueLow/High and hoursAfterLow/High.
Review/transfer: baseline hours = annual events × hands-on hours per event; recovered hours = baseline × reduction; capacity value = recovered hours × loaded rate.
Failure: annual loss = observed failures × net avoidable impact; addressable loss = annual loss × share; avoided-loss value = addressable loss × reduction. Avoided events are expected annual fractions, not a promise that an individual failure is prevented.
No lane summation, investment, net ROI, double-counted cash savings or benefit ramp is computed. Currency values ≥$1,000 are rounded to $100; displayed hour counts are rounded and the pure model retains precision.

## UI lifecycle/configuration
React state: selected lane; allInputs; editedLanes; readyLanes; attempted lanes; global lowText/highText; assumptionsOpen; result focus/scroll reference. A valid submitted lane renders a result; invalid edits remove its stale result. Only active panels mount, avoiding duplicate IDs.
Configuration: FULL_ROI_URL=https://bioprocessing-roi.onrender.com/; separate Render build/publish settings and response headers in render.quick-roi-20261007.yaml. No secret value is committed or required by the published app. There are no application analytics events or persisted payloads; only normal hosting asset traffic exists.
