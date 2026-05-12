import { NextResponse } from "next/server";
import { z } from "zod";

import {
  BIOPILOT_INPUT_SECTION_IDS,
  BIOPILOT_MODEL_VERSION,
  assessmentEvidenceMetaSchema,
  bioPilotAssessmentInputsSchema,
  normalizeAssessmentInputs,
  normalizeEvidenceMeta,
  type BioPilotAssessmentResults,
} from "@/lib/biopilot-fit-assessment";
import { leadCaptureSchema } from "@/lib/model";
import {
  ensurePersistenceTables,
  getPool,
  isAuthorizedAdmin,
  mapAssessmentProgressAdminRow,
  upsertAssessmentProgress,
} from "@/lib/server/biopilot-persistence";
import {
  enforcePublicPostGuard,
  readLimitedJsonPayload,
  rejectHoneypotPayload,
} from "@/lib/server/request-guards";

export const runtime = "nodejs";
const MAX_ASSESSMENT_PROGRESS_BYTES = 96 * 1024;

const assessmentProgressSchema = leadCaptureSchema.extend({
  sessionId: z.string().trim().min(8).max(120),
  sessionMode: z.enum(["example", "actual"]),
  modelVersion: z.literal(BIOPILOT_MODEL_VERSION).default(BIOPILOT_MODEL_VERSION),
  currentStep: z.enum(["intro", "profile", "inputs", "report"]),
  status: z
    .enum([
      "contact_captured",
      "process_selected",
      "inputs_started",
      "input_section_confirmed",
      "report_ready",
      "report_generation_failed",
      "report_generated",
    ])
    .default("inputs_started"),
  completedSectionIds: z.array(z.enum(BIOPILOT_INPUT_SECTION_IDS)).default([]),
  inputs: bioPilotAssessmentInputsSchema,
  evidenceMeta: assessmentEvidenceMetaSchema.optional(),
});

export async function GET(request: Request) {
  const pool = getPool();

  if (!pool) {
    return NextResponse.json(
      {
        message: "Assessment progress storage is not connected. Set DATABASE_URL on the web service.",
      },
      { status: 503 },
    );
  }

  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json(
      {
        message: "Admin authorization is required.",
      },
      { status: 401 },
    );
  }

  try {
    await ensurePersistenceTables(pool);

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
      completed_sections: string[];
      process_profile_id: string;
      lifecycle_stage_id: string;
      fit_band: string;
      fit_score: number;
      annual_value_potential: number;
      model_version: string;
      evidence_meta: z.infer<typeof assessmentEvidenceMetaSchema>;
      submitted_inputs: z.infer<typeof bioPilotAssessmentInputsSchema>;
      generated_report: BioPilotAssessmentResults;
      updated_at: string;
      created_at: string;
    }>(`
      SELECT
        id,
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
        generated_report,
        updated_at,
        created_at
      FROM roi_assessment_progress
      ORDER BY updated_at DESC, id DESC
      LIMIT 500
    `);

    return NextResponse.json({
      entries: result.rows.map(mapAssessmentProgressAdminRow),
    });
  } catch (error) {
    console.error("Assessment progress read failed", error);

    return NextResponse.json(
      {
        message: "Assessment progress records could not be loaded right now.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guardResponse = enforcePublicPostGuard(request, {
    key: "assessment-progress",
    limit: 240,
    windowMs: 10 * 60 * 1000,
    maxContentLength: MAX_ASSESSMENT_PROGRESS_BYTES,
  });

  if (guardResponse) {
    return guardResponse;
  }

  const { payload, response } = await readLimitedJsonPayload(request, {
    maxContentLength: MAX_ASSESSMENT_PROGRESS_BYTES,
  });

  if (response) {
    return response;
  }

  const honeypotResponse = rejectHoneypotPayload(payload);

  if (honeypotResponse) {
    return honeypotResponse;
  }

  const parsed = assessmentProgressSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Assessment progress could not be saved. Review the submitted values and try again.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const normalizedInputs = normalizeAssessmentInputs(parsed.data.inputs);
  const evidenceMeta = normalizeEvidenceMeta(parsed.data.evidenceMeta);
  const pool = getPool();

  if (!pool) {
    return NextResponse.json(
      {
        storageMode: "local_only" as const,
        message:
          "Progress was captured on this device, but online saving is not available right now.",
      },
      { status: 202 },
    );
  }

  try {
    await ensurePersistenceTables(pool);

    const inserted = await upsertAssessmentProgress({
      pool,
      lead: parsed.data,
      inputs: normalizedInputs,
      sessionId: parsed.data.sessionId,
      sessionMode: parsed.data.sessionMode,
      currentStep: parsed.data.currentStep,
      status: parsed.data.status,
      completedSections: parsed.data.completedSectionIds,
      evidenceMeta,
    });

    return NextResponse.json(
      {
        storageMode: "database" as const,
        message: "Assessment progress saved.",
        progressId: inserted.progressId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Assessment progress insert failed", error);

    return NextResponse.json(
      {
        storageMode: "local_only" as const,
        message:
          "Progress was captured on this device, but online saving is not available right now.",
      },
      { status: 202 },
    );
  }
}

export async function DELETE(request: Request) {
  const pool = getPool();

  if (!pool) {
    return NextResponse.json(
      {
        message: "Assessment progress storage is not connected. Set DATABASE_URL on the web service.",
      },
      { status: 503 },
    );
  }

  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json(
      {
        message: "Admin authorization is required.",
      },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));

  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json(
      {
        message: "A valid progress id is required.",
      },
      { status: 400 },
    );
  }

  try {
    await ensurePersistenceTables(pool);

    const result = await pool.query(
      `
        DELETE FROM roi_assessment_progress
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          message: "Progress record not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Progress record deleted.",
    });
  } catch (error) {
    console.error("Assessment progress delete failed", error);

    return NextResponse.json(
      {
        message: "Progress record could not be deleted right now.",
      },
      { status: 500 },
    );
  }
}
