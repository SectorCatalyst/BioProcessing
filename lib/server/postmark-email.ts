import type { BioPilotEmailNotificationPayload } from "@/lib/server/biopilot-notifications";

const POSTMARK_EMAIL_API_URL = "https://api.postmarkapp.com/email";
const MAX_POSTMARK_ERROR_BODY = 500;

const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeRecipients = (value: string | string[] | null | undefined) => {
  const recipients = Array.isArray(value) ? value : String(value ?? "").split(",");

  return recipients.map((recipient) => recipient.trim()).filter(Boolean);
};

export const getPostmarkRecipients = (fallbackRecipients: string[] = []) => {
  const configuredRecipients = normalizeRecipients(process.env.BIOPILOT_NOTIFICATION_RECIPIENTS);
  return configuredRecipients.length ? configuredRecipients : fallbackRecipients;
};

export const isPostmarkEmailConfigured = () =>
  Boolean(
    process.env.POSTMARK_SERVER_TOKEN?.trim() &&
      process.env.POSTMARK_FROM_EMAIL?.trim() &&
      getPostmarkRecipients().length,
  );

const renderRows = (rows: Array<[string, string | number | null | undefined]>) =>
  rows
    .map(
      ([label, value]) => `
        <tr>
          <th style="padding:8px 10px;text-align:left;color:#51627a;font-size:12px;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #e6edf5;">${escapeHtml(label)}</th>
          <td style="padding:8px 10px;color:#10213a;font-size:14px;border-bottom:1px solid #e6edf5;">${escapeHtml(value)}</td>
        </tr>
      `,
    )
    .join("");

export const renderPostmarkHtml = (notification: BioPilotEmailNotificationPayload) => {
  const leadRows: Array<[string, string]> = [
    ["Contact", `${notification.lead.firstName} ${notification.lead.lastName}`],
    ["Email", notification.lead.workEmail],
    ["Company", notification.lead.company],
    ["Title", notification.lead.jobTitle],
    ["Region", notification.lead.countryRegion],
  ];
  const reportRows: Array<[string, string | number | null | undefined]> = notification.report
    ? [
        ["Process", notification.report.processProfile],
        ["Stage", notification.report.lifecycleStage],
        ["Fit", `${notification.report.fitBand} (${notification.report.fitScore}/100)`],
        ["Annual value", Math.round(notification.report.annualValuePotential).toLocaleString("en-US")],
        ["3-year ROI", `${notification.report.threeYearRoi.toFixed(1)}%`],
        [
          "Payback",
          Number.isFinite(notification.report.paybackMonths)
            ? `${notification.report.paybackMonths.toFixed(1)} months`
            : "N/A",
        ],
        ["Priority", notification.report.topPriority],
      ]
    : [];
  const progressRows: Array<[string, string | number | null | undefined]> = notification.progress
    ? [
        ["Session", notification.progress.sessionId],
        ["Last step", notification.progress.currentStep],
        ["Last status", notification.progress.status],
        ["Completed sections", notification.progress.completedSections.length],
        ["Inactive minutes", notification.progress.staleMinutes],
        ["Last saved", notification.progress.updatedAt],
      ]
    : [];

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f5f8fb;font-family:Arial,Helvetica,sans-serif;color:#10213a;">
    <div style="max-width:720px;margin:0 auto;padding:28px 18px;">
      <div style="border:1px solid #d9e3ef;border-radius:16px;background:#ffffff;overflow:hidden;">
        <div style="background:#00316c;padding:22px 24px;color:#ffffff;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:.14em;opacity:.78;">BioPilot ROI</div>
          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.2;">${escapeHtml(notification.title)}</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 18px;font-size:16px;line-height:1.55;">${escapeHtml(notification.summary)}</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e6edf5;border-radius:12px;overflow:hidden;">
            ${renderRows(leadRows)}
          </table>
          ${
            reportRows.length
              ? `<h2 style="margin:24px 0 10px;font-size:16px;">Report</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e6edf5;border-radius:12px;overflow:hidden;">${renderRows(reportRows)}</table>`
              : ""
          }
          ${
            progressRows.length
              ? `<h2 style="margin:24px 0 10px;font-size:16px;">Progress</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e6edf5;border-radius:12px;overflow:hidden;">${renderRows(progressRows)}</table>`
              : ""
          }
          <p style="margin:24px 0 0;">
            <a href="${escapeHtml(notification.adminUrl)}" style="display:inline-block;border-radius:10px;background:#004f9b;color:#ffffff;text-decoration:none;padding:12px 16px;font-weight:700;">Open Admin Records</a>
          </p>
          <p style="margin:18px 0 0;color:#6b7a90;font-size:12px;">Event: ${escapeHtml(notification.event)} | App ${escapeHtml(notification.appVersion)} | Model ${escapeHtml(notification.modelVersion)}</p>
        </div>
      </div>
    </div>
  </body>
</html>`;
};

export const sendPostmarkNotificationEmail = async (
  notification: BioPilotEmailNotificationPayload,
) => {
  const token = process.env.POSTMARK_SERVER_TOKEN?.trim();
  const from = process.env.POSTMARK_FROM_EMAIL?.trim();
  const replyTo = process.env.POSTMARK_REPLY_TO?.trim();
  const messageStream = process.env.POSTMARK_MESSAGE_STREAM?.trim() || "outbound";
  const recipients = getPostmarkRecipients(notification.recipients);

  if (!token || !from || !recipients.length) {
    return {
      ok: false as const,
      status: 503,
      error: "Postmark email is not configured.",
      messageId: null,
    };
  }

  const response = await fetch(POSTMARK_EMAIL_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: from,
      To: recipients.join(","),
      Subject: notification.subject,
      TextBody: notification.text,
      HtmlBody: renderPostmarkHtml(notification),
      MessageStream: messageStream,
      ...(replyTo ? { ReplyTo: replyTo } : {}),
    }),
    signal: AbortSignal.timeout(8000),
  });
  const payload = (await response.json().catch(async () => {
    const text = await response.text().catch(() => "");
    return { Message: text.slice(0, MAX_POSTMARK_ERROR_BODY) };
  })) as { MessageID?: string; Message?: string; ErrorCode?: number };

  if (!response.ok || payload.ErrorCode) {
    return {
      ok: false as const,
      status: response.status,
      error: payload.Message || response.statusText || "Postmark email failed.",
      messageId: payload.MessageID ?? null,
    };
  }

  return {
    ok: true as const,
    status: response.status,
    error: null,
    messageId: payload.MessageID ?? null,
  };
};
