import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "biopilot-fit-assessment",
    version: process.env.npm_package_version ?? "0.3.1",
    databaseConfigured: Boolean(process.env.DATABASE_URL?.trim()),
    checkedAt: new Date().toISOString(),
  });
}
