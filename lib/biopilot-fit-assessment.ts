import { z } from "zod";

export const BIOPILOT_MODEL_VERSION = "2.1.0";

export const BIOPLAN_2023_BATCH_FAILURE_BENCHMARK = {
  id: "bioplan-2023-batch-failure",
  label: "BioPlan 2023 Batch-Failure Benchmark",
  shortLabel: "BioPlan 2023 Survey",
  weeksSinceLastBatchFailure: 64,
  failureCauseExposureScore: 35,
  context:
    "BioPlan 2023 reported an industry average of roughly 64 weeks between batch failures and highlighted equipment failure, contamination, operator error, material failure, specification misses, and cross-product contamination as tracked failure causes.",
} as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const BIOPILOT_TIER_IDS = [
  "basic",
  "professional",
  "enterprise",
  "custom",
];

export type BioPilotTierId = (typeof BIOPILOT_TIER_IDS)[number];

export const BIOPILOT_SUBSCRIPTION_TERM_YEARS = 3;

export interface BioPilotTier {
  id: BioPilotTierId;
  label: string;
  monthlySubscription: number;
  summary: string;
  limits: {
    bioreactors: number;
    recipesRunning: number;
    recipeStorage: number;
    patEquipment: number;
    users: number;
  };
}

export const BIOPILOT_TIERS: BioPilotTier[] = [
  {
    id: "basic",
    label: "Basic",
    monthlySubscription: 3000,
    summary: "Focused first deployment for one online bioreactor and one active recipe.",
    limits: {
      bioreactors: 1,
      recipesRunning: 1,
      recipeStorage: 5,
      patEquipment: 5,
      users: 2,
    },
  },
  {
    id: "professional",
    label: "Professional",
    monthlySubscription: 9000,
    summary: "Multi-reactor scope for a team standardizing several active recipes.",
    limits: {
      bioreactors: 4,
      recipesRunning: 4,
      recipeStorage: 20,
      patEquipment: 10,
      users: 8,
    },
  },
  {
    id: "enterprise",
    label: "Enterprise",
    monthlySubscription: 15000,
    summary: "Network-ready scope for larger connected programs and PAT coverage.",
    limits: {
      bioreactors: 7,
      recipesRunning: 7,
      recipeStorage: 20,
      patEquipment: 20,
      users: 8,
    },
  },
  {
    id: "custom",
    label: "Custom Scope",
    monthlySubscription: 9000,
    summary: "Use a confirmed monthly subscription for a scope outside the standard tiers.",
    limits: {
      bioreactors: 20,
      recipesRunning: 20,
      recipeStorage: 100,
      patEquipment: 60,
      users: 50,
    },
  },
];

export const BIOPILOT_TIER_MAP = Object.fromEntries(
  BIOPILOT_TIERS.map((tier) => [tier.id, tier]),
) as Record<BioPilotTierId, BioPilotTier>;

export const PROCESS_PROFILE_IDS = [
  "mab-cho",
  "biosimilar-antibody",
  "recombinant-protein",
  "microbial-fermentation",
  "vaccines",
  "viral-vector",
  "plasmid-dna",
  "mrna-rna",
] as const;

export type ProcessProfileId = (typeof PROCESS_PROFILE_IDS)[number];

export const LIFECYCLE_STAGE_IDS = [
  "process-development",
  "late-development",
  "clinical-manufacturing",
  "commercial-scale",
] as const;

export type LifecycleStageId = (typeof LIFECYCLE_STAGE_IDS)[number];

export interface ProcessProfile {
  id: ProcessProfileId;
  label: string;
  modality: string;
  summary: string;
  bioPilotFit: string;
  base: {
    manualHoursPerRun: number;
    reviewHours: number;
    decisionLagHours: number;
    transferPackageHours: number;
    runSuccessRate: number;
    deviationRate: number;
  };
  focusAreas: string[];
  instrumentStack: Array<{
    category: string;
    examples: string;
    whyItMatters: string;
  }>;
}

export interface LifecycleStage {
  id: LifecycleStageId;
  label: string;
  summary: string;
  complexityMultiplier: number;
  onboardingBaselineDays: number;
  annualProgramInvestment: number;
}

export interface BioPilotAssessmentInputs {
  processProfileId: ProcessProfileId;
  lifecycleStageId: LifecycleStageId;
  activePrograms: number;
  runsPerYear: number;
  sites: number;
  transferEventsPerYear: number;
  vendorPlatforms: number;
  blendedHourlyRate: number;
  costPerFailedRun: number;
  valuePerDayAcceleration: number;
  bioPilotTierId: BioPilotTierId;
  bioPilotBioreactors: number;
  bioPilotRecipesRunning: number;
  bioPilotRecipeStorage: number;
  bioPilotPatEquipment: number;
  bioPilotUsers: number;
  customMonthlySubscription: number;
  customerEngineeringHours: number;
  customerEngineeringHourlyRate: number;
  additionalServicesInvestment: number;
  plannedProgramInvestment: number;
  bioreactorConnectivity: number;
  sensorCoverage: number;
  patCoverage: number;
  analyzerConnectivity: number;
  downstreamVisibility: number;
  dataContextualization: number;
  sopAutomation: number;
  reviewByException: number;
  crossSiteCollaboration: number;
  manualTranscriptionShare: number;
  offlineDataDelayHours: number;
  batchReviewHours: number;
  deviationInvestigationHours: number;
  weeksSinceLastBatchFailure: number;
  failureCauseExposureScore: number;
  failedRunRecoveryHours: number;
  techTransferPackageHours: number;
  onboardingDays: number;
}

export type BioPilotAdjustableInputKey = Exclude<
  keyof BioPilotAssessmentInputs,
  "processProfileId" | "lifecycleStageId"
>;

export type BioPilotNumericInputKey = Exclude<
  BioPilotAdjustableInputKey,
  "bioPilotTierId"
>;

export const BIOPILOT_INPUT_SECTION_IDS = [
  "operating-frame",
  "solution-investment",
  "connected-stack",
  "manual-burden",
  "batch-failure",
] as const;

export type BioPilotInputSectionId = (typeof BIOPILOT_INPUT_SECTION_IDS)[number];

export type AssessmentInputSource = "default" | "sample" | "survey" | "user";

export interface AssessmentEvidenceMeta {
  completedSectionIds?: BioPilotInputSectionId[];
  inputSources?: Partial<Record<BioPilotAdjustableInputKey, AssessmentInputSource>>;
  usedSampleData?: boolean;
  userConfirmedAt?: string | null;
}

export interface AssessmentLane {
  id: string;
  label: string;
  currentScore: number;
  enabledScore: number;
  summary: string;
  leverage: string;
}

export interface BioPilotPlay {
  id: string;
  title: string;
  summary: string;
  whyBioPilot: string;
  relevanceScore: number;
}

export interface BuyingSignal {
  id: string;
  title: string;
  severity: "Critical" | "Material" | "Emerging";
  summary: string;
  action: string;
}

export interface ValueLever {
  id: string;
  label: string;
  annualValue: number;
  summary: string;
}

export interface AssessmentStateSnapshot {
  manualHoursPerRun: number;
  reviewHours: number;
  decisionLagHours: number;
  runSuccessRate: number;
  failureRecoveryHours: number;
  transferPackageHours: number;
  onboardingDays: number;
}

export interface DigitalPlantMaturityDomain {
  id: string;
  label: string;
  score: number;
  currentState: string;
  targetState: string;
  rationale: string;
}

export interface DigitalPlantMaturityAssessment {
  score: number;
  level: number;
  label: string;
  summary: string;
  domains: DigitalPlantMaturityDomain[];
  nextStep: string;
}

export interface EvidenceConfidenceAssessment {
  score: number;
  band: "Low" | "Directional" | "High";
  completedSections: number;
  totalSections: number;
  userEnteredFields: number;
  surveyFields: number;
  sampleFields: number;
  defaultFields: number;
  warnings: string[];
  summary: string;
}

export interface AssumptionTransparencyItem {
  label: string;
  basis: string;
  formula: string;
  sensitivity: string;
}

export interface AssumptionTransparency {
  summary: string;
  items: AssumptionTransparencyItem[];
  planningCaveat: string;
}

export interface SalesFollowUpBrief {
  priority: string;
  discoveryFocus: string[];
  recommendedAction: string;
  proposalUse: string;
}

export interface BioPilotInvestmentBasis {
  tierId: BioPilotTierId;
  tierLabel: string;
  monthlySubscription: number;
  annualSubscription: number;
  subscriptionTermYears: number;
  threeYearSubscription: number;
  includedEngineeringLabel: string;
  includedMaintenanceLabel: string;
  bioreactors: number;
  recipesRunning: number;
  recipeStorage: number;
  patEquipment: number;
  users: number;
  customerEngineeringHours: number;
  customerEngineeringHourlyRate: number;
  customerEngineeringInvestment: number;
  additionalServicesInvestment: number;
  firstYearInvestment: number;
  totalThreeYearInvestment: number;
}

export interface BioPilotInvestmentSummary extends BioPilotInvestmentBasis {
  yearOneValue: number;
  yearTwoValue: number;
  yearThreeValue: number;
  threeYearValue: number;
  netThreeYearBenefit: number;
  paybackMonths: number;
}

export interface BioPilotAssessmentResults {
  modelVersion: string;
  profile: ProcessProfile;
  stage: LifecycleStage;
  digitalCoverage: number;
  manualBurdenIndex: number;
  complexityScore: number;
  fitScore: number;
  fitBand: string;
  currentState: AssessmentStateSnapshot;
  bioPilotState: AssessmentStateSnapshot;
  annualRecoveredHours: number;
  avoidedFailedRuns: number;
  annualValuePotential: number;
  threeYearNetBenefit: number;
  threeYearRoi: number;
  paybackMonths: number;
  investment: BioPilotInvestmentSummary;
  annualDecisionDaysRecovered: number;
  laneScores: AssessmentLane[];
  plays: BioPilotPlay[];
  buyingSignals: BuyingSignal[];
  valueLevers: ValueLever[];
  digitalPlantMaturity: DigitalPlantMaturityAssessment;
  evidenceConfidence: EvidenceConfidenceAssessment;
  assumptionTransparency: AssumptionTransparency;
  salesFollowUp: SalesFollowUpBrief;
  executiveSummary: string;
  nextStep: string;
}

const normalizeTierId = (tierId: unknown): BioPilotTierId =>
  BIOPILOT_TIER_IDS.includes(tierId as BioPilotTierId)
    ? (tierId as BioPilotTierId)
    : "professional";

