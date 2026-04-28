export type ProcessTemplateId =
  | "mab-cho"
  | "microbial-fermentation"
  | "viral-vector";

export type ScaleProfileId =
  | "development"
  | "clinical"
  | "commercial";

export type InstrumentCategory =
  | "Bioreactors"
  | "Core Sensors"
  | "PAT"
  | "At-Line / Off-Line Analyzers"
  | "Downstream Equipment"
  | "Digital Systems";

export interface InstrumentDefinition {
  name: string;
  role: string;
  category: InstrumentCategory;
  impact: string;
}

export interface UnitOperationDefinition {
  id: string;
  name: string;
  objective: string;
  criticalSignals: string[];
  likelyInstruments: string[];
  sensitivity: {
    sensors: number;
    pat: number;
    analyzers: number;
    automation: number;
    historian: number;
    manualPenalty: number;
  };
}

export interface ProcessTemplate {
  id: ProcessTemplateId;
  name: string;
  modality: string;
  summary: string;
  stageLabel: string;
  scaleProfiles: Array<{
    id: ScaleProfileId;
    label: string;
    summary: string;
    complexityBias: number;
  }>;
  base: {
    manualHoursPerRun: number;
    dataLatencyHours: number;
    runSuccessRate: number;
    yieldStability: number;
    transferReadiness: number;
    qualityReadiness: number;
    transferPackageHours: number;
  };
  coreOutcomes: string[];
  instruments: InstrumentDefinition[];
  unitOperations: UnitOperationDefinition[];
}

export interface SimulatorInputs {
  processTemplateId: ProcessTemplateId;
  scaleProfileId: ScaleProfileId;
  activePrograms: number;
  runsPerYear: number;
  sites: number;
  transferEventsPerYear: number;
  blendedHourlyRate: number;
  costPerFailedRun: number;
  valuePerDayAcceleration: number;
  sensorCoverage: number;
  patCoverage: number;
  analyzerCoverage: number;
  automationCoverage: number;
  historianIntegration: number;
  processMaturity: number;
  manualTranscriptionShare: number;
  samplePullsPerDay: number;
  batchReviewHours: number;
  techTransferPackageHours: number;
  onboardingDays: number;
}

export interface SimulatedUnitOperation extends UnitOperationDefinition {
  effectivenessScore: number;
  diagnosis: string;
}

export interface BottleneckSignal {
  id: string;
  title: string;
  severity: "High" | "Material" | "Watch";
  summary: string;
  indicators: string[];
  levers: string[];
}

export interface ValueLever {
  id: string;
  label: string;
  annualValue: number;
  explanation: string;
}

