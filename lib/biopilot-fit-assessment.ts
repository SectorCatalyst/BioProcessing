export type ProcessProfileId =
  | "mab-cho"
  | "biosimilar-antibody"
  | "recombinant-protein"
  | "microbial-fermentation"
  | "vaccines"
  | "viral-vector"
  | "plasmid-dna"
  | "mrna-rna"
  | "sirna"
  | "cell-therapy"
  | "regenerative-medicine";

export type LifecycleStageId =
  | "process-development"
  | "late-development"
  | "clinical-manufacturing"
  | "commercial-scale";

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
  techTransferPackageHours: number;
  onboardingDays: number;
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
  transferPackageHours: number;
  onboardingDays: number;
}

export interface BioPilotAssessmentResults {
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
  annualDecisionDaysRecovered: number;
  laneScores: AssessmentLane[];
  plays: BioPilotPlay[];
  buyingSignals: BuyingSignal[];
  valueLevers: ValueLever[];
  executiveSummary: string;
  nextStep: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

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
      "Seed and production bioreactor orchestration",
      "At-line and off-line analytical context",
      "Batch review readiness",
      "Comparability and tech transfer packages",
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
    label: "Biosimilars and Antibody Variants",
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
      "Comparability package assembly",
      "Analytical consistency across lots",
      "Cross-site method and process alignment",
      "Change impact review discipline",
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
    label: "Recombinant Proteins and Enzymes",
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
      "Upstream to downstream visibility",
      "Faster interpretation of analytical evidence",
      "Process consistency across campaigns",
      "Scale-up and site handoff readiness",
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
      "High-frequency run monitoring",
      "Feed strategy and intervention timing",
      "Rapid review of analyzer evidence",
      "Operator consistency across shifts",
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
      "Campaign and release coordination",
      "Batch review and deviation readiness",
      "Cross-functional evidence visibility",
      "Scale and site consistency",
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
      "Sensitive upstream control windows",
      "Analytics-heavy decision chains",
      "Deviation and investigation effort",
      "Comparability and transfer readiness",
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
      "Fermentation and feed visibility",
      "Purification and release evidence alignment",
      "Template and lot traceability",
      "Transfer-ready operating history",
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
    label: "mRNA and RNA Therapeutics",
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
      "Template-to-batch context continuity",
      "Purification and formulation visibility",
      "Release readiness and evidence assembly",
      "Faster process learning cycles",
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
  {
    id: "sirna",
    label: "siRNA and Oligonucleotide Therapeutics",
    modality:
      "siRNA, antisense, and related oligonucleotide workflows spanning synthesis, purification, formulation, and analytical release.",
    summary:
      "Best for teams that need cleaner continuity from oligo synthesis or assembly through purification, formulation, and release review.",
    bioPilotFit:
      "BioPilot is relevant when synthesis records, purification evidence, formulation context, and analytical release data still have to be reconciled manually across teams and systems.",
    base: {
      manualHoursPerRun: 19,
      reviewHours: 19,
      decisionLagHours: 13,
      transferPackageHours: 70,
      runSuccessRate: 87,
      deviationRate: 0.1,
    },
    focusAreas: [
      "Synthesis-to-batch context continuity",
      "Purification and formulation visibility",
      "Analytical release readiness",
      "Cross-site transfer discipline",
    ],
    instrumentStack: [
      {
        category: "Synthesis and reaction operations",
        examples:
          "Oligonucleotide synthesizers, reaction skids, cleavage and deprotection steps, controlled hold conditions",
        whyItMatters:
          "The operating record has to stay coherent from synthesis through downstream handling.",
      },
      {
        category: "Purification and formulation",
        examples:
          "Chromatography, TFF, filtration, buffer exchange, LNP mixing, controlled formulation equipment",
        whyItMatters:
          "Product quality decisions depend on linking purification and formulation evidence back to the run context.",
      },
      {
        category: "Analytics and digital review",
        examples:
          "HPLC, UV, LC-MS support data, particle characterization, contextualized review records, guided SOPs",
        whyItMatters:
          "Manual stitching between synthesis, analytics, and release evidence creates avoidable review and transfer drag.",
      },
    ],
  },
  {
    id: "cell-therapy",
    label: "Cell Therapy",
    modality: "Autologous or allogeneic workflows where chain of identity, coordination, and operator consistency dominate execution risk.",
    summary:
      "Best for teams where orchestration, manual SOP execution, deviations, and training consistency are limiting throughput or release confidence.",
    bioPilotFit:
      "BioPilot fits when cross-functional execution is still manual and the organization needs a stronger digital operating layer across instruments and evidence.",
    base: {
      manualHoursPerRun: 28,
      reviewHours: 22,
      decisionLagHours: 14,
      transferPackageHours: 72,
      runSuccessRate: 84,
      deviationRate: 0.13,
    },
    focusAreas: [
      "Guided execution and SOP adherence",
      "Operator ramp and repeatability",
      "Evidence capture for review",
      "Cross-functional coordination",
    ],
    instrumentStack: [
      {
        category: "Bioprocess equipment",
        examples: "Cell culture systems, incubators, closed processing equipment, centrifuges",
        whyItMatters: "Execution consistency matters as much as instrument data.",
      },
      {
        category: "Measurement and analytics",
        examples: "Cell counters, viability analyzers, environmental monitoring, offline assays",
        whyItMatters: "The decision chain often depends on evidence collected from several locations.",
      },
      {
        category: "Digital execution",
        examples: "Guided SOPs, run records, exception handling, review-ready context",
        whyItMatters: "BioPilot can add most value where manual coordination is still the bottleneck.",
      },
    ],
  },
  {
    id: "regenerative-medicine",
    label: "Regenerative Medicine and Stem Cell",
    modality: "Stem cell, iPSC, organoid, and regenerative medicine workflows where operator consistency, growth conditions, and traceable evidence are critical.",
    summary:
      "Best for teams that need more disciplined execution, stronger evidence capture, and a clearer digital operating layer across sensitive workflows.",
    bioPilotFit:
      "BioPilot is relevant when regenerative workflows still depend on local know-how, manual SOP follow-through, and fragmented evidence capture.",
    base: {
      manualHoursPerRun: 26,
      reviewHours: 20,
      decisionLagHours: 15,
      transferPackageHours: 70,
      runSuccessRate: 85,
      deviationRate: 0.11,
    },
    focusAreas: [
      "Guided operator execution",
      "Culture condition traceability",
      "Evidence capture for review",
      "Process repeatability during scale and transfer",
    ],
    instrumentStack: [
      {
        category: "Culture and processing systems",
        examples: "Bioreactors, incubators, closed processing equipment, centrifuges, controlled environments",
        whyItMatters: "Execution consistency has to be preserved across a sensitive workflow.",
      },
      {
        category: "Monitoring and analytics",
        examples: "Cell counters, viability analyzers, metabolite checks, environmental monitoring, offline assays",
        whyItMatters: "The team needs faster access to evidence without losing context.",
      },
      {
        category: "Execution and review systems",
        examples: "Guided SOPs, event records, review dashboards, exception handling, release packages",
        whyItMatters: "This is where BioPilot can reduce training burden and review drag.",
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
  blendedHourlyRate: 150,
  costPerFailedRun: 85000,
  valuePerDayAcceleration: 40000,
  plannedProgramInvestment: 320000,
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
      valuePerDayAcceleration: 28000,
      plannedProgramInvestment: 220000,
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
      plannedProgramInvestment: 340000,
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
      costPerFailedRun: 120000,
      valuePerDayAcceleration: 52000,
      plannedProgramInvestment: 460000,
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
      techTransferPackageHours: 102,
      onboardingDays: 20,
    },
  },
  {
    id: "sirna-launch-readiness",
    label: "siRNA Launch Readiness",
    description:
      "An oligonucleotide program carrying synthesis, purification, formulation, and release evidence across several systems with heavy review drag.",
    inputs: {
      ...DEFAULT_BIOPILOT_ASSESSMENT_INPUTS,
      processProfileId: "sirna",
      lifecycleStageId: "late-development",
      activePrograms: 3,
      runsPerYear: 48,
      sites: 2,
      transferEventsPerYear: 4,
      vendorPlatforms: 5,
      blendedHourlyRate: 160,
      costPerFailedRun: 95000,
      valuePerDayAcceleration: 46000,
      plannedProgramInvestment: 290000,
      bioreactorConnectivity: 20,
      sensorCoverage: 46,
      patCoverage: 28,
      analyzerConnectivity: 38,
      downstreamVisibility: 44,
      dataContextualization: 26,
      sopAutomation: 24,
      reviewByException: 18,
      crossSiteCollaboration: 34,
      manualTranscriptionShare: 61,
      offlineDataDelayHours: 15,
      batchReviewHours: 22,
      deviationInvestigationHours: 17,
      techTransferPackageHours: 76,
      onboardingDays: 15,
    },
  },
];

const NUMERIC_INPUT_KEYS: Array<Exclude<keyof BioPilotAssessmentInputs, "processProfileId" | "lifecycleStageId">> = [
  "activePrograms",
  "runsPerYear",
  "sites",
  "transferEventsPerYear",
  "vendorPlatforms",
  "blendedHourlyRate",
  "costPerFailedRun",
  "valuePerDayAcceleration",
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
  "techTransferPackageHours",
  "onboardingDays",
];

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

const jitter = (base: number, variance: number, min: number, max: number) =>
  clamp(Math.round((base + randomBetween(-variance, variance)) * 10) / 10, min, max);

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
  };

  for (const key of NUMERIC_INPUT_KEYS) {
    const value = normalized[key];
    normalized[key] = Number.isFinite(value) ? value : DEFAULT_BIOPILOT_ASSESSMENT_INPUTS[key];
  }

  return normalized;
}