export function inferBioPilotTierId(
  inputs: Pick<
    BioPilotAssessmentInputs,
    | "bioPilotBioreactors"
    | "bioPilotRecipesRunning"
    | "bioPilotRecipeStorage"
    | "bioPilotPatEquipment"
    | "bioPilotUsers"
  >,
): BioPilotTierId {
  const enterprise = BIOPILOT_TIER_MAP.enterprise.limits;
  const professional = BIOPILOT_TIER_MAP.professional.limits;
  const basic = BIOPILOT_TIER_MAP.basic.limits;

  if (
    inputs.bioPilotBioreactors > enterprise.bioreactors ||
    inputs.bioPilotRecipesRunning > enterprise.recipesRunning ||
    inputs.bioPilotRecipeStorage > enterprise.recipeStorage ||
    inputs.bioPilotPatEquipment > enterprise.patEquipment ||
    inputs.bioPilotUsers > enterprise.users
  ) {
    return "custom";
  }

  if (
    inputs.bioPilotBioreactors > professional.bioreactors ||
    inputs.bioPilotRecipesRunning > professional.recipesRunning ||
    inputs.bioPilotRecipeStorage > professional.recipeStorage ||
    inputs.bioPilotPatEquipment > professional.patEquipment ||
    inputs.bioPilotUsers > professional.users
  ) {
    return "enterprise";
  }

  if (
    inputs.bioPilotBioreactors > basic.bioreactors ||
    inputs.bioPilotRecipesRunning > basic.recipesRunning ||
    inputs.bioPilotRecipeStorage > basic.recipeStorage ||
    inputs.bioPilotPatEquipment > basic.patEquipment ||
    inputs.bioPilotUsers > basic.users
  ) {
    return "professional";
  }

  return "basic";
}

export function calculateBioPilotInvestmentBasis(
  inputs: BioPilotAssessmentInputs,
): BioPilotInvestmentBasis {
  const tierId = normalizeTierId(inputs.bioPilotTierId);
  const tier = BIOPILOT_TIER_MAP[tierId];
  const monthlySubscription =
    tierId === "custom"
      ? clamp(inputs.customMonthlySubscription, 1000, 50000)
      : tier.monthlySubscription;
  const annualSubscription = monthlySubscription * 12;
  const threeYearSubscription = annualSubscription * BIOPILOT_SUBSCRIPTION_TERM_YEARS;
  const customerEngineeringHours = clamp(inputs.customerEngineeringHours, 0, 1000);
  const customerEngineeringHourlyRate = clamp(inputs.customerEngineeringHourlyRate, 80, 350);
  const customerEngineeringInvestment =
    customerEngineeringHours * customerEngineeringHourlyRate;
  const additionalServicesInvestment = clamp(inputs.additionalServicesInvestment, 0, 500000);

  return {
    tierId,
    tierLabel: tier.label,
    monthlySubscription,
    annualSubscription,
    subscriptionTermYears: BIOPILOT_SUBSCRIPTION_TERM_YEARS,
    threeYearSubscription,
    includedEngineeringLabel: "Basic engineering included",
    includedMaintenanceLabel: "Maintenance included",
    bioreactors: Math.round(clamp(inputs.bioPilotBioreactors, 1, 20)),
    recipesRunning: Math.round(clamp(inputs.bioPilotRecipesRunning, 1, 20)),
    recipeStorage: Math.round(clamp(inputs.bioPilotRecipeStorage, 1, 100)),
    patEquipment: Math.round(clamp(inputs.bioPilotPatEquipment, 0, 60)),
    users: Math.round(clamp(inputs.bioPilotUsers, 1, 50)),
    customerEngineeringHours,
    customerEngineeringHourlyRate,
    customerEngineeringInvestment,
    additionalServicesInvestment,
    firstYearInvestment:
      annualSubscription + customerEngineeringInvestment + additionalServicesInvestment,
    totalThreeYearInvestment:
      threeYearSubscription + customerEngineeringInvestment + additionalServicesInvestment,
  };
}

const calculatePaybackMonths = (
  annualValuePotential: number,
  investment: BioPilotInvestmentBasis,
) => {
  if (annualValuePotential <= 0) {
    return 60;
  }

  let cumulativeCashFlow =
    -investment.customerEngineeringInvestment - investment.additionalServicesInvestment;

  for (let month = 1; month <= 60; month += 1) {
    if (month <= 36 && (month - 1) % 12 === 0) {
      cumulativeCashFlow -= investment.annualSubscription;
    }

    const year = Math.ceil(month / 12);
    const ramp =
      year <= 1
        ? 0.6
        : year === 2
          ? 0.9
          : 1;
    cumulativeCashFlow += (annualValuePotential * ramp) / 12;

    if (cumulativeCashFlow >= 0) {
      return month;
    }
  }

  return 60;
};

const boundedNumber = (min: number, max: number) =>
  z.number().finite().min(min).max(max);

export const bioPilotAssessmentInputsSchema = z.object({
  processProfileId: z.enum(PROCESS_PROFILE_IDS),
  lifecycleStageId: z.enum(LIFECYCLE_STAGE_IDS),
  activePrograms: boundedNumber(1, 18),
  runsPerYear: boundedNumber(1, 220),
  sites: boundedNumber(1, 8),
  transferEventsPerYear: boundedNumber(0, 12),
  vendorPlatforms: boundedNumber(1, 8),
  blendedHourlyRate: boundedNumber(80, 260),
  costPerFailedRun: boundedNumber(15000, 250000),
  valuePerDayAcceleration: boundedNumber(10000, 150000),
  bioPilotTierId: z.enum(BIOPILOT_TIER_IDS),
  bioPilotBioreactors: boundedNumber(1, 20),
  bioPilotRecipesRunning: boundedNumber(1, 20),
  bioPilotRecipeStorage: boundedNumber(1, 100),
  bioPilotPatEquipment: boundedNumber(0, 60),
  bioPilotUsers: boundedNumber(1, 50),
  customMonthlySubscription: boundedNumber(1000, 50000),
  customerEngineeringHours: boundedNumber(0, 1000),
  customerEngineeringHourlyRate: boundedNumber(80, 350),
  additionalServicesInvestment: boundedNumber(0, 500000),
  plannedProgramInvestment: boundedNumber(0, 2000000),
  bioreactorConnectivity: boundedNumber(0, 100),
  sensorCoverage: boundedNumber(0, 100),
  patCoverage: boundedNumber(0, 100),
  analyzerConnectivity: boundedNumber(0, 100),
  downstreamVisibility: boundedNumber(0, 100),
  dataContextualization: boundedNumber(0, 100),
  sopAutomation: boundedNumber(0, 100),
  reviewByException: boundedNumber(0, 100),
  crossSiteCollaboration: boundedNumber(0, 100),
  manualTranscriptionShare: boundedNumber(0, 100),
  offlineDataDelayHours: boundedNumber(1, 36),
  batchReviewHours: boundedNumber(2, 48),
  deviationInvestigationHours: boundedNumber(2, 48),
  weeksSinceLastBatchFailure: boundedNumber(0, 156),
  failureCauseExposureScore: boundedNumber(0, 100),
  failedRunRecoveryHours: boundedNumber(0, 240),
  techTransferPackageHours: boundedNumber(8, 160),
  onboardingDays: boundedNumber(3, 120),
});

export const assessmentInputSourceSchema = z.enum(["default", "sample", "survey", "user"]);

export const assessmentEvidenceMetaSchema = z.object({
  completedSectionIds: z.array(z.enum(BIOPILOT_INPUT_SECTION_IDS)).optional(),
  inputSources: z.record(z.string(), assessmentInputSourceSchema).optional(),
  usedSampleData: z.boolean().optional(),
  userConfirmedAt: z.string().datetime().nullable().optional(),
});

