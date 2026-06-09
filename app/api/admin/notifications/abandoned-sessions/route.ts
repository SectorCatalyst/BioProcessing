import { NextResponse } from "next/server";

import {
  buildAssessmentAbandonedEmailNotification,
  getBioPilotAbandonmentMinutes,
  isBioPilotEmailNotificationConfigured,
  sendDedupedBioPilotEmailNotification,
} from "@/lib/server/biopilot-notifications";
import {
  ensurePersistenceTables,
  findAbandonedAssessmentProgress,
  getPool,
  isAuthorizedAdmin,
} from "@/lib/server/biopilot-persistence";

export const runtime = "nodejs";

const isAuthorizedNotificationRun = (request: Request) => {
  if (isAuthorizedAdmin(request)) {
    return true;
  }

  const configuredCronKey = process.env.BIOPILOT_NOTIFICATION_CRON_KEY?.trim();
  const presentedCronKey = request.headers.get("x-cron-key")?.trim();

  return Boolean(configuredCronKey && presentedCronKey && configuredCronKey === presentedCronKey);
};

export async function POST(request: Request) {
  if (!isAuthorizedNotificationRun(request)) {
    return NextResponse.json(
      {
        message: "Notification authorization is required.",
      },
      { status: 401 },
    );
  }

  const pool = getPool();

  if (!pool) {
    return NextResponse.json(
      {
        message: "Assessment storage is not connected. Set DATABASE_URL on the web service.",
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dryRun") === "1";
  const abandonmentMinutes = getBioPilotAbandonmentMinutes();

  try {
    await ensurePersistenceTables(pool);

    const candidates = await findAbandonedAssessmentProgress({
      pool,
      abandonmentMinutes,
      limit: 25,
    });

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun,
        webhookConfigured: isBioPilotEmailNotificationConfigured("assessment_abandoned"),
        abandonmentMinutes,
        candidates: candidates.map((candidate) => ({
          id: candidate.id,
          sessionId: candidate.sessionId,
          workEmail: candidate.workEmail,
          company: candidate.company,
          currentStep: candidate.currentStep,
          status: candidate.status,
          staleMinutes: Math.round(candidate.staleMinutes),
          updatedAt: candidate.updatedAt,
        })),
      });
    }

    const deliveries = [];

    for (const candidate of candidates) {
      const notification = buildAssessmentAbandonedEmailNotification({
        progress: candidate,
      });
      const delivery = await sendDedupedBioPilotEmailNotification({
        pool,
        eventKey: `assessment_abandoned:${candidate.sessionId}`,
        eventType: "assessment_abandoned",
        referenceId: candidate.id,
        notification,
      });

      deliveries.push({
        sessionId: candidate.sessionId,
        status: delivery.status,
        statusCode: delivery.statusCode,
      });
    }

    return NextResponse.json({
      ok: true,
      dryRun,
      webhookConfigured: isBioPilotEmailNotificationConfigured("assessment_abandoned"),
      abandonmentMinutes,
      checked: candidates.length,
      sent: deliveries.filter((delivery) => delivery.status === "sent").length,
      duplicates: deliveries.filter((delivery) => delivery.status === "duplicate").length,
      notConfigured: deliveries.filter((delivery) => delivery.status === "not_configured").length,
      failed: deliveries.filter((delivery) => delivery.status === "failed").length,
      deliveries,
    });
  } catch (error) {
    console.error("Abandoned assessment notification check failed", error);

    return NextResponse.json(
      {
        message: "Abandoned assessment notifications could not be checked right now.",
      },
      { status: 500 },
    );
  }
}
