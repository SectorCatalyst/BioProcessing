# Bioprocess Development ROI Calculator

Governed Next.js application for estimating the economic impact of digital orchestration in pharmaceutical bioprocess development. The model keeps Hard-Dollar, Capacity, and Strategic value separate, exposes auditable formula trace output, preserves provenance metadata, and records lifecycle lineage for local persisted model states.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui primitives
- React Hook Form + Zod
- Zustand with localStorage persistence
- Recharts
- jsPDF + jsPDF AutoTable
- pg

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run lint
npm run build
npm run test:e2e
```

These commands cover linting, production build/type checking, and Playwright coverage for the actual-session start, example-session start, four-section input flow, over-40 numeric inputs, survey benchmark application, report generation, PDF export, and public API guard behavior.

## What Is Implemented

- Structured input model covering Organization Profile, Current State, Cost Basis, Improvement Assumptions, Risk & Realization, Advanced Settings, Review and Sign-Off, and Scenario Justification.
- Scenario-based pure calculation engine for Labor Efficiency, Rerun Avoidance, Failed-Run Avoidance, Deviation Reduction, Cycle-Time Acceleration, Transfer Improvement, Transfer Delay Avoidance, Onboarding Efficiency, and optional Strategic Proxy.
- Conservative financial metrics across a three-year horizon, including Total Investment, recurring cost, phased benefits, 3-Year ROI, payback, NPV, and IRR.
- Assumptions Register with locked columns and provenance-aware source labeling.
- Model Risk Panel and conservative readiness logic.
- Formula Trace output for major engines and KPI calculations.
- Lifecycle metadata, local persistence, change log, review metadata, and override logging.
- Front-door lead capture gate that hides the calculator until contact details are submitted.
- Built-in lead-capture API route with local fallback behavior and Postgres persistence when `DATABASE_URL` is configured.
- Built-in assessment-submission API route with server-side calculation, persisted report storage, email-webhook notification support, and Postgres-backed admin retrieval when `DATABASE_URL` is configured.
- Demo/test-data controls that can load illustrative governed datasets and restore the previous working model.
- JSON, CSV, and PDF export flows with the required top-level ordering rules applied in code.
- BioPilot model version `2.1.2` with batch-failure occurrence, failure-cause exposure, failed-run recovery effort, neutral BioPlan 2023 survey benchmark application, BioPilot investment ROI context, and persisted model-version metadata across progress, submissions, admin exports, and PDF reports.

## Project Structure

- [`app/page.tsx`](/Users/troysullivan/Documents/BioProcessing ROI Calculator/app/page.tsx): page entry point
- [`app/api/lead-capture/route.ts`](/Users/troysullivan/Documents/BioProcessing ROI Calculator/app/api/lead-capture/route.ts): lead capture API route with Postgres insert and safe fallback
- [`app/api/assessment-submissions/route.ts`](/Users/troysullivan/Documents/BioProcessing ROI Calculator/app/api/assessment-submissions/route.ts): full assessment persistence route with server-side report generation and admin access
- [`components/calculator-app.tsx`](/Users/troysullivan/Documents/BioProcessing ROI Calculator/components/calculator-app.tsx): primary governed UI
- [`lib/model.ts`](/Users/troysullivan/Documents/BioProcessing ROI Calculator/lib/model.ts): types, field definitions, defaults, validation, provenance metadata
- [`lib/calculations.ts`](/Users/troysullivan/Documents/BioProcessing ROI Calculator/lib/calculations.ts): pure value engines, financial metrics, readiness, risk, trace, narrative
- [`lib/exporters.ts`](/Users/troysullivan/Documents/BioProcessing ROI Calculator/lib/exporters.ts): JSON, CSV, and PDF exports
- [`lib/test-data.ts`](/Users/troysullivan/Documents/BioProcessing ROI Calculator/lib/test-data.ts): governed demo datasets used by the test-data controls
- [`store/use-calculator-store.ts`](/Users/troysullivan/Documents/BioProcessing ROI Calculator/store/use-calculator-store.ts): persisted local model state, lineage, overrides, and change log

## Render Setup

The repository includes a [`render.yaml`](/Users/troysullivan/Documents/BioProcessing ROI Calculator/render.yaml) blueprint for a Render Web Service plus Postgres database.

The blueprint uses:

- `npm ci && npm run build` for deterministic installs from `package-lock.json`.
- `npm start`, which binds Next.js to `0.0.0.0` and Render's `PORT`.
- `/api/health` as the public Render health-check path.
- `NODE_VERSION=22`.
- `autoDeployTrigger: commit` on the `codex/biopilot-survey-data-enhancements` branch.

To persist lead capture and assessment reports into Render-hosted Postgres, configure:

1. A Render Postgres instance in the same region as the web service.
2. A `DATABASE_URL` environment variable on the web service, using the database's internal connection string.
3. A `LEAD_CAPTURE_ADMIN_KEY` environment variable on the web service for protected lead-management access.
4. Optionally, a `BIOPILOT_EMAIL_WEBHOOK_URL` environment variable for lead, abandoned-session, and report-submission email notifications. `SALES_NOTIFICATION_WEBHOOK_URL` remains as a legacy fallback for report notifications.
5. Optionally, `BIOPILOT_NOTIFICATION_RECIPIENTS`, `BIOPILOT_EMAIL_WEBHOOK_SECRET`, `BIOPILOT_ABANDONMENT_MINUTES`, `BIOPILOT_NOTIFICATION_CRON_KEY`, and `BIOPILOT_PUBLIC_BASE_URL` for the notification payload, provider verification, abandoned-session window, cron authorization, and production base URL.
6. Optionally, a `NEXT_PUBLIC_SITE_URL` environment variable with the final Render or custom-domain URL for share-card metadata.
7. A redeploy of the web service after the env vars are present.

Before sharing the hosted URL with clients, verify:

- `GET /api/health` returns `ok: true`.
- `GET /api/admin/db-health` succeeds after entering the `LEAD_CAPTURE_ADMIN_KEY` in the `x-admin-key` header.
- A fresh actual assessment can be submitted and appears in [`/admin/leads`](/Users/troysullivan/Documents/BioProcessing ROI Calculator/app/admin/leads/page.tsx).
- The same assessment can export a PDF from the final report screen.

Once `DATABASE_URL` is available, the built-in [`/api/lead-capture`](/Users/troysullivan/Documents/BioProcessing ROI Calculator/app/api/lead-capture/route.ts) route will:

- validate the incoming lead payload
- create the `roi_lead_captures` table automatically if it does not exist
- upsert lead records by work email
- preserve the first capture timestamp and update `updated_at` on later submissions from the same email
- expose guarded read/delete access for lead management when `LEAD_CAPTURE_ADMIN_KEY` is configured

The built-in [`/api/assessment-submissions`](/Users/troysullivan/Documents/BioProcessing ROI Calculator/app/api/assessment-submissions/route.ts) route will:

- validate the submitted contact and operating-input payload
- normalize the inputs and calculate the BioPilot report on the server
- upsert the linked lead record by work email
- create the `roi_assessment_submissions` table automatically if it does not exist
- insert each generated assessment as a durable report snapshot tied back to the lead capture
- expose guarded read/delete access for assessment management when `LEAD_CAPTURE_ADMIN_KEY` is configured

## Email Webhook Notifications

The production app can send internal email-webhook payloads without exposing notification secrets to the browser. The preferred setup is the first-party Render webhook at `/api/internal/email-webhook`, protected by `BIOPILOT_EMAIL_WEBHOOK_SECRET`, with email delivery handled by Postmark.

Notification events:

- `lead_captured`: sent after a real user submits contact details and the lead is saved.
- `report_submitted`: sent after a real user generates and saves a final report.
- `assessment_abandoned`: sent by a scheduled abandoned-session check when a real user has contact details and saved progress, but no final report after the configured inactivity window.

The payload includes:

- `subject`, `title`, `summary`, and `text` fields that can map directly into an email.
- `lead` fields for name, work email, company, title, and region.
- `report` fields for fit score, fit band, annual value potential, ROI, payback, and recommended action when a report is submitted.
- `progress` fields for last step, last status, completed sections, and inactivity age when a session is abandoned.
- `adminUrl` linking back to the protected admin page.

Recommended Render env vars:

```bash
BIOPILOT_EMAIL_WEBHOOK_URL=https://bioprocessing-roi.onrender.com/api/internal/email-webhook
BIOPILOT_EMAIL_WEBHOOK_SECRET=replace-with-a-long-random-secret
BIOPILOT_NOTIFICATION_RECIPIENTS=you@example.com,team@example.com
POSTMARK_SERVER_TOKEN=postmark-server-token
POSTMARK_FROM_EMAIL=verified-sender@example.com
POSTMARK_MESSAGE_STREAM=outbound
POSTMARK_REPLY_TO=optional-reply-address@example.com
BIOPILOT_ABANDONMENT_MINUTES=60
BIOPILOT_NOTIFICATION_CRON_KEY=replace-with-a-long-random-secret
BIOPILOT_PUBLIC_BASE_URL=https://bioprocessing-roi.onrender.com
```

Notification delivery is intentionally non-blocking: if the internal webhook or Postmark fails, lead capture and report generation still complete. Delivery attempts are tracked in `roi_notification_events` so repeated abandoned-session checks do not send duplicate abandonment emails for the same session.

Postmark requirements:

- Use the Postmark Server API Token, not the Account API Token.
- `POSTMARK_FROM_EMAIL` must be a verified sender signature or a sender on a verified domain in Postmark.
- `POSTMARK_MESSAGE_STREAM` should usually be `outbound` unless a specific stream was created for BioPilot ROI notifications.
- The internal webhook will not be considered configured until `BIOPILOT_EMAIL_WEBHOOK_URL`, `BIOPILOT_EMAIL_WEBHOOK_SECRET`, `BIOPILOT_NOTIFICATION_RECIPIENTS`, `POSTMARK_SERVER_TOKEN`, and `POSTMARK_FROM_EMAIL` are all present.
- The Postmark Server API Token is found by opening the Postmark server, or by using Account → API Tokens → Server API tokens and selecting the specific server. Do not use an Account API Token for sending BioPilot notification email.

To check abandoned sessions, create a Render Cron Job using the same repository and branch and run:

```bash
npm run notify:abandoned
```

Run it every 30-60 minutes. The script calls the protected [`/api/admin/notifications/abandoned-sessions`](/Users/troysullivan/Documents/BioProcessing ROI Calculator/app/api/admin/notifications/abandoned-sessions/route.ts) endpoint with `BIOPILOT_NOTIFICATION_CRON_KEY` or `LEAD_CAPTURE_ADMIN_KEY`.

If `DATABASE_URL` is missing or the insert fails, the gate still unlocks using local-only capture and the report still renders, so the app remains usable during setup.

## API Access

- Browser traffic posts only to the app's own `/api/lead-capture` and `/api/assessment-submissions` routes.
- The database is never called directly from the browser.
- No separate API service is required unless you want one; the existing Next.js app can own the lead-capture endpoint.
- Lead and assessment management is available at [`/admin/leads`](/Users/troysullivan/Documents/BioProcessing ROI Calculator/app/admin/leads/page.tsx) and requires the same `LEAD_CAPTURE_ADMIN_KEY` value entered into the admin page.
- For local development, leave `DATABASE_URL` unset if you want to test the local-only fallback. Use `.env.example` as the env var template.
- Public POST routes require JSON, enforce request-size limits, rate-limit repeated submissions, reject cross-origin browser submissions, and block simple honeypot/spam payloads.

## Modeling Notes

- Percentages are stored as whole numbers and converted to decimals inside the calculation engine.
- Annual runs are derived as `Runs per Month × 12`.
- Saved labor is monetized once and routed to Hard-Dollar, Capacity, or a mixed split based on Labor Treatment Mode.
- BioPilot v2 separates ordinary batch-review effort from failed/degraded-run recovery and uses the neutral survey benchmark only when the user explicitly applies it.
- Cycle-Time Acceleration and Transfer Delay Avoidance apply Capture Factor and Confidence Factor.
- Strategic Proxy remains separate and discounted by design.
- Decision-lag reduction is tracked but not independently monetized in version 1.

## Known Limitations

- The handoff document references locked acceptance tests and golden vectors `GV-001` through `GV-005`, but the numeric fixtures themselves were not present in the provided DOCX. The implementation therefore includes the governed engine and reporting surfaces, but not authoritative vector verification.
- Validation ranges and messages were implemented conservatively from the handoff model, not from a separate locked micro-spec pack.
- Benchmark guidance includes a neutral public survey benchmark for batch-failure recency and failure-cause exposure. It remains a planning assumption until replaced by site-specific failure logs, deviation records, and recovery effort.
- The PDF export is structurally compliant with the required section order, but intentionally plain.
- `npm install` currently reports one high-severity dependency vulnerability from the installed dependency tree. It was not remediated in this pass because no package upgrade strategy was specified.
