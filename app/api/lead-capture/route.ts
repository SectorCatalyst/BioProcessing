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
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS roi_lead_captures_work_email_idx
      ON roi_lead_captures (work_email);
  `);
};

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = leadCaptureSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Lead capture payload did not pass validation.",
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
          "Lead details were captured locally because DATABASE_URL is not configured on the server.",
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
          created_at = NOW();
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
        message:
          "Lead details were stored in Postgres through the built-in lead-capture API route.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Lead capture insert failed", error);

    return NextResponse.json(
      {
        storageMode: "local_only" as const,
        message:
          "Lead details were captured locally because the Postgres insert failed. Check DATABASE_URL and database access on Render.",
      },
      { status: 202 },
    );
  }
}