export function buildRandomizedSampleInputs(sampleId: string): BioPilotAssessmentInputs {
  const baseline =
    BIOPILOT_SAMPLE_CONFIGS.find((item) => item.id === sampleId)?.inputs ??
    DEFAULT_BIOPILOT_ASSESSMENT_INPUTS;

  const normalized = normalizeAssessmentInputs(baseline);
  const stage = LIFECYCLE_STAGE_MAP[normalized.lifecycleStageId];
  const maturityShift = randomBetween(-9, 9);

  return {
    ...normalized,
    activePrograms: jitter(normalized.activePrograms, 1.5, 1, 12),
    runsPerYear: jitter(normalized.runsPerYear, Math.max(8, normalized.runsPerYear * 0.14), 12, 220),
    sites: Math.round(jitter(normalized.sites, 0.75, 1, 6)),
    transferEventsPerYear: Math.round(jitter(normalized.transferEventsPerYear, 1.5, 0, 12)),
    vendorPlatforms: Math.round(jitter(normalized.vendorPlatforms, 1, 1, 8)),
    blendedHourlyRate: jitter(normalized.blendedHourlyRate, 14, 90, 260),
    costPerFailedRun: jitter(normalized.costPerFailedRun, normalized.costPerFailedRun * 0.16, 15000, 250000),
    valuePerDayAcceleration: jitter(
      normalized.valuePerDayAcceleration,
      normalized.valuePerDayAcceleration * 0.18,
      10000,
      150000,
    ),
    plannedProgramInvestment: jitter(
      stage.annualProgramInvestment,
      stage.annualProgramInvestment * 0.18,
      100000,
      900000,
    ),
    bioreactorConnectivity: jitter(normalized.bioreactorConnectivity + maturityShift * 0.7, 7, 8, 96),
    sensorCoverage: jitter(normalized.sensorCoverage + maturityShift * 0.55, 6, 10, 98),
    patCoverage: jitter(normalized.patCoverage + maturityShift * 0.7, 7, 4, 92),
    analyzerConnectivity: jitter(normalized.analyzerConnectivity + maturityShift * 0.7, 7, 6, 96),
    downstreamVisibility: jitter(normalized.downstreamVisibility + maturityShift * 0.55, 6, 8, 96),
    dataContextualization: jitter(normalized.dataContextualization + maturityShift * 0.8, 8, 6, 96),
    sopAutomation: jitter(normalized.sopAutomation + maturityShift * 0.75, 8, 4, 95),
    reviewByException: jitter(normalized.reviewByException + maturityShift * 0.7, 8, 4, 94),
    crossSiteCollaboration: jitter(normalized.crossSiteCollaboration + maturityShift * 0.55, 7, 6, 96),
    manualTranscriptionShare: jitter(normalized.manualTranscriptionShare - maturityShift * 0.85, 7, 6, 92),
    offlineDataDelayHours: jitter(normalized.offlineDataDelayHours - maturityShift * 0.12, 2.5, 1, 36),
    batchReviewHours: jitter(normalized.batchReviewHours - maturityShift * 0.18, 3.5, 2, 48),
    deviationInvestigationHours: jitter(
      normalized.deviationInvestigationHours - maturityShift * 0.18,
      3.5,
      2,
      48,
    ),
    techTransferPackageHours: jitter(
      normalized.techTransferPackageHours - maturityShift * 0.35,
      9,
      8,
      160,
    ),
    onboardingDays: jitter(normalized.onboardingDays - maturityShift * 0.15, 3, 3, 40),
  };
}

