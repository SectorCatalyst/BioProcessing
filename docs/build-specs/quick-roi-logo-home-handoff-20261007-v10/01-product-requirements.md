# Product requirements document

Build: quick-roi-logo-home-handoff-20261007-v10. Status: handoff-ready. Draft baseline: [../quick-roi-logo-home-20261007-v9/build-spec-manifest.json](../quick-roi-logo-home-20261007-v9/build-spec-manifest.json).

PR-001: Clicking the top-left Yokogawa logo navigates to the quick tool's main page and resets every lane's process inputs, prior estimates, errors and open assumptions. Scenario inputs return to 10/25. Acceptance: populate multiple lanes and modify the scenario, activate the logo, then verify the initial review state and blank fields in every lane.

PR-002: Keep compact desktop fit, approved logo and keyboard/touch access. Acceptance: named home link, visible focus, minimum44px target; 1280×720 result remains unclipped and mobile has no horizontal overflow.

PR-003: Provide an aesthetic recommendation for the sparse right side. Recommended next treatment: a subtle blue-tinted bounded estimate panel, two labelled output placeholders before calculation, then actual results in the same area. This is advisory in this revision; no extra copy, fabricated results or chart is added to the live interface.

The main page means this quick calculator's starting screen, not the comprehensive assessment. Model and detailed-stage contact handoff stay unchanged.

## Verified outcome

PR-001 and PR-002 verified: all populated lanes reset to blanks, ready/error state cleared, review selected, assumptions closed, range10/25 and scroll0. Local keyboard/pointer and actual native live logo click passed. PR-003 delivered as a recommendation only; the right-side layout is unchanged. Evidence: ../../../design-qa-logo-home-20261007-v1.md.