export const PROCESS_PROFILES: ProcessProfile[] = [
  {
    id: "mab-cho",
    label: "mAb / CHO Platform",
    modality: "Monoclonal antibody development and manufacturing with fed-batch or perfusion-adjacent control needs.",
    summary:
      "Best for teams that need tighter bioreactor visibility, cleaner review packages, stronger process understanding, and faster scale or site handoffs.",
    bioPilotFit:
      "BioPilot is strongest here when the team is still stitching together bioreactors, PAT, analyzers, and review evidence across multiple vendors.",
    base: {
      manualHoursPerRun: 18,
      reviewHours: 20,
      decisionLagHours: 16,
      transferPackageHours: 80,
      runSuccessRate: 91,
      deviationRate: 0.08,
    },
    focusAreas: [
      "Seed And Production Bioreactor Orchestration",
      "At-Line And Off-Line Analytical Context",
      "Batch Review Readiness",
      "Comparability And Tech Transfer Packages",
    ],
    instrumentStack: [
      {
        category: "Bioreactors",
        examples: "Single-use and stainless bioreactors, seed train vessels, control stations",
        whyItMatters: "Core execution layer that must stay aligned with run context and SOPs.",
      },
      {
        category: "Sensors and PAT",
        examples: "pH, DO, temperature, pressure, off-gas, capacitance, Raman, NIR",
        whyItMatters: "Turns the process from manually sampled to continuously interpreted.",
      },
      {
        category: "Analyzers and downstream",
        examples: "Bioanalyzers, cell counters, chromatography skids, UF/DF, filtration",
        whyItMatters: "Connects product quality and yield decisions back into the operating record.",
      },
    ],
  },
  {
    id: "biosimilar-antibody",
    label: "Biosimilars And Antibody Variants",
    modality: "Biosimilars, biobetters, bispecifics, and related antibody programs with high comparability and review discipline requirements.",
    summary:
      "Best for teams that need cleaner comparability packages, stronger analytical context, and more repeatable operating evidence across sites or lots.",
    bioPilotFit:
      "BioPilot is valuable here when comparability, review, and handoff work are still assembled manually from multiple systems.",
    base: {
      manualHoursPerRun: 20,
      reviewHours: 22,
      decisionLagHours: 16,
      transferPackageHours: 88,
      runSuccessRate: 89,
      deviationRate: 0.09,
    },
    focusAreas: [
      "Comparability Package Assembly",
      "Analytical Consistency Across Lots",
      "Cross-Site Method And Process Alignment",
      "Change Impact Review Discipline",
    ],
    instrumentStack: [
      {
        category: "Cell culture and reactors",
        examples: "Seed train and production bioreactors, gas control, feeding systems",
        whyItMatters: "Process consistency has to be captured with enough context to defend comparability.",
      },
      {
        category: "PAT and characterization",
        examples: "Raman, capacitance, cell analysis, metabolite analyzers, chromatography evidence",
        whyItMatters: "The analytical story has to line up cleanly with what happened in the process.",
      },
      {
        category: "Review and comparability systems",
        examples: "Historian, review dashboards, evidence packages, SOP execution records",
        whyItMatters: "This is where manual evidence assembly can quietly become the bottleneck.",
      },
    ],
  },
  {
    id: "recombinant-protein",
    label: "Recombinant Proteins And Enzymes",
    modality: "CHO, HEK, insect, or microbial expression workflows for recombinant proteins, enzymes, and fusion proteins.",
    summary:
      "Best for teams that need faster run interpretation, stronger downstream visibility, and more reliable transfer packages across development and manufacturing.",
    bioPilotFit:
      "BioPilot fits well when reactor, purification, and analytical context are visible separately but not usable together.",
    base: {
      manualHoursPerRun: 17,
      reviewHours: 18,
      decisionLagHours: 12,
      transferPackageHours: 66,
      runSuccessRate: 89,
      deviationRate: 0.08,
    },
    focusAreas: [
      "Upstream To Downstream Visibility",
      "Faster Interpretation Of Analytical Evidence",
      "Process Consistency Across Campaigns",
      "Scale-Up And Site Handoff Readiness",
    ],
    instrumentStack: [
      {
        category: "Bioreactors and process control",
        examples: "Single-use or stainless bioreactors, feed systems, gas and agitation control",
        whyItMatters: "Process conditions and interventions need to be visible in one operating story.",
      },
      {
        category: "Downstream and analytics",
        examples: "Chromatography skids, UF/DF, filtration, protein analysis, bioanalyzers",
        whyItMatters: "Yield and purity decisions depend on linking process and analytical data cleanly.",
      },
      {
        category: "Digital coordination",
        examples: "Historian, batch context, review workflows, transfer-ready documentation",
        whyItMatters: "This is where BioPilot can reduce manual coordination and review assembly.",
      },
    ],
  },
  {
    id: "microbial-fermentation",
    label: "Microbial Fermentation",
    modality: "Bacterial or yeast fermentation with high run cadence and strong need for repeatability and fast interventions.",
    summary:
      "Best for teams where rapid metabolic shifts, feeding control, and repeated run review are still slowed by manual data handling.",
    bioPilotFit:
      "BioPilot fits well when fermentation data, analyzer results, and operator actions are split between local systems and spreadsheet handoffs.",
    base: {
      manualHoursPerRun: 16,
      reviewHours: 14,
      decisionLagHours: 10,
      transferPackageHours: 56,
      runSuccessRate: 88,
      deviationRate: 0.09,
    },
    focusAreas: [
      "High-Frequency Run Monitoring",
      "Feed Strategy And Intervention Timing",
      "Rapid Review Of Analyzer Evidence",
      "Operator Consistency Across Shifts",
    ],
    instrumentStack: [
      {
        category: "Bioreactors and controls",
        examples: "Fermenters, gas-flow control, feed skids, agitation and pressure control",
        whyItMatters: "Operational changes are fast, so the data path has to be equally fast.",
      },
      {
        category: "Sensors and analyzers",
        examples: "pH, DO, off-gas, foam, biomass probes, glucose/lactate analyzers",
        whyItMatters: "The team needs immediate context to prevent drift or lost runs.",
      },
      {
        category: "Data systems",
        examples: "Historian, local SCADA, lab analyzers, batch review workspace",
        whyItMatters: "Value is lost when signals are visible in one system but not usable in the decision flow.",
      },
    ],
  },
  {
    id: "vaccines",
    label: "Vaccines",
    modality: "Protein subunit, inactivated, live-attenuated, or related vaccine workflows with campaign and release pressure.",
    summary:
      "Best for teams that need better campaign coordination, stronger release readiness, and cleaner alignment between upstream, downstream, and quality evidence.",
    bioPilotFit:
      "BioPilot is helpful here when vaccine process data, quality evidence, and review workflows still sit across disconnected systems.",
    base: {
      manualHoursPerRun: 22,
      reviewHours: 22,
      decisionLagHours: 14,
      transferPackageHours: 74,
      runSuccessRate: 87,
      deviationRate: 0.1,
    },
    focusAreas: [
      "Campaign And Release Coordination",
      "Batch Review And Deviation Readiness",
      "Cross-Functional Evidence Visibility",
      "Scale And Site Consistency",
    ],
    instrumentStack: [
      {
        category: "Upstream and process equipment",
        examples: "Bioreactors, fermenters, media prep, clarification and harvest systems",
        whyItMatters: "Campaign rhythm depends on connecting process status to the wider team quickly.",
      },
      {
        category: "Analytics and quality evidence",
        examples: "At-line analyzers, QC data streams, downstream purification, formulation evidence",
        whyItMatters: "Release readiness slows down when evidence stays fragmented.",
      },
      {
        category: "Digital review layer",
        examples: "Contextualized records, exception workflows, handoff dashboards, SOP guidance",
        whyItMatters: "BioPilot can reduce the cost of review preparation and multi-team coordination.",
      },
    ],
  },
  {
    id: "viral-vector",
    label: "Viral Vector",
    modality: "AAV, lentiviral, or other vector processes with demanding upstream and analytics coordination.",
    summary:
      "Best for teams where process sensitivity and evidence complexity create high pressure on review, deviations, and tech transfer discipline.",
    bioPilotFit:
      "BioPilot is compelling when upstream, downstream, and analytics evidence need to be contextualized quickly for development, comparability, and manufacturing readiness.",
    base: {
      manualHoursPerRun: 24,
      reviewHours: 24,
      decisionLagHours: 18,
      transferPackageHours: 92,
      runSuccessRate: 85,
      deviationRate: 0.12,
    },
    focusAreas: [
      "Sensitive Upstream Control Windows",
      "Analytics-Heavy Decision Chains",
      "Deviation And Investigation Effort",
      "Comparability And Transfer Readiness",
    ],
    instrumentStack: [
      {
        category: "Upstream and harvest",
        examples: "Bioreactors, wave bags, depth filtration, clarification steps",
        whyItMatters: "Any visibility gap in upstream can carry into downstream yield and quality risk.",
      },
      {
        category: "Analytics",
        examples: "Cell counters, qPCR support data, metabolite analyzers, PAT where deployed",
        whyItMatters: "Analytical context is central to whether the team can act quickly and defend the process.",
      },
      {
        category: "Transfer and review systems",
        examples: "Contextualization layer, SOP automation, evidence packages, review dashboards",
        whyItMatters: "This is where BioPilot can reduce the cost of coordination and review drag.",
      },
    ],
  },
  {
    id: "plasmid-dna",
    label: "Plasmid DNA",
    modality: "Plasmid DNA fermentation, purification, and release workflows supporting gene therapy, mRNA, and nucleic-acid programs.",
    summary:
      "Best for teams that need stronger fermentation visibility, cleaner purification evidence, and more disciplined transfer packages.",
    bioPilotFit:
      "BioPilot becomes relevant when plasmid production still depends on manual reconciliation between fermentation, purification, and quality evidence.",
    base: {
      manualHoursPerRun: 18,
      reviewHours: 18,
      decisionLagHours: 12,
      transferPackageHours: 68,
      runSuccessRate: 88,
      deviationRate: 0.09,
    },
    focusAreas: [
      "Fermentation And Feed Visibility",
      "Purification And Release Evidence Alignment",
      "Template And Lot Traceability",
      "Transfer-Ready Operating History",
    ],
    instrumentStack: [
      {
        category: "Fermentation systems",
        examples: "Microbial fermenters, gas and feed control, harvest and lysis preparation",
        whyItMatters: "The operating record has to stay intact from fermentation through purification.",
      },
      {
        category: "Purification and analytics",
        examples: "Chromatography, TFF, filtration, qPCR support data, concentration and quality measurements",
        whyItMatters: "A strong digital link between process and analytical evidence reduces review effort.",
      },
      {
        category: "Data and review coordination",
        examples: "Historian, context layer, exception handling, transfer package preparation",
        whyItMatters: "This is where BioPilot can reduce manual evidence assembly.",
      },
    ],
  },
  {
    id: "mrna-rna",
    label: "mRNA And RNA Therapeutics",
    modality: "mRNA, saRNA, and related RNA workflows with template handling, IVT, purification, formulation, and release coordination.",
    summary:
      "Best for teams that need a cleaner line of sight from upstream templates and IVT through purification, formulation, and final evidence review.",
    bioPilotFit:
      "BioPilot is useful when RNA production still relies on fragmented process, analytical, and release data across several teams.",
    base: {
      manualHoursPerRun: 20,
      reviewHours: 20,
      decisionLagHours: 14,
      transferPackageHours: 72,
      runSuccessRate: 86,
      deviationRate: 0.1,
    },
    focusAreas: [
      "Template-To-Batch Context Continuity",
      "Purification And Formulation Visibility",
      "Release Readiness And Evidence Assembly",
      "Faster Process Learning Cycles",
    ],
    instrumentStack: [
      {
        category: "Template and reaction operations",
        examples: "Template prep, IVT systems, reaction controls, mixing and hold conditions",
        whyItMatters: "Small gaps in context can slow process understanding and review confidence.",
      },
      {
        category: "Purification and formulation",
        examples: "TFF, chromatography, filtration, formulation equipment, particle and quality analyzers",
        whyItMatters: "The operating history has to stay coherent through every handoff.",
      },
      {
        category: "Digital operating layer",
        examples: "Contextualized records, review workflows, guided SOPs, transfer documentation",
        whyItMatters: "BioPilot can remove manual stitching between teams and process stages.",
      },
    ],
  },
];

export const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: "process-development",
    label: "Process Development",
    summary: "Learning speed and cross-experiment comparison matter more than high-volume release.",
    complexityMultiplier: 0.9,
    onboardingBaselineDays: 12,
    annualProgramInvestment: 180000,
  },
  {
    id: "late-development",
    label: "Late Development",
    summary: "Comparability, scale-up preparation, and stronger operating discipline are increasing priorities.",
    complexityMultiplier: 1,
    onboardingBaselineDays: 14,
    annualProgramInvestment: 260000,
  },
  {
    id: "clinical-manufacturing",
    label: "Clinical Manufacturing",
    summary: "Review readiness, deviation burden, and structured handoffs become material.",
    complexityMultiplier: 1.08,
    onboardingBaselineDays: 16,
    annualProgramInvestment: 320000,
  },
  {
    id: "commercial-scale",
    label: "Commercial Scale",
    summary: "Network consistency, exception handling, and release coordination drive the business case.",
    complexityMultiplier: 1.14,
    onboardingBaselineDays: 18,
    annualProgramInvestment: 420000,
  },
];

export const PROCESS_PROFILE_MAP = Object.fromEntries(
  PROCESS_PROFILES.map((profile) => [profile.id, profile]),
) as Record<ProcessProfileId, ProcessProfile>;

export const LIFECYCLE_STAGE_MAP = Object.fromEntries(
  LIFECYCLE_STAGES.map((stage) => [stage.id, stage]),
) as Record<LifecycleStageId, LifecycleStage>;

export const DEFAULT_BIOPILOT_ASSESSMENT_INPUTS: BioPilotAssessmentInputs = {
  processProfileId: "mab-cho",
  lifecycleStageId: "clinical-manufacturing",
  activePrograms: 4,
  runsPerYear: 60,
  sites: 2,
  transferEventsPerYear: 3,
  vendorPlatforms: 4,
  blendedHourlyRate: 145,
  costPerFailedRun: 80000,
  valuePerDayAcceleration: 35000,
  bioPilotTierId: "professional",
  bioPilotBioreactors: 4,
  bioPilotRecipesRunning: 4,
  bioPilotRecipeStorage: 20,
  bioPilotPatEquipment: 10,
  bioPilotUsers: 8,
  customMonthlySubscription: 9000,
  customerEngineeringHours: 160,
  customerEngineeringHourlyRate: 145,
  additionalServicesInvestment: 0,
  plannedProgramInvestment: 347200,
  bioreactorConnectivity: 45,
  sensorCoverage: 58,
  patCoverage: 34,
  analyzerConnectivity: 42,
  downstreamVisibility: 48,
  dataContextualization: 36,
  sopAutomation: 28,
  reviewByException: 24,
  crossSiteCollaboration: 38,
  manualTranscriptionShare: 56,
  offlineDataDelayHours: 14,
  batchReviewHours: 20,
  deviationInvestigationHours: 18,
  weeksSinceLastBatchFailure: 64,
  failureCauseExposureScore: 35,
  failedRunRecoveryHours: 36,
  techTransferPackageHours: 78,
  onboardingDays: 16,
};

