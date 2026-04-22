import {
  FIELD_METADATA_BY_PATH,
  REVIEW_APPROVAL_DISCLAIMER,
  SCENARIO_IDS,
  SCENARIO_LABELS,
  type EditableModel,
  type OverrideRecord,
  type ProvenanceMap,
  type ReadinessStatus,
  type RiskFlagFamily,
  type RiskSeverity,
  type ScenarioId,
  type ScenarioJustification,
} from "@/lib/model";
import { type VersioningState } from "@/store/use-calculator-store";

type ValueCategory = "hardDollar" | "capacity" | "strategic";
type EngineKey =
  | "laborEfficiency"
  | "rerunAvoidance"
  | "failedRunAvoidance"
  | "deviationReduction"
  | "cycleTimeAcceleration"
  | "transferImprovement"
  | "transferDelayAvoidance"
  | "onboardingEfficiency"
  | "strategicProxy";

export interface RiskFlag {
  family: RiskFlagFamily;
  severity: RiskSeverity;
  message: string;
  recommendation: string;
}

export interface FormulaTraceEntry {
  id: string;
  title: string;
  formula: string;
  sourceInputs: string[];
  intermediateSteps: string[];
  categoryAllocation: string;
  riskAdjustments: string[];
  phasingAdjustments: string[];
  costAdjustments: string[];
  notes: string[];
  relatedWarnings: string[];
}

export interface AssumptionRegisterRow {
  assumption: string;
  section: string;
  scenario: string;
  rawValue: string | number | boolean;
  displayValue: string;
  source: "User" | "Default" | "Derived";
  valueCategoryImpact: string;
  notes: string;
}

export interface EngineResult {
  key: EngineKey;
  title: string;
  hardDollar: number;
  capacity: number;
  strategic: number;
  total: number;
  trace: FormulaTraceEntry;
}

export interface ScenarioMetrics {
  totalInvestment: number;
  annualRecurringCost: number;
  annualHardDollarValue: number;
  annualCapacityValue: number;
  annualStrategicValue: number;
  totalAnnualValue: number;
  year1Benefit: number;
  year2Benefit: number;
  year3Benefit: number;
  year1NetBenefit: number;
  year2NetBenefit: number;
  year3NetBenefit: number;
  threeYearGrossBenefit: number;
  threeYearNetBenefit: number;
  threeYearRoi: number;
  paybackPeriodMonths: number | null;
  npv: number;
  irr: number | null;
}

export interface SensitivityPoint {
  assumption: string;
  roiDelta: number;
}

export interface ModelRiskPanel {
  confidenceTier: "Low" | "Moderate" | "High";
  flagSummary: RiskFlag[];
  riskDimensions: Array<{ label: string; value: string }>;
  dataGroundingSummary: string;
  valueConcentrationSummary: string;
  recommendedActions: string[];
}

export interface ScenarioResult {
  scenarioId: ScenarioId;
  scenarioLabel: string;
  annualRuns: number;
  blendedTechnicalHourlyRate: number;
  maturityPoints: number;
  engineResults: EngineResult[];
  metrics: ScenarioMetrics;
  formulaTrace: FormulaTraceEntry[];
  modelRisk: ModelRiskPanel;
  readinessStatus: ReadinessStatus;
  narrative: string;
  assumptionRegister: AssumptionRegisterRow[];
  sensitivity: SensitivityPoint[];
  missingJustifications: string[];
  paybackDescriptor: "fast" | "moderate" | "weak" | "not achieved within the modeled horizon";
}

export interface CalculationBundle {
  generatedAt: string;
  visibleScenarioIds: ScenarioId[];
  scenarioResults: Record<ScenarioId, ScenarioResult>;
  assumptionsRegister: AssumptionRegisterRow[];
}

const pct = (value: number) => value / 100;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const round = (value: number, decimals = 2) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
};

const safeDivide = (value: number, denominator: number) =>
  denominator === 0 ? 0 : value / denominator;

const getValueAtPath = (object: unknown, path: string) =>
  path.split(".").reduce<unknown>((accumulator, segment) => {
    if (accumulator === null || accumulator === undefined) {
      return undefined;
    }

    if (typeof accumulator !== "object") {
      return undefined;
    }

    return (accumulator as Record<string, unknown>)[segment];
  }, object);

const toValueAllocation = (
  title: string,
  key: EngineKey,
  category: ValueCategory,
  value: number,
  trace: FormulaTraceEntry,
): EngineResult => {
  const hardDollar = category === "hardDollar" ? value : 0;
  const capacity = category === "capacity" ? value : 0;
  const strategic = category === "strategic" ? value : 0;

  return {
    key,
    title,
    hardDollar,
    capacity,
    strategic,
    total: hardDollar + capacity + strategic,
    trace,
  };
};

const toSplitAllocation = (
  key: EngineKey,
  title: string,
  values: Pick<EngineResult, "hardDollar" | "capacity" | "strategic">,
  trace: FormulaTraceEntry,
): EngineResult => ({
  key,
  title,
  hardDollar: values.hardDollar,
  capacity: values.capacity,
  strategic: values.strategic,
  total: values.hardDollar + values.capacity + values.strategic,
  trace,
});

export const formatCurrency = (
  value: number,
  currencyCode = "USD",
  decimals = 0,
) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

export const formatNumber = (value: number, decimals = 0) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

export const formatPercent = (value: number, decimals = 0) =>
  `${formatNumber(value, decimals)}%`;

const averageAdoptionWithinMonths = (startMonth: number, endMonth: number, rampMonths: number) => {
  if (rampMonths <= 0) {
    return 1;
  }

  if (startMonth >= rampMonths) {
    return 1;
  }

  if (endMonth <= rampMonths) {
    const integrated = (endMonth ** 2 - startMonth ** 2) / (2 * rampMonths);
    return integrated / (endMonth - startMonth);
  }

  const rampIntegrated = (rampMonths ** 2 - startMonth ** 2) / (2 * rampMonths);
  const flatIntegrated = endMonth - rampMonths;
  return (rampIntegrated + flatIntegrated) / (endMonth - startMonth);
};

const buildYearPhaseFactors = (adoptionRampMonths: number, firstYearRealization: number) => {
  const year1Ramp = averageAdoptionWithinMonths(0, 12, adoptionRampMonths);
  const year2Ramp = averageAdoptionWithinMonths(12, 24, adoptionRampMonths);
  const year3Ramp = averageAdoptionWithinMonths(24, 36, adoptionRampMonths);

  return {
    year1: year1Ramp * pct(firstYearRealization),
    year2: year2Ramp,
    year3: year3Ramp,
  };
};

const computeIrr = (cashFlows: number[]) => {
  if (cashFlows.length < 2) {
    return null;
  }

  let low = -0.99;
  let high = 10;
  const npvAt = (rate: number) =>
    cashFlows.reduce((accumulator, cashFlow, index) => {
      return accumulator + cashFlow / (1 + rate) ** index;
    }, 0);

  let lowValue = npvAt(low);
  let highValue = npvAt(high);

  if (lowValue === 0) {
    return low;
  }

  if (highValue === 0) {
    return high;
  }

  if (lowValue * highValue > 0) {
    return null;
  }

  for (let iteration = 0; iteration < 100; iteration += 1) {
    const midpoint = (low + high) / 2;
    const midpointValue = npvAt(midpoint);

    if (Math.abs(midpointValue) < 0.0001) {
      return midpoint;
    }

    if (lowValue * midpointValue <= 0) {
      high = midpoint;
      highValue = midpointValue;
    } else {
      low = midpoint;
      lowValue = midpointValue;
    }
  }

  return (low + high) / 2;
};

const getPaybackPeriodMonths = (
  totalOneTimeInvestment: number,
  annualRecurringCost: number,
  yearBenefits: [number, number, number],
) => {
  let cumulative = -totalOneTimeInvestment;

  for (let index = 0; index < yearBenefits.length; index += 1) {
    const yearNet = yearBenefits[index] - annualRecurringCost;

    if (yearNet <= 0) {
      cumulative += yearNet;
      continue;
    }

    if (cumulative + yearNet >= 0) {
      const remaining = Math.abs(cumulative);
      return round(index * 12 + (remaining / yearNet) * 12, 1);
    }

    cumulative += yearNet;
  }

  return null;
};

