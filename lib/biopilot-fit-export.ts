"use client";

import type { jsPDF as JsPdfType } from "jspdf";

import type { BioPilotAssessmentInputs, BioPilotAssessmentResults } from "@/lib/biopilot-fit-assessment";
import type { LeadCaptureRecord } from "@/lib/model";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatPercent = (value: number) => `${Math.round(value)}%`;
const formatDecimal = (value: number) => decimalFormatter.format(value);
const formatNumber = (value: number) => numberFormatter.format(Math.round(value));

const buildFileName = (profileLabel: string) => {
  const slug = profileLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return `biopilot-fit-assessment-${slug}-${timestamp}.pdf`;
};

const seedPage = (doc: JsPdfType) => {
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 210, 297, "F");
};

const ensurePage = (doc: JsPdfType, y: number) => {
  if (y < 266) {
    return y;
  }

  doc.addPage();
  seedPage(doc);
  return 18;
};

const drawSectionHeading = (doc: JsPdfType, heading: string, y: number) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 49, 108);
  doc.text(heading, 14, y);
  return y + 8;
};

const drawParagraph = (doc: JsPdfType, text: string, y: number) => {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(56, 71, 89);
  const lines = doc.splitTextToSize(text, 180);
  doc.text(lines, 14, y);
  return y + lines.length * 4.8 + 4;
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export async function exportBioPilotAssessmentPdf(params: {
  inputs: BioPilotAssessmentInputs;
  results: BioPilotAssessmentResults;
  leadCapture: LeadCaptureRecord | null;
}) {
  const { inputs, results, leadCapture } = params;
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableModule.default ?? autoTableModule.autoTable;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  seedPage(doc);

  doc.setFillColor(0, 49, 108);
  doc.roundedRect(12, 12, 186, 34, 8, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 238, 0);
  doc.text("Yokogawa BioPilot", 18, 22);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("Fit Assessment Report", 18, 33);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(results.profile.label, 18, 40);

  let y = 56;

  const generatedAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: {
      fontSize: 9.5,
      cellPadding: 3,
      textColor: [34, 45, 58],
      lineColor: [224, 231, 239],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [236, 244, 252],
      textColor: [0, 49, 108],
      fontStyle: "bold",
    },
    body: [
      ["Generated", generatedAt],
      ["Contact", leadCapture ? `${leadCapture.firstName} ${leadCapture.lastName}` : "Not captured"],
      ["Company", leadCapture?.company ?? "Not captured"],
      ["Work email", leadCapture?.workEmail ?? "Not captured"],
      ["Lifecycle stage", results.stage.label],
    ],
    columnStyles: {
      0: { cellWidth: 36, fontStyle: "bold" },
      1: { cellWidth: 138 },
    },
    margin: { left: 14, right: 14 },
  });

  y = ((doc as JsPdfType & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
  y = drawSectionHeading(doc, "Executive summary", y);
  y = drawParagraph(doc, results.executiveSummary, y);

  y = ensurePage(doc, y + 4);
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: {
      fontSize: 9.5,
      cellPadding: 3,
      textColor: [34, 45, 58],
      lineColor: [224, 231, 239],
      lineWidth: 0.2,
    },
    head: [["Metric", "Reported value"]],
    headStyles: {
      fillColor: [236, 244, 252],
      textColor: [0, 49, 108],
      fontStyle: "bold",
    },
    body: [
      ["Fit score", formatPercent(results.fitScore)],
      ["Annual value", formatCurrency(results.annualValuePotential)],
      ["3-year ROI", formatPercent(results.threeYearRoi)],
      ["3-year net benefit", formatCurrency(results.threeYearNetBenefit)],
      ["Payback", `${formatDecimal(results.paybackMonths)} months`],
      ["Recovered hours", `${formatNumber(results.annualRecoveredHours)} hours / year`],
      ["Decision days recovered", `${formatDecimal(results.annualDecisionDaysRecovered)} days / year`],
      ["DPMM level", `Level ${results.digitalPlantMaturity.level}: ${results.digitalPlantMaturity.label}`],
      ["DPMM score", formatPercent(results.digitalPlantMaturity.score)],
      ["Evidence confidence", `${results.evidenceConfidence.band} (${formatPercent(results.evidenceConfidence.score)})`],
    ],
    margin: { left: 14, right: 14 },
  });

  y = ((doc as JsPdfType & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
  y = ensurePage(doc, y);
  y = drawSectionHeading(doc, "Digital plant maturity", y);

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: {
      fontSize: 9.5,
      cellPadding: 3,
      textColor: [34, 45, 58],
      lineColor: [224, 231, 239],
      lineWidth: 0.2,
      overflow: "linebreak",
    },
    head: [["Domain", "Score", "Why it matters"]],
    headStyles: {
      fillColor: [236, 244, 252],
      textColor: [0, 49, 108],
      fontStyle: "bold",
    },
    body: results.digitalPlantMaturity.domains.map((domain) => [
      domain.label,
      formatPercent(domain.score),
      domain.rationale,
    ]),
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 44 },
      1: { cellWidth: 24 },
      2: { cellWidth: 112 },
    },
  });

  y = ((doc as JsPdfType & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
  y = ensurePage(doc, y);
  y = drawSectionHeading(doc, "Evidence confidence and calculation basis", y);
  y = drawParagraph(doc, results.evidenceConfidence.summary, y);

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: {
      fontSize: 9.5,
      cellPadding: 3,
      textColor: [34, 45, 58],
      lineColor: [224, 231, 239],
      lineWidth: 0.2,
      overflow: "linebreak",
    },
    head: [["Area", "Basis", "Formula"]],
    headStyles: {
      fillColor: [236, 244, 252],
      textColor: [0, 49, 108],
      fontStyle: "bold",
    },
    body: results.assumptionTransparency.items.map((item) => [
      item.label,
      item.basis,
      item.formula,
    ]),
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 70 },
      2: { cellWidth: 72 },
    },
  });

  y = ((doc as JsPdfType & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
  y = ensurePage(doc, y);
  y = drawSectionHeading(doc, "Submitted process context", y);

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: {
      fontSize: 9.5,
      cellPadding: 3,
      textColor: [34, 45, 58],
      lineColor: [224, 231, 239],
      lineWidth: 0.2,
    },
    head: [["Input", "Submitted value"]],
    headStyles: {
      fillColor: [236, 244, 252],
      textColor: [0, 49, 108],
      fontStyle: "bold",
    },
    body: [
      ["Process family", results.profile.label],
      ["Active programs", formatNumber(inputs.activePrograms)],
      ["Runs per year", formatNumber(inputs.runsPerYear)],
      ["Sites or partners", formatNumber(inputs.sites)],
      ["Transfer events", formatNumber(inputs.transferEventsPerYear)],
      ["Vendor platforms", formatNumber(inputs.vendorPlatforms)],
      ["Planned BioPilot investment", formatCurrency(inputs.plannedProgramInvestment)],
    ],
    margin: { left: 14, right: 14 },
  });

  y = ((doc as JsPdfType & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
  y = ensurePage(doc, y);
  y = drawSectionHeading(doc, "Operating change summary", y);

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: {
      fontSize: 9.5,
      cellPadding: 3,
      textColor: [34, 45, 58],
      lineColor: [224, 231, 239],
      lineWidth: 0.2,
    },
    head: [["Measure", "Current", "With BioPilot"]],
    headStyles: {
      fillColor: [236, 244, 252],
      textColor: [0, 49, 108],
      fontStyle: "bold",
    },
    body: [
      [
        "Manual hours per run",
        `${formatDecimal(results.currentState.manualHoursPerRun)} hrs`,
        `${formatDecimal(results.bioPilotState.manualHoursPerRun)} hrs`,
      ],
      [
        "Batch review time",
        `${formatDecimal(results.currentState.reviewHours)} hrs`,
        `${formatDecimal(results.bioPilotState.reviewHours)} hrs`,
      ],
      [
        "Decision lag",
        `${formatDecimal(results.currentState.decisionLagHours)} hrs`,
        `${formatDecimal(results.bioPilotState.decisionLagHours)} hrs`,
      ],
      [
        "Run success rate",
        formatPercent(results.currentState.runSuccessRate),
        formatPercent(results.bioPilotState.runSuccessRate),
      ],
      [
        "Transfer package effort",
        `${formatDecimal(results.currentState.transferPackageHours)} hrs`,
        `${formatDecimal(results.bioPilotState.transferPackageHours)} hrs`,
      ],
      [
        "Operator ramp",
        `${formatDecimal(results.currentState.onboardingDays)} days`,
        `${formatDecimal(results.bioPilotState.onboardingDays)} days`,
      ],
    ],
    margin: { left: 14, right: 14 },
  });

  y = ((doc as JsPdfType & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
  y = ensurePage(doc, y);
  y = drawSectionHeading(doc, "Operational signals", y);

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: {
      fontSize: 9.5,
      cellPadding: 3,
      textColor: [34, 45, 58],
      lineColor: [224, 231, 239],
      lineWidth: 0.2,
      overflow: "linebreak",
    },
    head: [["Signal", "Severity", "Why it matters", "Suggested action"]],
    headStyles: {
      fillColor: [236, 244, 252],
      textColor: [0, 49, 108],
      fontStyle: "bold",
    },
    body: results.buyingSignals.map((signal) => [
      signal.title,
      signal.severity,
      signal.summary,
      signal.action,
    ]),
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: 24 },
      2: { cellWidth: 60 },
      3: { cellWidth: 60 },
    },
  });

  y = ((doc as JsPdfType & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
  y = ensurePage(doc, y);
  y = drawSectionHeading(doc, "Value drivers", y);

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: {
      fontSize: 9.5,
      cellPadding: 3,
      textColor: [34, 45, 58],
      lineColor: [224, 231, 239],
      lineWidth: 0.2,
      overflow: "linebreak",
    },
    head: [["Lever", "Annual value", "Summary"]],
    headStyles: {
      fillColor: [236, 244, 252],
      textColor: [0, 49, 108],
      fontStyle: "bold",
    },
    body: results.valueLevers.map((lever) => [
      lever.label,
      formatCurrency(lever.annualValue),
      lever.summary,
    ]),
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 54 },
      1: { cellWidth: 34 },
      2: { cellWidth: 92 },
    },
  });

  y = ((doc as JsPdfType & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
  y = ensurePage(doc, y);
  y = drawSectionHeading(doc, "Recommended next step", y);
  y = drawParagraph(doc, results.nextStep, y);
  y = ensurePage(doc, y + 2);
  drawParagraph(
    doc,
    "This estimate reflects the submitted inputs. Confirm the most important operating numbers before relying on it for formal planning.",
    y,
  );

  const blob = doc.output("blob");
  downloadBlob(blob, buildFileName(results.profile.label));
}