export interface SimulationResults {
  template: ProcessTemplate;
  scaleProfile: ProcessTemplate["scaleProfiles"][number];
  manualHoursPerRun: number;
  dataLatencyHours: number;
  runSuccessRate: number;
  yieldStability: number;
  transferReadiness: number;
  qualityReadiness: number;
  processEffectiveness: number;
  annualRecoveredHours: number;
  avoidedFailedRuns: number;
  annualValuePotential: number;
  valueLevers: ValueLever[];
  bottlenecks: BottleneckSignal[];
  unitOperations: SimulatedUnitOperation[];
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const PROCESS_TEMPLATES: ProcessTemplate[] = [
  {
    id: "mab-cho",
    name: "mAb / CHO Platform",
    modality: "Monoclonal antibody production with CHO upstream and chromatography-led downstream.",
    summary:
      "Best for teams running fed-batch or perfusion-like antibody workflows that need better run review, PAT coverage, transfer readiness, and batch evidence quality.",
    stageLabel: "Platform biologics",
    scaleProfiles: [
      {
        id: "development",
        label: "Process Development",
        summary: "Scale-down, characterization, and faster learning cycles matter most.",
        complexityBias: 0.92,
      },
      {
        id: "clinical",
        label: "Clinical Scale",
        summary: "Comparability, repeatability, and handoff discipline become more important.",
        complexityBias: 1,
      },
      {
        id: "commercial",
        label: "Commercial Scale",
        summary: "Batch review, release readiness, and network coordination dominate value.",
        complexityBias: 1.08,
      },
    ],
    base: {
      manualHoursPerRun: 30,
      dataLatencyHours: 18,
      runSuccessRate: 89,
      yieldStability: 82,
      transferReadiness: 71,
      qualityReadiness: 74,
      transferPackageHours: 84,
    },
    coreOutcomes: [
      "Reduce manual batch review and reporting effort",
      "Shorten decision lag between culture performance and intervention",
      "Improve comparability between runs and sites",
    ],
    instruments: [
      {
        name: "Single-use or stainless bioreactor",
        role: "Executes inoculum and production culture steps.",
        category: "Bioreactors",
        impact: "Core platform for growth, control, and process consistency.",
      },
      {
        name: "pH, dissolved oxygen, temperature, pressure, level sensors",
        role: "Maintain core process control in seed and production vessels.",
        category: "Core Sensors",
        impact: "Drives baseline control strategy and alarm responsiveness.",
      },
      {
        name: "Off-gas analyzers for O2 and CO2",
        role: "Provide metabolic visibility and gas-transfer insight.",
        category: "Core Sensors",
        impact: "Improves interpretation of culture state and oxygen demand.",
      },
      {
        name: "Capacitance or viable biomass probes",
        role: "Estimate viable cell concentration in near real time.",
        category: "PAT",
        impact: "Improves timing, control, and comparability.",
      },
      {
        name: "Raman / NIR spectroscopy",
        role: "Estimate nutrient and metabolite conditions without repeated manual sampling.",
        category: "PAT",
        impact: "Reduces sample burden and improves earlier intervention.",
      },
      {
        name: "At-line bioanalyzer and cell counter",
        role: "Measure glucose, lactate, ammonia, osmolality, viability, and density.",
        category: "At-Line / Off-Line Analyzers",
        impact: "Supports process understanding and fast run review.",
      },
      {
        name: "Chromatography skids, UF/DF, filtration systems",
        role: "Drive capture, polishing, and final conditioning.",
        category: "Downstream Equipment",
        impact: "Critical for yield, impurity control, and lot genealogy.",
      },
      {
        name: "Historian, MES/EBR, contextualization layer, review dashboards",
        role: "Unify operational and analytical evidence.",
        category: "Digital Systems",
        impact: "Converts raw data into review-ready process evidence.",
      },
    ],
    unitOperations: [
      {
        id: "seed-train",
        name: "Seed Train and Inoculum",
        objective: "Deliver a controlled, repeatable starting condition for production culture.",
        criticalSignals: ["Viability", "growth rate", "pH", "DO", "gas transfer"],
        likelyInstruments: ["Bioreactor", "pH/DO sensors", "Off-gas analyzer", "Cell counter"],
        sensitivity: {
          sensors: 1.1,
          pat: 0.6,
          analyzers: 0.8,
          automation: 0.8,
          historian: 0.6,
          manualPenalty: 0.8,
        },
      },
      {
        id: "production",
        name: "Production Bioreactor",
        objective: "Hold CPPs within a stable operating window and catch drift early.",
        criticalSignals: ["Nutrients", "metabolites", "DO", "pH", "viable biomass"],
        likelyInstruments: ["Bioreactor", "Raman", "Capacitance probe", "At-line analyzer"],
        sensitivity: {
          sensors: 1.2,
          pat: 1.2,
          analyzers: 0.9,
          automation: 1,
          historian: 0.8,
          manualPenalty: 1,
        },
      },
      {
        id: "harvest",
        name: "Harvest and Clarification",
        objective: "Protect product quality while moving out of culture efficiently.",
        criticalSignals: ["Hold time", "filter performance", "pool timing"],
        likelyInstruments: ["Filtration skid", "Pressure sensors", "Hold tracking"],
        sensitivity: {
          sensors: 0.7,
          pat: 0.4,
          analyzers: 0.5,
          automation: 0.8,
          historian: 0.8,
          manualPenalty: 0.7,
        },
      },
      {
        id: "purification",
        name: "Capture and Polishing",
        objective: "Recover product with stable yield and impurity control.",
        criticalSignals: ["Step yield", "column performance", "pool genealogy"],
        likelyInstruments: ["Chromatography skid", "UV", "pressure", "pool analytics"],
        sensitivity: {
          sensors: 0.6,
          pat: 0.4,
          analyzers: 1,
          automation: 0.9,
          historian: 0.9,
          manualPenalty: 0.8,
        },
      },
      {
        id: "release",
        name: "QC, Review, and Release Readiness",
        objective: "Turn run history into a defendable, review-ready evidence package.",
        criticalSignals: ["Review lag", "exceptions", "lot genealogy", "analytical context"],
        likelyInstruments: ["LIMS/QC systems", "Historian", "Review dashboards"],
        sensitivity: {
          sensors: 0.2,
          pat: 0.2,
          analyzers: 1,
          automation: 0.8,
          historian: 1.2,
          manualPenalty: 1.2,
        },
      },
    ],
  },
  {
    id: "microbial-fermentation",
    name: "Microbial Fermentation",
    modality: "Aerobic or anaerobic fermentation with strong dependence on gas transfer, feed strategy, and metabolic control.",
    summary:
      "Best for teams running microbial processes where off-gas, foam, feed dynamics, and manual sampling create high operational variability.",
    stageLabel: "Fermentation",
    scaleProfiles: [
      {
        id: "development",
        label: "Process Development",
        summary: "Focus is on strain behavior, feed strategy, and robust scale-down data.",
        complexityBias: 0.94,
      },
      {
        id: "clinical",
        label: "Pilot / Clinical",
        summary: "Operational robustness and historian context start to dominate.",
        complexityBias: 1,
      },
      {
        id: "commercial",
        label: "Commercial",
        summary: "Execution consistency and release timing become the main levers.",
        complexityBias: 1.1,
      },
    ],
    base: {
      manualHoursPerRun: 28,
      dataLatencyHours: 16,
      runSuccessRate: 87,
      yieldStability: 79,
      transferReadiness: 69,
      qualityReadiness: 72,
      transferPackageHours: 72,
    },
    coreOutcomes: [
      "Reduce sample-heavy control loops",
      "Improve metabolic visibility during feed and oxygen-transfer transitions",
      "Shorten manual troubleshooting after excursions",
    ],
    instruments: [
      {
        name: "Seed and production fermenters",
        role: "Run core inoculum and production phases.",
        category: "Bioreactors",
        impact: "Central execution environment for process performance.",
      },
      {
        name: "pH, DO, temperature, pressure, foam, agitation sensors",
        role: "Capture fermentation control conditions.",
        category: "Core Sensors",
        impact: "Essential for fast response to metabolic change.",
      },
      {
        name: "Off-gas analyzers and biomass probes",
        role: "Track oxygen uptake, carbon evolution, and biomass growth.",
        category: "PAT",
        impact: "Critical for feed, aeration, and oxygen-transfer decisions.",
      },
      {
        name: "At-line metabolite analyzers",
        role: "Measure substrate, product, and by-product concentrations.",
        category: "At-Line / Off-Line Analyzers",
        impact: "Reduces guesswork in feed and harvest timing.",
      },
      {
        name: "Filtration, centrifugation, capture systems",
        role: "Drive broth clarification and downstream entry.",
        category: "Downstream Equipment",
        impact: "Determines recovery consistency after fermentation.",
      },
      {
        name: "Historian, automation layer, contextual analytics",
        role: "Join sensor, analyzer, and event data for faster review.",
        category: "Digital Systems",
        impact: "Turns dynamic fermentation data into decision-ready context.",
      },
    ],
    unitOperations: [
      {
        id: "inoculum",
        name: "Inoculum Train",
        objective: "Create stable biomass and handoff timing into the main fermenter.",
        criticalSignals: ["Biomass", "viability", "oxygen demand"],
        likelyInstruments: ["Fermenter", "pH/DO", "Cell counter"],
        sensitivity: {
          sensors: 1,
          pat: 0.7,
          analyzers: 0.7,
          automation: 0.7,
          historian: 0.5,
          manualPenalty: 0.7,
        },
      },
      {
        id: "feed-control",
        name: "Production and Feed Control",
        objective: "Manage oxygen transfer, feed, and metabolism without large drift.",
        criticalSignals: ["OUR/CER", "substrate", "foam", "DO", "biomass"],
        likelyInstruments: ["Off-gas analyzer", "Foam sensor", "Metabolite analyzer"],
        sensitivity: {
          sensors: 1.1,
          pat: 1.1,
          analyzers: 1,
          automation: 1,
          historian: 0.7,
          manualPenalty: 1,
        },
      },
      {
        id: "harvest-fermentation",
        name: "Harvest and Cell Removal",
        objective: "Preserve product while moving efficiently into recovery steps.",
        criticalSignals: ["Harvest timing", "hold conditions", "solids load"],
        likelyInstruments: ["Centrifuge", "Filtration skid", "Pressure sensors"],
        sensitivity: {
          sensors: 0.7,
          pat: 0.3,
          analyzers: 0.6,
          automation: 0.8,
          historian: 0.8,
          manualPenalty: 0.7,
        },
      },
      {
        id: "recovery",
        name: "Recovery and Purification",
        objective: "Maintain recovery and impurity control after fermentation.",
        criticalSignals: ["Recovery yield", "impurity load", "pool quality"],
        likelyInstruments: ["Capture skid", "Analytics", "Pool tracking"],
        sensitivity: {
          sensors: 0.5,
          pat: 0.3,
          analyzers: 1,
          automation: 0.8,
          historian: 1,
          manualPenalty: 0.8,
        },
      },
    ],
  },
  {
    id: "viral-vector",
    name: "Viral Vector",
    modality: "Transient transfection or infection-based vector production with complex upstream variability and evidence-heavy handoffs.",
    summary:
      "Best for AAV and related vector teams where transfer readiness, evidence packaging, run variability, and manual data reconciliation are substantial bottlenecks.",
    stageLabel: "Advanced modalities",
    scaleProfiles: [
      {
        id: "development",
        label: "Process Development",
        summary: "Optimize transfection, infection, and downstream recovery knowledge.",
        complexityBias: 0.96,
      },
      {
        id: "clinical",
        label: "Clinical Manufacturing",
        summary: "Data lineage and exception handling become much more important.",
        complexityBias: 1.03,
      },
      {
        id: "commercial",
        label: "Commercial Readiness",
        summary: "Handoffs, release evidence, and cross-site repeatability dominate.",
        complexityBias: 1.12,
      },
    ],
    base: {
      manualHoursPerRun: 36,
      dataLatencyHours: 24,
      runSuccessRate: 84,
      yieldStability: 73,
      transferReadiness: 63,
      qualityReadiness: 68,
      transferPackageHours: 118,
    },
    coreOutcomes: [
      "Reduce manual reconciliation across high-variability runs",
      "Improve comparability and transfer evidence",
      "Tighten decision loops around yield, quality, and exception review",
    ],
    instruments: [
      {
        name: "Single-use bioreactors and rocking systems",
        role: "Support expansion and production phases for adherent or suspension workflows.",
        category: "Bioreactors",
        impact: "Execution base for complex cell and vector behavior.",
      },
      {
        name: "pH, DO, temperature, agitation, pressure sensors",
        role: "Provide core control coverage.",
        category: "Core Sensors",
        impact: "Required but often insufficient alone for process understanding.",
      },
      {
        name: "Capacitance, Raman, off-gas, soft sensors",
        role: "Improve visibility into cell health, biomass, and process drift.",
        category: "PAT",
        impact: "Critical when manual sampling is expensive and slow.",
      },
      {
        name: "At-line bioanalyzers, qPCR/ddPCR, titer and impurity assays",
        role: "Generate the analytical evidence needed for release and transfer.",
        category: "At-Line / Off-Line Analyzers",
        impact: "Strong driver of decision lag and evidence quality.",
      },
      {
        name: "Clarification, chromatography, TFF, UF/DF systems",
        role: "Support downstream recovery and final conditioning.",
        category: "Downstream Equipment",
        impact: "Important for yield and impurity control across sensitive material.",
      },
      {
        name: "Historian, contextualization, transfer packet builder, review workspace",
        role: "Combine run, analytical, and quality signals into one evidence thread.",
        category: "Digital Systems",
        impact: "Often the largest hidden value lever in advanced therapy operations.",
      },
    ],
    unitOperations: [
      {
        id: "expansion",
        name: "Expansion and Readiness",
        objective: "Move into production at the right cell state and timing window.",
        criticalSignals: ["Cell health", "growth state", "readiness timing"],
        likelyInstruments: ["Bioreactor", "Capacitance", "Cell counter"],
        sensitivity: {
          sensors: 0.9,
          pat: 0.9,
          analyzers: 0.8,
          automation: 0.7,
          historian: 0.6,
          manualPenalty: 0.8,
        },
      },
      {
        id: "transfection",
        name: "Transfection / Infection Window",
        objective: "Protect a narrow operating window with good timing and fast feedback.",
        criticalSignals: ["Timing", "cell condition", "process drift"],
        likelyInstruments: ["PAT", "At-line analyzer", "Historian"],
        sensitivity: {
          sensors: 0.9,
          pat: 1.2,
          analyzers: 1,
          automation: 0.9,
          historian: 0.8,
          manualPenalty: 1,
        },
      },
      {
        id: "vector-harvest",
        name: "Harvest and Clarification",
        objective: "Protect fragile material and preserve traceable recovery conditions.",
        criticalSignals: ["Hold time", "shear risk", "clarification timing"],
        likelyInstruments: ["Filtration", "Pressure", "Hold tracking"],
        sensitivity: {
          sensors: 0.6,
          pat: 0.4,
          analyzers: 0.7,
          automation: 0.8,
          historian: 0.9,
          manualPenalty: 0.8,
        },
      },
      {
        id: "vector-purification",
        name: "Purification and Final Conditioning",
        objective: "Preserve yield while controlling impurity and consistency.",
        criticalSignals: ["Yield", "impurity", "pool context"],
        likelyInstruments: ["Chromatography", "TFF", "Analytics"],
        sensitivity: {
          sensors: 0.4,
          pat: 0.3,
          analyzers: 1.1,
          automation: 0.8,
          historian: 1,
          manualPenalty: 0.8,
        },
      },
      {
        id: "vector-review",
        name: "Transfer, Review, and Release Packet",
        objective: "Turn a complex run into a reusable, defendable evidence package.",
        criticalSignals: ["Review lag", "traceability", "analytical linkage"],
        likelyInstruments: ["Historian", "Review workspace", "Transfer packet builder"],
        sensitivity: {
          sensors: 0.2,
          pat: 0.2,
          analyzers: 1,
          automation: 0.7,
          historian: 1.3,
          manualPenalty: 1.3,
        },
      },
    ],
  },
];

export const PROCESS_TEMPLATE_MAP = Object.fromEntries(
  PROCESS_TEMPLATES.map((template) => [template.id, template]),
) as Record<ProcessTemplateId, ProcessTemplate>;

export const DEFAULT_SIMULATOR_INPUTS: SimulatorInputs = {
  processTemplateId: "mab-cho",
  scaleProfileId: "clinical",
  activePrograms: 6,
  runsPerYear: 180,
  sites: 2,
  transferEventsPerYear: 6,
  blendedHourlyRate: 165,
  costPerFailedRun: 65000,
  valuePerDayAcceleration: 90000,
  sensorCoverage: 72,
  patCoverage: 38,
  analyzerCoverage: 52,
  automationCoverage: 48,
  historianIntegration: 46,
  processMaturity: 58,
  manualTranscriptionShare: 44,
  samplePullsPerDay: 7,
  batchReviewHours: 14,
  techTransferPackageHours: 88,
  onboardingDays: 12,
};

export const DEMO_CONFIGS: Array<{
  id: string;
  label: string;
  description: string;
  inputs: SimulatorInputs;
}> = [
  {
    id: "mab-manual-heavy",
    label: "mAb Manual Review Burden",
    description:
      "A biologics team with decent base sensing but weak PAT, fragmented review, and heavy manual batch assembly.",
    inputs: {
      ...DEFAULT_SIMULATOR_INPUTS,
      processTemplateId: "mab-cho",
      scaleProfileId: "clinical",
      patCoverage: 32,
      analyzerCoverage: 48,
      automationCoverage: 42,
      historianIntegration: 38,
      manualTranscriptionShare: 52,
      batchReviewHours: 18,
      techTransferPackageHours: 96,
    },
  },
  {
    id: "vector-transfer-heavy",
    label: "Viral Vector Transfer Friction",
    description:
      "A vector program where transfer packets, analytical linkage, and cross-site coordination dominate the value story.",
    inputs: {
      ...DEFAULT_SIMULATOR_INPUTS,
      processTemplateId: "viral-vector",
      scaleProfileId: "clinical",
      activePrograms: 4,
      runsPerYear: 120,
      sites: 3,
      transferEventsPerYear: 10,
      blendedHourlyRate: 178,
      costPerFailedRun: 88000,
      valuePerDayAcceleration: 140000,
      sensorCoverage: 64,
      patCoverage: 28,
      analyzerCoverage: 58,
      automationCoverage: 40,
      historianIntegration: 30,
      processMaturity: 46,
      manualTranscriptionShare: 55,
      samplePullsPerDay: 9,
      batchReviewHours: 21,
      techTransferPackageHours: 140,
      onboardingDays: 16,
    },
  },
  {
    id: "fermentation-optimized",
    label: "Fermentation Control Upgrade",
    description:
      "A fermentation operation with stronger PAT, better historian integration, and lower sample burden.",
    inputs: {
      ...DEFAULT_SIMULATOR_INPUTS,
      processTemplateId: "microbial-fermentation",
      scaleProfileId: "commercial",
      activePrograms: 8,
      runsPerYear: 240,
      sites: 2,
      transferEventsPerYear: 4,
      blendedHourlyRate: 150,
      costPerFailedRun: 54000,
      valuePerDayAcceleration: 65000,
      sensorCoverage: 82,
      patCoverage: 68,
      analyzerCoverage: 70,
      automationCoverage: 74,
      historianIntegration: 78,
      processMaturity: 72,
      manualTranscriptionShare: 24,
      samplePullsPerDay: 4,
      batchReviewHours: 8,
      techTransferPackageHours: 56,
      onboardingDays: 8,
    },
  },
];

const severityFromScore = (score: number): BottleneckSignal["severity"] => {
  if (score >= 7) {
    return "High";
  }

  if (score >= 4) {
    return "Material";
  }

  return "Watch";
};

const scoreUnitOperation = (
  unitOperation: UnitOperationDefinition,
  inputs: SimulatorInputs,
  template: ProcessTemplate,
  scaleBias: number,
): SimulatedUnitOperation => {
  const coverageScore =
    inputs.sensorCoverage * unitOperation.sensitivity.sensors +
    inputs.patCoverage * unitOperation.sensitivity.pat +
    inputs.analyzerCoverage * unitOperation.sensitivity.analyzers +
    inputs.automationCoverage * unitOperation.sensitivity.automation +
    inputs.historianIntegration * unitOperation.sensitivity.historian;

  const coverageWeight =
    unitOperation.sensitivity.sensors +
    unitOperation.sensitivity.pat +
    unitOperation.sensitivity.analyzers +
    unitOperation.sensitivity.automation +
    unitOperation.sensitivity.historian;

  const normalizedCoverage = coverageScore / Math.max(coverageWeight, 1);
  const manualPenalty =
    (inputs.manualTranscriptionShare / 100) * 24 * unitOperation.sensitivity.manualPenalty +
    (inputs.samplePullsPerDay / 12) * 12 +
    (inputs.batchReviewHours / 24) * 10 +
    (Math.max(inputs.sites - 1, 0) / 4) * 8 * scaleBias;

  const effectivenessScore = clamp(
    44 + normalizedCoverage * 0.48 + inputs.processMaturity * 0.22 - manualPenalty,
    32,
    98,
  );

  const diagnosis =
    effectivenessScore >= 80
      ? "This unit operation is comparatively well supported by the current instrumentation and digital workflow."
      : effectivenessScore >= 65
        ? "This unit operation is workable, but there is still enough manual burden to slow review and reaction time."
        : "This unit operation is likely absorbing avoidable effort because instrumentation coverage and digital context are not strong enough.";

  return {
    ...unitOperation,
    effectivenessScore,
    diagnosis,
  };
};

export const simulateBioprocess = (inputs: SimulatorInputs): SimulationResults => {
  const template = PROCESS_TEMPLATE_MAP[inputs.processTemplateId];
  const scaleProfile =
    template.scaleProfiles.find((profile) => profile.id === inputs.scaleProfileId) ??
    template.scaleProfiles[0];
  const scaleBias = scaleProfile.complexityBias;

  const manualIndex =
    (inputs.manualTranscriptionShare / 100) * 1.2 +
    (inputs.samplePullsPerDay / 12) * 0.65 +
    (inputs.batchReviewHours / 24) * 0.7 +
    (inputs.onboardingDays / 20) * 0.25 +
    (Math.max(inputs.sites - 1, 0) / 4) * 0.35 * scaleBias +
    (inputs.techTransferPackageHours / template.base.transferPackageHours) * 0.45;

  const digitalIndex =
    (inputs.sensorCoverage / 100) * 0.9 +
    (inputs.patCoverage / 100) * 0.9 +
    (inputs.analyzerCoverage / 100) * 0.75 +
    (inputs.automationCoverage / 100) * 0.95 +
    (inputs.historianIntegration / 100) * 0.95 +
    (inputs.processMaturity / 100) * 0.65;

  const manualHoursPerRun = clamp(
    template.base.manualHoursPerRun *
      (1 + manualIndex * 0.32 - digitalIndex * 0.28) *
      scaleBias,
    5,
    120,
  );

  const dataLatencyHours = clamp(
    template.base.dataLatencyHours *
      (1 +
        (inputs.manualTranscriptionShare / 100) * 0.8 +
        (inputs.samplePullsPerDay / 20) * 0.28 +
        (inputs.batchReviewHours / 24) * 0.22 -
        (inputs.historianIntegration / 100) * 0.55 -
        (inputs.analyzerCoverage / 100) * 0.22 -
        (inputs.patCoverage / 100) * 0.18) *
      scaleBias,
    2,
    96,
  );

  const runSuccessRate = clamp(
    template.base.runSuccessRate +
      inputs.sensorCoverage * 0.05 +
      inputs.patCoverage * 0.05 +
      inputs.analyzerCoverage * 0.02 +
      inputs.automationCoverage * 0.03 +
      inputs.processMaturity * 0.04 -
      inputs.manualTranscriptionShare * 0.04 -
      Math.max(inputs.sites - 1, 0) * 1.1 * scaleBias,
    68,
    99,
  );

  const yieldStability = clamp(
    template.base.yieldStability +
      inputs.sensorCoverage * 0.06 +
      inputs.patCoverage * 0.05 +
      inputs.analyzerCoverage * 0.04 +
      inputs.processMaturity * 0.05 -
      inputs.samplePullsPerDay * 0.55 -
      inputs.manualTranscriptionShare * 0.03,
    58,
    99,
  );

  const transferReadiness = clamp(
    template.base.transferReadiness +
      inputs.historianIntegration * 0.07 +
      inputs.automationCoverage * 0.03 +
      inputs.processMaturity * 0.05 -
      (inputs.techTransferPackageHours / template.base.transferPackageHours) * 14 -
      Math.max(inputs.sites - 1, 0) * 1.8 * scaleBias,
    35,
    99,
  );

  const qualityReadiness = clamp(
    template.base.qualityReadiness +
      inputs.analyzerCoverage * 0.05 +
      inputs.historianIntegration * 0.05 +
      inputs.automationCoverage * 0.025 -
      inputs.batchReviewHours * 0.45 -
      inputs.manualTranscriptionShare * 0.025,
    40,
    99,
  );

  const processEffectiveness = clamp(
    runSuccessRate * 0.26 +
      yieldStability * 0.22 +
      transferReadiness * 0.18 +
      qualityReadiness * 0.18 +
      (100 - dataLatencyHours) * 0.08 +
      (100 - manualHoursPerRun) * 0.08,
    0,
    99,
  );

  const annualRecoveredHours = Math.max(
    0,
    (template.base.manualHoursPerRun * scaleBias - manualHoursPerRun) * inputs.runsPerYear,
  );

  const baselineFailedRuns =
    inputs.runsPerYear * ((100 - template.base.runSuccessRate) / 100);
  const simulatedFailedRuns = inputs.runsPerYear * ((100 - runSuccessRate) / 100);
  const avoidedFailedRuns = Math.max(0, baselineFailedRuns - simulatedFailedRuns);

  const laborValue = annualRecoveredHours * inputs.blendedHourlyRate;
  const failureValue = avoidedFailedRuns * inputs.costPerFailedRun;
  const decisionValue = Math.max(
    0,
    ((template.base.dataLatencyHours * scaleBias - dataLatencyHours) / 24) *
      inputs.valuePerDayAcceleration *
      Math.min(inputs.activePrograms, 12) *
      0.72,
  );
  const transferValue = Math.max(
    0,
    (template.base.transferPackageHours - inputs.techTransferPackageHours) *
      inputs.transferEventsPerYear *
      inputs.blendedHourlyRate *
      0.62,
  );
  const releaseValue =
    Math.max(0, qualityReadiness - template.base.qualityReadiness) *
    inputs.runsPerYear *
    inputs.costPerFailedRun *
    0.006;

  const valueLevers: ValueLever[] = [
    {
      id: "labor",
      label: "Recovered manual execution and review time",
      annualValue: laborValue,
      explanation:
        "Captures lower reporting, review, and reconciliation burden across runs.",
    },
    {
      id: "failure",
      label: "Avoided failed or unrecoverable runs",
      annualValue: failureValue,
      explanation:
        "Uses the change in simulated run success as a directional proxy for avoided run loss.",
    },
    {
      id: "decision",
      label: "Faster process and portfolio decisions",
      annualValue: decisionValue,
      explanation:
        "Uses reduced data latency as a proxy for faster intervention and program decisions.",
    },
    {
      id: "transfer",
      label: "Lower transfer and package assembly burden",
      annualValue: transferValue,
      explanation:
        "Values shorter transfer package effort across internal or partner handoffs.",
    },
    {
      id: "release",
      label: "Lower release and investigation friction",
      annualValue: releaseValue,
      explanation:
        "Uses better review readiness as a directional proxy for less quality drag.",
    },
  ].sort((left, right) => right.annualValue - left.annualValue);

  const annualValuePotential = valueLevers.reduce(
    (sum, lever) => sum + lever.annualValue,
    0,
  );

  const bottleneckScores = [
    {
      id: "manual-data",
      title: "Manual data assembly",
      score:
        (inputs.manualTranscriptionShare >= 50 ? 4 : inputs.manualTranscriptionShare >= 30 ? 2 : 1) +
        (inputs.historianIntegration <= 35 ? 3 : inputs.historianIntegration <= 55 ? 2 : 0) +
        (inputs.batchReviewHours >= 16 ? 2 : inputs.batchReviewHours >= 10 ? 1 : 0),
      summary:
        "Run context is likely split across spreadsheets, reports, and disconnected systems.",
      indicators: [
        `${inputs.manualTranscriptionShare}% of the workflow is still being transcribed or reconciled manually.`,
        `${inputs.batchReviewHours} batch review hours are required per run.`,
        `${inputs.historianIntegration}% historian / contextualization coverage is in place.`,
      ],
      levers: [
        "Increase historian and contextualization coverage",
        "Automate review-ready report assembly",
        "Reduce duplicate manual transcription steps",
      ],
    },
    {
      id: "process-observability",
      title: "Process observability gap",
      score:
        (inputs.sensorCoverage <= 55 ? 3 : inputs.sensorCoverage <= 75 ? 1 : 0) +
        (inputs.patCoverage <= 35 ? 3 : inputs.patCoverage <= 60 ? 1 : 0) +
        (inputs.samplePullsPerDay >= 8 ? 2 : inputs.samplePullsPerDay >= 5 ? 1 : 0),
      summary:
        "The process likely depends too heavily on delayed or manual observations.",
      indicators: [
        `${inputs.sensorCoverage}% core sensor coverage is in place.`,
        `${inputs.patCoverage}% PAT coverage is in place.`,
        `${inputs.samplePullsPerDay} manual sample pulls are performed per day.`,
      ],
      levers: [
        "Expand in-line or near real-time sensing",
        "Introduce PAT where sampling burden is highest",
        "Tie measurements to event context for earlier intervention",
      ],
    },
    {
      id: "analytics-review",
      title: "Analytical and review latency",
      score:
        (inputs.analyzerCoverage <= 45 ? 3 : inputs.analyzerCoverage <= 65 ? 1 : 0) +
        (dataLatencyHours >= 24 ? 3 : dataLatencyHours >= 12 ? 2 : 0) +
        (qualityReadiness <= 70 ? 2 : qualityReadiness <= 80 ? 1 : 0),
      summary:
        "Analytics and review appear to be pacing decisions more than the physical process itself.",
      indicators: [
        `${inputs.analyzerCoverage}% analyzer coverage is in place.`,
        `${Math.round(dataLatencyHours)} hours of simulated data-to-decision latency remain.`,
        `${Math.round(qualityReadiness)} quality-readiness score is projected.`,
      ],
      levers: [
        "Improve at-line analyzer integration",
        "Reduce manual review packet assembly",
        "Link QC evidence directly to run context",
      ],
    },
    {
      id: "transfer-network",
      title: "Transfer and network coordination",
      score:
        (inputs.techTransferPackageHours >= 110
          ? 3
          : inputs.techTransferPackageHours >= 70
            ? 2
            : 0) +
        (inputs.sites >= 3 ? 2 : inputs.sites >= 2 ? 1 : 0) +
        (inputs.transferEventsPerYear >= 8 ? 2 : inputs.transferEventsPerYear >= 4 ? 1 : 0),
      summary:
        "Cross-site or cross-partner handoffs are likely consuming a material amount of effort.",
      indicators: [
        `${inputs.techTransferPackageHours} hours are spent on each transfer package.`,
        `${inputs.sites} sites are operating in the current model.`,
        `${inputs.transferEventsPerYear} transfer events occur each year.`,
      ],
      levers: [
        "Standardize reusable transfer packets",
        "Improve cross-site naming, parameter, and evidence alignment",
        "Shorten manual packet assembly and clarification loops",
      ],
    },
    {
      id: "workforce-ramp",
      title: "Workforce ramp and operating discipline",
      score:
        (inputs.onboardingDays >= 14 ? 2 : inputs.onboardingDays >= 8 ? 1 : 0) +
        (inputs.automationCoverage <= 45 ? 2 : inputs.automationCoverage <= 65 ? 1 : 0) +
        (processEffectiveness <= 70 ? 2 : processEffectiveness <= 82 ? 1 : 0),
      summary:
        "The process likely depends too much on local expertise instead of repeatable guided execution.",
      indicators: [
        `${inputs.onboardingDays} days are needed for ramp-up.`,
        `${inputs.automationCoverage}% automation coverage is currently modeled.`,
        `${Math.round(processEffectiveness)} overall process effectiveness is projected.`,
      ],
      levers: [
        "Improve guided execution and digital work instructions",
        "Reduce role-specific manual interpretation",
        "Use context-rich onboarding and review views",
      ],
    },
  ];

  const bottlenecks: BottleneckSignal[] = bottleneckScores
    .map((item) => ({
      ...item,
      severity: severityFromScore(item.score),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  const unitOperations = template.unitOperations.map((unitOperation) =>
    scoreUnitOperation(unitOperation, inputs, template, scaleBias),
  );

  return {
    template,
    scaleProfile,
    manualHoursPerRun,
    dataLatencyHours,
    runSuccessRate,
    yieldStability,
    transferReadiness,
    qualityReadiness,
    processEffectiveness,
    annualRecoveredHours,
    avoidedFailedRuns,
    annualValuePotential,
    valueLevers,
    bottlenecks,
    unitOperations,
  };
};
