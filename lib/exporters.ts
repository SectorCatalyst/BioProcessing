"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  type CalculationBundle,
  formatCurrency,
  formatPercent,
} from "@/lib/calculations";
import { type EditableModel, type OverrideRecord, type ProvenanceMap, type ScenarioId } from "@/lib/model";
import { type VersioningState } from "@/store/use-calculator-store";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const buildFileStem = (scenarioId: ScenarioId) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `bioprocess-development-roi-${scenarioId}-${timestamp}`;
};

const buildProvenanceSummary = (provenance: ProvenanceMap) => {
  const entries = Object.values(provenance);
  return {
    totalEntries: entries.length,
    userEntered: entries.filter((entry) => entry.sourceLabel === "User").length,
    defaultPlaceholder: entries.filter((entry) => entry.sourceLabel === "Default").length,
    derived: entries.filter((entry) => entry.sourceLabel === "Derived").length,
  };
};

export const exportJson = (params: {
  model: EditableModel;
  bundle: CalculationBundle;
  selectedScenarioId: ScenarioId;
  provenance: ProvenanceMap;
  overrides: OverrideRecord[];
  versioning: VersioningState;
}) => {
  const { model, bundle, selectedScenarioId, provenance, overrides, versioning } = params;
  const selectedScenario = bundle.scenarioResults[selectedScenarioId];

  const payload = {
    metadata: {
      applicationTitle: "Bioprocess Development ROI Calculator",
      subtitle:
        "A structured business-case tool for estimating the economic impact of digital orchestration in pharmaceutical bioprocess development.",
      shortDescription:
        "Estimate hard-dollar savings, redeployed capacity, and strategic value across development workflows, using transparent assumptions and scenario-based modeling.",
      landingDisclaimer:
        "This model is estimate-based and should be validated against actual process data, adoption conditions, and implementation scope.",
      generatedAt: bundle.generatedAt,
      selectedScenarioId,
      versioning,
      reviewAndSignOff: model.reviewAndSignOff,
      overrides,
    },
    inputs: {
      organizationProfile: model.organizationProfile,
      reviewAndSignOff: model.reviewAndSignOff,
    },
    scenarios: bundle.visibleScenarioIds.map((scenarioId) => ({
      scenarioId,
      scenarioLabel: bundle.scenarioResults[scenarioId].scenarioLabel,
      inputs: model.scenarios[scenarioId],
      scenarioJustification: model.scenarioJustifications[scenarioId],
    })),
    advancedSettings: model.advancedSettings,
    results: bundle.visibleScenarioIds.map((scenarioId) => {
      const scenario = bundle.scenarioResults[scenarioId];
      return {
        scenarioId,
        readinessStatus: scenario.readinessStatus,
        paybackDescriptor: scenario.paybackDescriptor,
        metrics: scenario.metrics,
        narrative: scenario.narrative,
      };
    }),
    assumptionsRegister: bundle.assumptionsRegister,
    provenanceSummary: buildProvenanceSummary(provenance),
    modelRisk: bundle.visibleScenarioIds.map((scenarioId) => ({
      scenarioId,
      modelRisk: bundle.scenarioResults[scenarioId].modelRisk,
    })),
    formulaTrace: selectedScenario.formulaTrace,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  downloadBlob(blob, `${buildFileStem(selectedScenarioId)}.json`);
};

const scenarioInputRows = (model: EditableModel, scenarioId: ScenarioId) => {
  const scenario = model.scenarios[scenarioId];
  return [
    {
      Scenario: scenarioId,
      Section: "Current State",
      ScientistAggregationHoursPerRun: scenario.currentState.scientistDataAggregationHoursPerRun,
      EngineerAggregationHoursPerRun: scenario.currentState.engineerDataAggregationHoursPerRun,
      TechnicianAggregationHoursPerRun: scenario.currentState.technicianDataAggregationHoursPerRun,
      ReportingHoursPerRun: scenario.currentState.reportingHoursPerRun,
      CampaignDurationWeeks: scenario.currentState.campaignDurationWeeks,
      TimeToDecisionLagHours: scenario.currentState.timeToDecisionLagHours,
    },
    {
      Scenario: scenarioId,
      Section: "Improvement Assumptions",
      DataAggregationReductionPct: scenario.improvementAssumptions.reductionInDataAggregation,
      ReportingReductionPct: scenario.improvementAssumptions.reductionInReporting,
      TroubleshootingReductionPct: scenario.improvementAssumptions.reductionInTroubleshooting,
      ManualWorkflowReductionPct: scenario.improvementAssumptions.reductionInManualWorkflowExecution,
      CampaignDurationReductionPct: scenario.improvementAssumptions.reductionInCampaignDuration,
      TransferDelayRiskReductionPct: scenario.improvementAssumptions.reductionInTransferDelayRisk,
    },
    {
      Scenario: scenarioId,
      Section: "Risk & Realization",
      LaborTreatmentMode: scenario.riskAndRealization.laborTreatmentMode,
      CaptureFactorPct: scenario.riskAndRealization.captureFactor,
      ConfidenceFactorPct: scenario.riskAndRealization.confidenceFactor,
      AdoptionRampMonths: scenario.riskAndRealization.adoptionRampMonths,
      FirstYearRealizationPct: scenario.riskAndRealization.firstYearRealization,
      AccelerationValueCategory: scenario.riskAndRealization.accelerationValueCategory,
    },
  ];
};

const normalizeCsvRecords = (sheetName: string, rows: unknown[]) =>
  rows.map((row) => {
    if (row && typeof row === "object" && !Array.isArray(row)) {
      return {
        Worksheet: sheetName,
        ...(row as Record<string, unknown>),
      };
    }

    return {
      Worksheet: sheetName,
      Value: row,
    };
  });

const csvCell = (value: unknown) => {
  const serialized =
    value === null || value === undefined
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);

  return `"${serialized.replace(/"/g, '""')}"`;
};

