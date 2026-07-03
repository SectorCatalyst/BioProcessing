import { Pool } from "pg";

import {
  assessBioPilotFit,
  BIOPILOT_MODEL_VERSION,
  type AssessmentEvidenceMeta,
  type BioPilotAssessmentInputs,
  type BioPilotAssessmentResults,
} from "@/lib/biopilot-fit-assessment";
import { type LeadCaptureFormInput } from "@/lib/model";

declare global {
  var __biopilotPersistencePool: Pool | undefined;
}

export type AssessmentSessionMode = "example" | "actual";

export interface AssessmentSubmissionRecord {
  id: string;
  leadCaptureId: string | null;
  sessionMode: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  company: string;
  jobTitle: string;
  countryRegion: string;
  processProfileId: string;
  lifecycleStageId: string;
  fitBand: string;
  fitScore: number;
  annualValuePotential: number;
  threeYearRoi: number;
  paybackMonths: number;
  digitalCoverage: number;
  manualBurdenIndex: number;
  modelVersion: string;
  digitalPlantMaturityScore: number | null;
  digitalPlantMaturityLevel: number | null;
  evidenceConfidenceScore: number | null;
  evidenceConfidenceBand: string | null;
  topPriority: string;
  salesFollowUp: string;
  executiveSummary: string;
  evidenceMeta: AssessmentEvidenceMeta;
  submittedInputs: BioPilotAssessmentInputs;
  generatedReport: BioPilotAssessmentResults;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackEntryRecord {
  id: string;
  assessmentId: string | null;
  workEmail: string;
  company: string;
  rating: number;
  usefulness: number;
  clarity: number;
  comment: string;
  page: string;
  createdAt: string;
}

export interface AssessmentProgressRecord {
  id: string;
  sessionId: string;
  sessionMode: string;
  leadCaptureId: string | null;
  firstName: string;
  lastName: string;
  workEmail: string;
  company: string;
  jobTitle: string;
  countryRegion: string;
  currentStep: string;
  status: string;
  completedSections: string[];
  processProfileId: string;
  lifecycleStageId: string;
  fitBand: string;
  fitScore: number;
  annualValuePotential: number;
  modelVersion: string;
  evidenceConfidenceScore: number | null;
  evidenceConfidenceBand: string | null;
  topPriority: string;
  evidenceMeta: AssessmentEvidenceMeta;
  submittedInputs: BioPilotAssessmentInputs;
  generatedReport: BioPilotAssessmentResults;
  updatedAt: string;
  createdAt: string;
}

export interface NotificationEventRecord {
  id: string;
  eventKey: string;
  eventType: string;
  referenceId: string;
  deliveryStatus: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  deliveredAt: string | null;
}

export const getPool = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return null;
  }

  if (!global.__biopilotPersistencePool) {
    const requiresSsl =
      (!databaseUrl.includes("localhost") &&
        !databaseUrl.includes("127.0.0.1") &&
        !databaseUrl.includes("sslmode=disable")) ||
      process.env.PGSSLMODE === "require" ||
      databaseUrl.includes("sslmode=require") ||
      databaseUrl.includes("neon.tech") ||
      databaseUrl.includes("supabase") ||
      databaseUrl.includes("render.com");

    global.__biopilotPersistencePool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 10000,
      max: 5,
      ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
    });
  }

  return global.__biopilotPersistencePool;
};

export const getAdminKey = () => process.env.LEAD_CAPTURE_ADMIN_KEY?.trim() ?? "";

export const isAuthorizedAdmin = (request: Request) => {
  const configuredKey = getAdminKey();
  if (!configuredKey) {
    return false;
  }

  const presentedKey = request.headers.get("x-admin-key")?.trim();
  return Boolean(presentedKey && presentedKey === configuredKey);
};