const getPaybackDescriptor = (paybackPeriodMonths: number | null) => {
  if (paybackPeriodMonths === null) {
    return "not achieved within the modeled horizon" as const;
  }

  if (paybackPeriodMonths <= 12) {
    return "fast" as const;
  }

  if (paybackPeriodMonths <= 24) {
    return "moderate" as const;
  }

  return "weak" as const;
};

const getDataGroundingBreakdown = (provenanceEntries: ProvenanceMap, scenarioId: ScenarioId) => {
  const relevantEntries = Object.values(provenanceEntries).filter((entry) => {
    return entry.scenario === "global" || entry.scenario === scenarioId;
  });

  const userCount = relevantEntries.filter((entry) => entry.sourceLabel === "User").length;
  const defaultCount = relevantEntries.filter((entry) => entry.sourceLabel === "Default").length;
  const derivedCount = relevantEntries.filter((entry) => entry.sourceLabel === "Derived").length;
  const totalCount = relevantEntries.length || 1;

  return {
    userCount,
    defaultCount,
    derivedCount,
    totalCount,
    userRatio: userCount / totalCount,
    defaultRatio: defaultCount / totalCount,
    derivedRatio: derivedCount / totalCount,
  };
};

const buildAssumptionRows = (
  model: EditableModel,
  scenarioId: ScenarioId,
  provenance: ProvenanceMap,
  derivedRows: AssumptionRegisterRow[],
) => {
  const rows = Object.entries(provenance)
    .filter(([, entry]) => entry.scenario === "global" || entry.scenario === scenarioId)
    .map(([path, entry]) => {
      const rawValue = getValueAtPath(model, path);
      const metadata = FIELD_METADATA_BY_PATH[path];
      let displayValue = String(rawValue ?? "");

      if (typeof rawValue === "number") {
        if (metadata?.field.label.includes("Cost") || metadata?.field.label.includes("Value")) {
          displayValue = formatCurrency(rawValue, model.advancedSettings.currencyCode, 0);
        } else if (metadata?.field.label.includes("(%)")) {
          displayValue = formatPercent(rawValue);
        } else {
          displayValue = formatNumber(rawValue, 1);
        }
      }

      if (typeof rawValue === "boolean") {
        displayValue = rawValue ? "Enabled" : "Disabled";
      }

      return {
        assumption: entry.assumption,
        section: entry.section,
        scenario: entry.scenario === "global" ? "Global" : SCENARIO_LABELS[entry.scenario],
        rawValue: rawValue as string | number | boolean,
        displayValue,
        source: entry.sourceLabel,
        valueCategoryImpact: entry.valueCategoryImpact,
        notes: entry.notes,
      } satisfies AssumptionRegisterRow;
    });

  return [...rows, ...derivedRows];
};

const buildJustificationRequirements = (
  scenarioId: ScenarioId,
  justification: ScenarioJustification,
  model: EditableModel,
) => {
  const scenario = model.scenarios[scenarioId];
  const missing: string[] = [];

  if (
    scenario.riskAndRealization.laborTreatmentMode === "hard_savings" &&
    justification.hardSavingsClassification.trim().length === 0
  ) {
    missing.push("Hard Savings Classification");
  }

  if (
    scenario.riskAndRealization.laborTreatmentMode === "mixed" &&
    justification.mixedLaborSplit.trim().length === 0
  ) {
    missing.push("Mixed Labor Split");
  }

  if (
    model.advancedSettings.enableStrategicProxyValues &&
    justification.strategicProxyActivation.trim().length === 0
  ) {
    missing.push("Strategic Proxy Activation");
  }

  if (
    scenario.riskAndRealization.captureFactor >= 70 &&
    justification.highCaptureFactor.trim().length === 0
  ) {
    missing.push("High Capture Factor");
  }

  if (
    scenario.riskAndRealization.confidenceFactor >= 75 &&
    justification.highConfidenceFactor.trim().length === 0
  ) {
    missing.push("High Confidence Factor");
  }

  const improvementValues = Object.values(scenario.improvementAssumptions);
  if (
    (scenarioId === "aggressive" || improvementValues.some((value) => value >= 60)) &&
    justification.aggressiveScenarioUse.trim().length === 0
  ) {
    missing.push("Aggressive Scenario Use");
  }

  if (
    improvementValues.some((value) => value >= 60) &&
    justification.stretchAssumption.trim().length === 0
  ) {
    missing.push("Stretch Assumption");
  }

  if (
    model.advancedSettings.enableTransferDelayAvoidance &&
    justification.transferDelayAvoidance.trim().length === 0
  ) {
    missing.push("Transfer Delay Avoidance");
  }

  return missing;
};

const buildRiskFlag = (
  family: RiskFlagFamily,
  severity: RiskSeverity,
  message: string,
  recommendation: string,
): RiskFlag => ({
  family,
  severity,
  message,
  recommendation,
});

const buildFinancialMetrics = (
  annualHardDollarValue: number,
  annualCapacityValue: number,
  annualStrategicValue: number,
  annualRecurringCost: number,
  totalOneTimeInvestment: number,
  discountRate: number,
  phaseFactors: { year1: number; year2: number; year3: number },
) => {
  const totalAnnualValue = annualHardDollarValue + annualCapacityValue + annualStrategicValue;
  const yearBenefits: [number, number, number] = [
    totalAnnualValue * phaseFactors.year1,
    totalAnnualValue * phaseFactors.year2,
    totalAnnualValue * phaseFactors.year3,
  ];
  const yearNetBenefits: [number, number, number] = [
    yearBenefits[0] - annualRecurringCost - totalOneTimeInvestment,
    yearBenefits[1] - annualRecurringCost,
    yearBenefits[2] - annualRecurringCost,
  ];
  const threeYearGrossBenefit = yearBenefits.reduce((sum, value) => sum + value, 0);
  const totalInvestment = totalOneTimeInvestment + annualRecurringCost * 3;
  const threeYearNetBenefit = threeYearGrossBenefit - totalInvestment;
  const threeYearRoi = safeDivide(threeYearNetBenefit, totalInvestment);
  const paybackPeriodMonths = getPaybackPeriodMonths(totalOneTimeInvestment, annualRecurringCost, yearBenefits);
  const discount = pct(discountRate);
  const npv =
    -totalOneTimeInvestment +
    yearBenefits[0] / (1 + discount) ** 1 -
    annualRecurringCost / (1 + discount) ** 1 +
    yearBenefits[1] / (1 + discount) ** 2 -
    annualRecurringCost / (1 + discount) ** 2 +
    yearBenefits[2] / (1 + discount) ** 3 -
    annualRecurringCost / (1 + discount) ** 3;
  const irr = computeIrr([
    -totalOneTimeInvestment,
    yearBenefits[0] - annualRecurringCost,
    yearBenefits[1] - annualRecurringCost,
    yearBenefits[2] - annualRecurringCost,
  ]);

  return {
    totalInvestment,
    annualRecurringCost,
    annualHardDollarValue,
    annualCapacityValue,
    annualStrategicValue,
    totalAnnualValue,
    year1Benefit: yearBenefits[0],
    year2Benefit: yearBenefits[1],
    year3Benefit: yearBenefits[2],
    year1NetBenefit: yearNetBenefits[0],
    year2NetBenefit: yearNetBenefits[1],
    year3NetBenefit: yearNetBenefits[2],
    threeYearGrossBenefit,
    threeYearNetBenefit,
    threeYearRoi,
    paybackPeriodMonths,
    npv,
    irr,
  } satisfies ScenarioMetrics;
};