export const BIOPILOT_SAMPLE_CONFIGS: Array<{
  id: string;
  label: string;
  description: string;
  inputs: BioPilotAssessmentInputs;
}> = [
  {
    id: "pd-lab-fragmented-stack",
    label: "Process Development Lab",
    description:
      "A process development group with multi-vendor equipment, delayed analyzer context, and heavy spreadsheet-driven review.",
    inputs: {
      ...DEFAULT_BIOPILOT_ASSESSMENT_INPUTS,
      lifecycleStageId: "process-development",
      activePrograms: 6,
      runsPerYear: 92,
      sites: 1,
      transferEventsPerYear: 2,
      vendorPlatforms: 5,
      blendedHourlyRate: 135,
      costPerFailedRun: 45000,
      valuePerDayAcceleration: 22000,
      bioPilotTierId: "basic",
      bioPilotBioreactors: 1,
      bioPilotRecipesRunning: 1,
      bioPilotRecipeStorage: 5,
      bioPilotPatEquipment: 5,
      bioPilotUsers: 2,
      customMonthlySubscription: 3000,
      customerEngineeringHours: 120,
      customerEngineeringHourlyRate: 135,
      additionalServicesInvestment: 0,
      plannedProgramInvestment: 124200,
      bioreactorConnectivity: 34,
      sensorCoverage: 52,
      patCoverage: 24,
      analyzerConnectivity: 31,
      downstreamVisibility: 38,
      dataContextualization: 24,
      sopAutomation: 18,
      reviewByException: 16,
      crossSiteCollaboration: 30,
      manualTranscriptionShare: 64,
      offlineDataDelayHours: 11,
      batchReviewHours: 14,
      deviationInvestigationHours: 12,
      weeksSinceLastBatchFailure: 52,
      failureCauseExposureScore: 38,
      failedRunRecoveryHours: 24,
      techTransferPackageHours: 48,
      onboardingDays: 13,
    },
  },
  {
    id: "clinical-tech-transfer",
    label: "Clinical Tech Transfer",
    description:
      "A clinical-stage network preparing for site and partner transfers, with review drag and poor package reuse.",
    inputs: {
      ...DEFAULT_BIOPILOT_ASSESSMENT_INPUTS,
      lifecycleStageId: "clinical-manufacturing",
      activePrograms: 4,
      runsPerYear: 54,
      sites: 3,
      transferEventsPerYear: 6,
      vendorPlatforms: 4,
      blendedHourlyRate: 150,
      costPerFailedRun: 95000,
      valuePerDayAcceleration: 40000,
      bioPilotTierId: "professional",
      bioPilotBioreactors: 4,
      bioPilotRecipesRunning: 4,
      bioPilotRecipeStorage: 20,
      bioPilotPatEquipment: 10,
      bioPilotUsers: 8,
      customMonthlySubscription: 9000,
      customerEngineeringHours: 180,
      customerEngineeringHourlyRate: 150,
      additionalServicesInvestment: 0,
      plannedProgramInvestment: 351000,
      bioreactorConnectivity: 48,
      sensorCoverage: 60,
      patCoverage: 36,
      analyzerConnectivity: 44,
      downstreamVisibility: 46,
      dataContextualization: 34,
      sopAutomation: 30,
      reviewByException: 20,
      crossSiteCollaboration: 32,
      manualTranscriptionShare: 58,
      offlineDataDelayHours: 16,
      batchReviewHours: 24,
      deviationInvestigationHours: 20,
      weeksSinceLastBatchFailure: 64,
      failureCauseExposureScore: 36,
      failedRunRecoveryHours: 42,
      techTransferPackageHours: 94,
      onboardingDays: 18,
    },
  },
  {
    id: "commercial-network",
    label: "Commercial Multi-Site Network",
    description:
      "A larger network with stronger instrumentation than average, but still carrying review, exception, and transfer friction.",
    inputs: {
      ...DEFAULT_BIOPILOT_ASSESSMENT_INPUTS,
      lifecycleStageId: "commercial-scale",
      activePrograms: 3,
      runsPerYear: 120,
      sites: 4,
      transferEventsPerYear: 8,
      vendorPlatforms: 6,
      blendedHourlyRate: 165,
      costPerFailedRun: 150000,
      valuePerDayAcceleration: 55000,
      bioPilotTierId: "enterprise",
      bioPilotBioreactors: 7,
      bioPilotRecipesRunning: 7,
      bioPilotRecipeStorage: 20,
      bioPilotPatEquipment: 20,
      bioPilotUsers: 8,
      customMonthlySubscription: 15000,
      customerEngineeringHours: 240,
      customerEngineeringHourlyRate: 165,
      additionalServicesInvestment: 0,
      plannedProgramInvestment: 579600,
      bioreactorConnectivity: 62,
      sensorCoverage: 72,
      patCoverage: 48,
      analyzerConnectivity: 54,
      downstreamVisibility: 58,
      dataContextualization: 44,
      sopAutomation: 42,
      reviewByException: 34,
      crossSiteCollaboration: 40,
      manualTranscriptionShare: 42,
      offlineDataDelayHours: 18,
      batchReviewHours: 28,
      deviationInvestigationHours: 22,
      weeksSinceLastBatchFailure: 88,
      failureCauseExposureScore: 28,
      failedRunRecoveryHours: 64,
      techTransferPackageHours: 102,
      onboardingDays: 20,
    },
  },
];

export const BIOPILOT_NUMERIC_INPUT_KEYS: BioPilotNumericInputKey[] = [
  "activePrograms",
  "runsPerYear",
  "sites",
  "transferEventsPerYear",
  "vendorPlatforms",
  "blendedHourlyRate",
  "costPerFailedRun",
  "valuePerDayAcceleration",
  "bioPilotBioreactors",
  "bioPilotRecipesRunning",
  "bioPilotRecipeStorage",
  "bioPilotPatEquipment",
  "bioPilotUsers",
  "customMonthlySubscription",
  "customerEngineeringHours",
  "customerEngineeringHourlyRate",
  "additionalServicesInvestment",
  "plannedProgramInvestment",
  "bioreactorConnectivity",
  "sensorCoverage",
  "patCoverage",
  "analyzerConnectivity",
  "downstreamVisibility",
  "dataContextualization",
  "sopAutomation",
  "reviewByException",
  "crossSiteCollaboration",
  "manualTranscriptionShare",
  "offlineDataDelayHours",
  "batchReviewHours",
  "deviationInvestigationHours",
  "weeksSinceLastBatchFailure",
  "failureCauseExposureScore",
  "failedRunRecoveryHours",
  "techTransferPackageHours",
  "onboardingDays",
];

export const BIOPILOT_ADJUSTABLE_INPUT_KEYS: BioPilotAdjustableInputKey[] = [
  ...BIOPILOT_NUMERIC_INPUT_KEYS,
  "bioPilotTierId",
];

const NUMERIC_INPUT_KEYS = BIOPILOT_NUMERIC_INPUT_KEYS;

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

const jitter = (base: number, variance: number, min: number, max: number) =>
  clamp(Math.round((base + randomBetween(-variance, variance)) * 10) / 10, min, max);

const wholeNumberJitter = (base: number, variance: number, min: number, max: number) =>
  Math.round(jitter(base, variance, min, max));

const roundedCurrencyJitter = (base: number, variance: number, min: number, max: number) =>
  Math.round(jitter(base, variance, min, max) / 1000) * 1000;

const roundedRateJitter = (base: number, variance: number, min: number, max: number) =>
  Math.round(jitter(base, variance, min, max) / 5) * 5;

export function normalizeAssessmentInputs(
  inputs: Partial<BioPilotAssessmentInputs>,
): BioPilotAssessmentInputs {
  const profile = PROCESS_PROFILE_MAP[inputs.processProfileId as ProcessProfileId]
    ? (inputs.processProfileId as ProcessProfileId)
    : DEFAULT_BIOPILOT_ASSESSMENT_INPUTS.processProfileId;
  const stage = LIFECYCLE_STAGE_MAP[inputs.lifecycleStageId as LifecycleStageId]
    ? (inputs.lifecycleStageId as LifecycleStageId)
    : DEFAULT_BIOPILOT_ASSESSMENT_INPUTS.lifecycleStageId;

  const normalized: BioPilotAssessmentInputs = {
    ...DEFAULT_BIOPILOT_ASSESSMENT_INPUTS,
    ...inputs,
    processProfileId: profile,
    lifecycleStageId: stage,
    bioPilotTierId: normalizeTierId(inputs.bioPilotTierId),
  };

  for (const key of NUMERIC_INPUT_KEYS) {
    const value = normalized[key];
    normalized[key] = Number.isFinite(value) ? value : DEFAULT_BIOPILOT_ASSESSMENT_INPUTS[key];
  }

  const investmentBasis = calculateBioPilotInvestmentBasis(normalized);
  normalized.plannedProgramInvestment = investmentBasis.totalThreeYearInvestment;

  return normalized;
}

