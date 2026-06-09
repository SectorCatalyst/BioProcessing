import { NextResponse } from "next/server";
import { z } from "zod";

import { isInternalPostmarkEmailConfigured } from "@/lib/server/biopilot-notifications";
import { sendPostmarkNotificationEmail } from "@/lib/server/postmark-email";
import { readLimitedJsonPayload } from "@/lib/server/request-guards";

export const runtime = "nodejs";

const MAX_EMAIL_WEBHOOK_BYTES = 32 * 1024;

const notificationLeadSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  workEmail: z.string().trim().email().max(160),
  company: z.string().trim().min(1).max(160),
  jobTitle: z.string().trim().min(1).max(160),
  countryRegion: z.string().trim().min(1).max(160),
});

const notificationReportSchema = z.object({
  processProfile: z.string().trim().min(1).max(180),
  lifecycleStage: z.string().trim().min(1).max(180),
  fitBand: z.string().trim().min(1).max(120),
  fitScore: z.number().finite(),
  annualValuePotential: z.number().finite(),
  threeYearRoi: z.number().finite(),
  paybackMonths: z.number().finite(),
  topPriority: z.string().trim().min(1).max(240),
  recommendedAction: z.string().trim().min(1).max(1200),
});

const notificationProgressSchema = z.object({
  sessionId: z.string().trim().min(8).max(140),
  currentStep: z.string().trim().min(1).max(80),
  status: z.string().trim().min(1).max(120),
  completedSections: z.array(z.string().trim().max(80)).max(20),
  staleMinutes: z.number().finite().nonnegative(),
  updatedAt: z.string().trim().min(1).max(80),
});

const emailNotificationSchema = z.object({
  event: z.enum(["lead_captured", "report_submitted", "assessment_abandoned"]),
  source: z.literal("biopilot-fit-assessment"),
  subject: z.string().trim().min(1).max(220),
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(600),
  text: z.string().trim().min(1).max(6000),
  submittedAt: z.string().trim().min(1).max(80),
  recipients: z.array(z.string().trim().email()).max(20).default([]),
  adminUrl: z.string().trim().url().max(400),
  appVersion: z.string().trim().min(1).max(40),
  modelVersion: z.string().trim().min(1).max(40),
  lead: notificationLeadSchema,
  report: notificationReportSchema.optional(),
  progress: notificationProgressSchema.optional(),
});

const isAuthorizedInternalWebhook = (request: Request) => {
  const configuredSecret = process.env.BIOPILOT_EMAIL_WEBHOOK_SECRET?.trim();
  const presentedSecret = request.headers.get("x-biopilot-webhook-secret")?.trim();

  return Boolean(configuredSecret && presentedSecret && configuredSecret === presentedSecret);
};

export async function GET(request: Request) {
  if (!isAuthorizedInternalWebhook(request)) {
    return NextResponse.json(
      {
        message: "Email webhook authorization is required.",
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    provider: "postmark",
    postmarkConfigured: isInternalPostmarkEmailConfigured(),
  });
}

export async function POST(request: Request) {
  if (!isAuthorizedInternalWebhook(request)) {
    return NextResponse.json(
      {
        message: "Email webhook authorization is required.",
      },
      { status: 401 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!/\bapplication\/(?:[\w.+-]+\+)?json\b/i.test(contentType)) {
    return NextResponse.json(
      {
        message: "Submit this request as JSON.",
      },
      { status: 415 },
    );
  }

  const { payload, response } = await readLimitedJsonPayload(request, {
    maxContentLength: MAX_EMAIL_WEBHOOK_BYTES,
  });

  if (response) {
    return response;
  }

  const parsed = emailNotificationSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Email notification payload is invalid.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const delivery = await sendPostmarkNotificationEmail(parsed.data);

  if (!delivery.ok) {
    return NextResponse.json(
      {
        message: "Postmark email could not be sent.",
        providerStatus: delivery.status,
        providerMessage: delivery.error,
      },
      { status: delivery.status === 503 ? 503 : 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    provider: "postmark",
    messageId: delivery.messageId,
  });
}
