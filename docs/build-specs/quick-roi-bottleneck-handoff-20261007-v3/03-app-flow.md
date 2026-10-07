# App flow document

Build: quick-roi-bottleneck-handoff-20261007-v3. Reconciles the implemented Bottleneck Finder and supersedes ../quick-roi-bottleneck-20261007-v2. Earlier concept and implementation packs are preserved.

## Entry and actor
An anonymous prospect opens the new root URL. The initial state selects Batch review and shows three labeled example inputs. A neutral result placeholder explains the estimate; there is no contact gate (PR-001/002/006).

## Primary sequence
1. Select Batch review, Failed runs or Tech transfer. Arrow keys move tab focus; Enter activates the focused lane.
2. Edit the lane's three values, or use its clearly labeled examples.
3. Select See my estimate. Valid input produces the selected lane's annual range and effort/loss context immediately in the browser (PR-003/005).
4. On a small screen, submission brings the result into view. The estimate button becomes Update estimate; subsequent valid edits update the current estimate.
5. Optionally open Review assumptions. Inspect formulas, limits and privacy, edit the shared lower/upper scenario, or restore 10–25%.
6. Optionally choose Build my full business case. The full assessment opens in another tab; the quick-tool state is retained, and the destination has no input parameters.

## State and recovery
| State | Display and behavior |
|---|---|
| First visit | Example labels and uncalculated placeholder; no fabricated live result |
| Edited | Explains that unchanged values remain examples |
| Valid submitted | Result, caveat, before/after or addressable loss and optional deeper CTA |
| Invalid main input | Inline error, first invalid field receives focus, no stale result; values retained |
| Invalid scenario | Error inside assumptions; range must be 0–100 and ordered; result hidden until corrected |
| Zero opportunity | Valid $0 range plus plain explanation; other lanes remain available |
| Lane switching | Each lane's inputs and submitted status preserved; only selected lane rendered |
| Reload/close | In-memory entries reset to examples; no persisted customer data |

## Assumptions and outcomes
Two optional scenario controls are disclosed after the main three-input path. The same scenario range applies to all lanes; they are never combined. No cancellation or backend retry is needed because there is no network calculation or write. Asset loading follows the normal static page download. Internet access is needed to open the later full assessment.

## Verified transitions
Local and public result paths tested for all three lanes. Blank/zero recovery, invalid scenario and restoring defaults, keyboard activation, state retention, mobile scroll and the fixed external handoff were observed. The full assessment's contact fields were left blank. Consent and submission behavior in that separate app are outside this build.