const buildNarrative = (params: {
  scenarioId: ScenarioId;
  readinessStatus: ReadinessStatus;
  metrics: ScenarioMetrics;
  engineResults: EngineResult[];
  paybackDescriptor: "fast" | "moderate" | "weak" | "not achieved within the modeled horizon";
  model: EditableModel;
}) => {
  const { scenarioId, readinessStatus, metrics, engineResults, paybackDescriptor, model } = params;
  const topDriver = [...engineResults].sort((left, right) => right.total - left.total)[0];
  const strategicEnabled = model.advancedSettings.enableStrategicProxyValues;
  const readinessSentence =
    readinessStatus === "Decision-Support Ready"
      ? "The scenario is detailed enough to support planning discussions."
      : readinessStatus === "Review-Ready"
        ? "The scenario is detailed enough for team review."
        : readinessStatus === "Minimally Calculable"
          ? "The scenario currently supports an early directional estimate."
          : "The scenario still needs more complete inputs before it should be shared broadly.";
  const strategicSentence = strategicEnabled
    ? `Strategic proxy value is shown separately at ${formatCurrency(
        metrics.annualStrategicValue,
        model.advancedSettings.currencyCode,
        0,
      )} annually and should be interpreted as proxy-based rather than directly realized.`
    : "Strategic proxy value is disabled, so the modeled total reflects hard-dollar and capacity value only.";

  return [
    `${SCENARIO_LABELS[scenarioId]} scenario output estimates ${formatCurrency(
      metrics.annualHardDollarValue,
      model.advancedSettings.currencyCode,
      0,
    )} in annual hard-dollar value and ${formatCurrency(
      metrics.annualCapacityValue,
      model.advancedSettings.currencyCode,
      0,
    )} in annual capacity value. Three-year ROI is ${formatPercent(
      metrics.threeYearRoi * 100,
      0,
    )} with payback assessed as ${paybackDescriptor}.`,
    `The largest modeled driver is ${topDriver.title} at ${formatCurrency(
      topDriver.total,
      model.advancedSettings.currencyCode,
      0,
    )} annually. ${readinessSentence}`,
    `${strategicSentence} Review status remains ${model.reviewAndSignOff.reviewStatus}. ${REVIEW_APPROVAL_DISCLAIMER}`,
  ].join(" ");
};

const buildSensitivity = (
  scenarioId: ScenarioId,
  model: EditableModel,
  provenance: ProvenanceMap,
  overrides: OverrideRecord[],
  versioning: VersioningState,
  baselineRoi: number,
) => {
  const assumptions: Array<{
    path:
      | "reductionInDataAggregation"
      | "reductionInReruns"
      | "reductionInCampaignDuration"
      | "captureFactor"
      | "confidenceFactor";
    label: string;
    domain: "improvementAssumptions" | "riskAndRealization";
  }> = [
    {
      path: "reductionInDataAggregation",
      label: "Data Aggregation Reduction",
      domain: "improvementAssumptions",
    },
    { path: "reductionInReruns", label: "Rerun Reduction", domain: "improvementAssumptions" },
    {
      path: "reductionInCampaignDuration",
      label: "Campaign Duration Reduction",
      domain: "improvementAssumptions",
    },
    { path: "captureFactor", label: "Capture Factor", domain: "riskAndRealization" },
    { path: "confidenceFactor", label: "Confidence Factor", domain: "riskAndRealization" },
  ];

  return assumptions.map((assumption) => {
    const nextModel = structuredClone(model);
    if (assumption.domain === "improvementAssumptions") {
      const currentValue =
        nextModel.scenarios[scenarioId].improvementAssumptions[
          assumption.path as
            | "reductionInDataAggregation"
            | "reductionInReruns"
            | "reductionInCampaignDuration"
        ];
      nextModel.scenarios[scenarioId].improvementAssumptions[
        assumption.path as
          | "reductionInDataAggregation"
          | "reductionInReruns"
          | "reductionInCampaignDuration"
      ] = clamp(currentValue + 5, 0, 100);
    } else {
      const currentValue =
        nextModel.scenarios[scenarioId].riskAndRealization[
          assumption.path as "captureFactor" | "confidenceFactor"
        ];
      nextModel.scenarios[scenarioId].riskAndRealization[
        assumption.path as "captureFactor" | "confidenceFactor"
      ] = clamp(currentValue + 5, 0, 100);
    }

    const rerun = calculateScenarioResult({
      model: nextModel,
      scenarioId,
      provenance,
      overrides,
      versioning,
      includeSensitivity: false,
    });

    return {
      assumption: assumption.label,
      roiDelta: rerun.metrics.threeYearRoi - baselineRoi,
    } satisfies SensitivityPoint;
  });
};

