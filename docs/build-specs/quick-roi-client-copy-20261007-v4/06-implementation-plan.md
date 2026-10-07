# Implementation plan

Build: quick-roi-client-copy-20261007-v4. Baseline: ../quick-roi-bottleneck-handoff-20261007-v3/06-implementation-plan.md.

## Sequence
1. Draft six delta documents and inventory the visible copy (complete).
2. Replace the initial card and client-facing strings; implement accurate example state (CP-001–003).
3. Build/lint the scoped revision; verify default, mixed/full inputs, result, errors, assumptions and mobile (CP-004).
4. Record new uniquely named QA evidence and deploy the reviewed quick-site commit only (CP-005).
5. Create a reconciled six-document handoff snapshot with the actual commit/deploy and checks.

## Gates and boundaries
No new model test is planned for a copy/state presentation revision; existing six arithmetic/validation tests cover unchanged logic. Existing security/dependency maintenance limits stay documented; no package version changes are needed. Roll back by redeploying the prior quick-site commit 9b2899088fc2da2029f48098064652827f9f2e47. The full app remains outside this revision.