const downloadCsvRecords = (records: Array<Record<string, unknown>>, filename: string) => {
  const headers = Array.from(new Set(records.flatMap((record) => Object.keys(record))));
  const csv = [
    headers.map(csvCell).join(","),
    ...records.map((record) => headers.map((header) => csvCell(record[header])).join(",")),
  ].join("\n");

  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename);
};

export const exportCsvBundle = (params: {
  model: EditableModel;
  bundle: CalculationBundle;
  selectedScenarioId: ScenarioId;
}) => {
  const { model, bundle, selectedScenarioId } = params;
  const executiveSummary = bundle.visibleScenarioIds.map((scenarioId) => {
    const scenario = bundle.scenarioResults[scenarioId];
    return {
      Scenario: scenario.scenarioLabel,
      ReadinessStatus: scenario.readinessStatus,
      TotalInvestment: scenario.metrics.totalInvestment,
      ThreeYearROI: scenario.metrics.threeYearRoi,
      PaybackPeriodMonths: scenario.metrics.paybackPeriodMonths ?? "N/A",
      NPV: scenario.metrics.npv,
      AnnualHardDollarValue: scenario.metrics.annualHardDollarValue,
      AnnualCapacityValue: scenario.metrics.annualCapacityValue,
      AnnualStrategicValue: scenario.metrics.annualStrategicValue,
    };
  });

  const resultsByScenario = bundle.visibleScenarioIds.map((scenarioId) => {
    const scenario = bundle.scenarioResults[scenarioId];
    return {
      Scenario: scenario.scenarioLabel,
      Year1Benefit: scenario.metrics.year1Benefit,
      Year2Benefit: scenario.metrics.year2Benefit,
      Year3Benefit: scenario.metrics.year3Benefit,
      Year1NetBenefit: scenario.metrics.year1NetBenefit,
      Year2NetBenefit: scenario.metrics.year2NetBenefit,
      Year3NetBenefit: scenario.metrics.year3NetBenefit,
      ThreeYearGrossBenefit: scenario.metrics.threeYearGrossBenefit,
      ThreeYearNetBenefit: scenario.metrics.threeYearNetBenefit,
      NPV: scenario.metrics.npv,
      IRR: scenario.metrics.irr ?? "N/A",
    };
  });

  const selectedScenario = bundle.scenarioResults[selectedScenarioId];
  const sensitivityAnalysis = selectedScenario.sensitivity.map((point) => ({
    Assumption: point.assumption,
    ThreeYearROIDelta: point.roiDelta,
  }));

  const sheets: Array<[string, unknown[]]> = [
    ["Executive Summary", executiveSummary],
    ["Organization Profile", [model.organizationProfile]],
    [
      "Current State",
      bundle.visibleScenarioIds.map((scenarioId) => ({
        Scenario: scenarioId,
        ...model.scenarios[scenarioId].currentState,
      })),
    ],
    [
      "Cost Basis",
      bundle.visibleScenarioIds.map((scenarioId) => ({
        Scenario: scenarioId,
        ...model.scenarios[scenarioId].costBasis,
      })),
    ],
    ["Scenario Inputs", bundle.visibleScenarioIds.flatMap((scenarioId) => scenarioInputRows(model, scenarioId))],
    ["Results by Scenario", resultsByScenario],
    ["Sensitivity Analysis", sensitivityAnalysis],
    ["Assumptions Register", bundle.assumptionsRegister],
  ];

  downloadCsvRecords(
    sheets.flatMap(([sheetName, rows]) => normalizeCsvRecords(sheetName, rows)),
    `${buildFileStem(selectedScenarioId)}.csv`,
  );
};

