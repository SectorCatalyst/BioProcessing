import { NextResponse } from "next/server";

import { leadCaptureSchema } from "@/lib/model";
import {
  ensureLeadCaptureTable,
  getPool,
  isAuthorizedAdmin,
  upsertLeadCapture,
} from "@/lib/server/biopilot-persistence";
import {
  enforcePublicPostGuard,
  readLimitedJsonPayload,
  rejectHoneypotPayload,
} from "@/lib/server/request-guards";

export const runtime = "nodejs";
const MAX_LEAD_CAPTURE_BYTES = 16 * 1024;

export async function GET(request: Request) {
  const pool = getPool();

  if (!pool) {
    return NextResponse.json(
      {
        message: "Lead storage is not connected. Set DATABASE_URL on the web service.",
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
    await ensureLeadCaptureTable(pool);

    const result = await pool.query<{
      id: string;
      first_name: string;
      last_name: string;
      work_email: string;
      company: string;
      job_title: string;
      country_region: string;
      consent_to_contact: boolean;
      session_mode: string;
      source: string;
      created_at: string;
      updated_at: string;
    }>(`
      SELECT
        id,
        first_name,
        last_name,
        work_email,
        company,
        job_title,
        country_region,
        consent_to_contact,
        session_mode,
        source,
        created_at,
        updated_at
      FROM roi_lead_captures
      ORDER BY updated_at DESC, id DESC
      LIMIT 500
    `);

    return NextResponse.json({
      entries: result.rows.map((row) => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        workEmail: row.work_email,
        company: row.company,
        jobTitle: row.job_title,
        countryRegion: row.country_region,
        consentToContact: row.consent_to_contact,
        sessionMode: row.session_mode,
        source: row.source,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    console.error("Lead capture read failed", error);

    return NextResponse.json(
      {
        message: "Lead records could not be loaded right now.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guardResponse = enforcePublicPostGuard(request, {
    key: "lead-capture",
    limit: 8,
    windowMs: 10 * 60 * 1000,
    maxContentLength: MAX_LEAD_CAPTURE_BYTES,
  });

  if (guardResponse) {
    return guardResponse;
  }

  const { payload, response } = await readLimitedJsonPayload(request, {
    maxContentLength: MAX_LEAD_CAPTURE_BYTES,
  });

  if (response) {
    return response;
  }

  const honeypotResponse = rejectHoneypotPayload(payload);

  if (honeypotResponse) {
    return honeypotResponse;
  }

  const parsed = leadCaptureSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "We could not save your details. Please review the form and try again.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const pool = getPool();

  if (!pool) {
    return NextResponse.json(
      {
        storageMode: "local_only" as const,
        message:
          "Your details are saved on this device for now. Online submission is not available at the moment.",
      },
      { status: 202 },
    );
  }

  try {
    await ensureLeadCaptureTable(pool);

    await upsertLeadCapture(pool, parsed.data);

    return NextResponse.json(
      {
        storageMode: "database" as const,
        message: "Your details were saved successfully.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Lead capture insert failed", error);

    return NextResponse.json(
      {
        storageMode: "local_only" as const,
        message:
          "Your details are saved on this device for now. Online submission is not available right now.",
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
        message: "Lead storage is not connected. Set DATABASE_URL on the web service.",
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
        message: "A valid lead id is required.",
      },
      { status: 400 },
    );
  }

  try {
    await ensureLeadCaptureTable(pool);

    const result = await pool.query(
      `
        DELETE FROM roi_lead_captures
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          message: "Lead record not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Lead record deleted.",
    });
  } catch (error) {
    console.error("Lead capture delete failed", error);

    return NextResponse.json(
      {
        message: "Lead record could not be deleted right now.",
      },
      { status: 500 },
    );
  }
}
