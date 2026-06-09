import type { Pool } from "pg";

import {
  BIOPILOT_MODEL_VERSION,
  type BioPilotAssessmentResults,
} from "@/lib/biopilot-fit-assessment";
import type { LeadCaptureFormInput } from "@/lib/model";
import {
  claimNotificationEvent,
  ensureNotificationEventsTable,
  recordNotificationDelivery,
  type AssessmentProgressRecord,
} from "@/lib/server/biopilot-persistence";

export type BioPilotEmailNotificationEvent =
  | "lead_captured"
  | "report_submitted"
  | "assessment_abandoned";

interface NotificationLead {
  firstName: string;
  lastName: string;
  workEmail: string;
  company: string;
  jobTitle: string;
  countryRegion: string;
}

interface NotificationReport {
  processProfile: string;
  lifecycleStage: string;
  fitBand: string;
  fitScore: number;
  annualValuePotential: number;
  threeYearRoi: number;
  paybackMonths: number;
  topPriority: string;
  recommendedAction: string;
}

interface NotificationProgress {
  sessionId: string;
  currentStep: string;
  status: string;
  completedSections: string[];
  staleMinutes: number;
  updatedAt: string;
}

export interface BioPilotEmailNotificationPayload {
  event: BioPilotEmailNotificationEvent;
  source: "biopilot-fit-assessment";
  subject: string;
  title: string;
  summary: string;
  text: string;
  submittedAt: string;
  recipients: string[];
  adminUrl: string;
  appVersion: string;
  modelVersion: string;
  lead: NotificationLead;
  report?: NotificationReport;
  progress?: NotificationProgress;
}

const DEFAULT_ADMIN_URL = "https://bioprocessing-roi.onrender.com/admin/leads";
const DEFAULT_ABANDONMENT_MINUTES = 60;
const MAX_WEBHOOK_RESPONSE_BYTES = 320;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number, digits = 0) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);

const cleanLine = (value: string | number | null | undefined) =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const getSiteBaseUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
  process.env.BIOPILOT_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "") ||
  "";

export const getBioPilotAdminUrl = () =>
  process.env.BIOPILOT_ADMIN_URL?.trim() ||
  (getSiteBaseUrl() ? `${getSiteBaseUrl()}/admin/leads` : DEFAULT_ADMIN_URL);

export const getBioPilotEmailWebhookUrl = (eventType?: BioPilotEmailNotificationEvent) =>
  process.env.BIOPILOT_EMAIL_WEBHOOK_URL?.trim() ||
  (eventType === "report_submitted"
    ? process.env.SALES_NOTIFICATION_WEBHOOK_URL?.trim()
    : "") ||
  "";

const isInternalEmailWebhookUrl = (url: string) =>
  /\/api\/internal\/email-webhook(?:$|\?)/.test(url);

export const isInternalPostmarkEmailConfigured = () =>
  Boolean(
    process.env.POSTMARK_SERVER_TOKEN?.trim() &&
      process.env.POSTMARK_FROM_EMAIL?.trim() &&
      getBioPilotNotificationRecipients().length,
  );

export const isBioPilotEmailNotificationConfigured = (
  eventType?: BioPilotEmailNotificationEvent,
) => {
  const webhookUrl = getBioPilotEmailWebhookUrl(eventType);

  if (!webhookUrl) {
    return false;
  }

  if (isInternalEmailWebhookUrl(webhookUrl)) {
    return isInternalPostmarkEmailConfigured();
  }

  return true;
};

export const getBioPilotNotificationRecipients = () =>
  (process.env.BIOPILOT_NOTIFICATION_RECIPIENTS ?? "")
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean);

export const getBioPilotAbandonmentMinutes = () => {
  const parsed = Number(process.env.BIOPILOT_ABANDONMENT_MINUTES);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_ABANDONMENT_MINUTES;
  }

  return Math.min(24 * 60, Math.max(15, Math.round(parsed)));
};

const toLead = (lead: LeadCaptureFormInput): NotificationLead => ({
  firstName: lead.firstName,
  lastName: lead.lastName,
  workEmail: lead.workEmail.toLowerCase(),
  company: lead.company,
  jobTitle: lead.jobTitle,
  countryRegion: lead.countryRegion,
});

