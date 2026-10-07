# Product requirements document

Build: quick-roi-bottleneck-handoff-20261007-v3. Reconciles the implemented Bottleneck Finder and supersedes ../quick-roi-bottleneck-20261007-v2. Earlier concept and implementation packs are preserved.

## Purpose and audience
Prospective bioprocessing clients need a small first step that reveals an opportunity before the detailed BioPilot assessment. The user selected Bottleneck Finder, explicitly replacing the earlier Team Time Back direction. Keep the existing calculator's look and feel and create a separate branch and URL.

## Implemented scope
BioPilot Quick ROI offers Batch review, Failed runs and Tech transfer. One selected lane exposes three inputs and a local estimate. There is no lead form before the result. The optional full-business-case action opens the existing detailed assessment afterward.

## Requirements and acceptance
| ID | Requirement | Verified acceptance |
|---|---|---|
| PR-001 | Three bottleneck choices | All three visible and selectable; correct form/result on each |
| PR-002 | Three main inputs per lane | Defaults, units and helper text visible; no setup wizard |
| PR-003 | Clear directional result | Annual value range plus recovered hours or modeled avoided runs; capacity separated from cash |
| PR-004 | Honest scenario | Default 10–25% explicitly illustrative; editable in assumptions; invalid ordering rejected |
| PR-005 | Conservative failure scope | Net avoidable cost and user-entered addressable share applied before reduction; zero valid |
| PR-006 | Results before contact capture | No contact input or submission; memory-only values; optional fixed handoff carries no entered data |
| PR-007 | Visual continuity | Actual source logo, original shared font/palette/background, rounded controls and blue actions reused |
| PR-008 | Recoverable accessible flow | Inline validation, invalid-field focus, polite result announcement, keyboard choices, mobile result scroll; 320/390px no overflow |
| PR-009 | Separate release | New branch and separate Render static site; original calculator service remains on its prior branch |
| PR-010 | Complete handoff | Six reconciled documents, model/source/browser checks and release evidence retained |

## Boundaries
No combined-lane total, ROI percentage, payback, investment entry, realization ramp, exports, customer accounts, database, contact collection, CRM action, email send or input transfer. The detailed tool remains the later-stage business-case workflow.

## Assumptions and success evaluation
Example operating values and 10–25% reduction are planning assumptions, not vendor performance evidence. Technical completion and flow count are verified; conversion uplift, client comprehension and completion time have not been measured. Evaluate comprehension, completion and voluntary deeper-assessment handoff in consented prospect sessions before choosing analytics or quoting the outputs commercially.

## Release and sources
Live preview: https://biopilot-quick-roi.onrender.com/ . Selected visual: ../../concepts/quick-roi-20261007-v1/bottleneck-finder.png. User instructions are authoritative over earlier proposals. See ../../../design-qa.md and ../../../reviews/bottleneck-qa-20261007-v1/ for evidence.