export function buildRandomizedSampleInputs(sampleId: string): BioPilotAssessmentInputs {
  const baseline =
    BIOPILOT_SAMPLE_CONFIGS.find((item) => item.id === sampleId)?.inputs ??
    DEFAULT_BIOPILOT_ASSESSMENT_INPUTS;

  const normalized = normalizeAssessmentInputs(baseline);
  const opportunityShift = randomBetween(18, 26);

  return normalizeAssessmentInputs({
    ...normalized,
    activePrograms: wholeNumberJitter(normalized.activePrograms + 1.2, 1.5, 1, 14),
    runsPerYear: wholeNumberJitter(
      normalized.runsPerYear + normalized.runsPerYear * 0.1,
      Math.max(4, normalized.runsPerYear * 0.14),
      1,
      220,
    ),
    sites: wholeNumberJitter(normalized.sites + 0.75, 0.75, 1, 7),
    transferEventsPerYear: wholeNumberJitter(normalized.transferEventsPerYear + 1.3, 1.5, 0, 12),
    vendorPlatforms: wholeNumberJitter(normalized.vendorPlatforms + 1.2, 1, 1, 8),
    blendedHourlyRate: roundedRateJitter(normalized.blendedHourlyRate, 14, 90, 260),
    costPerFailedRun: roundedCurrencyJitter(
      normalized.costPerFailedRun,
      normalized.costPerFailedRun * 0.16,
      15000,
      250000,
    ),
    valuePerDayAcceleration: roundedCurrencyJitter(
      normalized.valuePerDayAcceleration,
      normalized.valuePerDayAcceleration * 0.18,
      10000,
      150000,
    ),
    bioPilotBioreactors: wholeNumberJitter(normalized.bioPilotBioreactors, 1, 1, 20),
    bioPilotRecipesRunning: wholeNumberJitter(normalized.bioPilotRecipesRunning, 1, 1, 20),
    bioPilotRecipeStorage: wholeNumberJitter(normalized.bioPilotRecipeStorage, 3, 1, 100),
    bioPilotPatEquipment: wholeNumberJitter(normalized.bioPilotPatEquipment, 2, 0, 60),
    bioPilotUsers: wholeNumberJitter(normalized.bioPilotUsers, 1, 1, 50),
    customMonthlySubscription: roundedCurrencyJitter(
      normalized.customMonthlySubscription,
      normalized.customMonthlySubscription * 0.08,
      1000,
      50000,
    ),
    customerEngineeringHours: wholeNumberJitter(
      normalized.customerEngineeringHours,
      24,
      0,
      1000,
    ),
    customerEngineeringHourlyRate: roundedRateJitter(
      normalized.customerEngineeringHourlyRate,
      10,
      80,
      350,
    ),
    additionalServicesInvestment: roundedCurrencyJitter(
      normalized.additionalServicesInvestment,
      Math.max(5000, normalized.additionalServicesInvestment * 0.12),
      0,
      500000,
    ),
    bioreactorConnectivity: jitter(normalized.bioreactorConnectivity - opportunityShift, 6, 8, 78),
    sensorCoverage: jitter(normalized.sensorCoverage - opportunityShift * 0.75, 5, 10, 82),
    patCoverage: jitter(normalized.patCoverage - opportunityShift, 6, 4, 72),
    analyzerConnectivity: jitter(normalized.analyzerConnectivity - opportunityShift, 6, 6, 76),
    downstreamVisibility: jitter(normalized.downstreamVisibility - opportunityShift * 0.85, 5, 8, 78),
    dataContextualization: jitter(normalized.dataContextualization - opportunityShift * 1.1, 6, 6, 74),
    sopAutomation: jitter(normalized.sopAutomation - opportunityShift * 1.05, 6, 4, 72),
    reviewByException: jitter(normalized.reviewByException - opportunityShift * 1.05, 6, 4, 72),
    crossSiteCollaboration: jitter(normalized.crossSiteCollaboration - opportunityShift * 0.85, 6, 6, 76),
    manualTranscriptionShare: jitter(normalized.manualTranscriptionShare + opportunityShift * 1.2, 5, 52, 96),
    offlineDataDelayHours: jitter(normalized.offlineDataDelayHours + opportunityShift * 0.25, 2.5, 1, 36),
    batchReviewHours: jitter(normalized.batchReviewHours + opportunityShift * 0.45, 3.5, 2, 48),
    deviationInvestigationHours: jitter(
      normalized.deviationInvestigationHours + opportunityShift * 0.38,
      3.5,
      2,
      48,
    ),
    weeksSinceLastBatchFailure: wholeNumberJitter(
      normalized.weeksSinceLastBatchFailure - opportunityShift * 0.45,
      8,
      0,
      156,
    ),
    failureCauseExposureScore: jitter(
      normalized.failureCauseExposureScore + opportunityShift * 0.55,
      7,
      0,
      100,
    ),
    failedRunRecoveryHours: wholeNumberJitter(
      normalized.failedRunRecoveryHours + opportunityShift * 0.85,
      8,
      0,
      240,
    ),
    techTransferPackageHours: jitter(
      normalized.techTransferPackageHours + opportunityShift * 0.85,
      9,
      8,
      160,
    ),
    onboardingDays: jitter(normalized.onboardingDays + opportunityShift * 0.35, 3, 3, 120),
  });
}

const percentageInverse = (value: number) => clamp(100 - value, 0, 100);

const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

export function normalizeEvidenceMeta(
  meta?: AssessmentEvidenceMeta | null,
): AssessmentEvidenceMeta {
  const completedSectionIds = new Set<BioPilotInputSectionId>();

  for (const sectionId of meta?.completedSectionIds ?? []) {
    if ((BIOPILOT_INPUT_SECTION_IDS as readonly string[]).includes(sectionId)) {
      completedSectionIds.add(sectionId);
    }
  }

  const inputSources: AssessmentEvidenceMeta["inputSources"] = {};
  const rawInputSources = meta?.inputSources ?? {};

  for (const key of BIOPILOT_ADJUSTABLE_INPUT_KEYS) {
    const source = rawInputSources[key];

    if (source === "sample" || source === "survey" || source === "user" || source === "default") {
      inputSources[key] = source;
    }
  }

  return {
    completedSectionIds: [...completedSectionIds],
    inputSources,
    usedSampleData: Boolean(meta?.usedSampleData),
    userConfirmedAt: meta?.userConfirmedAt ?? null,
  };
}

const getMaturityLevel = (score: number) => {
  if (score >= 85) {
    return { level: 5, label: "Adaptive Digital Plant" };
  }
  if (score >= 65) {
    return { level: 4, label: "Guided Digital Plant" };
  }
  if (score >= 45) {
    return { level: 3, label: "Contextualized Operations" };
  }
  if (score >= 25) {
    return { level: 2, label: "Connected Islands" };
  }
  return { level: 1, label: "Manual And Local Records" };
};

const buildDigitalPlantMaturity = (
  inputs: BioPilotAssessmentInputs,
): DigitalPlantMaturityAssessment => {
  const domainInputs = [
    {
      id: "data-foundation",
      label: "Data Foundation",
      score: average([
        inputs.bioreactorConnectivity,
        inputs.sensorCoverage,
        inputs.analyzerConnectivity,
      ]),
      currentState: "Instrument and analyzer signals are available, but may still be distributed across local systems.",
      targetState: "Core process and analyzer signals are consistently available in one operating context.",
      rationale: "BioPilot value depends on whether reactor, sensor, and analyzer data can be trusted as a unified source.",
    },
    {
      id: "process-visibility",
      label: "Process Visibility",
      score: average([
        inputs.patCoverage,
        inputs.downstreamVisibility,
        inputs.dataContextualization,
      ]),
      currentState: "Process signals and downstream evidence are partly visible but not always decision-ready.",
      targetState: "Upstream, downstream, and analytical context can be interpreted as one process story.",
      rationale: "Visibility maturity shows how quickly the team can understand what happened and why.",
    },
    {
      id: "guided-execution",
      label: "Guided Execution",
      score: average([
        inputs.sopAutomation,
        percentageInverse(inputs.manualTranscriptionShare),
        percentageInverse(inputs.onboardingDays * 2.5),
      ]),
      currentState: "Operator execution still depends on manual transcription, local practices, or tribal knowledge.",
      targetState: "Execution steps, evidence capture, and operator guidance are embedded into the workflow.",
      rationale: "Guided execution maturity is the clearest indicator of recoverable manual effort.",
    },
    {
      id: "review-readiness",
      label: "Review Readiness",
      score: average([
        inputs.reviewByException,
        percentageInverse(inputs.batchReviewHours * 2.1),
        percentageInverse(inputs.deviationInvestigationHours * 2.4),
        percentageInverse(inputs.failedRunRecoveryHours * 0.55),
      ]),
      currentState: "Evidence is still being assembled after the run instead of being review-ready during execution.",
      targetState: "Review packages are assembled continuously, with exceptions surfaced while the run is active.",
      rationale: "Review readiness connects digital maturity to quality, investigation, and release-time value.",
    },
    {
      id: "network-scale",
      label: "Network Scale Readiness",
      score: average([
        inputs.crossSiteCollaboration,
        percentageInverse(inputs.techTransferPackageHours * 0.65),
        percentageInverse(inputs.vendorPlatforms * 9),
        percentageInverse(inputs.sites * 12),
      ]),
      currentState: "The process story becomes harder to reuse as vendor platforms, sites, or partners increase.",
      targetState: "Process context can move across programs, sites, and partners with less reconstruction.",
      rationale: "Network maturity shows whether the operating model can scale beyond one lab or one reactor train.",
    },
  ];

  const domains = domainInputs.map((domain) => ({
    ...domain,
    score: clamp(domain.score, 0, 100),
  }));
  const score = clamp(
    domains.find((domain) => domain.id === "data-foundation")!.score * 0.22 +
      domains.find((domain) => domain.id === "process-visibility")!.score * 0.22 +
      domains.find((domain) => domain.id === "guided-execution")!.score * 0.22 +
      domains.find((domain) => domain.id === "review-readiness")!.score * 0.18 +
      domains.find((domain) => domain.id === "network-scale")!.score * 0.16,
    0,
    100,
  );
  const maturityLevel = getMaturityLevel(score);
  const lowestDomain = [...domains].sort((left, right) => left.score - right.score)[0];

  return {
    score,
    level: maturityLevel.level,
    label: maturityLevel.label,
    domains,
    summary: `The submitted operating model maps to DPMM level ${maturityLevel.level}: ${maturityLevel.label.toLowerCase()}.`,
    nextStep: lowestDomain
      ? `Start by improving ${lowestDomain.label.toLowerCase()} because it is the lowest maturity domain in this assessment.`
      : "Confirm the maturity baseline with a short operating review.",
  };
};

const buildEvidenceConfidence = (
  meta?: AssessmentEvidenceMeta | null,
): EvidenceConfidenceAssessment => {
  const normalizedMeta = normalizeEvidenceMeta(meta);
  const inputSources = normalizedMeta.inputSources ?? {};
  const completedSections = normalizedMeta.completedSectionIds?.length ?? 0;
  const userEnteredFields = BIOPILOT_ADJUSTABLE_INPUT_KEYS.filter(
    (key) => inputSources[key] === "user",
  ).length;
  const surveyFields = BIOPILOT_ADJUSTABLE_INPUT_KEYS.filter(
    (key) => inputSources[key] === "survey",
  ).length;
  const sampleFields = BIOPILOT_ADJUSTABLE_INPUT_KEYS.filter(
    (key) => inputSources[key] === "sample",
  ).length;
  const defaultFields = Math.max(
    0,
    BIOPILOT_ADJUSTABLE_INPUT_KEYS.length - userEnteredFields - surveyFields - sampleFields,
  );
  const sectionCompletionScore =
    (completedSections / BIOPILOT_INPUT_SECTION_IDS.length) * 42;
  const userEvidenceScore =
    (userEnteredFields / BIOPILOT_ADJUSTABLE_INPUT_KEYS.length) * 42;
  const surveySupportScore =
    (surveyFields / BIOPILOT_ADJUSTABLE_INPUT_KEYS.length) * 10;
  const sampleSupportScore =
    (sampleFields / BIOPILOT_ADJUSTABLE_INPUT_KEYS.length) * 8;
  const samplePenalty = normalizedMeta.usedSampleData && userEnteredFields < 8 ? 12 : 0;
  const defaultPenalty = defaultFields > 8 ? 10 : defaultFields > 3 ? 5 : 0;
  const score = clamp(
    sectionCompletionScore +
      userEvidenceScore +
      surveySupportScore +
      sampleSupportScore -
      samplePenalty -
      defaultPenalty,
    0,
    100,
  );
  const band =
    score >= 72 ? "High" : score >= 44 ? "Directional" : "Low";
  const warnings: string[] = [];

  if (completedSections < BIOPILOT_INPUT_SECTION_IDS.length) {
    warnings.push("Not every input section was confirmed before report generation.");
  }

  if (defaultFields > 0) {
    warnings.push(`${defaultFields} numeric assumptions were not explicitly updated from defaults.`);
  }

  if (normalizedMeta.usedSampleData) {
    warnings.push("Sample data was used; replace sample assumptions before formal planning.");
  }

  if (surveyFields > 0) {
    warnings.push("Survey benchmark assumptions were used; replace them with site-specific operating evidence when available.");
  }

  return {
    score,
    band,
    completedSections,
    totalSections: BIOPILOT_INPUT_SECTION_IDS.length,
    userEnteredFields,
    surveyFields,
    sampleFields,
    defaultFields,
    warnings,
    summary:
      band === "High"
        ? "Most assumptions were explicitly reviewed, so the estimate is suitable for a focused opportunity discussion."
        : band === "Directional"
          ? "The estimate is useful for opportunity sizing, but priority assumptions should be confirmed before a proposal discussion."
          : "The estimate is an early planning view and should be treated as low confidence until the inputs are validated.",
  };
};