const buildText = (lines: Array<string | null | undefined>) =>
  lines
    .map((line) => cleanLine(line))
    .filter(Boolean)
    .join("\n");

const basePayload = ({
  event,
  lead,
  subject,
  title,
  summary,
  lines,
}: {
  event: BioPilotEmailNotificationEvent;
  lead: LeadCaptureFormInput;
  subject: string;
  title: string;
  summary: string;
  lines: string[];
}): Omit<BioPilotEmailNotificationPayload, "report" | "progress"> => {
  const adminUrl = getBioPilotAdminUrl();
  const recipients = getBioPilotNotificationRecipients();

  return {
    event,
    source: "biopilot-fit-assessment",
    subject,
    title,
    summary,
    text: buildText([...lines, `Admin: ${adminUrl}`]),
    submittedAt: new Date().toISOString(),
    recipients,
    adminUrl,
    appVersion: process.env.npm_package_version ?? "unknown",
    modelVersion: BIOPILOT_MODEL_VERSION,
    lead: toLead(lead),
  };
};

export const buildLeadCapturedEmailNotification = ({
  lead,
  leadCaptureId,
}: {
  lead: LeadCaptureFormInput;
  leadCaptureId: string | null;
}): BioPilotEmailNotificationPayload => {
  const fullName = `${lead.firstName} ${lead.lastName}`.trim();
  const summary = `${fullName} from ${lead.company} started a BioPilot ROI assessment.`;

  return basePayload({
    event: "lead_captured",
    lead,
    subject: `BioPilot ROI lead captured: ${lead.company}`,
    title: "New BioPilot ROI Lead",
    summary,
    lines: [
      summary,
      `Contact: ${fullName}`,
      `Email: ${lead.workEmail.toLowerCase()}`,
      `Company: ${lead.company}`,
      `Title: ${lead.jobTitle}`,
      `Region: ${lead.countryRegion}`,
      leadCaptureId ? `Lead ID: ${leadCaptureId}` : null,
    ].filter((line): line is string => Boolean(line)),
  });
};

export const buildReportSubmittedEmailNotification = ({
  lead,
  results,
  assessmentId,
}: {
  lead: LeadCaptureFormInput;
  results: BioPilotAssessmentResults;
  assessmentId: string | null;
}): BioPilotEmailNotificationPayload => {
  const summary = `${lead.company} generated a BioPilot ROI report with a ${results.fitScore}/100 fit score.`;
  const report: NotificationReport = {
    processProfile: results.profile.label,
    lifecycleStage: results.stage.label,
    fitBand: results.fitBand,
    fitScore: results.fitScore,
    annualValuePotential: results.annualValuePotential,
    threeYearRoi: results.threeYearRoi,
    paybackMonths: results.paybackMonths,
    topPriority: results.salesFollowUp.priority,
    recommendedAction: results.salesFollowUp.recommendedAction,
  };

  return {
    ...basePayload({
      event: "report_submitted",
      lead,
      subject: `BioPilot ROI report submitted: ${lead.company}`,
      title: "BioPilot ROI Report Submitted",
      summary,
      lines: [
        summary,
        `Contact: ${lead.firstName} ${lead.lastName}`,
        `Email: ${lead.workEmail.toLowerCase()}`,
        `Process: ${report.processProfile}`,
        `Stage: ${report.lifecycleStage}`,
        `Fit: ${report.fitBand} (${formatNumber(report.fitScore)}/100)`,
        `Annual value potential: ${formatCurrency(report.annualValuePotential)}`,
        `3-year ROI: ${formatNumber(report.threeYearRoi, 1)}%`,
        `Payback: ${Number.isFinite(report.paybackMonths) ? `${formatNumber(report.paybackMonths, 1)} months` : "N/A"}`,
        `Top priority: ${report.topPriority}`,
        assessmentId ? `Assessment ID: ${assessmentId}` : null,
      ].filter((line): line is string => Boolean(line)),
    }),
    report,
  };
};

