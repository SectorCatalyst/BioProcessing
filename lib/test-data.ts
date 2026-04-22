import {
  buildEmptyJustification,
  defaultEditableModel,
  type EditableModel,
  type ScenarioId,
} from "@/lib/model";

export interface TestDatasetPreset {
  id: string;
  label: string;
  description: string;
  preferredScenario: ScenarioId;
  model: EditableModel;
}

const cloneDefaultModel = () => structuredClone(defaultEditableModel);

const buildBiotechExpansionModel = () => {
  const model = cloneDefaultModel();

  model.organizationProfile = {
    organizationType: "Biotech",
    modality: "Monoclonal Antibody",
    processStage: "Process Development",
    processType: "Integrated",
    activeProgramsPerYear: 9,
    runsPerMonth: 26,
    users: 58,
    sites: 3,
    scaleRange: "Bench to Pilot",
    instrumentsPerWorkflow: 16,
    vendorsPerWorkflow: 5,
    transferEventsPerYear: 8,
    newUsersPerYear: 22,
  };

  model.scenarios.conservative.currentState = {
    ...model.scenarios.conservative.currentState,
    campaignDurationWeeks: 20,
    deviationsPerYear: 32,
    transferPackagePreparationHours: 96,
  };
  model.scenarios.expected.currentState = {
    ...model.scenarios.expected.currentState,
    campaignDurationWeeks: 20,
    deviationsPerYear: 32,
    transferPackagePreparationHours: 96,
  };
  model.scenarios.aggressive.currentState = {
    ...model.scenarios.aggressive.currentState,
    campaignDurationWeeks: 20,
    deviationsPerYear: 32,
    transferPackagePreparationHours: 96,
  };

  model.scenarios.expected.costBasis = {
    ...model.scenarios.expected.costBasis,
    annualSoftwareCost: 220000,
    annualSupportCost: 110000,
    oneTimeImplementationCost: 390000,
    validationCost: 155000,
    valuePerWeekOfAcceleration: 115000,
    costPerTransferDelayEvent: 165000,
  };

  model.scenarios.expected.improvementAssumptions = {
    reductionInDataAggregation: 24,
    reductionInReporting: 22,
    reductionInTroubleshooting: 16,
    reductionInManualWorkflowExecution: 19,
    reductionInReruns: 11,
    reductionInFailedRuns: 8,
    reductionInDeviations: 14,
    reductionInCampaignDuration: 7,
    reductionInTransferPreparation: 20,
    reductionInOnboarding: 23,
    reductionInDecisionLag: 16,
    reductionInTransferDelayRisk: 10,
  };
  model.scenarios.expected.riskAndRealization = {
    laborTreatmentMode: "mixed",
    mixedLaborHardSavingsShare: 38,
    captureFactor: 58,
    confidenceFactor: 68,
    adoptionRampMonths: 5,
    firstYearRealization: 62,
    integrationComplexity: "medium",
    validationIntensity: "standard",
    changeManagementRisk: "medium",
    accelerationValueCategory: "hard-dollar",
  };

  model.scenarios.conservative.improvementAssumptions = {
    ...model.scenarios.expected.improvementAssumptions,
    reductionInDataAggregation: 16,
    reductionInReporting: 14,
    reductionInCampaignDuration: 4,
    reductionInTransferDelayRisk: 6,
  };
  model.scenarios.aggressive.improvementAssumptions = {
    ...model.scenarios.expected.improvementAssumptions,
    reductionInDataAggregation: 30,
    reductionInReporting: 28,
    reductionInCampaignDuration: 11,
    reductionInTransferDelayRisk: 15,
  };

  model.advancedSettings = {
    ...model.advancedSettings,
    enableStrategicProxyValues: true,
    strategicProxyPerMaturityPoint: 32000,
    enableTransferDelayAvoidance: true,
    enableOnboardingValue: true,
  };
  model.reviewAndSignOff = {
    reviewStatus: "Reviewed",
    reviewerName: "Commercial strategy lead",
    reviewedAt: "2026-03-15",
    reviewNotes:
      "Sample dataset prepared from directional public ranges for digital bioprocess integration and planning discussions.",
    internalDiscussionApproval: true,
  };
  model.scenarioJustifications.expected = {
    hardSavingsClassification:
      "Hard-dollar treatment applies only to the agreed share of labor that is expected to reduce contractor or overtime spend.",
    mixedLaborSplit:
      "The mixed split assumes part of the saved effort is redeployed to additional development throughput while a smaller share offsets external spend.",
    strategicProxyActivation:
      "Strategic proxy is enabled for demo purposes and remains separated from hard-dollar and capacity value.",
    highCaptureFactor: "",
    highConfidenceFactor: "",
    aggressiveScenarioUse: "",
    stretchAssumption: "",
    transferDelayAvoidance:
      "Transfer delay avoidance is included because the demo case assumes repeat transfer packages across multiple sites.",
  };
  model.scenarioJustifications.conservative = buildEmptyJustification();
  model.scenarioJustifications.aggressive = buildEmptyJustification();

  return model;
};