const addPdfHeading = (doc: jsPDF, title: string, y: number) => {
  doc.setFontSize(14);
  doc.setTextColor(233, 238, 244);
  doc.text(title, 14, y);
  return y + 8;
};

const addPdfParagraph = (doc: jsPDF, text: string, y: number) => {
  doc.setFontSize(10);
  doc.setTextColor(190, 198, 210);
  const lines = doc.splitTextToSize(text, 182);
  doc.text(lines, 14, y);
  return y + lines.length * 5 + 4;
};

const ensurePdfPage = (doc: jsPDF, y: number) => {
  if (y < 260) {
    return y;
  }

  doc.addPage();
  doc.setFillColor(8, 16, 30);
  doc.rect(0, 0, 210, 297, "F");
  return 20;
};

const seedPdfPage = (doc: jsPDF) => {
  doc.setFillColor(8, 16, 30);
  doc.rect(0, 0, 210, 297, "F");
};

export const exportPdf = (params: {
  model: EditableModel;
  bundle: CalculationBundle;
  selectedScenarioId: ScenarioId;
}) => {
  const { model, bundle, selectedScenarioId } = params;
  const scenario = bundle.scenarioResults[selectedScenarioId];
  const currencyCode = model.advancedSettings.currencyCode;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  seedPdfPage(doc);

  let y = 20;
  y = addPdfHeading(doc, "Cover Page", y);
  y = addPdfParagraph(doc, "Bioprocess Development ROI Calculator", y);
  y = addPdfParagraph(
    doc,
    "A structured business-case tool for estimating the economic impact of digital orchestration in pharmaceutical bioprocess development.",
    y,
  );
  y = addPdfParagraph(
    doc,
    "This model is estimate-based and should be validated against actual process data, adoption conditions, and implementation scope.",
    y,
  );

  y = ensurePdfPage(doc, y + 12);
  y = addPdfHeading(doc, "Executive Summary", y);
  y = addPdfParagraph(doc, scenario.narrative, y);

  y = ensurePdfPage(doc, y + 8);
  y = addPdfHeading(doc, "KPI Overview", y);
  autoTable(doc, {
    startY: y,
    styles: { fillColor: [16, 26, 42], textColor: [233, 238, 244], lineColor: [38, 65, 104] },
    headStyles: { fillColor: [22, 44, 77] },
    bodyStyles: { fillColor: [10, 18, 32] },
    head: [["KPI", "Value"]],
    body: [
      ["Total Investment", formatCurrency(scenario.metrics.totalInvestment, currencyCode, 0)],
      ["3-Year ROI", formatPercent(scenario.metrics.threeYearRoi * 100, 0)],
      ["Payback Period", scenario.metrics.paybackPeriodMonths === null ? "N/A" : `${scenario.metrics.paybackPeriodMonths} months`],
      ["NPV", formatCurrency(scenario.metrics.npv, currencyCode, 0)],
      ["Annual Hard-Dollar Value", formatCurrency(scenario.metrics.annualHardDollarValue, currencyCode, 0)],
      ["Annual Capacity Value", formatCurrency(scenario.metrics.annualCapacityValue, currencyCode, 0)],
    ],
  });
  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;

  y = ensurePdfPage(doc, y + 10);
  y = addPdfHeading(doc, "Value Composition", y);
  autoTable(doc, {
    startY: y,
    styles: { fillColor: [10, 18, 32], textColor: [233, 238, 244], lineColor: [38, 65, 104] },
    headStyles: { fillColor: [22, 44, 77] },
    body: [
      ["Hard-Dollar", formatCurrency(scenario.metrics.annualHardDollarValue, currencyCode, 0)],
      ["Capacity", formatCurrency(scenario.metrics.annualCapacityValue, currencyCode, 0)],
      ["Strategic", formatCurrency(scenario.metrics.annualStrategicValue, currencyCode, 0)],
    ],
  });
  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;

  y = ensurePdfPage(doc, y + 10);
  y = addPdfHeading(doc, "Scenario Comparison", y);
  autoTable(doc, {
    startY: y,
    styles: { fillColor: [10, 18, 32], textColor: [233, 238, 244], lineColor: [38, 65, 104] },
    headStyles: { fillColor: [22, 44, 77] },
    head: [["Scenario", "3-Year ROI", "Readiness", "Payback"]],
    body: bundle.visibleScenarioIds.map((scenarioId) => {
      const row = bundle.scenarioResults[scenarioId];
      return [
        row.scenarioLabel,
        formatPercent(row.metrics.threeYearRoi * 100, 0),
        row.readinessStatus,
        row.metrics.paybackPeriodMonths === null ? "N/A" : `${row.metrics.paybackPeriodMonths} months`,
      ];
    }),
  });
  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;

  y = ensurePdfPage(doc, y + 10);
  y = addPdfHeading(doc, "Model Readiness Status", y);
  y = addPdfParagraph(doc, `Readiness state: ${scenario.readinessStatus}.`, y);

  y = ensurePdfPage(doc, y + 8);
  y = addPdfHeading(doc, "Model Risk Summary", y);
  y = addPdfParagraph(doc, `Confidence tier: ${scenario.modelRisk.confidenceTier}.`, y);
  autoTable(doc, {
    startY: y,
    styles: { fillColor: [10, 18, 32], textColor: [233, 238, 244], lineColor: [38, 65, 104] },
    headStyles: { fillColor: [22, 44, 77] },
    head: [["Family", "Severity", "Message"]],
    body: scenario.modelRisk.flagSummary.map((flag) => [flag.family, flag.severity, flag.message]),
  });
  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;

  y = ensurePdfPage(doc, y + 10);
  y = addPdfHeading(doc, "Assumptions Highlights", y);
  autoTable(doc, {
    startY: y,
    styles: { fillColor: [10, 18, 32], textColor: [233, 238, 244], lineColor: [38, 65, 104] },
    headStyles: { fillColor: [22, 44, 77] },
    head: [["Assumption", "Display Value", "Source"]],
    body: scenario.assumptionRegister.slice(0, 10).map((row) => [
      row.assumption,
      row.displayValue,
      row.source,
    ]),
  });
  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;

  y = ensurePdfPage(doc, y + 10);
  y = addPdfHeading(doc, "Narrative Summary", y);
  y = addPdfParagraph(doc, scenario.narrative, y);

  y = ensurePdfPage(doc, y + 10);
  y = addPdfHeading(doc, "Methodology Notes", y);
  y = addPdfParagraph(
    doc,
    "Percentages are stored as whole numbers and converted to decimals inside pure calculation functions. Cycle-time acceleration uses capture and confidence adjustment. Decision-lag reduction is tracked but not independently monetized in version 1.",
    y,
  );

  y = ensurePdfPage(doc, y + 10);
  y = addPdfHeading(doc, "Disclaimer", y);
  addPdfParagraph(
    doc,
    "This model is estimate-based and should be validated against actual process data, adoption conditions, implementation scope, and review governance. Strategic proxy value remains separate by default.",
    y,
  );

  doc.save(`${buildFileStem(selectedScenarioId)}.pdf`);
};