const buildRiskAndReadiness = (params: {
  scenarioId: ScenarioId;
  model: EditableModel;
  engineResults: EngineResult[];
  metrics: ScenarioMetrics;
  provenance: ProvenanceMap;
  missingJustifications: string[];
}) => {
  const { scenarioId, model, engineResults, metrics, provenance, missingJustifications } = params;
  const scenario = model.scenarios[scenarioId];
  const grounding = getDataGroundingBreakdown(provenance, scenarioId);
  const flags: RiskFlag[] = [];
  const improvementValues = Object.values(scenario.improvementAssumptions);
  const maxImprovement = Math.max(...improvementValues);
  const topEngine = [...engineResults].sort((left, right) => right.total - left.total)[0];
  const concentrationRatio = safeDivide(topEngine?.total ?? 0, metrics.totalAnnualValue);
  const strategicRatio = safeDivide(metrics.annualStrategicValue, metrics.totalAnnualValue);
  const laborHardDollar = engineResults
    .filter((engine) =>
      ["laborEfficiency", "transferImprovement", "onboardingEfficiency"].includes(engine.key),
    )
    .reduce((sum, engine) => sum + engine.hardDollar, 0);
  const hardDollarRatio = safeDivide(laborHardDollar, metrics.totalAnnualValue);
  const paybackWithoutStrategic = buildFinancialMetrics(
    metrics.annualHardDollarValue,
    metrics.annualCapacityValue,
    0,
    metrics.annualRecurringCost,
    metrics.totalInvestment - metrics.annualRecurringCost * 3,
    scenario.costBasis.discountRate,
    buildYearPhaseFactors(
      scenario.riskAndRealization.adoptionRampMonths,
      scenario.riskAndRealization.firstYearRealization,
    ),
  ).paybackPeriodMonths;

  if (maxImprovement >= 70 || scenario.riskAndRealization.captureFactor >= 80) {
    flags.push(
      buildRiskFlag(
        "Assumption Extremity",
        "High Risk",
        "One or more assumptions are stretched into a range that materially elevates model risk.",
        "Document operating evidence or reduce the stretched assumptions.",
      ),
    );
  } else if (maxImprovement >= 55 || scenario.riskAndRealization.confidenceFactor >= 75) {
    flags.push(
      buildRiskFlag(
        "Assumption Extremity",
        "Warning",
        "Several assumptions sit above conservative ranges and need explicit evidence.",
        "Add scenario justification and confirm with operating data.",
      ),
    );
  }

  if (concentrationRatio >= 0.6) {
    flags.push(
      buildRiskFlag(
        "Value Concentration",
        "Warning",
        `${topEngine.title} contributes ${formatPercent(concentrationRatio * 100)} of modeled annual value.`,
        "Stress test the primary driver before using this result in a decision forum.",
      ),
    );
  } else if (concentrationRatio >= 0.45) {
    flags.push(
      buildRiskFlag(
        "Value Concentration",
        "Caution",
        `${topEngine.title} is the dominant driver of the annual value mix.`,
        "Review whether the concentration aligns with the actual operating constraint.",
      ),
    );
  }

  if (
    scenario.riskAndRealization.laborTreatmentMode === "hard_savings" &&
    hardDollarRatio >= 0.35
  ) {
    flags.push(
      buildRiskFlag(
        "Classification Credibility",
        "Warning",
        "A large share of the modeled value is classified as labor hard savings.",
        "Confirm whether saved labor is truly removed from spend rather than redeployed.",
      ),
    );
  } else if (scenario.riskAndRealization.laborTreatmentMode === "mixed") {
    flags.push(
      buildRiskFlag(
        "Classification Credibility",
        "Info",
        "Mixed labor treatment is active, which splits labor value between hard-dollar and capacity.",
        "Keep the mixed split justified and reviewable.",
      ),
    );
  }

  if (strategicRatio >= 0.3) {
    flags.push(
      buildRiskFlag(
        "Proxy Dependence",
        "Warning",
        "Strategic proxy value forms a material share of the total annual value.",
        "Use the proxy as a separate discussion input rather than as proof of economic realization.",
      ),
    );
  } else if (strategicRatio > 0) {
    flags.push(
      buildRiskFlag(
        "Proxy Dependence",
        "Caution",
        "Strategic proxy value is present and should remain separated from realized value.",
        "Communicate the proxy nature of this value in reviews and exports.",
      ),
    );
  }

  if (grounding.userRatio < 0.2) {
    flags.push(
      buildRiskFlag(
        "Low Data Grounding",
        "Warning",
        "Most assumptions remain default placeholders or derived values.",
        "Replace placeholders with direct operating data before decision use.",
      ),
    );
  } else if (grounding.userRatio < 0.4) {
    flags.push(
      buildRiskFlag(
        "Low Data Grounding",
        "Caution",
        "A significant portion of the model still relies on placeholder values.",
        "Increase site-specific inputs to improve credibility.",
      ),
    );
  }

  if (scenarioId === "aggressive" || maxImprovement >= 60) {
    flags.push(
      buildRiskFlag(
        "Scenario Stretch",
        missingJustifications.length > 0 ? "Warning" : "Caution",
        "Aggressive or stretch assumptions are present in this scenario.",
        "Maintain written rationale and compare against the expected scenario before escalation.",
      ),
    );
  }

  if (metrics.paybackPeriodMonths === null) {
    flags.push(
      buildRiskFlag(
        "Payback Fragility",
        "High Risk",
        "The model does not achieve payback within the three-year horizon.",
        "Recheck value capture, cost scope, or readiness before relying on ROI output.",
      ),
    );
  } else if (metrics.paybackPeriodMonths > 24 || paybackWithoutStrategic === null) {
    flags.push(
      buildRiskFlag(
        "Payback Fragility",
        "Warning",
        "Payback is either late in the horizon or dependent on value categories with lower realization confidence.",
        "Present payback with the value mix and sensitivity caveats.",
      ),
    );
  }

  if (
    scenario.riskAndRealization.integrationComplexity === "high" ||
    scenario.riskAndRealization.validationIntensity === "intensive" ||
    scenario.riskAndRealization.changeManagementRisk === "high"
  ) {
    flags.push(
      buildRiskFlag(
        "Realization Risk",
        "Warning",
        "Implementation friction is elevated by complexity, validation burden, or change risk.",
        "Lower capture expectations or extend the ramp if operating evidence is weak.",
      ),
    );
  } else if (
    scenario.riskAndRealization.integrationComplexity === "medium" ||
    scenario.riskAndRealization.validationIntensity === "standard" ||
    scenario.riskAndRealization.changeManagementRisk === "medium"
  ) {
    flags.push(
      buildRiskFlag(
        "Realization Risk",
        "Caution",
        "Realization depends on non-trivial deployment conditions.",
        "Track adoption and validation assumptions in the review narrative.",
      ),
    );
  }

  if (
    !Number.isFinite(metrics.threeYearRoi) ||
    !Number.isFinite(metrics.npv) ||
    metrics.totalInvestment < 0
  ) {
    flags.push(
      buildRiskFlag(
        "Output Integrity",
        "High Risk",
        "A core financial metric is not internally coherent.",
        "Inspect cost inputs, formula trace, and export integrity before sharing results.",
      ),
    );
  }

  if (missingJustifications.length > 0) {
    flags.push(
      buildRiskFlag(
        "Classification Credibility",
        "Caution",
        `Missing required scenario justifications: ${missingJustifications.join(", ")}.`,
        "Add the required rationale before treating the result as review-ready.",
      ),
    );
  }

  const highRiskCount = flags.filter((flag) => flag.severity === "High Risk").length;
  const warningCount = flags.filter((flag) => flag.severity === "Warning").length;

  let confidenceTier: "Low" | "Moderate" | "High" = "High";
  if (highRiskCount > 0 || grounding.userRatio < 0.2) {
    confidenceTier = "Low";
  } else if (warningCount > 0 || grounding.userRatio < 0.5) {
    confidenceTier = "Moderate";
  }

  let readinessStatus: ReadinessStatus = "Minimally Calculable";
  if (
    highRiskCount > 0 ||
    grounding.userRatio < 0.15 ||
    !Number.isFinite(metrics.totalAnnualValue) ||
    metrics.totalAnnualValue <= 0
  ) {
    readinessStatus = "Incomplete";
  } else if (
    model.reviewAndSignOff.reviewStatus === "Reviewed" ||
    model.reviewAndSignOff.reviewStatus === "Approved for Internal Discussion"
  ) {
    if (warningCount <= 1 && grounding.userRatio >= 0.5 && missingJustifications.length === 0) {
      readinessStatus = "Decision-Support Ready";
    } else if (warningCount <= 3 && grounding.userRatio >= 0.3 && missingJustifications.length === 0) {
      readinessStatus = "Review-Ready";
    }
  } else if (
    warningCount <= 3 &&
    grounding.userRatio >= 0.3 &&
    missingJustifications.length === 0
  ) {
    readinessStatus = "Review-Ready";
  }

  const riskDimensions = [
    {
      label: "Data Grounding",
      value: `${formatPercent(grounding.userRatio * 100)} user-entered assumptions across the active scenario and global inputs`,
    },
    {
      label: "Implementation Complexity",
      value: `${scenario.riskAndRealization.integrationComplexity} integration complexity with ${scenario.riskAndRealization.validationIntensity} validation intensity`,
    },
    {
      label: "Classification",
      value: `${scenario.riskAndRealization.laborTreatmentMode} labor treatment and ${scenario.riskAndRealization.accelerationValueCategory} acceleration category`,
    },
    {
      label: "Proxy Usage",
      value: model.advancedSettings.enableStrategicProxyValues
        ? "Strategic proxy value is enabled and remains separate."
        : "Strategic proxy value is disabled.",
    },
  ];

  const recommendedActions = Array.from(
    new Set([
      ...flags.map((flag) => flag.recommendation),
      ...(missingJustifications.length > 0
        ? ["Complete the missing scenario justification fields before review."]
        : []),
    ]),
  );

  return {
    readinessStatus,
    modelRisk: {
      confidenceTier,
      flagSummary: flags,
      riskDimensions,
      dataGroundingSummary: `${formatPercent(grounding.userRatio * 100)} user-entered, ${formatPercent(
        grounding.defaultRatio * 100,
      )} default, ${formatPercent(grounding.derivedRatio * 100)} derived.`,
      valueConcentrationSummary: topEngine
        ? `${topEngine.title} contributes ${formatPercent(concentrationRatio * 100)} of annual value.`
        : "No concentrated value driver identified.",
      recommendedActions,
    } satisfies ModelRiskPanel,
  };
};

const buildDerivedRows = (
  model: EditableModel,
  scenarioId: ScenarioId,
  annualRuns: number,
  blendedTechnicalHourlyRate: number,
  maturityPoints: number,
  metrics: ScenarioMetrics,
) => {
  const currencyCode = model.advancedSettings.currencyCode;
  return [
    {
      assumption: "Annual Runs",
      section: "Derived",
      scenario: SCENARIO_LABELS[scenarioId],
      rawValue: annualRuns,
      displayValue: formatNumber(annualRuns, 0),
      source: "Derived",
      valueCategoryImpact: "Labor, Reruns, Failed Runs",
      notes: "Derived as Runs per Month × 12.",
    },
    {
      assumption: "Blended Technical Hourly Rate",
      section: "Derived",
      scenario: SCENARIO_LABELS[scenarioId],
      rawValue: blendedTechnicalHourlyRate,
      displayValue: formatCurrency(blendedTechnicalHourlyRate, currencyCode, 0),
      source: "Derived",
      valueCategoryImpact: "Labor, Onboarding, Transfer",
      notes:
        "Derived as the simple average of Scientist, Engineer, and Technician hourly cost for mixed-team activities.",
    },
    {
      assumption: "Strategic Maturity Points",
      section: "Derived",
      scenario: SCENARIO_LABELS[scenarioId],
      rawValue: maturityPoints,
      displayValue: formatNumber(maturityPoints, 1),
      source: "Derived",
      valueCategoryImpact: "Strategic",
      notes:
        "Derived proxy base from program count, sites, vendors, instruments, transfer events, and average improvement intensity.",
    },
    {
      assumption: "Total Investment",
      section: "Derived",
      scenario: SCENARIO_LABELS[scenarioId],
      rawValue: metrics.totalInvestment,
      displayValue: formatCurrency(metrics.totalInvestment, currencyCode, 0),
      source: "Derived",
      valueCategoryImpact: "Investment",
      notes: "Derived as one-time investment plus three years of recurring cost.",
    },
  ] satisfies AssumptionRegisterRow[];
};