const buildCdmoScaleUpModel = () => {
  const model = cloneDefaultModel();

  model.organizationProfile = {
    organizationType: "CDMO",
    modality: "Recombinant Protein",
    processStage: "Scale-Up",
    processType: "Integrated",
    activeProgramsPerYear: 14,
    runsPerMonth: 34,
    users: 96,
    sites: 4,
    scaleRange: "Pilot to Clinical",
    instrumentsPerWorkflow: 22,
    vendorsPerWorkflow: 7,
    transferEventsPerYear: 14,
    newUsersPerYear: 34,
  };

  for (const scenarioId of ["conservative", "expected", "aggressive"] as const) {
    model.scenarios[scenarioId].currentState = {
      ...model.scenarios[scenarioId].currentState,
      scientistDataAggregationHoursPerRun: 5.2,
      engineerDataAggregationHoursPerRun: 4.4,
      technicianDataAggregationHoursPerRun: 3.2,
      reportingHoursPerRun: 4.5,
      troubleshootingHoursPerRun: 3.1,
      manualWorkflowExecutionHoursPerRun: 4,
      averageRerunRate: 14,
      averageFailedRunRate: 6,
      deviationsPerYear: 46,
      investigationHoursPerDeviation: 14,
      campaignDurationWeeks: 24,
      transferPackagePreparationHours: 120,
      onboardingHoursPerUser: 30,
      timeToDecisionLagHours: 22,
    };
  }

  model.scenarios.expected.costBasis = {
    ...model.scenarios.expected.costBasis,
    scientistHourlyCost: 175,
    engineerHourlyCost: 165,
    technicianHourlyCost: 105,
    qaHourlyCost: 152,
    costPerRerun: 24000,
    costPerFailedRun: 56000,
    costPerDeviation: 11000,
    annualSoftwareCost: 310000,
    annualSupportCost: 145000,
    oneTimeImplementationCost: 510000,
    validationCost: 210000,
    valuePerWeekOfAcceleration: 110000,
    costPerTransferDelayEvent: 180000,
  };
  model.scenarios.expected.improvementAssumptions = {
    reductionInDataAggregation: 20,
    reductionInReporting: 18,
    reductionInTroubleshooting: 15,
    reductionInManualWorkflowExecution: 18,
    reductionInReruns: 12,
    reductionInFailedRuns: 8,
    reductionInDeviations: 15,
    reductionInCampaignDuration: 6,
    reductionInTransferPreparation: 20,
    reductionInOnboarding: 19,
    reductionInDecisionLag: 15,
    reductionInTransferDelayRisk: 9,
  };
  model.scenarios.expected.riskAndRealization = {
    laborTreatmentMode: "mixed",
    mixedLaborHardSavingsShare: 42,
    captureFactor: 56,
    confidenceFactor: 68,
    adoptionRampMonths: 7,
    firstYearRealization: 55,
    integrationComplexity: "medium",
    validationIntensity: "intensive",
    changeManagementRisk: "medium",
    accelerationValueCategory: "capacity",
  };
  model.advancedSettings = {
    ...model.advancedSettings,
    enableStrategicProxyValues: true,
    strategicProxyPerMaturityPoint: 28000,
  };
  model.reviewAndSignOff = {
    reviewStatus: "Under Review",
    reviewerName: "CDMO operations planning",
    reviewedAt: "2026-03-16",
    reviewNotes:
      "Sample scale-up dataset built from directional public ranges to highlight transfer planning, operational risk, and rollout timing.",
    internalDiscussionApproval: false,
  };
  model.scenarioJustifications.expected = {
    hardSavingsClassification: "",
    mixedLaborSplit:
      "The mixed split assumes some saved effort is retained as redeployed engineering throughput while a defined share offsets third-party and overtime burden.",
    strategicProxyActivation:
      "Strategic proxy remains separate and is enabled to show maturity-sensitive value in a multi-site CDMO context.",
    highCaptureFactor: "",
    highConfidenceFactor: "",
    aggressiveScenarioUse: "",
    stretchAssumption: "",
    transferDelayAvoidance:
      "Transfer delay avoidance is modeled because repeated client handoffs create measurable timing risk at clinical scale-up.",
  };

  return model;
};