const buildAssumptionTransparency = (
  inputs: BioPilotAssessmentInputs,
  annualRecoveredHours: number,
  annualValuePotential: number,
  investment: BioPilotInvestmentSummary,
  threeYearRoi: number,
  paybackMonths: number,
  evidenceMeta?: AssessmentEvidenceMeta | null,
): AssumptionTransparency => {
  const normalizedMeta = normalizeEvidenceMeta(evidenceMeta);
  const surveyBackedFields = BIOPILOT_ADJUSTABLE_INPUT_KEYS.filter(
    (key) => normalizedMeta.inputSources?.[key] === "survey",
  );
  const items: AssumptionTransparencyItem[] = [
    {
      label: "Annual Recovered Hours",
      basis: `${Math.round(inputs.runsPerYear)} annual runs plus transfer, deviation, and onboarding effort.`,
      formula:
        "Recovered hours = run coordination savings + review savings + investigation savings + failure recovery savings + transfer savings + onboarding savings.",
      sensitivity: `Current estimate: ${Math.round(annualRecoveredHours).toLocaleString("en-US")} hours per year. Review hours, failure recovery hours, and runs per year are usually the most sensitive time drivers.`,
    },
    {
      label: "Annual Value",
      basis: "Submitted hourly rate, failed-run impact, failure recovery effort, and value per accelerated decision day.",
      formula:
        "Annual value = recovered hours x blended hourly rate + avoided failed runs x failed-run impact + accelerated decision value.",
      sensitivity: `Current estimate: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(annualValuePotential)}. Failed-run impact can dominate the result if the process is high value or scarce-capacity. Set recovery hours to 0 if the failed-run impact already includes recovery labor.`,
    },
    {
      label: "Batch Failure And Recovery",
      basis: `${Math.round(inputs.weeksSinceLastBatchFailure)} weeks since the last batch failure, ${Math.round(inputs.failureCauseExposureScore)} / 100 failure-cause exposure, and ${Math.round(inputs.failedRunRecoveryHours)} recovery hours per failed or materially degraded run.`,
      formula:
        "Failure value = modeled avoided failed or degraded runs x failed-run impact, plus avoided recovery hours valued at the loaded labor rate.",
      sensitivity:
        "This area is most sensitive to actual failure frequency, failure impact, and whether recovery effort is already included in the failed-run impact assumption.",
    },
    {
      label: "BioPilot Scope And Investment",
      basis: `${investment.tierLabel} scope at ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(investment.monthlySubscription)} per month, billed annually over ${investment.subscriptionTermYears} years, with ${Math.round(investment.customerEngineeringHours).toLocaleString("en-US")} customer engineering hours.`,
      formula:
        "BioPilot investment = 36 months of subscription cost + customer engineering effort + selected additional services. Basic engineering and maintenance are included in the subscription scope.",
      sensitivity: `Current 3-year BioPilot investment: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(investment.totalThreeYearInvestment)}. ROI is most sensitive to tier selection, customer engineering hours, hourly rate, and optional services.`
    },
    {
      label: "ROI And Payback",
      basis: `${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(investment.threeYearValue)} phased value compared with ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(investment.totalThreeYearInvestment)} 3-year BioPilot investment.`,
      formula:
        "3-year ROI = phased 3-year value minus BioPilot investment, divided by BioPilot investment. Payback uses annual subscription billing, customer engineering effort, optional services, and a phased value ramp.",
      sensitivity: `Current estimate: ${Math.round(threeYearRoi)}% 3-year ROI and ${paybackMonths >= 60 ? "60+" : paybackMonths.toFixed(1)} months payback. Confirm the selected scope and site engineering assumptions before formal budget approval.`,
    },
    {
      label: "DPMM Score",
      basis: "Weighted maturity across data foundation, process visibility, guided execution, review readiness, and network scale readiness.",
      formula:
        "DPMM = weighted score from 0-100, then mapped to a five-level digital plant maturity scale.",
      sensitivity:
        "The DPMM score is most sensitive to connectivity, data contextualization, SOP automation, and review-by-exception inputs.",
    },
  ];

  if (surveyBackedFields.length > 0) {
    items.push({
      label: "Survey Benchmark Context",
      basis: `${BIOPLAN_2023_BATCH_FAILURE_BENCHMARK.shortLabel}: ${BIOPLAN_2023_BATCH_FAILURE_BENCHMARK.context}`,
      formula:
        "Survey-backed values are used as planning benchmarks only. User-entered site evidence overrides the benchmark in the estimate.",
      sensitivity:
        "Replacing benchmark assumptions with site-specific failure logs, deviation records, and recovery effort usually improves confidence more than changing low-impact fields.",
    });
  }

  return {
    summary:
      "This report estimates current inefficiency and potential improvement from submitted time, maturity, batch-failure, and value assumptions.",
    items,
    planningCaveat:
      "Use this as a planning and opportunity-development estimate. Final ROI should be revisited with confirmed operating evidence and confirmed BioPilot commercial scope.",
  };
};

const rankSeverity = (value: number): BuyingSignal["severity"] => {
  if (value >= 76) {
    return "Critical";
  }
  if (value >= 55) {
    return "Material";
  }
  return "Emerging";
};