const calculateScenarioResult = (params: {
  model: EditableModel;
  scenarioId: ScenarioId;
  provenance: ProvenanceMap;
  overrides: OverrideRecord[];
  versioning: VersioningState;
  includeSensitivity?: boolean;
}): ScenarioResult => {
  const { model, scenarioId, provenance, overrides, versioning, includeSensitivity = true } = params;
  const scenario = model.scenarios[scenarioId];
  const org = model.organizationProfile;
  const current = scenario.currentState;
  const cost = scenario.costBasis;
  const improvement = scenario.improvementAssumptions;
  const risk = scenario.riskAndRealization;

  const annualRuns = org.runsPerMonth * 12;
  const blendedTechnicalHourlyRate =
    (cost.scientistHourlyCost + cost.engineerHourlyCost + cost.technicianHourlyCost) / 3;
  const riskMultiplier = pct(risk.captureFactor) * pct(risk.confidenceFactor);
  const phaseFactors = buildYearPhaseFactors(risk.adoptionRampMonths, risk.firstYearRealization);

  const aggregationHoursSaved =
    annualRuns * pct(improvement.reductionInDataAggregation) * current.scientistDataAggregationHoursPerRun;
  const aggregationEngineerHoursSaved =
    annualRuns * pct(improvement.reductionInDataAggregation) * current.engineerDataAggregationHoursPerRun;
  const aggregationTechnicianHoursSaved =
    annualRuns * pct(improvement.reductionInDataAggregation) * current.technicianDataAggregationHoursPerRun;
  const sharedHoursSaved =
    annualRuns * pct(improvement.reductionInReporting) * current.reportingHoursPerRun +
    annualRuns * pct(improvement.reductionInTroubleshooting) * current.troubleshootingHoursPerRun +
    annualRuns *
      pct(improvement.reductionInManualWorkflowExecution) *
      current.manualWorkflowExecutionHoursPerRun;
  const grossLaborValue =
    aggregationHoursSaved * cost.scientistHourlyCost +
    aggregationEngineerHoursSaved * cost.engineerHourlyCost +
    aggregationTechnicianHoursSaved * cost.technicianHourlyCost +
    sharedHoursSaved * blendedTechnicalHourlyRate;
  const laborHardShare =
    risk.laborTreatmentMode === "hard_savings"
      ? 1
      : risk.laborTreatmentMode === "redeployed_capacity"
        ? 0
        : pct(risk.mixedLaborHardSavingsShare);
  const laborCapacityShare = 1 - laborHardShare;

  const laborTraceWarnings = [];
  if (risk.laborTreatmentMode === "hard_savings") {
    laborTraceWarnings.push("Hard-savings classification depends on actual spend removal, not simple redeployment.");
  }

  const laborEfficiency = toSplitAllocation(
    "laborEfficiency",
    "Labor Efficiency",
    {
      hardDollar: grossLaborValue * laborHardShare,
      capacity: grossLaborValue * laborCapacityShare,
      strategic: 0,
    },
    {
      id: "trace-labor-efficiency",
      title: "Labor Efficiency",
      formula:
        "Annual labor value = annual runs × saved hours per run × hourly cost, with mixed-team activities valued at a blended technical rate.",
      sourceInputs: [
        "Scientist Data Aggregation Hours per Run",
        "Engineer Data Aggregation Hours per Run",
        "Technician Data Aggregation Hours per Run",
        "Reporting Hours per Run",
        "Troubleshooting Hours per Run",
        "Manual Workflow Execution Hours per Run",
        "Scientist Hourly Cost",
        "Engineer Hourly Cost",
        "Technician Hourly Cost",
        "Labor Treatment Mode",
      ],
      intermediateSteps: [
        `Annual runs = ${annualRuns}.`,
        `Aggregation hours saved across roles = ${formatNumber(
          aggregationHoursSaved + aggregationEngineerHoursSaved + aggregationTechnicianHoursSaved,
          1,
        )}.`,
        `Shared hours saved = ${formatNumber(sharedHoursSaved, 1)}.`,
        `Blended technical hourly rate = ${formatCurrency(
          blendedTechnicalHourlyRate,
          model.advancedSettings.currencyCode,
          0,
        )}.`,
      ],
      categoryAllocation:
        risk.laborTreatmentMode === "mixed"
          ? `Mixed allocation: ${formatPercent(
              laborHardShare * 100,
            )} hard-dollar and ${formatPercent(laborCapacityShare * 100)} capacity.`
          : risk.laborTreatmentMode === "hard_savings"
            ? "Allocated fully to Hard-Dollar."
            : "Allocated fully to Capacity.",
      riskAdjustments: ["No capture or confidence factor applied to labor efficiency by default."],
      phasingAdjustments: [
        `Year 1 realization factor = ${formatPercent(phaseFactors.year1 * 100, 1)}.`,
        `Year 2 realization factor = ${formatPercent(phaseFactors.year2 * 100, 1)}.`,
        `Year 3 realization factor = ${formatPercent(phaseFactors.year3 * 100, 1)}.`,
      ],
      costAdjustments: ["No incremental cost applied inside the engine. Investment is handled at KPI level."],
      notes: ["Saved labor hours are monetized once and not reused in other labor value engines."],
      relatedWarnings: laborTraceWarnings,
    },
  );

  const rerunsAvoided = annualRuns * pct(current.averageRerunRate) * pct(improvement.reductionInReruns);
  const rerunAvoidance = toValueAllocation(
    "Rerun Avoidance",
    "rerunAvoidance",
    "hardDollar",
    rerunsAvoided * cost.costPerRerun,
    {
      id: "trace-rerun-avoidance",
      title: "Rerun Avoidance",
      formula: "Avoided rerun value = annual runs × baseline rerun rate × rerun reduction × cost per rerun.",
      sourceInputs: ["Runs per Month", "Average Rerun Rate (%)", "Reduction in Reruns (%)", "Cost per Rerun"],
      intermediateSteps: [
        `Annual runs = ${annualRuns}.`,
        `Avoided reruns = ${formatNumber(rerunsAvoided, 1)}.`,
      ],
      categoryAllocation: "Allocated fully to Hard-Dollar.",
      riskAdjustments: ["No additional capture factor applied to rerun avoidance in version 1."],
      phasingAdjustments: [
        `Year 1 realization factor = ${formatPercent(phaseFactors.year1 * 100, 1)}.`,
        `Year 2 realization factor = ${formatPercent(phaseFactors.year2 * 100, 1)}.`,
        `Year 3 realization factor = ${formatPercent(phaseFactors.year3 * 100, 1)}.`,
      ],
      costAdjustments: ["No incremental engine-level cost adjustment."],
      notes: ["This engine only values avoided reruns and does not monetize the same saved hours separately."],
      relatedWarnings: [],
    },
  );

  const failedRunsAvoided =
    annualRuns * pct(current.averageFailedRunRate) * pct(improvement.reductionInFailedRuns);
  const failedRunAvoidance = toValueAllocation(
    "Failed-Run Avoidance",
    "failedRunAvoidance",
    "hardDollar",
    failedRunsAvoided * cost.costPerFailedRun,
    {
      id: "trace-failed-run-avoidance",
      title: "Failed-Run Avoidance",
      formula:
        "Avoided failed-run value = annual runs × baseline failed-run rate × failed-run reduction × cost per failed run.",
      sourceInputs: [
        "Runs per Month",
        "Average Failed Run Rate (%)",
        "Reduction in Failed Runs (%)",
        "Cost per Failed Run",
      ],
      intermediateSteps: [
        `Avoided failed runs = ${formatNumber(failedRunsAvoided, 1)}.`,
      ],
      categoryAllocation: "Allocated fully to Hard-Dollar.",
      riskAdjustments: ["No additional capture factor applied in version 1."],
      phasingAdjustments: [
        `Year 1 realization factor = ${formatPercent(phaseFactors.year1 * 100, 1)}.`,
        `Year 2 realization factor = ${formatPercent(phaseFactors.year2 * 100, 1)}.`,
        `Year 3 realization factor = ${formatPercent(phaseFactors.year3 * 100, 1)}.`,
      ],
      costAdjustments: ["No incremental engine-level cost adjustment."],
      notes: ["The engine uses the provided failed-run cost directly."],
      relatedWarnings: [],
    },
  );

  const deviationsAvoided = current.deviationsPerYear * pct(improvement.reductionInDeviations);
  const fallbackDeviationLaborValue =
    deviationsAvoided * current.investigationHoursPerDeviation * cost.qaHourlyCost;
  const deviationDirectValue =
    cost.costPerDeviation > 0 ? deviationsAvoided * cost.costPerDeviation : fallbackDeviationLaborValue;
  const deviationReduction = toValueAllocation(
    "Deviation Reduction",
    "deviationReduction",
    "hardDollar",
    deviationDirectValue,
    {
      id: "trace-deviation-reduction",
      title: "Deviation Reduction",
      formula: "Deviation value = avoided deviations × cost per deviation, with a QA labor fallback if direct cost is absent.",
      sourceInputs: [
        "Deviations per Year",
        "Reduction in Deviations (%)",
        "Cost per Deviation",
        "Investigation Hours per Deviation",
        "Quality Assurance (QA) Hourly Cost",
      ],
      intermediateSteps: [
        `Avoided deviations = ${formatNumber(deviationsAvoided, 1)}.`,
        `Fallback QA labor value = ${formatCurrency(
          fallbackDeviationLaborValue,
          model.advancedSettings.currencyCode,
          0,
        )}.`,
      ],
      categoryAllocation: "Allocated fully to Hard-Dollar.",
      riskAdjustments: ["No additional risk factor applied beyond the scenario choice."],
      phasingAdjustments: [
        `Year 1 realization factor = ${formatPercent(phaseFactors.year1 * 100, 1)}.`,
        `Year 2 realization factor = ${formatPercent(phaseFactors.year2 * 100, 1)}.`,
        `Year 3 realization factor = ${formatPercent(phaseFactors.year3 * 100, 1)}.`,
      ],
      costAdjustments: ["No incremental engine-level cost adjustment."],
      notes: [
        cost.costPerDeviation > 0
          ? "Direct cost per deviation was used to stay conservative and avoid adding QA labor twice."
          : "QA investigation labor was used because direct deviation cost was not provided.",
      ],
      relatedWarnings: [],
    },
  );

  const accelerationWeeksSaved =
    org.activeProgramsPerYear *
    current.campaignDurationWeeks *
    pct(improvement.reductionInCampaignDuration);
  const cycleTimeValue =
    accelerationWeeksSaved * cost.valuePerWeekOfAcceleration * riskMultiplier;
  const accelerationCategory =
    risk.accelerationValueCategory === "hard-dollar"
      ? "hardDollar"
      : risk.accelerationValueCategory === "capacity"
        ? "capacity"
        : "strategic";
  const cycleTimeAcceleration = toValueAllocation(
    "Cycle-Time Acceleration",
    "cycleTimeAcceleration",
    accelerationCategory,
    cycleTimeValue,
    {
      id: "trace-cycle-time-acceleration",
      title: "Cycle-Time Acceleration",
      formula:
        "Acceleration value = active programs × campaign duration × reduction in campaign duration × value per week × capture factor × confidence factor.",
      sourceInputs: [
        "Active Programs per Year",
        "Campaign Duration (Weeks)",
        "Reduction in Campaign Duration (%)",
        "Value per Week of Acceleration",
        "Capture Factor (%)",
        "Confidence Factor (%)",
        "Acceleration Value Category",
      ],
      intermediateSteps: [
        `Weeks saved before risk adjustment = ${formatNumber(accelerationWeeksSaved, 1)}.`,
        `Risk multiplier = ${formatPercent(riskMultiplier * 100, 1)}.`,
      ],
      categoryAllocation: `Allocated to ${risk.accelerationValueCategory}.`,
      riskAdjustments: [
        `Capture factor = ${formatPercent(risk.captureFactor)}.`,
        `Confidence factor = ${formatPercent(risk.confidenceFactor)}.`,
      ],
      phasingAdjustments: [
        `Year 1 realization factor = ${formatPercent(phaseFactors.year1 * 100, 1)}.`,
        `Year 2 realization factor = ${formatPercent(phaseFactors.year2 * 100, 1)}.`,
        `Year 3 realization factor = ${formatPercent(phaseFactors.year3 * 100, 1)}.`,
      ],
      costAdjustments: ["No engine-level cost. Investment is recognized separately."],
      notes: [
        "Decision-lag reduction is tracked separately for transparency and is not independently monetized in version 1.",
      ],
      relatedWarnings: [],
    },
  );

  const transferImprovementHoursSaved =
    org.transferEventsPerYear *
    current.transferPackagePreparationHours *
    pct(improvement.reductionInTransferPreparation);
  const transferImprovementValue = transferImprovementHoursSaved * cost.engineerHourlyCost;
  const transferImprovement = toSplitAllocation(
    "transferImprovement",
    "Transfer Improvement",
    {
      hardDollar: transferImprovementValue * laborHardShare,
      capacity: transferImprovementValue * laborCapacityShare,
      strategic: 0,
    },
    {
      id: "trace-transfer-improvement",
      title: "Transfer Improvement",
      formula:
        "Transfer improvement value = transfer events × transfer package preparation hours × transfer preparation reduction × engineer hourly cost.",
      sourceInputs: [
        "Transfer Events per Year",
        "Transfer Package Preparation Hours",
        "Reduction in Transfer Preparation (%)",
        "Engineer Hourly Cost",
        "Labor Treatment Mode",
      ],
      intermediateSteps: [
        `Transfer preparation hours saved = ${formatNumber(transferImprovementHoursSaved, 1)}.`,
      ],
      categoryAllocation:
        risk.laborTreatmentMode === "hard_savings"
          ? "Allocated fully to Hard-Dollar."
          : risk.laborTreatmentMode === "redeployed_capacity"
            ? "Allocated fully to Capacity."
            : `Allocated using the mixed labor split of ${formatPercent(laborHardShare * 100)} / ${formatPercent(
                laborCapacityShare * 100,
              )}.`,
      riskAdjustments: ["No additional capture factor applied to the labor-based transfer engine."],
      phasingAdjustments: [
        `Year 1 realization factor = ${formatPercent(phaseFactors.year1 * 100, 1)}.`,
        `Year 2 realization factor = ${formatPercent(phaseFactors.year2 * 100, 1)}.`,
        `Year 3 realization factor = ${formatPercent(phaseFactors.year3 * 100, 1)}.`,
      ],
      costAdjustments: ["No engine-level cost adjustment."],
      notes: ["Transfer preparation hours are treated as labor value and follow the selected labor treatment mode."],
      relatedWarnings: [],
    },
  );

  const transferDelayAvoidanceValue =
    model.advancedSettings.enableTransferDelayAvoidance
      ? org.transferEventsPerYear *
        pct(improvement.reductionInTransferDelayRisk) *
        cost.costPerTransferDelayEvent *
        riskMultiplier
      : 0;
  const transferDelayAvoidance = toValueAllocation(
    "Transfer Delay Avoidance",
    "transferDelayAvoidance",
    "hardDollar",
    transferDelayAvoidanceValue,
    {
      id: "trace-transfer-delay-avoidance",
      title: "Transfer Delay Avoidance",
      formula:
        "Transfer delay avoidance = transfer events × transfer delay risk reduction × cost per transfer delay event × capture factor × confidence factor.",
      sourceInputs: [
        "Transfer Events per Year",
        "Reduction in Transfer Delay Risk (%)",
        "Cost per Transfer Delay Event",
        "Capture Factor (%)",
        "Confidence Factor (%)",
        "Enable Transfer Delay Avoidance",
      ],
      intermediateSteps: [
        `Transfer delay avoidance enabled = ${model.advancedSettings.enableTransferDelayAvoidance ? "Yes" : "No"}.`,
      ],
      categoryAllocation: "Allocated fully to Hard-Dollar when enabled.",
      riskAdjustments: [
        `Capture factor = ${formatPercent(risk.captureFactor)}.`,
        `Confidence factor = ${formatPercent(risk.confidenceFactor)}.`,
      ],
      phasingAdjustments: [
        `Year 1 realization factor = ${formatPercent(phaseFactors.year1 * 100, 1)}.`,
        `Year 2 realization factor = ${formatPercent(phaseFactors.year2 * 100, 1)}.`,
        `Year 3 realization factor = ${formatPercent(phaseFactors.year3 * 100, 1)}.`,
      ],
      costAdjustments: ["No engine-level cost adjustment."],
      notes: ["Disabled transfer delay avoidance resolves to zero and remains visible in the trace."],
      relatedWarnings: [],
    },
  );

  const onboardingHoursSaved =
    model.advancedSettings.enableOnboardingValue
      ? org.newUsersPerYear *
        current.onboardingHoursPerUser *
        pct(improvement.reductionInOnboarding)
      : 0;
  const onboardingValue = onboardingHoursSaved * blendedTechnicalHourlyRate;
  const onboardingEfficiency = toSplitAllocation(
    "onboardingEfficiency",
    "Onboarding Efficiency",
    {
      hardDollar: onboardingValue * laborHardShare,
      capacity: onboardingValue * laborCapacityShare,
      strategic: 0,
    },
    {
      id: "trace-onboarding-efficiency",
      title: "Onboarding Efficiency",
      formula:
        "Onboarding value = new users per year × onboarding hours per user × onboarding reduction × blended technical hourly rate.",
      sourceInputs: [
        "New Users per Year",
        "Onboarding Hours per User",
        "Reduction in Onboarding (%)",
        "Enable Onboarding Value",
        "Labor Treatment Mode",
      ],
      intermediateSteps: [
        `Onboarding hours saved = ${formatNumber(onboardingHoursSaved, 1)}.`,
        `Blended technical hourly rate = ${formatCurrency(
          blendedTechnicalHourlyRate,
          model.advancedSettings.currencyCode,
          0,
        )}.`,
      ],
      categoryAllocation:
        risk.laborTreatmentMode === "mixed"
          ? `Allocated using the mixed labor split of ${formatPercent(laborHardShare * 100)} / ${formatPercent(
              laborCapacityShare * 100,
            )}.`
          : risk.laborTreatmentMode === "hard_savings"
            ? "Allocated fully to Hard-Dollar."
            : "Allocated fully to Capacity.",
      riskAdjustments: ["No additional capture factor applied to this labor-based engine."],
      phasingAdjustments: [
        `Year 1 realization factor = ${formatPercent(phaseFactors.year1 * 100, 1)}.`,
        `Year 2 realization factor = ${formatPercent(phaseFactors.year2 * 100, 1)}.`,
        `Year 3 realization factor = ${formatPercent(phaseFactors.year3 * 100, 1)}.`,
      ],
      costAdjustments: ["No engine-level cost adjustment."],
      notes: ["Disabled onboarding value resolves to zero and stays visible in the trace."],
      relatedWarnings: [],
    },
  );

  const averageImprovementIntensity =
    Object.values(improvement).reduce((sum, value) => sum + value, 0) /
    Object.values(improvement).length /
    100;
  const maturityPoints =
    (org.activeProgramsPerYear +
      org.sites +
      org.vendorsPerWorkflow +
      org.instrumentsPerWorkflow / 2 +
      org.transferEventsPerYear) *
    averageImprovementIntensity;
  const strategicProxyValue =
    model.advancedSettings.enableStrategicProxyValues
      ? maturityPoints *
        model.advancedSettings.strategicProxyPerMaturityPoint *
        pct(risk.confidenceFactor) *
        0.5
      : 0;
  const strategicProxy = toValueAllocation(
    "Strategic Proxy",
    "strategicProxy",
    "strategic",
    strategicProxyValue,
    {
      id: "trace-strategic-proxy",
      title: "Strategic Proxy",
      formula:
        "Strategic proxy = maturity points × strategic proxy per maturity point × confidence factor × 0.5 proxy discount.",
      sourceInputs: [
        "Enable Strategic Proxy Values",
        "Strategic Proxy per Maturity Point",
        "Confidence Factor (%)",
        "Active Programs per Year",
        "Sites",
        "Vendors per Workflow",
        "Instruments per Workflow",
        "Transfer Events per Year",
      ],
      intermediateSteps: [
        `Average improvement intensity = ${formatPercent(averageImprovementIntensity * 100, 1)}.`,
        `Maturity points = ${formatNumber(maturityPoints, 1)}.`,
      ],
      categoryAllocation: "Allocated fully to Strategic and kept separate by default.",
      riskAdjustments: [
        `Confidence factor = ${formatPercent(risk.confidenceFactor)}.`,
        "Proxy discount = 50% to keep proxy logic conservative.",
      ],
      phasingAdjustments: [
        `Year 1 realization factor = ${formatPercent(phaseFactors.year1 * 100, 1)}.`,
        `Year 2 realization factor = ${formatPercent(phaseFactors.year2 * 100, 1)}.`,
        `Year 3 realization factor = ${formatPercent(phaseFactors.year3 * 100, 1)}.`,
      ],
      costAdjustments: ["No engine-level cost adjustment."],
      notes: [
        "This engine is a proxy construct and should not be merged into hard-dollar or capacity value without explicit user action outside version 1.",
      ],
      relatedWarnings: model.advancedSettings.enableStrategicProxyValues
        ? ["Strategic proxy is active and should be communicated as a proxy-dependent value stream."]
        : [],
    },
  );

  const engineResults = [
    laborEfficiency,
    rerunAvoidance,
    failedRunAvoidance,
    deviationReduction,
    cycleTimeAcceleration,
    transferImprovement,
    transferDelayAvoidance,
    onboardingEfficiency,
    strategicProxy,
  ];

  const annualHardDollarValue = engineResults.reduce((sum, engine) => sum + engine.hardDollar, 0);
  const annualCapacityValue = engineResults.reduce((sum, engine) => sum + engine.capacity, 0);
  const annualStrategicValue = engineResults.reduce((sum, engine) => sum + engine.strategic, 0);
  const totalOneTimeInvestment =
    cost.oneTimeImplementationCost +
    cost.validationCost +
    cost.internalProjectHours * cost.internalProjectHourlyCost +
    cost.initialTrainingHours * cost.trainingHourlyCost;
  const annualRecurringCost = cost.annualSoftwareCost + cost.annualSupportCost;
  const metrics = buildFinancialMetrics(
    annualHardDollarValue,
    annualCapacityValue,
    annualStrategicValue,
    annualRecurringCost,
    totalOneTimeInvestment,
    cost.discountRate,
    phaseFactors,
  );

  const derivedRows = buildDerivedRows(
    model,
    scenarioId,
    annualRuns,
    blendedTechnicalHourlyRate,
    maturityPoints,
    metrics,
  );
  const assumptionRegister = buildAssumptionRows(model, scenarioId, provenance, derivedRows);
  const missingJustifications = buildJustificationRequirements(
    scenarioId,
    model.scenarioJustifications[scenarioId],
    model,
  );
  const { readinessStatus, modelRisk } = buildRiskAndReadiness({
    scenarioId,
    model,
    engineResults,
    metrics,
    provenance,
    missingJustifications,
  });
  const paybackDescriptor = getPaybackDescriptor(metrics.paybackPeriodMonths);

  const kpiTrace: FormulaTraceEntry[] = [
    {
      id: "trace-total-investment",
      title: "Total Investment",
      formula:
        "Total investment = one-time implementation cost + validation cost + internal project hours × internal project hourly cost + initial training hours × training hourly cost + 3 × annual recurring cost.",
      sourceInputs: [
        "One-Time Implementation Cost",
        "Validation Cost",
        "Internal Project Hours",
        "Internal Project Hourly Cost",
        "Initial Training Hours",
        "Training Hourly Cost",
        "Annual Software Cost",
        "Annual Support Cost",
      ],
      intermediateSteps: [
        `One-time investment = ${formatCurrency(
          totalOneTimeInvestment,
          model.advancedSettings.currencyCode,
          0,
        )}.`,
        `Annual recurring cost = ${formatCurrency(
          annualRecurringCost,
          model.advancedSettings.currencyCode,
          0,
        )}.`,
      ],
      categoryAllocation: "Investment only.",
      riskAdjustments: ["None."],
      phasingAdjustments: ["Recurring cost assumed in each of the three modeled years."],
      costAdjustments: ["Included directly in the KPI."],
      notes: ["Total investment uses the full modeled three-year recurring cost burden."],
      relatedWarnings: [],
    },
    {
      id: "trace-three-year-roi",
      title: "3-Year ROI",
      formula: "3-Year ROI = 3-Year Net Benefit ÷ Total Investment.",
      sourceInputs: ["3-Year Net Benefit", "Total Investment"],
      intermediateSteps: [
        `3-Year Net Benefit = ${formatCurrency(
          metrics.threeYearNetBenefit,
          model.advancedSettings.currencyCode,
          0,
        )}.`,
        `Total Investment = ${formatCurrency(
          metrics.totalInvestment,
          model.advancedSettings.currencyCode,
          0,
        )}.`,
      ],
      categoryAllocation: "All value categories remain visible in the numerator and are not collapsed elsewhere.",
      riskAdjustments: ["Indirectly reflects capture and confidence through the underlying engines."],
      phasingAdjustments: ["Uses phased year-one realization and annual recurring cost over the modeled horizon."],
      costAdjustments: ["Subtracts total investment across the three-year horizon."],
      notes: ["ROI is presented as a ratio and can be negative when modeled cost exceeds phased benefit."],
      relatedWarnings: [],
    },
    {
      id: "trace-payback-period",
      title: "Payback Period",
      formula:
        "Payback period is the first month in which cumulative net benefit exceeds the one-time investment and recurring cost burden.",
      sourceInputs: ["Year 1 Benefit", "Year 2 Benefit", "Year 3 Benefit", "Annual Recurring Cost", "One-Time Investment"],
      intermediateSteps: [
        `Year 1 net benefit = ${formatCurrency(
          metrics.year1NetBenefit,
          model.advancedSettings.currencyCode,
          0,
        )}.`,
        `Year 2 net benefit = ${formatCurrency(
          metrics.year2NetBenefit,
          model.advancedSettings.currencyCode,
          0,
        )}.`,
        `Year 3 net benefit = ${formatCurrency(
          metrics.year3NetBenefit,
          model.advancedSettings.currencyCode,
          0,
        )}.`,
      ],
      categoryAllocation: "Uses the full value mix; strategic value stays visible as a separate category elsewhere.",
      riskAdjustments: ["Indirectly reflects risk-adjusted acceleration and delay-avoidance engines."],
      phasingAdjustments: ["Interpolated within the year when cumulative net benefit crosses zero."],
      costAdjustments: ["Recognizes one-time investment upfront and recurring cost annually."],
      notes: ["If payback is not reached within 36 months, the KPI reports N/A in charts and narrative wording."],
      relatedWarnings: [],
    },
    {
      id: "trace-npv",
      title: "NPV",
      formula: "NPV = -one-time investment + discounted annual net cash flows across years 1 to 3.",
      sourceInputs: ["Discount Rate (%)", "Year 1 Benefit", "Year 2 Benefit", "Year 3 Benefit", "Annual Recurring Cost"],
      intermediateSteps: [`Discount rate = ${formatPercent(cost.discountRate)}.`],
      categoryAllocation: "Uses the full annual value mix while preserving category visibility outside the KPI.",
      riskAdjustments: ["Indirect through underlying engine outputs."],
      phasingAdjustments: ["Uses year-specific phased benefits."],
      costAdjustments: ["Subtracts recurring cost from each annual benefit before discounting."],
      notes: ["NPV is calculated on three modeled years and excludes any terminal value assumption."],
      relatedWarnings: [],
    },
    {
      id: "trace-irr",
      title: "IRR",
      formula: "IRR solves for the discount rate at which the net present value of the modeled cash flows equals zero.",
      sourceInputs: ["One-Time Investment", "Year 1 Benefit", "Year 2 Benefit", "Year 3 Benefit", "Annual Recurring Cost"],
      intermediateSteps: [
        metrics.irr === null ? "IRR could not be solved for this cash-flow profile." : `IRR = ${formatPercent(metrics.irr * 100, 1)}.`,
      ],
      categoryAllocation: "Uses the full value mix while preserving category visibility outside the KPI.",
      riskAdjustments: ["Indirect through underlying engine outputs."],
      phasingAdjustments: ["Uses phased annual cash flows."],
      costAdjustments: ["Uses annual net cash flows after recurring cost and initial one-time investment."],
      notes: ["IRR shows N/A when the cash-flow profile does not produce a valid root within the solver bounds."],
      relatedWarnings: [],
    },
  ];

  const formulaTrace = [...engineResults.map((engine) => engine.trace), ...kpiTrace];
  const narrative = buildNarrative({
    scenarioId,
    readinessStatus,
    metrics,
    engineResults,
    paybackDescriptor,
    model,
  });

  const sensitivity = includeSensitivity
    ? buildSensitivity(
        scenarioId,
        model,
        provenance,
        overrides,
        versioning,
        metrics.threeYearRoi,
      )
    : [];

  return {
    scenarioId,
    scenarioLabel: SCENARIO_LABELS[scenarioId],
    annualRuns,
    blendedTechnicalHourlyRate,
    maturityPoints,
    engineResults,
    metrics,
    formulaTrace,
    modelRisk,
    readinessStatus,
    narrative,
    assumptionRegister,
    sensitivity,
    missingJustifications,
    paybackDescriptor,
  };
};