const buildCellGeneTransferModel = () => {
  const model = cloneDefaultModel();

  model.organizationProfile = {
    organizationType: "Cell and Gene Therapy Developer",
    modality: "Viral Vector",
    processStage: "Tech Transfer",
    processType: "Integrated",
    activeProgramsPerYear: 5,
    runsPerMonth: 16,
    users: 64,
    sites: 3,
    scaleRange: "Clinical to Commercial",
    instrumentsPerWorkflow: 18,
    vendorsPerWorkflow: 6,
    transferEventsPerYear: 10,
    newUsersPerYear: 18,
  };

  for (const scenarioId of ["conservative", "expected", "aggressive"] as const) {
    model.scenarios[scenarioId].currentState = {
      ...model.scenarios[scenarioId].currentState,
      scientistDataAggregationHoursPerRun: 6.2,
      engineerDataAggregationHoursPerRun: 4.7,
      technicianDataAggregationHoursPerRun: 2.8,
      reportingHoursPerRun: 5,
      troubleshootingHoursPerRun: 4.3,
      manualWorkflowExecutionHoursPerRun: 4.1,
      averageRerunRate: 12,
      averageFailedRunRate: 5,
      deviationsPerYear: 38,
      investigationHoursPerDeviation: 16,
      campaignDurationWeeks: 22,
      transferPackagePreparationHours: 132,
      onboardingHoursPerUser: 34,
      timeToDecisionLagHours: 28,
    };
  }

  model.scenarios.expected.costBasis = {
    ...model.scenarios.expected.costBasis,
    scientistHourlyCost: 185,
    engineerHourlyCost: 170,
    technicianHourlyCost: 112,
    qaHourlyCost: 158,
    costPerRerun: 32000,
    costPerFailedRun: 88000,
    costPerDeviation: 13500,
    annualSoftwareCost: 295000,
    annualSupportCost: 135000,
    oneTimeImplementationCost: 540000,
    validationCost: 240000,
    valuePerWeekOfAcceleration: 145000,
    costPerTransferDelayEvent: 210000,
  };

  model.scenarios.expected.improvementAssumptions = {
    reductionInDataAggregation: 26,
    reductionInReporting: 24,
    reductionInTroubleshooting: 18,
    reductionInManualWorkflowExecution: 21,
    reductionInReruns: 10,
    reductionInFailedRuns: 8,
    reductionInDeviations: 16,
    reductionInCampaignDuration: 7,
    reductionInTransferPreparation: 24,
    reductionInOnboarding: 27,
    reductionInDecisionLag: 22,
    reductionInTransferDelayRisk: 12,
  };

  model.scenarios.expected.riskAndRealization = {
    laborTreatmentMode: "mixed",
    mixedLaborHardSavingsShare: 35,
    captureFactor: 54,
    confidenceFactor: 62,
    adoptionRampMonths: 7,
    firstYearRealization: 54,
    integrationComplexity: "high",
    validationIntensity: "intensive",
    changeManagementRisk: "medium",
    accelerationValueCategory: "capacity",
  };

  model.scenarios.conservative.improvementAssumptions = {
    ...model.scenarios.expected.improvementAssumptions,
    reductionInDataAggregation: 18,
    reductionInReporting: 16,
    reductionInCampaignDuration: 4,
    reductionInTransferPreparation: 15,
    reductionInDecisionLag: 14,
  };

  model.scenarios.aggressive.improvementAssumptions = {
    ...model.scenarios.expected.improvementAssumptions,
    reductionInDataAggregation: 32,
    reductionInReporting: 30,
    reductionInCampaignDuration: 10,
    reductionInTransferPreparation: 30,
    reductionInDecisionLag: 28,
  };

  model.advancedSettings = {
    ...model.advancedSettings,
    enableStrategicProxyValues: true,
    strategicProxyPerMaturityPoint: 30000,
  };

  model.reviewAndSignOff = {
    reviewStatus: "Under Review",
    reviewerName: "Advanced therapies program lead",
    reviewedAt: "2026-03-18",
    reviewNotes:
      "Sample tech-transfer dataset prepared from directional public workflow patterns for complex advanced-therapy handoffs and multi-system review burdens.",
    internalDiscussionApproval: false,
  };

  model.scenarioJustifications.expected = {
    hardSavingsClassification: "",
    mixedLaborSplit:
      "The mixed split assumes some effort is redeployed into faster transfer readiness while a limited share offsets external analytical and coordination burden.",
    strategicProxyActivation:
      "Strategic proxy is kept separate to reflect timing-sensitive program value without merging it into direct savings.",
    highCaptureFactor: "",
    highConfidenceFactor: "",
    aggressiveScenarioUse: "",
    stretchAssumption: "",
    transferDelayAvoidance:
      "Transfer delay avoidance is included because late evidence packages and multi-site coordination can materially delay advanced-therapy readiness.",
  };

  return model;
};

export const TEST_DATASETS: TestDatasetPreset[] = [
  {
    id: "biotech-expansion-demo",
    label: "Sample Biotech Program",
    description:
      "A mid-scale biotech example built from directional public ranges, with optional strategic value and moderate ramp assumptions.",
    preferredScenario: "expected",
    model: buildBiotechExpansionModel(),
  },
  {
    id: "cdmo-scale-up-demo",
    label: "Sample CDMO Scale-Up",
    description:
      "A multi-site CDMO example built from directional public ranges, focused on transfer preparation, deviations, and capacity gains.",
    preferredScenario: "expected",
    model: buildCdmoScaleUpModel(),
  },
  {
    id: "cell-gene-transfer-demo",
    label: "Sample Advanced Therapy Transfer",
    description:
      "A complex tech-transfer example with higher evidence-packaging, onboarding, and decision-lag burden across multiple sites.",
    preferredScenario: "expected",
    model: buildCellGeneTransferModel(),
  },
];

export const getTestDatasetById = (datasetId: string) =>
  TEST_DATASETS.find((dataset) => dataset.id === datasetId);
