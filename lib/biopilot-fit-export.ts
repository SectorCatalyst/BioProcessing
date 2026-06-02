"use client";

import type { jsPDF as JsPdfType } from "jspdf";

import {
  BIOPILOT_MODEL_VERSION,
  type BioPilotAssessmentInputs,
  type BioPilotAssessmentResults,
} from "@/lib/biopilot-fit-assessment";
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
const formatPaybackMonths = (value: number) =>
  value >= 60 ? "60+ mo" : `${formatDecimal(value)} mo`;

type PdfColor = [number, number, number];

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const PAGE_MARGIN_X = 14;
const PAGE_BOTTOM_Y = 252;
const YFA_LOGO_URL = "/yfa-logo-new-alpha.png";
const YFA_LOGO_ASPECT_RATIO = 1988 / 498;

const COLORS = {
  background: [247, 250, 252] as PdfColor,
  card: [255, 255, 255] as PdfColor,
  cardSoft: [241, 247, 252] as PdfColor,
  ink: [12, 29, 53] as PdfColor,
  muted: [83, 104, 132] as PdfColor,
  border: [213, 225, 237] as PdfColor,
  blue: [0, 79, 155] as PdfColor,
  navy: [0, 31, 68] as PdfColor,
  cyan: [24, 184, 199] as PdfColor,
  yellow: [255, 238, 0] as PdfColor,
};

const buildFileName = (profileLabel: string) => {
  const slug = profileLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return `biopilot-fit-assessment-${slug}-${timestamp}.pdf`;
};

const setFillColor = (doc: JsPdfType, color: PdfColor) => {
  doc.setFillColor(color[0], color[1], color[2]);
};

const setDrawColor = (doc: JsPdfType, color: PdfColor) => {
  doc.setDrawColor(color[0], color[1], color[2]);
};

const setTextColor = (doc: JsPdfType, color: PdfColor) => {
  doc.setTextColor(color[0], color[1], color[2]);
};

const seedPage = (doc: JsPdfType) => {
  setFillColor(doc, COLORS.background);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");
  setFillColor(doc, [232, 241, 249]);
  doc.rect(0, 0, 3.2, PAGE_HEIGHT, "F");
};

const ensurePage = (doc: JsPdfType, y: number) => {
  if (y < PAGE_BOTTOM_Y) {
    return y;
  }

  doc.addPage();
  seedPage(doc);
  return 18;
};

const ensureSpace = (doc: JsPdfType, y: number, minimumHeight: number) => {
  if (y + minimumHeight < PAGE_BOTTOM_Y) {
    return y;
  }

  doc.addPage();
  seedPage(doc);
  return 18;
};

const loadImageDataUrl = async (url: string) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const addLogo = (
  doc: JsPdfType,
  logoDataUrl: string | null,
  x: number,
  y: number,
  width: number,
) => {
  if (!logoDataUrl) {
    setTextColor(doc, COLORS.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Yokogawa Fluence Analytics", x, y + 7);
    return;
  }

  doc.addImage(logoDataUrl, "PNG", x, y, width, width / YFA_LOGO_ASPECT_RATIO);
};

const drawLabel = (doc: JsPdfType, label: string, x: number, y: number, color = COLORS.muted) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setTextColor(doc, color);
  doc.text(label.toUpperCase(), x, y, { charSpace: 0.9 });
};

const drawSectionHeading = (doc: JsPdfType, heading: string, y: number) => {
  setDrawColor(doc, COLORS.border);
  doc.setLineWidth(0.25);
  doc.line(PAGE_MARGIN_X, y - 4, PAGE_WIDTH - PAGE_MARGIN_X, y - 4);
  setFillColor(doc, COLORS.yellow);
  doc.roundedRect(PAGE_MARGIN_X, y - 5.4, 12, 2.2, 1.1, 1.1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setTextColor(doc, COLORS.ink);
  doc.text(heading, 14, y);
  return y + 8;
};

const drawParagraph = (doc: JsPdfType, text: string, y: number, width = 180) => {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  setTextColor(doc, COLORS.muted);
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, 14, y);
  return y + lines.length * 4.8 + 4;
};

