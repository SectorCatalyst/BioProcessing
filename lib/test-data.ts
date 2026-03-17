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
      "Illustrative governed demo dataset for internal business-case review and product walkthroughs.",
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
    valuePerWeekOfAcceleration: 148000,
    costPerTransferDelayEvent: 215000,
  };
  model.scenarios.expected.improvementAssumptions = {
    reductionInDataAggregation: 22,
    reductionInReporting: 20,
    reductionInTroubleshooting: 17,
    reductionInManualWorkflowExecution: 21,
    reductionInReruns: 12,
    reductionInFailedRuns: 8,
    reductionInDeviations: 15,
    reductionInCampaignDuration: 8,
    reductionInTransferPreparation: 23,
    reductionInOnboarding: 24,
    reductionInDecisionLag: 18,
    reductionInTransferDelayRisk: 11,
  };
  model.scenarios.expected.riskAndRealization = {
    laborTreatmentMode: "mixed",
    mixedLaborHardSavingsShare: 42,
    captureFactor: 60,
    confidenceFactor: 70,
    adoptionRampMonths: 7,
    firstYearRealization: 58,
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
      "Illustrative scale-up and transfer demo dataset intended to exercise transfer and risk mechanics.",
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

export const TEST_DATASETS: TestDatasetPreset[] = [
  {
    id: "biotech-expansion-demo",
    label: "Biotech Expansion Demo",
    description:
      "Illustrative mid-scale biotech dataset with strategic proxy enabled and moderate realization assumptions.",
    preferredScenario: "expected",
    model: buildBiotechExpansionModel(),
  },
  {
    id: "cdmo-scale-up-demo",
    label: "CDMO Scale-Up Demo",
    description:
      "Illustrative multi-site CDMO dataset emphasizing transfer preparation, deviations, and capacity-oriented acceleration.",
    preferredScenario: "expected",
    model: buildCdmoScaleUpModel(),
  },
];

export const getTestDatasetById = (datasetId: string) =>
  TEST_DATASETS.find((dataset) => dataset.id === datasetId);
