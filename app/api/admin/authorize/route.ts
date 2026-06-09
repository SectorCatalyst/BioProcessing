import { NextResponse } from "next/server";

import { isAuthorizedAdmin } from "@/lib/server/biopilot-persistence";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json(
      {
        authorized: false,
        message: "Admin authorization is required.",
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    authorized: true,
    message: "Internal mode authorized.",
  });
}