export const calculateAllScenarios = (params: {
  model: EditableModel;
  provenance: ProvenanceMap;
  overrides: OverrideRecord[];
  versioning: VersioningState;
}) => {
  const { model, provenance, overrides, versioning } = params;

  const scenarioResults = Object.fromEntries(
    SCENARIO_IDS.map((scenarioId) => [
      scenarioId,
      calculateScenarioResult({
        model,
        scenarioId,
        provenance,
        overrides,
        versioning,
      }),
    ]),
  ) as Record<ScenarioId, ScenarioResult>;

  const visibleScenarioIds = model.advancedSettings.showAggressiveScenario
    ? [...SCENARIO_IDS]
    : SCENARIO_IDS.filter((scenarioId) => scenarioId !== "aggressive");

  return {
    generatedAt: new Date().toISOString(),
    visibleScenarioIds,
    scenarioResults,
    assumptionsRegister: visibleScenarioIds.flatMap(
      (scenarioId) => scenarioResults[scenarioId].assumptionRegister,
    ),
  } satisfies CalculationBundle;
};

export const getScenarioComparisonRows = (bundle: CalculationBundle) =>
  bundle.visibleScenarioIds.map((scenarioId) => {
    const scenario = bundle.scenarioResults[scenarioId];
    return {
      scenario: scenario.scenarioLabel,
      annualHardDollarValue: scenario.metrics.annualHardDollarValue,
      annualCapacityValue: scenario.metrics.annualCapacityValue,
      annualStrategicValue: scenario.metrics.annualStrategicValue,
      threeYearRoi: scenario.metrics.threeYearRoi,
      paybackPeriodMonths: scenario.metrics.paybackPeriodMonths,
      readinessStatus: scenario.readinessStatus,
    };
  });

export const getAnnualValueComposition = (scenario: ScenarioResult) => [
  {
    category: "Hard-Dollar",
    value: scenario.metrics.annualHardDollarValue,
  },
  {
    category: "Capacity",
    value: scenario.metrics.annualCapacityValue,
  },
  {
    category: "Strategic",
    value: scenario.metrics.annualStrategicValue,
  },
];

export const getBridgeRows = (scenario: ScenarioResult) => [
  { label: "Year 1 Benefit", value: scenario.metrics.year1Benefit },
  { label: "Year 1 Net Benefit", value: scenario.metrics.year1NetBenefit },
  { label: "Year 2 Net Benefit", value: scenario.metrics.year2NetBenefit },
  { label: "Year 3 Net Benefit", value: scenario.metrics.year3NetBenefit },
  { label: "3-Year Net Benefit", value: scenario.metrics.threeYearNetBenefit },
];

export const getFormulaTracePreview = (scenario: ScenarioResult) => {
  return scenario.formulaTrace.slice(0, 6);
};
