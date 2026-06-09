import { expect, test } from "@playwright/test";

import {
  assessBioPilotFit,
  DEFAULT_BIOPILOT_ASSESSMENT_INPUTS,
} from "../lib/biopilot-fit-assessment";
import {
  buildLeadCapturedEmailNotification,
  buildReportSubmittedEmailNotification,
  getBioPilotAbandonmentMinutes,
  getBioPilotEmailWebhookUrl,
} from "../lib/server/biopilot-notifications";

const lead = {
  firstName: "Avery",
  lastName: "Stone",
  workEmail: "avery.stone@bioprocess.example",
  company: "Northstar Biologics",
  jobTitle: "Process Development Lead",
  countryRegion: "United States",
  consentToContact: true,
};

test.describe("BioPilot email notification payloads", () => {
  test("builds email-webhook fields for lead capture and report submission", () => {
    process.env.BIOPILOT_NOTIFICATION_RECIPIENTS = "owner@example.com, team@example.com";
    process.env.NEXT_PUBLIC_SITE_URL = "https://bioprocessing-roi.onrender.com";

    const leadNotification = buildLeadCapturedEmailNotification({
      lead,
      leadCaptureId: "lead-42",
    });

    expect(leadNotification).toMatchObject({
      event: "lead_captured",
      source: "biopilot-fit-assessment",
      subject: "BioPilot ROI lead captured: Northstar Biologics",
      recipients: ["owner@example.com", "team@example.com"],
      adminUrl: "https://bioprocessing-roi.onrender.com/admin/leads",
      lead: {
        workEmail: "avery.stone@bioprocess.example",
        company: "Northstar Biologics",
      },
    });
    expect(leadNotification.text).toContain("Lead ID: lead-42");

    const results = assessBioPilotFit(DEFAULT_BIOPILOT_ASSESSMENT_INPUTS);
    const reportNotification = buildReportSubmittedEmailNotification({
      lead,
      results,
      assessmentId: "assessment-24",
    });

    expect(reportNotification).toMatchObject({
      event: "report_submitted",
      subject: "BioPilot ROI report submitted: Northstar Biologics",
      report: {
        fitScore: results.fitScore,
        fitBand: results.fitBand,
        annualValuePotential: results.annualValuePotential,
      },
    });
    expect(reportNotification.text).toContain("Assessment ID: assessment-24");
    expect(reportNotification.text).toContain("Annual value potential:");
  });

  test("clamps abandoned-session notification window to a practical range", () => {
    process.env.BIOPILOT_ABANDONMENT_MINUTES = "5";
    expect(getBioPilotAbandonmentMinutes()).toBe(15);

    process.env.BIOPILOT_ABANDONMENT_MINUTES = "90";
    expect(getBioPilotAbandonmentMinutes()).toBe(90);

    process.env.BIOPILOT_ABANDONMENT_MINUTES = "3000";
    expect(getBioPilotAbandonmentMinutes()).toBe(1440);
  });

  test("keeps the legacy sales webhook fallback report-only", () => {
    process.env.BIOPILOT_EMAIL_WEBHOOK_URL = "";
    process.env.SALES_NOTIFICATION_WEBHOOK_URL = "https://example.com/report-webhook";

    expect(getBioPilotEmailWebhookUrl("report_submitted")).toBe(
      "https://example.com/report-webhook",
    );
    expect(getBioPilotEmailWebhookUrl("lead_captured")).toBe("");
    expect(getBioPilotEmailWebhookUrl("assessment_abandoned")).toBe("");
  });
});
