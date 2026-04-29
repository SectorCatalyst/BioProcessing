import { NextResponse } from "next/server";
import { type z } from "zod";

import {
  assessBioPilotFit,
  assessmentEvidenceMetaSchema,
  bioPilotAssessmentInputsSchema,
  normalizeAssessmentInputs,
  normalizeEvidenceMeta,
} from "@/lib/biopilot-fit-assessment";
import { leadCaptureSchema } from "@/lib/model";
import {
  ensurePersistenceTables,
  getPool,
  insertAssessmentSubmission,
  isAuthorizedAdmin,
  mapAssessmentAdminRow,
} from "@/lib/server/biopilot-persistence";

export const runtime = "nodejs";

const assessmentSubmissionSchema = leadCaptureSchema.extend({
  inputs: bioPilotAssessmentInputsSchema,
  evidenceMeta: assessmentEvidenceMetaSchema.optional(),
});

type AssessmentSubmissionPayload = z.infer<typeof assessmentSubmissionSchema>;

const notifySalesWebhook = async (payload: {
  lead: AssessmentSubmissionPayload;
  results: ReturnType<typeof assessBioPilotFit>;
}) => {
  const webhookUrl = process.env.SALES_NOTIFICATION_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "biopilot_assessment_submitted",
        submittedAt: new Date().toISOString(),
        lead: {
          firstName: payload.lead.firstName,
          lastName: payload.lead.lastName,
          workEmail: payload.lead.workEmail,
          company: payload.lead.company,
          jobTitle: payload.lead.jobTitle,
          countryRegion: payload.lead.countryRegion,
        },
        report: {
          processProfile: payload.results.profile.label,
          lifecycleStage: payload.results.stage.label,
          fitBand: payload.results.fitBand,
          fitScore: payload.results.fitScore,
          annualValuePotential: payload.results.annualValuePotential,
          dpmmScore: payload.results.digitalPlantMaturity.score,
          dpmmLevel: payload.results.digitalPlantMaturity.level,
          evidenceConfidence: payload.results.evidenceConfidence.band,
          topPriority: payload.results.salesFollowUp.priority,
          recommendedAction: payload.results.salesFollowUp.recommendedAction,
        },
      }),
    });
  } catch (error) {
    console.error("Sales notification webhook failed", error);
  }
};

export async function GET(request: Request) {
  const pool = getPool();

  if (!pool) {
    return NextResponse.json(
      {
        message: "Assessment storage is not connected. Set DATABASE_URL on the web service.",
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
      generated_report: ReturnType<typeof assessBioPilotFit>;
      created_at: string;
      updated_at: string;
    }>(`
      SELECT
        id,
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
        generated_report,
        created_at,
        updated_at
      FROM roi_assessment_submissions
      ORDER BY updated_at DESC, id DESC
      LIMIT 500
    `);

    return NextResponse.json({
      entries: result.rows.map(mapAssessmentAdminRow),
    });
  } catch (error) {
    console.error("Assessment submission read failed", error);

    return NextResponse.json(
      {
        message: "Assessment records could not be loaded right now.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = assessmentSubmissionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "The assessment payload could not be saved. Review the submitted values and try again.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const normalizedInputs = normalizeAssessmentInputs(parsed.data.inputs);
  const evidenceMeta = normalizeEvidenceMeta(parsed.data.evidenceMeta);
  const computedResults = assessBioPilotFit(normalizedInputs, evidenceMeta);
  const pool = getPool();

  if (!pool) {
    return NextResponse.json(
      {
        storageMode: "local_only" as const,
        message:
          "The report was created, but online saving is not available at the moment.",
        results: computedResults,
      },
      { status: 202 },
    );
  }

  try {
    await ensurePersistenceTables(pool);

    const inserted = await insertAssessmentSubmission({
      pool,
      lead: parsed.data,
      inputs: normalizedInputs,
      evidenceMeta,
    });
    await notifySalesWebhook({
      lead: parsed.data,
      results: inserted.results,
    });

    return NextResponse.json(
      {
        storageMode: "database" as const,
        message: "The report was saved successfully.",
        assessmentId: inserted.assessmentId,
        results: inserted.results,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Assessment submission insert failed", error);

    return NextResponse.json(
      {
        storageMode: "local_only" as const,
        message:
          "The report was created, but online saving is not available right now.",
        results: computedResults,
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
        message: "Assessment storage is not connected. Set DATABASE_URL on the web service.",
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
  const idParam = searchParams.get("id");
  const id = Number(idParam);

  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json(
      {
        message: "A valid assessment id is required.",
      },
      { status: 400 },
    );
  }

  try {
    await ensurePersistenceTables(pool);

    const result = await pool.query(
      `
        DELETE FROM roi_assessment_submissions
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          message: "Assessment record not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Assessment record deleted.",
    });
  } catch (error) {
    console.error("Assessment submission delete failed", error);

    return NextResponse.json(
      {
        message: "Assessment record could not be deleted right now.",
      },
      { status: 500 },
    );
  }
}
