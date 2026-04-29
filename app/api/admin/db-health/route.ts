import { NextResponse } from "next/server";

import {
  ensurePersistenceTables,
  getPool,
  isAuthorizedAdmin,
} from "@/lib/server/biopilot-persistence";

export const runtime = "nodejs";

const sanitizeError = (error: unknown) => {
  const maybePgError = error as { code?: unknown; message?: unknown; name?: unknown };
  const message =
    typeof maybePgError.message === "string"
      ? maybePgError.message
      : "Unknown database error.";

  return {
    code: typeof maybePgError.code === "string" ? maybePgError.code : null,
    name: typeof maybePgError.name === "string" ? maybePgError.name : "Error",
    message: message.slice(0, 240),
  };
};

const databaseUrlHasValidScheme = () => {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    return false;
  }

  return databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://");
};

export async function GET(request: Request) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json(
      {
        message: "Admin authorization is required.",
      },
      { status: 401 },
    );
  }

  const pool = getPool();

  if (!pool) {
    return NextResponse.json(
      {
        databaseUrlPresent: false,
        databaseUrlHasValidScheme: false,
        connected: false,
        schemaReady: false,
        canWrite: false,
        message: "DATABASE_URL is not configured on the web service.",
      },
      { status: 503 },
    );
  }

  const baseStatus = {
    databaseUrlPresent: true,
    databaseUrlHasValidScheme: databaseUrlHasValidScheme(),
    connected: false,
    schemaReady: false,
    canWrite: false,
    pgSslMode: process.env.PGSSLMODE ?? null,
  };

  try {
    const connectionResult = await pool.query<{
      database_name: string;
      database_user: string;
      checked_at: string;
    }>(`
      SELECT
        current_database() AS database_name,
        current_user AS database_user,
        NOW() AS checked_at
    `);

    const connection = connectionResult.rows[0] ?? null;

    try {
      await ensurePersistenceTables(pool);
    } catch (error) {
      return NextResponse.json(
        {
          ...baseStatus,
          connected: true,
          connection,
          failedStage: "schema",
          error: sanitizeError(error),
          message:
            "Database connection works, but the app could not create or verify required tables.",
        },
        { status: 500 },
      );
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS roi_db_health_checks (
          id BIGSERIAL PRIMARY KEY,
          checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      const writeResult = await pool.query<{ id: string }>(`
        INSERT INTO roi_db_health_checks DEFAULT VALUES
        RETURNING id
      `);
      const healthCheckId = writeResult.rows[0]?.id ?? null;

      if (healthCheckId) {
        await pool.query(
          `
            DELETE FROM roi_db_health_checks
            WHERE id = $1
          `,
          [healthCheckId],
        );
      }
    } catch (error) {
      return NextResponse.json(
        {
          ...baseStatus,
          connected: true,
          schemaReady: true,
          connection,
          failedStage: "write",
          error: sanitizeError(error),
          message:
            "Database schema is reachable, but the app could not write a test record.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ...baseStatus,
      connected: true,
      schemaReady: true,
      canWrite: true,
      connection,
      message: "Database connection, schema, and write access are working.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ...baseStatus,
        failedStage: "connect",
        error: sanitizeError(error),
        message:
          "The app could not connect to Postgres. Check DATABASE_URL, SSL, and database availability.",
      },
      { status: 500 },
    );
  }
}
