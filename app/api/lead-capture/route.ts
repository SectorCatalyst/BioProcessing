import { NextResponse } from "next/server";
import { Pool } from "pg";

import { leadCaptureSchema } from "@/lib/model";

export const runtime = "nodejs";

declare global {
  var __leadCapturePool: Pool | undefined;
}

const getPool = () => {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!global.__leadCapturePool) {
    global.__leadCapturePool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return global.__leadCapturePool;
};

const getAdminKey = () => process.env.LEAD_CAPTURE_ADMIN_KEY?.trim() ?? "";

const isAuthorizedAdmin = (request: Request) => {
  const configuredKey = getAdminKey();
  if (!configuredKey) {
    return false;
  }

  const presentedKey = request.headers.get("x-admin-key")?.trim();
  return Boolean(presentedKey && presentedKey === configuredKey);
};

const ensureLeadCaptureTable = async (pool: Pool) => {
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
  const payload = await request.json().catch(() => null);
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
          "Your details were saved for this browser session. Server-side follow-up is not connected yet.",
      },
      { status: 202 },
    );
  }

  try {
    await ensureLeadCaptureTable(pool);

    await pool.query(
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
          updated_at = NOW();
      `,
      [
        parsed.data.firstName,
        parsed.data.lastName,
        parsed.data.workEmail.toLowerCase(),
        parsed.data.company,
        parsed.data.jobTitle,
        parsed.data.countryRegion,
        parsed.data.consentToContact,
      ],
    );

    return NextResponse.json(
      {
        storageMode: "database" as const,
        message: "Your details were saved successfully for follow-up.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Lead capture insert failed", error);

    return NextResponse.json(
      {
        storageMode: "local_only" as const,
        message:
          "Your details were saved for this browser session. Server-side follow-up is not available right now.",
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