const percentageInverse = (value: number) => clamp(100 - value, 0, 100);

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
      ? "Very strong BioPilot relevance"
      : fitScore >= 64
        ? "Strong BioPilot relevance"
        : fitScore >= 48
          ? "Moderate BioPilot relevance"
          : "Lower immediate BioPilot relevance";

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

  const currentRunSuccessRate = clamp(
    profile.base.runSuccessRate +
      inputs.sensorCoverage * 0.03 +
      inputs.patCoverage * 0.035 +
      inputs.analyzerConnectivity * 0.018 +
      inputs.sopAutomation * 0.015 +
      inputs.dataContextualization * 0.018 -
      inputs.manualTranscriptionShare * 0.03 -
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
    45,
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

  const annualRecoveredHours = Math.max(
    0,
    runCoordinationRecoveredHours +
      reviewRecoveredHours +
      deviationRecoveredHours +
      transferRecoveredHours +
      onboardingRecoveredHours,
  );

  const baselineFailedRuns =
    inputs.runsPerYear * ((100 - currentRunSuccessRate) / 100);
  const modeledFailedRuns =
    inputs.runsPerYear * ((100 - bioPilotRunSuccessRate) / 100);
  const avoidedFailedRuns = Math.max(0, baselineFailedRuns - modeledFailedRuns);

  const annualDecisionDaysRecovered = Math.max(
    0,
    ((currentDecisionLagHours - bioPilotDecisionLagHours) / 24) *
      Math.min(inputs.activePrograms, 8) *
      2.1,
  );

  const valueLevers: ValueLever[] = [
    {
      id: "run-coordination",
      label: "Run coordination, reporting, and operator time",
      annualValue:
        (runCoordinationRecoveredHours + onboardingRecoveredHours) *
        inputs.blendedHourlyRate,
      summary:
        "Captures less spreadsheet handling, less manual reconciliation, and faster operator ramp.",
    },
    {
      id: "review",
      label: "Batch review and investigation effort",
      annualValue:
        (reviewRecoveredHours + deviationRecoveredHours) * inputs.blendedHourlyRate,
      summary:
        "Values moving the team closer to review-by-exception and cleaner evidence packages.",
    },
    {
      id: "transfer",
      label: "Tech transfer and package assembly effort",
      annualValue: transferRecoveredHours * inputs.blendedHourlyRate,
      summary:
        "Values reusable run context and shorter handoff package assembly across sites or partners.",
    },
    {
      id: "failure",
      label: "Avoided failed or materially degraded runs",
      annualValue: avoidedFailedRuns * inputs.costPerFailedRun,
      summary:
        "Uses the modeled change in run success as a directional proxy for avoidable loss.",
    },
    {
      id: "acceleration",
      label: "Faster process and portfolio decisions",
      annualValue:
        annualDecisionDaysRecovered *
        inputs.valuePerDayAcceleration *
        0.58,
      summary:
        "Uses lower delay between operational events and usable context as a directional acceleration proxy.",
    },
  ].sort((left, right) => right.annualValue - left.annualValue);

  const annualValuePotential = valueLevers.reduce(
    (sum, lever) => sum + lever.annualValue,
    0,
  );
  const threeYearValue = annualValuePotential * (0.6 + 0.9 + 1);
  const threeYearNetBenefit = threeYearValue - inputs.plannedProgramInvestment;
  const threeYearRoi =
    inputs.plannedProgramInvestment > 0
      ? (threeYearNetBenefit / inputs.plannedProgramInvestment) * 100
      : 0;
  const paybackMonths =
    annualValuePotential > 0
      ? (inputs.plannedProgramInvestment / (annualValuePotential * 0.72)) * 12
      : 0;

  const laneScores: AssessmentLane[] = [
    {
      id: "bioreactor-layer",
      label: "Bioreactor and control layer",
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
      label: "Analytical and process visibility",
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
      label: "Guided execution",
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
      label: "Review and release readiness",
      currentScore: clamp(
        inputs.reviewByException * 0.44 +
          percentageInverse(inputs.batchReviewHours * 3.6) * 0.32 +
          percentageInverse(inputs.deviationInvestigationHours * 4.2) * 0.24,
        0,
        100,
      ),
      enabledScore: clamp(
        inputs.reviewByException * 0.44 +
          percentageInverse(inputs.batchReviewHours * 3.6) * 0.32 +
          percentageInverse(inputs.deviationInvestigationHours * 4.2) * 0.24 +
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
      label: "Tech transfer and network scale-up",
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
        "This is often the closing wedge when BioPilot must justify value beyond one lab or one reactor train.",
    },
  ];

  const plays: BioPilotPlay[] = [
    {
      id: "multivendor",
      title: "Unify multi-vendor bioreactors and process evidence",
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
      title: "Digitize SOP execution and reduce manual transcription",
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
      title: "Connect online and off-line data into one decision flow",
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
      title: "Move toward review-ready, exception-based evidence",
      summary:
        "Reduce post-run review effort by keeping evidence, context, and SOP execution linked as the run progresses.",
      whyBioPilot:
        "Most relevant when batch review, investigations, and release prep consume specialist time that should be spent on process decisions.",
      relevanceScore: clamp(
        percentageInverse(inputs.reviewByException) * 0.46 +
          clamp(inputs.batchReviewHours * 3.6, 0, 100) * 0.32 +
          clamp(inputs.deviationInvestigationHours * 4.4, 0, 100) * 0.22,
        0,
        100,
      ),
    },
    {
      id: "transfer",
      title: "Standardize scale-up and tech transfer packages",
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
      title: "Spreadsheet-heavy run coordination",
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
      title: "Review and investigation drag",
      severity: rankSeverity(
        clamp(inputs.batchReviewHours * 3.2, 0, 100) * 0.58 +
          percentageInverse(inputs.reviewByException) * 0.42,
      ),
      summary:
        "The organization is still building evidence after the run instead of keeping it review-ready during execution.",
      action:
        "Focus on review-ready evidence, exception handling, and linked process context.",
    },
    {
      id: "late-context",
      title: "Late analyzer and process context",
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
      title: "Scale-up and transfer friction",
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
      title: "Fragmented equipment and data stack",
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

  const executiveSummary = `${profile.label} in ${stage.label.toLowerCase()} shows ${fitBand.charAt(0).toLowerCase()}${fitBand.slice(1)} because the operation still carries ${Math.round(manualBurdenIndex)} / 100 manual burden and only ${Math.round(digitalCoverage)} / 100 digital coverage. The most relevant BioPilot capability is ${topPlay?.title.toLowerCase() ?? "data and workflow unification"}, which points to a modeled ${annualRecoveredHours.toFixed(0)} annual hours recovered and ${topLever ? `about ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(topLever.annualValue)} in the largest value lever` : "a meaningful operational value story"}.`;

  const nextStep = topSignal
    ? `Validate the process around ${topSignal.title.toLowerCase()}, then confirm three operating values before finalizing the business case: actual review hours, current failed-run cost, and the true transfer package effort.`
    : "Validate the real operating data behind the top value lever before finalizing the business case.";

  return {
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
      transferPackageHours: currentTransferPackageHours,
      onboardingDays: currentOnboardingDays,
    },
    bioPilotState: {
      manualHoursPerRun: bioPilotManualHoursPerRun,
      reviewHours: bioPilotReviewHours,
      decisionLagHours: bioPilotDecisionLagHours,
      runSuccessRate: bioPilotRunSuccessRate,
      transferPackageHours: bioPilotTransferPackageHours,
      onboardingDays: bioPilotOnboardingDays,
    },
    annualRecoveredHours,
    avoidedFailedRuns,
    annualValuePotential,
    threeYearNetBenefit,
    threeYearRoi,
    paybackMonths,
    annualDecisionDaysRecovered,
    laneScores,
    plays,
    buyingSignals,
    valueLevers,
    executiveSummary,
    nextStep,
  };
}