export const buildAssessmentAbandonedEmailNotification = ({
  progress,
}: {
  progress: AssessmentProgressRecord & { staleMinutes: number };
}): BioPilotEmailNotificationPayload => {
  const lead: LeadCaptureFormInput = {
    firstName: progress.firstName,
    lastName: progress.lastName,
    workEmail: progress.workEmail,
    company: progress.company,
    jobTitle: progress.jobTitle,
    countryRegion: progress.countryRegion,
    consentToContact: true,
  };
  const staleMinutes = Math.max(0, Math.round(progress.staleMinutes));
  const summary = `${progress.company} appears to have stopped before generating a BioPilot ROI report.`;
  const progressPayload: NotificationProgress = {
    sessionId: progress.sessionId,
    currentStep: progress.currentStep,
    status: progress.status,
    completedSections: progress.completedSections,
    staleMinutes,
    updatedAt: progress.updatedAt,
  };

  return {
    ...basePayload({
      event: "assessment_abandoned",
      lead,
      subject: `BioPilot ROI assessment abandoned: ${progress.company}`,
      title: "BioPilot ROI Assessment Abandoned",
      summary,
      lines: [
        summary,
        `Contact: ${progress.firstName} ${progress.lastName}`,
        `Email: ${progress.workEmail.toLowerCase()}`,
        `Last step: ${progress.currentStep}`,
        `Last status: ${progress.status}`,
        `Completed sections: ${progress.completedSections.length}`,
        `Inactive for: ${staleMinutes} minutes`,
        `Last saved: ${progress.updatedAt}`,
        `Session ID: ${progress.sessionId}`,
      ],
    }),
    progress: progressPayload,
  };
};

const truncateWebhookBody = async (response: Response) => {
  const body = await response.text().catch(() => "");

  if (!body) {
    return "";
  }

  return body.slice(0, MAX_WEBHOOK_RESPONSE_BYTES);
};

const postBioPilotEmailNotification = async (
  notification: BioPilotEmailNotificationPayload,
) => {
  const webhookUrl = getBioPilotEmailWebhookUrl(notification.event);

  if (!webhookUrl) {
    return { status: "not_configured" as const, statusCode: null, error: null };
  }

  const secret = process.env.BIOPILOT_EMAIL_WEBHOOK_SECRET?.trim();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "BioPilot-ROI-Notifications",
  };

  if (secret) {
    headers["x-biopilot-webhook-secret"] = secret;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(notification),
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) {
      const responseBody = await truncateWebhookBody(response);
      return {
        status: "failed" as const,
        statusCode: response.status,
        error: responseBody || response.statusText || "Webhook returned an error.",
      };
    }

    return { status: "sent" as const, statusCode: response.status, error: null };
  } catch (error) {
    return {
      status: "failed" as const,
      statusCode: null,
      error: error instanceof Error ? error.message : "Webhook request failed.",
    };
  }
};

export const sendDedupedBioPilotEmailNotification = async ({
  pool,
  eventKey,
  eventType,
  referenceId,
  notification,
}: {
  pool: Pool;
  eventKey: string;
  eventType: BioPilotEmailNotificationEvent;
  referenceId: string;
  notification: BioPilotEmailNotificationPayload;
}) => {
  if (!isBioPilotEmailNotificationConfigured(eventType)) {
    return { status: "not_configured" as const, statusCode: null, error: null };
  }

  await ensureNotificationEventsTable(pool);
  const notificationEventId = await claimNotificationEvent({
    pool,
    eventKey,
    eventType,
    referenceId,
    payload: notification,
  });

  if (!notificationEventId) {
    return { status: "duplicate" as const, statusCode: null, error: null };
  }

  const delivery = await postBioPilotEmailNotification(notification);

  await recordNotificationDelivery({
    pool,
    notificationEventId,
    deliveryStatus: delivery.status === "sent" ? "sent" : "failed",
    lastError: delivery.error,
  });

  if (delivery.status === "failed") {
    console.error("BioPilot email webhook failed", {
      eventType,
      statusCode: delivery.statusCode,
      error: delivery.error,
    });
  }

  return delivery;
};
