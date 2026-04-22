import { Pool } from "pg";

import {
  assessBioPilotFit,
  type BioPilotAssessmentInputs,
  type BioPilotAssessmentResults,
} from "@/lib/biopilot-fit-assessment";
import { type LeadCaptureFormInput } from "@/lib/model";

declare global {
  var __biopilotPersistencePool: Pool | undefined;
}

export interface AssessmentSubmissionRecord {
  id: string;
  leadCaptureId: string | null;
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
  executiveSummary: string;
  createdAt: string;
  updatedAt: string;
}

export const getPool = () => {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!global.__biopilotPersistencePool) {
    global.__biopilotPersistencePool = new Pool({
      connectionString: process.env.DATABASE_URL,
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
    CREATE UNIQUE INDEX IF NOT EXISTS roi_lead_captures_work_email_idx
      ON roi_lead_captures (work_email);
  `);
};

export const ensureAssessmentTable = async (pool: Pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roi_assessment_submissions (
      id BIGSERIAL PRIMARY KEY,
      lead_capture_id BIGINT REFERENCES roi_lead_captures(id) ON DELETE SET NULL,
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
      submitted_inputs JSONB NOT NULL,
      generated_report JSONB NOT NULL,
      source TEXT NOT NULL DEFAULT 'biopilot-fit-assessment',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
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

export const ensurePersistenceTables = async (pool: Pool) => {
  await ensureLeadCaptureTable(pool);
  await ensureAssessmentTable(pool);
};

export const upsertLeadCapture = async (pool: Pool, lead: LeadCaptureFormInput) => {
  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO roi_lead_captures (
        first_name,
        last_name,
        work_email,
        company,
        job_title,
        country_region,
        consent_to_contact
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (work_email)
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        company = EXCLUDED.company,
        job_title = EXCLUDED.job_title,
        country_region = EXCLUDED.country_region,
        consent_to_contact = EXCLUDED.consent_to_contact,
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
    ],
  );

  return result.rows[0]?.id ?? null;
};

export const insertAssessmentSubmission = async ({
  pool,
  lead,
  inputs,
}: {
  pool: Pool;
  lead: LeadCaptureFormInput;
  inputs: BioPilotAssessmentInputs;
}) => {
  const leadCaptureId = await upsertLeadCapture(pool, lead);
  const results = assessBioPilotFit(inputs);

  const insertResult = await pool.query<{ id: string; created_at: string; updated_at: string }>(
    `
      INSERT INTO roi_assessment_submissions (
        lead_capture_id,
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
        submitted_inputs,
        generated_report
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18::jsonb
      )
      RETURNING id, created_at, updated_at
    `,
    [
      leadCaptureId,
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
    generated_report: BioPilotAssessmentResults;
    created_at: string;
    updated_at: string;
  },
): AssessmentSubmissionRecord => ({
  id: row.id,
  leadCaptureId: row.lead_capture_id,
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
  executiveSummary: row.generated_report?.executiveSummary ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