const drawMetricCard = (
  doc: JsPdfType,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  detail: string,
  emphasis: PdfColor,
) => {
  setFillColor(doc, COLORS.card);
  setDrawColor(doc, COLORS.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, width, 27, 5, 5, "FD");
  setFillColor(doc, emphasis);
  doc.roundedRect(x, y, 3, 27, 1.5, 1.5, "F");
  drawLabel(doc, label, x + 7, y + 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  setTextColor(doc, COLORS.ink);
  doc.text(value, x + 7, y + 16.8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  setTextColor(doc, COLORS.muted);
  doc.text(doc.splitTextToSize(detail, width - 12), x + 7, y + 22);
};

const drawCoverHeader = (params: {
  doc: JsPdfType;
  logoDataUrl: string | null;
  generatedAt: string;
  profileLabel: string;
  stageLabel: string;
  fitBand: string;
  fitScore: string;
}) => {
  const { doc, logoDataUrl, generatedAt, profileLabel, stageLabel, fitBand, fitScore } = params;

  setFillColor(doc, COLORS.card);
  setDrawColor(doc, COLORS.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(14, 12, 91, 26, 6, 6, "FD");
  addLogo(doc, logoDataUrl, 18, 17, 72);

  setFillColor(doc, COLORS.cardSoft);
  setDrawColor(doc, COLORS.border);
  doc.roundedRect(126, 14, 70, 18, 5, 5, "FD");
  drawLabel(doc, "Clinical Planning Report", 131, 21, COLORS.blue);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  setTextColor(doc, COLORS.muted);
  doc.text(generatedAt, 131, 27);

  setFillColor(doc, COLORS.navy);
  doc.roundedRect(14, 48, 182, 47, 8, 8, "F");
  setFillColor(doc, COLORS.yellow);
  doc.roundedRect(18, 53, 22, 2.5, 1.2, 1.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  setTextColor(doc, [255, 255, 255]);
  doc.text("BioPilot Fit Assessment", 18, 68);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.2);
  doc.text(doc.splitTextToSize(profileLabel, 110), 18, 78);
  setTextColor(doc, [188, 214, 236]);
  doc.text(stageLabel, 18, 88);

  setFillColor(doc, [255, 255, 255]);
  doc.roundedRect(136, 56, 50, 27, 6, 6, "F");
  drawLabel(doc, fitBand, 142, 64, COLORS.blue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setTextColor(doc, COLORS.ink);
  doc.text(fitScore, 142, 76);

  return 108;
};

const drawTable = (
  autoTable: (doc: JsPdfType, options: Record<string, unknown>) => void,
  doc: JsPdfType,
  options: Record<string, unknown>,
) => {
  autoTable(doc, {
    theme: "plain",
    styles: {
      fontSize: 9.2,
      cellPadding: { top: 3.1, right: 3, bottom: 3.1, left: 3 },
      textColor: COLORS.ink,
      lineColor: COLORS.border,
      lineWidth: 0.12,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: COLORS.cardSoft,
      textColor: COLORS.blue,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [251, 253, 255],
    },
    rowPageBreak: "avoid",
    margin: { left: PAGE_MARGIN_X, right: PAGE_MARGIN_X, bottom: 24 },
    ...options,
  });
};

const getLastAutoTableY = (doc: JsPdfType, fallbackY: number) =>
  ((doc as JsPdfType & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? fallbackY);

const addFooters = (doc: JsPdfType, logoDataUrl: string | null) => {
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    setDrawColor(doc, COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(PAGE_MARGIN_X, 280, PAGE_WIDTH - PAGE_MARGIN_X, 280);
    addLogo(doc, logoDataUrl, PAGE_MARGIN_X, 284, 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setTextColor(doc, COLORS.muted);
    doc.text("Directional planning output. Validate operating evidence before formal ROI decisions.", 66, 289);
    doc.text(`${page} / ${pageCount}`, 190, 289, { align: "right" });
  }
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
  const autoTable = (autoTableModule.default ?? autoTableModule.autoTable) as (
    doc: JsPdfType,
    options: Record<string, unknown>,
  ) => void;
  const logoDataUrl = await loadImageDataUrl(YFA_LOGO_URL);
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  seedPage(doc);

  const generatedAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  let y = drawCoverHeader({
    doc,
    logoDataUrl,
    generatedAt,
    profileLabel: results.profile.label,
    stageLabel: results.stage.label,
    fitBand: results.fitBand,
    fitScore: formatPercent(results.fitScore),
  });

  drawMetricCard(
    doc,
    14,
    y,
    87,
    "Annual Value",
    formatCurrency(results.annualValuePotential),
    "Estimated annual value from the submitted assumptions.",
    COLORS.blue,
  );
  drawMetricCard(
    doc,
    109,
    y,
    87,
    "3-Year ROI",
    formatPercent(results.threeYearRoi),
    "Return against BioPilot scope and customer engineering assumptions.",
    COLORS.cyan,
  );
  y += 33;
  drawMetricCard(
    doc,
    14,
    y,
    87,
    "Recovered Hours",
    `${formatNumber(results.annualRecoveredHours)} hrs`,
    "Annual time released back to science, review, and transfer work.",
    COLORS.cyan,
  );
  drawMetricCard(
    doc,
    109,
    y,
    87,
    "Payback",
    formatPaybackMonths(results.paybackMonths),
    "Payback using annual subscription billing and a phased value ramp.",
    COLORS.blue,
  );
  y += 39;

  y = drawSectionHeading(doc, "Assessment Details", y);
  drawTable(autoTable, doc, {
    startY: y,
    body: [
      ["Generated", generatedAt],
      ["Contact", leadCapture ? `${leadCapture.firstName} ${leadCapture.lastName}` : "Not Captured"],
      ["Company", leadCapture?.company ?? "Not Captured"],
      ["Work Email", leadCapture?.workEmail ?? "Not Captured"],
      ["Process Family", results.profile.label],
      ["Lifecycle Stage", results.stage.label],
      ["Model Version", results.modelVersion ?? BIOPILOT_MODEL_VERSION],
      ["Digital Plant Maturity", `Level ${results.digitalPlantMaturity.level}: ${results.digitalPlantMaturity.label}`],
      ["Decision Days", `${formatDecimal(results.annualDecisionDaysRecovered)} days / year`],
    ],
    columnStyles: {
      0: { cellWidth: 36, fontStyle: "bold" },
      1: { cellWidth: 138 },
    },
  });

  y = getLastAutoTableY(doc, y) + 10;
  y = ensureSpace(doc, y, 34);
  y = drawSectionHeading(doc, "Executive Summary", y);
  y = drawParagraph(doc, results.executiveSummary, y);

  y = ensureSpace(doc, y + 2, 72);
  y = drawSectionHeading(doc, "Submitted Process Context", y);

  drawTable(autoTable, doc, {
    startY: y,
    head: [["Input", "Submitted Value"]],
    body: [
      ["Process Family", results.profile.label],
      ["Active Programs", formatNumber(inputs.activePrograms)],
      ["Runs Per Year", formatNumber(inputs.runsPerYear)],
      ["Sites Or Partners", formatNumber(inputs.sites)],
      ["Transfer Events", formatNumber(inputs.transferEventsPerYear)],
      ["Vendor Platforms", formatNumber(inputs.vendorPlatforms)],
      ["Weeks Since Last Batch Failure", `${formatNumber(inputs.weeksSinceLastBatchFailure)} weeks`],
      ["Failure-Cause Exposure", formatPercent(inputs.failureCauseExposureScore)],
      ["Failed-Run Recovery Hours", `${formatNumber(inputs.failedRunRecoveryHours)} hrs`],
    ],
    columnStyles: {
      0: { cellWidth: 48, fontStyle: "bold" },
      1: { cellWidth: 126 },
    },
  });

  y = getLastAutoTableY(doc, y) + 8;
  y = ensureSpace(doc, y, 88);
  y = drawSectionHeading(doc, "BioPilot Investment Basis", y);

  drawTable(autoTable, doc, {
    startY: y,
    head: [["Assumption", "Submitted Value"]],
    body: [
      ["BioPilot Scope", results.investment.tierLabel],
      ["Monthly Subscription", formatCurrency(results.investment.monthlySubscription)],
      ["Annual Subscription", formatCurrency(results.investment.annualSubscription)],
      ["3-Year Subscription", formatCurrency(results.investment.threeYearSubscription)],
      ["Online Bioreactors", formatNumber(results.investment.bioreactors)],
      ["Active Recipes", formatNumber(results.investment.recipesRunning)],
      ["Stored Recipes", formatNumber(results.investment.recipeStorage)],
      ["PAT Equipment", formatNumber(results.investment.patEquipment)],
      ["Users", formatNumber(results.investment.users)],
      [
        "Customer Engineering",
        `${formatNumber(results.investment.customerEngineeringHours)} hrs at ${formatCurrency(results.investment.customerEngineeringHourlyRate)} / hr`,
      ],
      ["Engineering Investment", formatCurrency(results.investment.customerEngineeringInvestment)],
      ["Additional Services", formatCurrency(results.investment.additionalServicesInvestment)],
      ["3-Year BioPilot Investment", formatCurrency(results.investment.totalThreeYearInvestment)],
      [
        "Included",
        `${results.investment.includedEngineeringLabel}; ${results.investment.includedMaintenanceLabel}`,
      ],
    ],
    columnStyles: {
      0: { cellWidth: 54, fontStyle: "bold" },
      1: { cellWidth: 120 },
    },
  });

  y = getLastAutoTableY(doc, y) + 8;
  y = ensureSpace(doc, y, 76);
  y = drawSectionHeading(doc, "How The Estimate Was Calculated", y);

  drawTable(autoTable, doc, {
    startY: y,
    head: [["Area", "Basis", "Formula"]],
    body: results.assumptionTransparency.items.map((item) => [
      item.label,
      item.basis,
      item.formula,
    ]),
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 70 },
      2: { cellWidth: 72 },
    },
  });

  y = getLastAutoTableY(doc, y) + 8;
  y = ensureSpace(doc, y, 70);
  y = drawSectionHeading(doc, "Digital Plant Maturity", y);

  drawTable(autoTable, doc, {
    startY: y,
    head: [["Domain", "Score", "Why It Matters"]],
    body: results.digitalPlantMaturity.domains.map((domain) => [
      domain.label,
      formatPercent(domain.score),
      domain.rationale,
    ]),
    columnStyles: {
      0: { cellWidth: 44 },
      1: { cellWidth: 24 },
      2: { cellWidth: 112 },
    },
  });

  y = getLastAutoTableY(doc, y) + 8;
  y = ensureSpace(doc, y, 70);
  y = drawSectionHeading(doc, "Operating Change Summary", y);

  drawTable(autoTable, doc, {
    startY: y,
    head: [["Measure", "Current", "With BioPilot"]],
    body: [
      [
        "Manual Hours Per Run",
        `${formatDecimal(results.currentState.manualHoursPerRun)} hrs`,
        `${formatDecimal(results.bioPilotState.manualHoursPerRun)} hrs`,
      ],
      [
        "Batch Review Time",
        `${formatDecimal(results.currentState.reviewHours)} hrs`,
        `${formatDecimal(results.bioPilotState.reviewHours)} hrs`,
      ],
      [
        "Decision Lag",
        `${formatDecimal(results.currentState.decisionLagHours)} hrs`,
        `${formatDecimal(results.bioPilotState.decisionLagHours)} hrs`,
      ],
      [
        "Run Success Rate",
        formatPercent(results.currentState.runSuccessRate),
        formatPercent(results.bioPilotState.runSuccessRate),
      ],
      [
        "Failure Recovery Effort",
        `${formatDecimal(results.currentState.failureRecoveryHours)} hrs`,
        `${formatDecimal(results.bioPilotState.failureRecoveryHours)} hrs`,
      ],
      [
        "Transfer Package Effort",
        `${formatDecimal(results.currentState.transferPackageHours)} hrs`,
        `${formatDecimal(results.bioPilotState.transferPackageHours)} hrs`,
      ],
      [
        "Operator Ramp",
        `${formatDecimal(results.currentState.onboardingDays)} days`,
        `${formatDecimal(results.bioPilotState.onboardingDays)} days`,
      ],
    ],
    columnStyles: {
      0: { cellWidth: 74 },
      1: { cellWidth: 50 },
      2: { cellWidth: 50 },
    },
  });

  y = getLastAutoTableY(doc, y) + 8;
  y = ensureSpace(doc, y, 70);
  y = drawSectionHeading(doc, "Operational Signals", y);

  drawTable(autoTable, doc, {
    startY: y,
    head: [["Signal", "Severity", "Why It Matters", "Suggested Action"]],
    body: results.buyingSignals.map((signal) => [
      signal.title,
      signal.severity,
      signal.summary,
      signal.action,
    ]),
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: 24 },
      2: { cellWidth: 60 },
      3: { cellWidth: 60 },
    },
  });

  y = getLastAutoTableY(doc, y) + 8;
  y = ensureSpace(doc, y, 70);
  y = drawSectionHeading(doc, "Value Drivers", y);

  drawTable(autoTable, doc, {
    startY: y,
    head: [["Lever", "Annual Value", "Summary"]],
    body: results.valueLevers.map((lever) => [
      lever.label,
      formatCurrency(lever.annualValue),
      lever.summary,
    ]),
    columnStyles: {
      0: { cellWidth: 54 },
      1: { cellWidth: 34 },
      2: { cellWidth: 92 },
    },
  });

  y = getLastAutoTableY(doc, y) + 8;
  y = ensureSpace(doc, y, 34);
  y = drawSectionHeading(doc, "Recommended Next Step", y);
  y = drawParagraph(doc, results.nextStep, y);
  y = ensurePage(doc, y + 2);
  y = drawParagraph(
    doc,
    "This estimate reflects the submitted inputs and BioPilot scope assumptions. Confirm the most important operating numbers and final commercial scope before relying on it for formal planning.",
    y,
  );

  addFooters(doc, logoDataUrl);
  const blob = doc.output("blob");
  downloadBlob(blob, buildFileName(results.profile.label));
}