export function assessBioPilotFit(
  inputs: BioPilotAssessmentInputs,
  evidenceMeta?: AssessmentEvidenceMeta | null,
): BioPilotAssessmentResults {
  const profile = PROCESS_PROFILE_MAP[inputs.processProfileId];
  const stage = LIFECYCLE_STAGE_MAP[inputs.lifecycleStageId];

  const digitalCoverage = clamp(
    inputs.bioreactorConnectivity * 0.17 +
      inputs.sensorCoverage * 0.12 +
      inputs.patCoverage * 0.12 +
      inputs.analyzerConnectivity * 0.13 +
      inputs.downstreamVisibility * 0.08 +
      inputs.dataContextualization * 0.16 +
      inputs.sopAutomation * 0.11 +
      inputs.reviewByException * 0.06 +
      inputs.crossSiteCollaboration * 0.05,
    0,
    100,
  );

  const manualBurdenIndex = clamp(
    inputs.manualTranscriptionShare * 0.34 +
      (inputs.offlineDataDelayHours / 24) * 18 +
      (inputs.batchReviewHours / 24) * 18 +
      (inputs.deviationInvestigationHours / 24) * 12 +
      (inputs.failedRunRecoveryHours / 120) * 6 +
      (inputs.failureCauseExposureScore / 100) * 5 +
      (inputs.techTransferPackageHours / (profile.base.transferPackageHours * 1.2)) * 10 +
      (inputs.onboardingDays / (stage.onboardingBaselineDays * 1.35)) * 8,
    0,
    100,
  );

  const complexityScore = clamp(
    ((inputs.vendorPlatforms - 1) / 6) * 36 +
      ((inputs.sites - 1) / 4) * 28 +
      (inputs.transferEventsPerYear / 10) * 20 +
      (inputs.activePrograms / 10) * 8 +
      (inputs.runsPerYear / 140) * 8,
    0,
    100,
  );

  const fitScore = clamp(
    percentageInverse(digitalCoverage) * 0.38 +
      manualBurdenIndex * 0.28 +
      complexityScore * 0.18 +
      percentageInverse(inputs.reviewByException) * 0.08 +
      percentageInverse(inputs.sopAutomation) * 0.08,
    8,
    98,
  );

  const fitBand =
    fitScore >= 80
      ? "Very Strong BioPilot Fit"
      : fitScore >= 64
        ? "Strong BioPilot Fit"
        : fitScore >= 48
          ? "Moderate BioPilot Fit"
          : "Emerging BioPilot Fit";

  const currentManualHoursPerRun = clamp(
    profile.base.manualHoursPerRun *
      stage.complexityMultiplier *
      (1 + manualBurdenIndex / 150 - digitalCoverage / 400),
    8,
    120,
  );

  const currentReviewHours = clamp(
    inputs.batchReviewHours *
      (1 + percentageInverse(inputs.reviewByException) / 180),
    4,
    72,
  );

  const currentDecisionLagHours = clamp(
    inputs.offlineDataDelayHours *
      (1 +
        percentageInverse(inputs.dataContextualization) / 180 +
        percentageInverse(inputs.analyzerConnectivity) / 240),
    2,
    96,
  );

  const failureRecencyRisk = clamp(
    ((104 - inputs.weeksSinceLastBatchFailure) / 104) * 100,
    0,
    100,
  );
  const failureCauseRisk = clamp(inputs.failureCauseExposureScore, 0, 100);

  const currentRunSuccessRate = clamp(
    profile.base.runSuccessRate +
      inputs.sensorCoverage * 0.03 +
      inputs.patCoverage * 0.035 +
      inputs.analyzerConnectivity * 0.018 +
      inputs.sopAutomation * 0.015 +
      inputs.dataContextualization * 0.018 -
      inputs.manualTranscriptionShare * 0.03 -
      failureRecencyRisk * 0.025 -
      failureCauseRisk * 0.025 -
      Math.max(inputs.vendorPlatforms - 2, 0) * 0.7 -
      Math.max(inputs.sites - 1, 0) * 0.9,
    72,
    99.2,
  );

  const currentTransferPackageHours = clamp(
    inputs.techTransferPackageHours *
      (1 + Math.max(inputs.sites - 1, 0) * 0.06 - inputs.crossSiteCollaboration / 500),
    10,
    180,
  );

  const currentOnboardingDays = clamp(
    inputs.onboardingDays *
      (1 + percentageInverse(inputs.sopAutomation) / 350),
    4,
    160,
  );

  const enablementMultiplier = clamp(0.26 + fitScore / 210, 0.24, 0.68);

  const bioPilotManualHoursPerRun = clamp(
    currentManualHoursPerRun * (1 - enablementMultiplier * 0.64),
    4,
    currentManualHoursPerRun,
  );
  const bioPilotReviewHours = clamp(
    currentReviewHours * (1 - enablementMultiplier * 0.7),
    3,
    currentReviewHours,
  );
  const bioPilotDecisionLagHours = clamp(
    currentDecisionLagHours * (1 - enablementMultiplier * 0.78),
    1.5,
    currentDecisionLagHours,
  );
  const bioPilotRunSuccessRate = clamp(
    currentRunSuccessRate + enablementMultiplier * 6.8,
    currentRunSuccessRate,
    99.5,
  );
  const bioPilotTransferPackageHours = clamp(
    currentTransferPackageHours * (1 - enablementMultiplier * 0.58),
    8,
    currentTransferPackageHours,
  );
  const bioPilotOnboardingDays = clamp(
    currentOnboardingDays * (1 - enablementMultiplier * 0.36),
    3,
    currentOnboardingDays,
  );
  const currentFailureRecoveryHours = clamp(inputs.failedRunRecoveryHours, 0, 240);
  const bioPilotFailureRecoveryHours = clamp(
    currentFailureRecoveryHours * (1 - enablementMultiplier * 0.4),
    0,
    currentFailureRecoveryHours,
  );

  const expectedDeviationEvents = Math.max(
    2,
    Math.round(
      inputs.runsPerYear *
        profile.base.deviationRate *
        (1 + manualBurdenIndex / 220 - digitalCoverage / 350),
    ),
  );
  const currentDeviationHours = inputs.deviationInvestigationHours;
  const bioPilotDeviationHours = clamp(
    currentDeviationHours * (1 - enablementMultiplier * 0.45),
    4,
    currentDeviationHours,
  );

  const runCoordinationRecoveredHours =
    (currentManualHoursPerRun - bioPilotManualHoursPerRun) * inputs.runsPerYear;
  const reviewRecoveredHours =
    (currentReviewHours - bioPilotReviewHours) * inputs.runsPerYear;
  const deviationRecoveredHours =
    (currentDeviationHours - bioPilotDeviationHours) * expectedDeviationEvents;
  const transferRecoveredHours =
    (currentTransferPackageHours - bioPilotTransferPackageHours) *
    inputs.transferEventsPerYear;
  const annualUsersRequiringRamp = Math.max(
    4,
    Math.round(inputs.activePrograms * 1.6 + inputs.sites),
  );
  const onboardingRecoveredHours =
    (currentOnboardingDays - bioPilotOnboardingDays) *
    8 *
    annualUsersRequiringRamp;

  const baselineFailedRuns =
    inputs.runsPerYear * ((100 - currentRunSuccessRate) / 100);
  const modeledFailedRuns =
    inputs.runsPerYear * ((100 - bioPilotRunSuccessRate) / 100);
  const avoidedFailedRuns = Math.max(0, baselineFailedRuns - modeledFailedRuns);
  const failureRecoveryRecoveredHours =
    (currentFailureRecoveryHours - bioPilotFailureRecoveryHours) *
    avoidedFailedRuns;

  const annualRecoveredHours = Math.max(
    0,
    runCoordinationRecoveredHours +
      reviewRecoveredHours +
      deviationRecoveredHours +
      failureRecoveryRecoveredHours +
      transferRecoveredHours +
      onboardingRecoveredHours,
  );

  const annualDecisionDaysRecovered = Math.max(
    0,
    ((currentDecisionLagHours - bioPilotDecisionLagHours) / 24) *
      Math.min(inputs.activePrograms, 8) *
      2.1,
  );

  const valueLevers: ValueLever[] = [
    {
      id: "run-coordination",
      label: "Run Coordination, Reporting, And Operator Time",
      annualValue:
        (runCoordinationRecoveredHours + onboardingRecoveredHours) *
        inputs.blendedHourlyRate,
      summary:
        "Captures less spreadsheet handling, less manual reconciliation, and faster operator ramp.",
    },
    {
      id: "review",
      label: "Batch Review And Investigation Effort",
      annualValue:
        (reviewRecoveredHours + deviationRecoveredHours) * inputs.blendedHourlyRate,
      summary:
        "Values moving the team closer to review-by-exception and cleaner evidence packages.",
    },
    {
      id: "transfer",
      label: "Tech Transfer And Package Assembly Effort",
      annualValue: transferRecoveredHours * inputs.blendedHourlyRate,
      summary:
        "Values reusable run context and shorter handoff package assembly across sites or partners.",
    },
    {
      id: "failure",
      label: "Avoided Failed Runs And Recovery Effort",
      annualValue:
        avoidedFailedRuns * inputs.costPerFailedRun +
        failureRecoveryRecoveredHours * inputs.blendedHourlyRate,
      summary:
        "Estimated from modeled run-success improvement, fewer lost batches, and less recovery or restart effort.",
    },
    {
      id: "acceleration",
      label: "Faster Process And Portfolio Decisions",
      annualValue:
        annualDecisionDaysRecovered *
        inputs.valuePerDayAcceleration *
        0.58,
      summary:
        "Estimated from faster access to usable process context and earlier decisions.",
    },
  ].sort((left, right) => right.annualValue - left.annualValue);

  const annualValuePotential = valueLevers.reduce(
    (sum, lever) => sum + lever.annualValue,
    0,
  );
  const investmentBasis = calculateBioPilotInvestmentBasis(inputs);
  const yearOneValue = annualValuePotential * 0.6;
  const yearTwoValue = annualValuePotential * 0.9;
  const yearThreeValue = annualValuePotential;
  const threeYearValue = yearOneValue + yearTwoValue + yearThreeValue;
  const threeYearNetBenefit = threeYearValue - investmentBasis.totalThreeYearInvestment;
  const threeYearRoi =
    investmentBasis.totalThreeYearInvestment > 0
      ? (threeYearNetBenefit / investmentBasis.totalThreeYearInvestment) * 100
      : 0;
  const paybackMonths = calculatePaybackMonths(annualValuePotential, investmentBasis);
  const investment: BioPilotInvestmentSummary = {
    ...investmentBasis,
    yearOneValue,
    yearTwoValue,
    yearThreeValue,
    threeYearValue,
    netThreeYearBenefit: threeYearNetBenefit,
    paybackMonths,
  };

  const laneScores: AssessmentLane[] = [
    {
      id: "bioreactor-layer",
      label: "Bioreactor And Control Layer",
      currentScore: clamp(
        inputs.bioreactorConnectivity * 0.46 +
          inputs.sensorCoverage * 0.34 +
          inputs.patCoverage * 0.2,
        0,
        100,
      ),
      enabledScore: clamp(
        inputs.bioreactorConnectivity * 0.46 +
          inputs.sensorCoverage * 0.34 +
          inputs.patCoverage * 0.2 +
          enablementMultiplier * 18,
        0,
        100,
      ),
      summary:
        "How ready the process is to unify reactor data, PAT signals, and operator context.",
      leverage:
        "BioPilot matters most here when multiple reactor platforms and manual logging still dominate execution.",
    },
    {
      id: "analytics",
      label: "Analytical And Process Visibility",
      currentScore: clamp(
        inputs.patCoverage * 0.32 +
          inputs.analyzerConnectivity * 0.3 +
          inputs.dataContextualization * 0.38,
        0,
        100,
      ),
      enabledScore: clamp(
        inputs.patCoverage * 0.32 +
          inputs.analyzerConnectivity * 0.3 +
          inputs.dataContextualization * 0.38 +
          enablementMultiplier * 24,
        0,
        100,
      ),
      summary:
        "How quickly the team can translate signals and analyzer results into a usable operating decision.",
      leverage:
        "This is usually where BioPilot turns disconnected process and lab evidence into a single decision surface.",
    },
    {
      id: "guided-operations",
      label: "Guided Execution",
      currentScore: clamp(
        inputs.sopAutomation * 0.44 +
          percentageInverse(inputs.manualTranscriptionShare) * 0.28 +
          percentageInverse(inputs.onboardingDays * 4.2) * 0.28,
        0,
        100,
      ),
      enabledScore: clamp(
        inputs.sopAutomation * 0.44 +
          percentageInverse(inputs.manualTranscriptionShare) * 0.28 +
          percentageInverse(inputs.onboardingDays * 4.2) * 0.28 +
          enablementMultiplier * 26,
        0,
        100,
      ),
      summary:
        "How repeatable operator execution is across shifts, sites, and new team members.",
      leverage:
        "BioPilot creates the most leverage here when SOP steps are still followed manually and tribal knowledge drives consistency.",
    },
    {
      id: "review",
      label: "Review And Release Readiness",
      currentScore: clamp(
        inputs.reviewByException * 0.44 +
          percentageInverse(inputs.batchReviewHours * 3.6) * 0.28 +
          percentageInverse(inputs.deviationInvestigationHours * 4.2) * 0.2 +
          percentageInverse(inputs.failedRunRecoveryHours * 0.7) * 0.08,
        0,
        100,
      ),
      enabledScore: clamp(
        inputs.reviewByException * 0.44 +
          percentageInverse(inputs.batchReviewHours * 3.6) * 0.28 +
          percentageInverse(inputs.deviationInvestigationHours * 4.2) * 0.2 +
          percentageInverse(inputs.failedRunRecoveryHours * 0.7) * 0.08 +
          enablementMultiplier * 24,
        0,
        100,
      ),
      summary:
        "How close the organization is to review-ready evidence instead of post-run evidence assembly.",
      leverage:
        "BioPilot is strong here when investigation and review time are growing faster than run volume.",
    },
    {
      id: "transfer",
      label: "Tech Transfer And Network Scale-Up",
      currentScore: clamp(
        inputs.crossSiteCollaboration * 0.42 +
          percentageInverse(inputs.techTransferPackageHours) * 0.28 +
          percentageInverse(inputs.vendorPlatforms * 10) * 0.12 +
          percentageInverse(inputs.sites * 15) * 0.18,
        0,
        100,
      ),
      enabledScore: clamp(
        inputs.crossSiteCollaboration * 0.42 +
          percentageInverse(inputs.techTransferPackageHours) * 0.28 +
          percentageInverse(inputs.vendorPlatforms * 10) * 0.12 +
          percentageInverse(inputs.sites * 15) * 0.18 +
          enablementMultiplier * 18,
        0,
        100,
      ),
      summary:
        "How efficiently the process can be packaged, explained, and repeated across sites or partners.",
      leverage:
        "This area becomes more important as the process expands beyond one lab or one reactor train.",
    },
  ];

  const plays: BioPilotPlay[] = [
    {
      id: "multivendor",
      title: "Unify Multi-Vendor Bioreactors And Process Evidence",
      summary:
        "Bring reactor, sensor, analyzer, and downstream context into one operating view instead of leaving it distributed across local systems.",
      whyBioPilot:
        "Most useful when the organization runs more than two vendor platforms or struggles to compare runs cleanly.",
      relevanceScore: clamp(
        percentageInverse(inputs.bioreactorConnectivity) * 0.4 +
          Math.min(inputs.vendorPlatforms * 12, 40) * 0.35 +
          percentageInverse(inputs.dataContextualization) * 0.25,
        0,
        100,
      ),
    },
    {
      id: "guided-sop",
      title: "Digitize SOP Execution And Reduce Manual Transcription",
      summary:
        "Turn operator steps, run context, and evidence capture into a guided digital workflow instead of separate manual activities.",
      whyBioPilot:
        "Most useful when transcription and onboarding still consume a visible share of run effort.",
      relevanceScore: clamp(
        inputs.manualTranscriptionShare * 0.42 +
          percentageInverse(inputs.sopAutomation) * 0.38 +
          clamp(inputs.onboardingDays * 4, 0, 100) * 0.2,
        0,
        100,
      ),
    },
    {
      id: "contextualization",
      title: "Connect Online And Off-Line Data Into One Decision Flow",
      summary:
        "Contextualize analyzer results, PAT signals, and process data so the team can act faster and review with less assembly work.",
      whyBioPilot:
        "Most relevant when analyzer data arrives late or is not tied cleanly to the process event that created it.",
      relevanceScore: clamp(
        percentageInverse(inputs.analyzerConnectivity) * 0.34 +
          percentageInverse(inputs.dataContextualization) * 0.34 +
          clamp(inputs.offlineDataDelayHours * 4.2, 0, 100) * 0.32,
        0,
        100,
      ),
    },
    {
      id: "review-ready",
      title: "Move Toward Review-Ready, Exception-Based Evidence",
      summary:
        "Reduce post-run review effort by keeping evidence, context, and SOP execution linked as the run progresses.",
      whyBioPilot:
        "Most relevant when batch review, investigations, and release prep consume specialist time that should be spent on process decisions.",
      relevanceScore: clamp(
        percentageInverse(inputs.reviewByException) * 0.46 +
          clamp(inputs.batchReviewHours * 3.6, 0, 100) * 0.32 +
          clamp(inputs.deviationInvestigationHours * 4.4, 0, 100) * 0.14 +
          clamp(inputs.failedRunRecoveryHours * 0.9, 0, 100) * 0.08,
        0,
        100,
      ),
    },
    {
      id: "failure-risk",
      title: "Reduce Batch Failure And Recovery Exposure",
      summary:
        "Use better monitoring, PAT context, and guided response to reduce failed-run risk and recovery effort.",
      whyBioPilot:
        "Most relevant when recent failure occurrence, failure-cause exposure, or recovery hours are material.",
      relevanceScore: clamp(
        failureRecencyRisk * 0.36 +
          inputs.failureCauseExposureScore * 0.34 +
          clamp(inputs.failedRunRecoveryHours * 0.8, 0, 100) * 0.3,
        0,
        100,
      ),
    },
    {
      id: "transfer",
      title: "Standardize Scale-Up And Tech Transfer Packages",
      summary:
        "Use a reusable digital context instead of rebuilding the process story for each handoff or site expansion.",
      whyBioPilot:
        "Most useful when the organization has more than one site or a visible annual transfer load.",
      relevanceScore: clamp(
        clamp(inputs.techTransferPackageHours, 0, 100) * 0.38 +
          Math.min(inputs.transferEventsPerYear * 12, 100) * 0.34 +
          Math.min(inputs.sites * 20, 100) * 0.28,
        0,
        100,
      ),
    },
  ]
    .sort((left, right) => right.relevanceScore - left.relevanceScore)
    .slice(0, 4);

  const rawSignals: BuyingSignal[] = [
    {
      id: "spreadsheets",
      title: "Spreadsheet-Heavy Run Coordination",
      severity: rankSeverity(
        inputs.manualTranscriptionShare * 0.65 +
          percentageInverse(inputs.sopAutomation) * 0.35,
      ),
      summary:
        "Manual transcription and SOP follow-through are still carrying too much of the operating burden.",
      action:
        "Focus on guided execution, data capture, and operator workflow standardization.",
    },
    {
      id: "review-drag",
      title: "Review And Investigation Drag",
      severity: rankSeverity(
        clamp(inputs.batchReviewHours * 3.2, 0, 100) * 0.58 +
          percentageInverse(inputs.reviewByException) * 0.34 +
          clamp(inputs.failedRunRecoveryHours * 0.8, 0, 100) * 0.08,
      ),
      summary:
        "The organization is still building evidence after the run instead of keeping it review-ready during execution.",
      action:
        "Focus on review-ready evidence, exception handling, and linked process context.",
    },
    {
      id: "batch-failure",
      title: "Batch Failure And Recovery Risk",
      severity: rankSeverity(
        failureRecencyRisk * 0.38 +
          inputs.failureCauseExposureScore * 0.34 +
          clamp(inputs.failedRunRecoveryHours * 0.85, 0, 100) * 0.28,
      ),
      summary:
        "Failure occurrence, root-cause exposure, and recovery effort are large enough to deserve explicit review.",
      action:
        "Validate the last failed run, dominant failure causes, recovery effort, and which process-monitoring or PAT controls would reduce recurrence.",
    },
    {
      id: "late-context",
      title: "Late Analyzer And Process Context",
      severity: rankSeverity(
        clamp(inputs.offlineDataDelayHours * 4.2, 0, 100) * 0.48 +
          percentageInverse(inputs.dataContextualization) * 0.3 +
          percentageInverse(inputs.analyzerConnectivity) * 0.22,
      ),
      summary:
        "The team is waiting too long to turn process and lab data into a usable decision.",
      action:
        "Focus on online plus offline contextualization and faster intervention workflows.",
    },
    {
      id: "multisite",
      title: "Scale-Up And Transfer Friction",
      severity: rankSeverity(
        clamp(inputs.techTransferPackageHours, 0, 100) * 0.46 +
          Math.min(inputs.transferEventsPerYear * 11, 100) * 0.24 +
          Math.min(inputs.sites * 17, 100) * 0.3,
      ),
      summary:
        "The process story is difficult to reuse as the organization crosses sites, partners, or lifecycle stages.",
      action:
        "Focus on reusable process context, package discipline, and cross-site operating consistency.",
    },
    {
      id: "multivendor",
      title: "Fragmented Equipment And Data Stack",
      severity: rankSeverity(
        percentageInverse(inputs.bioreactorConnectivity) * 0.38 +
          percentageInverse(inputs.dataContextualization) * 0.26 +
          Math.min(inputs.vendorPlatforms * 13, 100) * 0.36,
      ),
      summary:
        "The organization is carrying orchestration risk because instruments and data systems do not feel like one operating layer.",
      action:
        "Focus on BioPilot as the unifying layer across bioreactors, PAT, analyzers, and evidence.",
    },
  ];

  const buyingSignals = rawSignals
    .sort((left, right) => {
      const severityWeight = { Critical: 3, Material: 2, Emerging: 1 };
      return severityWeight[right.severity] - severityWeight[left.severity];
    })
    .slice(0, 4);

  const topLever = valueLevers[0];
  const topPlay = plays[0];
  const topSignal = buyingSignals[0];
  const digitalPlantMaturity = buildDigitalPlantMaturity(inputs);
  const evidenceConfidence = buildEvidenceConfidence(evidenceMeta);
  const assumptionTransparency = buildAssumptionTransparency(
    inputs,
    annualRecoveredHours,
    annualValuePotential,
    investment,
    threeYearRoi,
    paybackMonths,
    evidenceMeta,
  );
  const salesFollowUp: SalesFollowUpBrief = {
    priority: topSignal?.title ?? topPlay?.title ?? "Confirm the top operating friction",
    discoveryFocus: [
      "Validate the submitted review, investigation, failure recovery, and transfer effort with one recent run.",
      "Confirm which BioPilot scope maps to the lowest DPMM maturity domain.",
      "Confirm the selected BioPilot scope, customer engineering effort, and optional services before final budget approval.",
    ],
    recommendedAction:
      evidenceConfidence.band === "High"
        ? "Use this report to structure a proposal review and confirm implementation scope."
        : "Use this report to guide discovery, then refresh the estimate after the priority assumptions are confirmed.",
    proposalUse:
      "This calculator connects the operating opportunity to BioPilot subscription scope and customer engineering assumptions. Confirm final commercial terms before budget approval.",
  };

  const formatSentencePhrase = (value: string) =>
    value
      .toLowerCase()
      .replace(/\bsop\b/g, "SOP")
      .replace(/\bpat\b/g, "PAT")
      .replace(/\bqa\b/g, "QA")
      .replace(/\blims\b/g, "LIMS")
      .replace(/\bmes\b/g, "MES");
  const topPlayPhrase = topPlay ? formatSentencePhrase(topPlay.title) : "data and workflow unification";

  const executiveSummary = `${profile.label} in ${stage.label.toLowerCase()} shows a ${fitBand} because the operation still carries ${Math.round(manualBurdenIndex)} / 100 manual burden and only ${Math.round(digitalCoverage)} / 100 digital coverage. The strongest BioPilot priority is ${topPlayPhrase}, which points to an estimated ${annualRecoveredHours.toFixed(0)} annual hours recovered and ${topLever ? `about ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(topLever.annualValue)} in the largest value driver` : "a meaningful value opportunity"}.`;

  const nextStep = topSignal
    ? `Confirm the process around ${formatSentencePhrase(topSignal.title)}, then verify four inputs before relying on the estimate: actual review hours, current failed-run impact, recovery hours, and transfer package effort.`
    : "Confirm the operating data behind the top value driver before relying on the estimate.";

  return {
    modelVersion: BIOPILOT_MODEL_VERSION,
    profile,
    stage,
    digitalCoverage,
    manualBurdenIndex,
    complexityScore,
    fitScore,
    fitBand,
    currentState: {
      manualHoursPerRun: currentManualHoursPerRun,
      reviewHours: currentReviewHours,
      decisionLagHours: currentDecisionLagHours,
      runSuccessRate: currentRunSuccessRate,
      failureRecoveryHours: currentFailureRecoveryHours,
      transferPackageHours: currentTransferPackageHours,
      onboardingDays: currentOnboardingDays,
    },
    bioPilotState: {
      manualHoursPerRun: bioPilotManualHoursPerRun,
      reviewHours: bioPilotReviewHours,
      decisionLagHours: bioPilotDecisionLagHours,
      runSuccessRate: bioPilotRunSuccessRate,
      failureRecoveryHours: bioPilotFailureRecoveryHours,
      transferPackageHours: bioPilotTransferPackageHours,
      onboardingDays: bioPilotOnboardingDays,
    },
    annualRecoveredHours,
    avoidedFailedRuns,
    annualValuePotential,
    threeYearNetBenefit,
    threeYearRoi,
    paybackMonths,
    investment,
    annualDecisionDaysRecovered,
    laneScores,
    plays,
    buyingSignals,
    valueLevers,
    digitalPlantMaturity,
    evidenceConfidence,
    assumptionTransparency,
    salesFollowUp,
    executiveSummary,
    nextStep,
  };
}
