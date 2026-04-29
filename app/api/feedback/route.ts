import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ensureFeedbackTable,
  getPool,
  insertFeedbackEntry,
  isAuthorizedAdmin,
  mapFeedbackAdminRow,
} from "@/lib/server/biopilot-persistence";
import { enforcePublicPostGuard, rejectHoneypotPayload } from "@/lib/server/request-guards";

export const runtime = "nodejs";

const feedbackSchema = z.object({
  assessmentId: z.number().int().positive().nullable().optional(),
  workEmail: z.string().trim().email().optional().or(z.literal("")),
  company: z.string().trim().max(180).optional(),
  rating: z.number().int().min(1).max(5),
  usefulness: z.number().int().min(1).max(5),
  clarity: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
  page: z.string().trim().max(80).optional(),
});

export async function GET(request: Request) {
  const pool = getPool();

  if (!pool) {
    return NextResponse.json(
      {
        message: "Feedback storage is not connected. Set DATABASE_URL on the web service.",
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
    await ensureFeedbackTable(pool);

    const result = await pool.query<{
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
    }>(`
      SELECT
        id,
        assessment_id,
        work_email,
        company,
        rating,
        usefulness,
        clarity,
        comment,
        page,
        created_at
      FROM roi_feedback_entries
      ORDER BY created_at DESC, id DESC
      LIMIT 500
    `);

    return NextResponse.json({
      entries: result.rows.map(mapFeedbackAdminRow),
    });
  } catch (error) {
    console.error("Feedback read failed", error);

    return NextResponse.json(
      {
        message: "Feedback records could not be loaded right now.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guardResponse = enforcePublicPostGuard(request, {
    key: "feedback",
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (guardResponse) {
    return guardResponse;
  }

  const payload = await request.json().catch(() => null);
  const honeypotResponse = rejectHoneypotPayload(payload);

  if (honeypotResponse) {
    return honeypotResponse;
  }

  const parsed = feedbackSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Feedback could not be saved. Review the values and try again.",
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
        message: "Feedback was captured on this device, but online saving is not available right now.",
      },
      { status: 202 },
    );
  }

  try {
    await ensureFeedbackTable(pool);
    const inserted = await insertFeedbackEntry({
      pool,
      ...parsed.data,
    });

    return NextResponse.json(
      {
        storageMode: "database" as const,
        message: "Feedback saved.",
        feedbackId: inserted.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Feedback insert failed", error);

    return NextResponse.json(
      {
        message: "Feedback could not be saved right now.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const pool = getPool();

  if (!pool) {
    return NextResponse.json(
      {
        message: "Feedback storage is not connected. Set DATABASE_URL on the web service.",
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
        message: "A valid feedback id is required.",
      },
      { status: 400 },
    );
  }

  try {
    await ensureFeedbackTable(pool);

    const result = await pool.query(
      `
        DELETE FROM roi_feedback_entries
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          message: "Feedback record not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Feedback record deleted.",
    });
  } catch (error) {
    console.error("Feedback delete failed", error);

    return NextResponse.json(
      {
        message: "Feedback record could not be deleted right now.",
      },
      { status: 500 },
    );
  }
}