export const ensureLeadCaptureTable = async (pool: Pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roi_lead_captures (
      id BIGSERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      work_email TEXT NOT NULL,
      company TEXT NOT NULL,
      job_title TEXT NOT NULL,
      country_region TEXT NOT NULL,
      consent_to_contact BOOLEAN NOT NULL DEFAULT TRUE,
      session_mode TEXT NOT NULL DEFAULT 'actual',
      source TEXT NOT NULL DEFAULT 'bioprocess-roi-calculator',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE roi_lead_captures
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await pool.query(`
    ALTER TABLE roi_lead_captures
    ADD COLUMN IF NOT EXISTS session_mode TEXT NOT NULL DEFAULT 'actual';
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS roi_lead_captures_work_email_idx
      ON roi_lead_captures (work_email);
  `);
};

export const ensureAssessmentTable = async (pool: Pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roi_assessment_submissions (
      id BIGSERIAL PRIMARY KEY,
      lead_capture_id BIGINT REFERENCES roi_lead_captures(id) ON DELETE SET NULL,
      session_mode TEXT NOT NULL DEFAULT 'actual',
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      work_email TEXT NOT NULL,
      company TEXT NOT NULL,
      job_title TEXT NOT NULL,
      country_region TEXT NOT NULL,
      process_profile_id TEXT NOT NULL,
      lifecycle_stage_id TEXT NOT NULL,
      fit_band TEXT NOT NULL,
      fit_score DOUBLE PRECISION NOT NULL,
      annual_value_potential DOUBLE PRECISION NOT NULL,
      three_year_roi DOUBLE PRECISION NOT NULL,
      payback_months DOUBLE PRECISION NOT NULL,
      digital_coverage DOUBLE PRECISION NOT NULL,
      manual_burden_index DOUBLE PRECISION NOT NULL,
      model_version TEXT NOT NULL DEFAULT '2.2.0',
      evidence_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
      submitted_inputs JSONB NOT NULL,
      generated_report JSONB NOT NULL,
      source TEXT NOT NULL DEFAULT 'biopilot-fit-assessment',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE roi_assessment_submissions
    ADD COLUMN IF NOT EXISTS evidence_meta JSONB NOT NULL DEFAULT '{}'::jsonb;
  `);

  await pool.query(`
    ALTER TABLE roi_assessment_submissions
    ADD COLUMN IF NOT EXISTS session_mode TEXT NOT NULL DEFAULT 'actual';
  `);

  await pool.query(`
    ALTER TABLE roi_assessment_submissions
    ADD COLUMN IF NOT EXISTS model_version TEXT NOT NULL DEFAULT '2.2.0';
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS roi_assessment_submissions_work_email_idx
      ON roi_assessment_submissions (work_email);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS roi_assessment_submissions_updated_at_idx
      ON roi_assessment_submissions (updated_at DESC, id DESC);
  `);
};

export const ensureFeedbackTable = async (pool: Pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roi_feedback_entries (
      id BIGSERIAL PRIMARY KEY,
      assessment_id BIGINT,
      work_email TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      rating INTEGER NOT NULL,
      usefulness INTEGER NOT NULL,
      clarity INTEGER NOT NULL,
      comment TEXT NOT NULL DEFAULT '',
      page TEXT NOT NULL DEFAULT 'final-report',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS roi_feedback_entries_created_at_idx
      ON roi_feedback_entries (created_at DESC, id DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS roi_feedback_entries_work_email_idx
      ON roi_feedback_entries (work_email);
  `);
};

export const ensureAssessmentProgressTable = async (pool: Pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roi_assessment_progress (
      id BIGSERIAL PRIMARY KEY,
      session_id TEXT NOT NULL UNIQUE,
      session_mode TEXT NOT NULL DEFAULT 'actual',
      lead_capture_id BIGINT REFERENCES roi_lead_captures(id) ON DELETE SET NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      work_email TEXT NOT NULL,
      company TEXT NOT NULL,
      job_title TEXT NOT NULL,
      country_region TEXT NOT NULL,
      current_step TEXT NOT NULL,
      status TEXT NOT NULL,
      completed_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
      process_profile_id TEXT NOT NULL,
      lifecycle_stage_id TEXT NOT NULL,
      fit_band TEXT NOT NULL,
      fit_score DOUBLE PRECISION NOT NULL,
      annual_value_potential DOUBLE PRECISION NOT NULL,
      model_version TEXT NOT NULL DEFAULT '2.2.0',
      evidence_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
      submitted_inputs JSONB NOT NULL,
      generated_report JSONB NOT NULL,
      source TEXT NOT NULL DEFAULT 'biopilot-fit-progress',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS roi_assessment_progress_work_email_idx
      ON roi_assessment_progress (work_email);
  `);

  await pool.query(`
    ALTER TABLE roi_assessment_progress
    ADD COLUMN IF NOT EXISTS model_version TEXT NOT NULL DEFAULT '2.2.0';
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS roi_assessment_progress_updated_at_idx
      ON roi_assessment_progress (updated_at DESC, id DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS roi_assessment_progress_status_idx
      ON roi_assessment_progress (status);
  `);
};

export const ensureNotificationEventsTable = async (pool: Pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roi_notification_events (
      id BIGSERIAL PRIMARY KEY,
      event_key TEXT NOT NULL UNIQUE,
      event_type TEXT NOT NULL,
      reference_id TEXT NOT NULL DEFAULT '',
      delivery_status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      delivered_at TIMESTAMPTZ
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS roi_notification_events_type_status_idx
      ON roi_notification_events (event_type, delivery_status);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS roi_notification_events_updated_at_idx
      ON roi_notification_events (updated_at DESC, id DESC);
  `);
};

export const ensurePersistenceTables = async (pool: Pool) => {
  await ensureLeadCaptureTable(pool);
  await ensureAssessmentTable(pool);
  await ensureFeedbackTable(pool);
  await ensureAssessmentProgressTable(pool);
};

export const upsertLeadCapture = async (
  pool: Pool,
  lead: LeadCaptureFormInput,
  sessionMode: AssessmentSessionMode = "actual",
) => {
  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO roi_lead_captures (
        first_name,
        last_name,
        work_email,
        company,
        job_title,
        country_region,
        consent_to_contact,
        session_mode
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (work_email)
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        company = EXCLUDED.company,
        job_title = EXCLUDED.job_title,
        country_region = EXCLUDED.country_region,
        consent_to_contact = EXCLUDED.consent_to_contact,
        session_mode = EXCLUDED.session_mode,
        updated_at = NOW()
      RETURNING id
    `,
    [
      lead.firstName,
      lead.lastName,
      lead.workEmail.toLowerCase(),
      lead.company,
      lead.jobTitle,
      lead.countryRegion,
      lead.consentToContact,
      sessionMode,
    ],
  );

  return result.rows[0]?.id ?? null;
};

export const insertAssessmentSubmission = async ({
  pool,
  lead,
  inputs,
  evidenceMeta,
  sessionMode = "actual",
}: {
  pool: Pool;
  lead: LeadCaptureFormInput;
  inputs: BioPilotAssessmentInputs;
  evidenceMeta?: AssessmentEvidenceMeta | null;
  sessionMode?: AssessmentSessionMode;
}) => {
  const leadCaptureId =
    sessionMode === "example" ? null : await upsertLeadCapture(pool, lead, sessionMode);
  const results = assessBioPilotFit(inputs, evidenceMeta);

  const insertResult = await pool.query<{ id: string; created_at: string; updated_at: string }>(
    `
      INSERT INTO roi_assessment_submissions (
        lead_capture_id,
        session_mode,
        first_name,
        last_name,
        work_email,
        company,
        job_title,
        country_region,
        process_profile_id,
        lifecycle_stage_id,
        fit_band,
        fit_score,
        annual_value_potential,
        three_year_roi,
        payback_months,
        digital_coverage,
        manual_burden_index,
        model_version,
        evidence_meta,
        submitted_inputs,
        generated_report
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19::jsonb, $20::jsonb, $21::jsonb
      )
      RETURNING id, created_at, updated_at
    `,
    [
      leadCaptureId,
      sessionMode,
      lead.firstName,
      lead.lastName,
      lead.workEmail.toLowerCase(),
      lead.company,
      lead.jobTitle,
      lead.countryRegion,
      inputs.processProfileId,
      inputs.lifecycleStageId,
      results.fitBand,
      results.fitScore,
      results.annualValuePotential,
      results.threeYearRoi,
      results.paybackMonths,
      results.digitalCoverage,
      results.manualBurdenIndex,
      BIOPILOT_MODEL_VERSION,
      JSON.stringify(evidenceMeta ?? {}),
      JSON.stringify(inputs),
      JSON.stringify(results),
    ],
  );

  return {
    assessmentId: insertResult.rows[0]?.id ?? null,
    createdAt: insertResult.rows[0]?.created_at ?? new Date().toISOString(),
    updatedAt: insertResult.rows[0]?.updated_at ?? new Date().toISOString(),
    leadCaptureId,
    results,
  };
};

export const mapAssessmentAdminRow = (
  row: {
    id: string;
    lead_capture_id: string | null;
    session_mode: string;
    first_name: string;
    last_name: string;
    work_email: string;
    company: string;
    job_title: string;
    country_region: string;
    process_profile_id: string;
    lifecycle_stage_id: string;
    fit_band: string;
    fit_score: number;
    annual_value_potential: number;
    three_year_roi: number;
    payback_months: number;
    digital_coverage: number;
    manual_burden_index: number;
    model_version?: string | null;
    evidence_meta: AssessmentEvidenceMeta;
    submitted_inputs: BioPilotAssessmentInputs;
    generated_report: BioPilotAssessmentResults;
    created_at: string;
    updated_at: string;
  },
): AssessmentSubmissionRecord => ({
  id: row.id,
  leadCaptureId: row.lead_capture_id,
  sessionMode: row.session_mode,
  firstName: row.first_name,
  lastName: row.last_name,
  workEmail: row.work_email,
  company: row.company,
  jobTitle: row.job_title,
  countryRegion: row.country_region,
  processProfileId: row.process_profile_id,
  lifecycleStageId: row.lifecycle_stage_id,
  fitBand: row.fit_band,
  fitScore: row.fit_score,
  annualValuePotential: row.annual_value_potential,
  threeYearRoi: row.three_year_roi,
  paybackMonths: row.payback_months,
  digitalCoverage: row.digital_coverage,
  manualBurdenIndex: row.manual_burden_index,
  modelVersion: row.model_version ?? row.generated_report?.modelVersion ?? BIOPILOT_MODEL_VERSION,
  digitalPlantMaturityScore: row.generated_report?.digitalPlantMaturity?.score ?? null,
  digitalPlantMaturityLevel: row.generated_report?.digitalPlantMaturity?.level ?? null,
  evidenceConfidenceScore: row.generated_report?.evidenceConfidence?.score ?? null,
  evidenceConfidenceBand: row.generated_report?.evidenceConfidence?.band ?? null,
  topPriority: row.generated_report?.salesFollowUp?.priority ?? row.generated_report?.plays?.[0]?.title ?? "",
  salesFollowUp: row.generated_report?.salesFollowUp?.recommendedAction ?? "",
  executiveSummary: row.generated_report?.executiveSummary ?? "",
  evidenceMeta: row.evidence_meta ?? {},
  submittedInputs: row.submitted_inputs,
  generatedReport: row.generated_report,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const upsertAssessmentProgress = async ({
  pool,
  lead,
  inputs,
  sessionId,
  sessionMode,
  currentStep,
  status,
  completedSections,
  evidenceMeta,
}: {
  pool: Pool;
  lead: LeadCaptureFormInput;
  inputs: BioPilotAssessmentInputs;
  sessionId: string;
  sessionMode: "example" | "actual";
  currentStep: string;
  status: string;
  completedSections: string[];
  evidenceMeta?: AssessmentEvidenceMeta | null;
}) => {
  const leadCaptureId =
    sessionMode === "example" ? null : await upsertLeadCapture(pool, lead, sessionMode);
  const results = assessBioPilotFit(inputs, evidenceMeta);

  const result = await pool.query<{ id: string; updated_at: string; created_at: string }>(
    `
      INSERT INTO roi_assessment_progress (
        session_id,
        session_mode,
        lead_capture_id,
        first_name,
        last_name,
        work_email,
        company,
        job_title,
        country_region,
        current_step,
        status,
        completed_sections,
        process_profile_id,
        lifecycle_stage_id,
        fit_band,
        fit_score,
        annual_value_potential,
        model_version,
        evidence_meta,
        submitted_inputs,
        generated_report
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12::jsonb, $13, $14, $15, $16, $17, $18, $19::jsonb, $20::jsonb, $21::jsonb
      )
      ON CONFLICT (session_id)
      DO UPDATE SET
        session_mode = EXCLUDED.session_mode,
        lead_capture_id = EXCLUDED.lead_capture_id,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        work_email = EXCLUDED.work_email,
        company = EXCLUDED.company,
        job_title = EXCLUDED.job_title,
        country_region = EXCLUDED.country_region,
        current_step = EXCLUDED.current_step,
        status = EXCLUDED.status,
        completed_sections = EXCLUDED.completed_sections,
        process_profile_id = EXCLUDED.process_profile_id,
        lifecycle_stage_id = EXCLUDED.lifecycle_stage_id,
        fit_band = EXCLUDED.fit_band,
        fit_score = EXCLUDED.fit_score,
        annual_value_potential = EXCLUDED.annual_value_potential,
        model_version = EXCLUDED.model_version,
        evidence_meta = EXCLUDED.evidence_meta,
        submitted_inputs = EXCLUDED.submitted_inputs,
        generated_report = EXCLUDED.generated_report,
        updated_at = NOW()
      RETURNING id, created_at, updated_at
    `,
    [
      sessionId,
      sessionMode,
      leadCaptureId,
      lead.firstName,
      lead.lastName,
      lead.workEmail.toLowerCase(),
      lead.company,
      lead.jobTitle,
      lead.countryRegion,
      currentStep,
      status,
      JSON.stringify(completedSections),
      inputs.processProfileId,
      inputs.lifecycleStageId,
      results.fitBand,
      results.fitScore,
      results.annualValuePotential,
      BIOPILOT_MODEL_VERSION,
      JSON.stringify(evidenceMeta ?? {}),
      JSON.stringify(inputs),
      JSON.stringify(results),
    ],
  );

  return {
    progressId: result.rows[0]?.id ?? null,
    createdAt: result.rows[0]?.created_at ?? new Date().toISOString(),
    updatedAt: result.rows[0]?.updated_at ?? new Date().toISOString(),
    leadCaptureId,
    results,
  };
};

export const mapAssessmentProgressAdminRow = (row: {
  id: string;
  session_id: string;
  session_mode: string;
  lead_capture_id: string | null;
  first_name: string;
  last_name: string;
  work_email: string;
  company: string;
  job_title: string;
  country_region: string;
  current_step: string;
  status: string;
  completed_sections: string[] | unknown;
  process_profile_id: string;
  lifecycle_stage_id: string;
  fit_band: string;
  fit_score: number;
  annual_value_potential: number;
  model_version?: string | null;
  evidence_meta: AssessmentEvidenceMeta;
  submitted_inputs: BioPilotAssessmentInputs;
  generated_report: BioPilotAssessmentResults;
  updated_at: string;
  created_at: string;
}): AssessmentProgressRecord => ({
  id: row.id,
  sessionId: row.session_id,
  sessionMode: row.session_mode,
  leadCaptureId: row.lead_capture_id,
  firstName: row.first_name,
  lastName: row.last_name,
  workEmail: row.work_email,
  company: row.company,
  jobTitle: row.job_title,
  countryRegion: row.country_region,
  currentStep: row.current_step,
  status: row.status,
  completedSections: Array.isArray(row.completed_sections)
    ? row.completed_sections.map(String)
    : [],
  processProfileId: row.process_profile_id,
  lifecycleStageId: row.lifecycle_stage_id,
  fitBand: row.fit_band,
  fitScore: row.fit_score,
  annualValuePotential: row.annual_value_potential,
  modelVersion: row.model_version ?? row.generated_report?.modelVersion ?? BIOPILOT_MODEL_VERSION,
  evidenceConfidenceScore: row.generated_report?.evidenceConfidence?.score ?? null,
  evidenceConfidenceBand: row.generated_report?.evidenceConfidence?.band ?? null,
  topPriority: row.generated_report?.salesFollowUp?.priority ?? row.generated_report?.plays?.[0]?.title ?? "",
  evidenceMeta: row.evidence_meta ?? {},
  submittedInputs: row.submitted_inputs,
  generatedReport: row.generated_report,
  updatedAt: row.updated_at,
  createdAt: row.created_at,
});

export const claimNotificationEvent = async ({
  pool,
  eventKey,
  eventType,
  referenceId,
  payload,
  retryAfterMinutes = 10,
}: {
  pool: Pool;
  eventKey: string;
  eventType: string;
  referenceId: string;
  payload: unknown;
  retryAfterMinutes?: number;
}) => {
  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO roi_notification_events (
        event_key,
        event_type,
        reference_id,
        payload,
        delivery_status
      )
      VALUES ($1, $2, $3, $4::jsonb, 'pending')
      ON CONFLICT (event_key)
      DO UPDATE SET
        payload = EXCLUDED.payload,
        delivery_status = 'pending',
        last_error = NULL,
        updated_at = NOW()
      WHERE roi_notification_events.delivery_status = 'failed'
        AND roi_notification_events.attempts < 3
        AND roi_notification_events.updated_at <= NOW() - ($5::int * INTERVAL '1 minute')
      RETURNING id
    `,
    [
      eventKey,
      eventType,
      referenceId,
      JSON.stringify(payload ?? {}),
      Math.max(1, Math.round(retryAfterMinutes)),
    ],
  );

  return result.rows[0]?.id ?? null;
};

export const recordNotificationDelivery = async ({
  pool,
  notificationEventId,
  deliveryStatus,
  lastError,
}: {
  pool: Pool;
  notificationEventId: string;
  deliveryStatus: "sent" | "failed";
  lastError?: string | null;
}) => {
  await pool.query(
    `
      UPDATE roi_notification_events
      SET
        delivery_status = $2,
        attempts = attempts + 1,
        last_error = $3,
        updated_at = NOW(),
        delivered_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE delivered_at END
      WHERE id = $1
    `,
    [notificationEventId, deliveryStatus, lastError ?? null],
  );
};

export const findAbandonedAssessmentProgress = async ({
  pool,
  abandonmentMinutes,
  limit = 25,
}: {
  pool: Pool;
  abandonmentMinutes: number;
  limit?: number;
}) => {
  const result = await pool.query<{
    id: string;
    session_id: string;
    session_mode: string;
    lead_capture_id: string | null;
    first_name: string;
    last_name: string;
    work_email: string;
    company: string;
    job_title: string;
    country_region: string;
    current_step: string;
    status: string;
    completed_sections: string[] | unknown;
    process_profile_id: string;
    lifecycle_stage_id: string;
    fit_band: string;
    fit_score: number;
    annual_value_potential: number;
    model_version?: string | null;
    evidence_meta: AssessmentEvidenceMeta;
    submitted_inputs: BioPilotAssessmentInputs;
    generated_report: BioPilotAssessmentResults;
    updated_at: string;
    created_at: string;
    stale_minutes: number;
  }>(
    `
      SELECT
        p.id,
        p.session_id,
        p.session_mode,
        p.lead_capture_id,
        p.first_name,
        p.last_name,
        p.work_email,
        p.company,
        p.job_title,
        p.country_region,
        p.current_step,
        p.status,
        p.completed_sections,
        p.process_profile_id,
        p.lifecycle_stage_id,
        p.fit_band,
        p.fit_score,
        p.annual_value_potential,
        p.model_version,
        p.evidence_meta,
        p.submitted_inputs,
        p.generated_report,
        p.updated_at,
        p.created_at,
        EXTRACT(EPOCH FROM (NOW() - p.updated_at)) / 60 AS stale_minutes
      FROM roi_assessment_progress p
      WHERE p.session_mode = 'actual'
        AND p.current_step <> 'report'
        AND p.status <> 'report_generated'
        AND p.updated_at <= NOW() - ($1::int * INTERVAL '1 minute')
        AND NOT EXISTS (
          SELECT 1
          FROM roi_assessment_submissions s
          WHERE LOWER(s.work_email) = LOWER(p.work_email)
            AND s.created_at >= p.created_at
        )
      ORDER BY p.updated_at ASC, p.id ASC
      LIMIT $2
    `,
    [
      Math.max(15, Math.round(abandonmentMinutes)),
      Math.min(100, Math.max(1, Math.round(limit))),
    ],
  );

  return result.rows.map((row) => ({
    ...mapAssessmentProgressAdminRow(row),
    staleMinutes: Number(row.stale_minutes) || 0,
  }));
};

export const insertFeedbackEntry = async ({
  pool,
  assessmentId,
  workEmail,
  company,
  rating,
  usefulness,
  clarity,
  comment,
  page,
}: {
  pool: Pool;
  assessmentId?: number | null;
  workEmail?: string | null;
  company?: string | null;
  rating: number;
  usefulness: number;
  clarity: number;
  comment?: string | null;
  page?: string | null;
}) => {
  const result = await pool.query<{ id: string; created_at: string }>(
    `
      INSERT INTO roi_feedback_entries (
        assessment_id,
        work_email,
        company,
        rating,
        usefulness,
        clarity,
        comment,
        page
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at
    `,
    [
      assessmentId ?? null,
      workEmail?.trim().toLowerCase() ?? "",
      company?.trim() ?? "",
      rating,
      usefulness,
      clarity,
      comment?.trim() ?? "",
      page?.trim() || "final-report",
    ],
  );

  return {
    id: result.rows[0]?.id ?? null,
    createdAt: result.rows[0]?.created_at ?? new Date().toISOString(),
  };
};

export const mapFeedbackAdminRow = (row: {
  id: string;
  assessment_id: string | null;
  work_email: string;
  company: string;
  rating: number;
  usefulness: number;
  clarity: number;
  comment: string;
  page: string;
  created_at: string;
}): FeedbackEntryRecord => ({
  id: row.id,
  assessmentId: row.assessment_id,
  workEmail: row.work_email,
  company: row.company,
  rating: row.rating,
  usefulness: row.usefulness,
  clarity: row.clarity,
  comment: row.comment,
  page: row.page,
  createdAt: row.created_at,
});
