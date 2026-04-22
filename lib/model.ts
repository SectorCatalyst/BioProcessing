import { z } from "zod";

export const SCENARIO_IDS = ["conservative", "expected", "aggressive"] as const;

export type ScenarioId = (typeof SCENARIO_IDS)[number];

export const SCENARIO_LABELS: Record<ScenarioId, string> = {
  conservative: "Conservative",
  expected: "Expected",
  aggressive: "Aggressive",
};

export const TOP_LEVEL_NAV = [
  "Organization Profile",
  "Current State",
  "Cost Basis",
  "Improvement Assumptions",
  "Risk & Realization",
  "Advanced Settings",
  "Results",
  "Assumptions Register",
  "Export",
] as const;

export type TopLevelNavItem = (typeof TOP_LEVEL_NAV)[number];

export type SectionId =
  | "organizationProfile"
  | "currentState"
  | "costBasis"
  | "improvementAssumptions"
  | "riskAndRealization"
  | "advancedSettings"
  | "reviewAndSignOff"
  | "scenarioJustification";

export type LaborTreatmentMode =
  | "hard_savings"
  | "redeployed_capacity"
  | "mixed";

export type IntegrationComplexity = "low" | "medium" | "high";
export type ValidationIntensity = "light" | "standard" | "intensive";
export type ChangeManagementRisk = "low" | "medium" | "high";
export type AccelerationValueCategory = "hard-dollar" | "capacity" | "strategic";
export type ReviewStatus =
  | "Not Reviewed"
  | "Under Review"
  | "Reviewed with Concerns"
  | "Reviewed"
  | "Approved for Internal Discussion";
export type OverrideType =
  | "Standard Note"
  | "Material Change"
  | "High-Confidence Input"
  | "Benchmark Adjustment"
  | "Post-Review Update";
export type SourceLabel = "User" | "Default" | "Derived";
export type ProvenanceClass =
  | "user_entered"
  | "default_placeholder"
  | "benchmark_placeholder"
  | "derived_calculation"
  | "proxy_assumption"
  | "imported_external";
export type SourceQualityTier =
  | "direct_operating_data"
  | "estimated_site_input"
  | "generic_placeholder"
  | "internal_benchmark"
  | "external_benchmark"
  | "formula_derived"
  | "proxy_construct";

export type RiskSeverity = "Info" | "Caution" | "Warning" | "High Risk";
export type RiskFlagFamily =
  | "Assumption Extremity"
  | "Value Concentration"
  | "Classification Credibility"
  | "Proxy Dependence"
  | "Low Data Grounding"
  | "Scenario Stretch"
  | "Payback Fragility"
  | "Realization Risk"
  | "Output Integrity";
export type ReadinessStatus =
  | "Incomplete"
  | "Minimally Calculable"
  | "Review-Ready"
  | "Decision-Support Ready";

export interface OptionDefinition {
  value: string;
  label: string;
}

export interface FieldDefinition {
  key: string;
  label: string;
  description?: string;
  kind: "number" | "text" | "select" | "textarea" | "switch";
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  options?: OptionDefinition[];
  benchmarkHint?: string;
  valueCategoryImpact: string;
}

export interface FieldGroup {
  id: SectionId;
  title: string;
  description: string;
  scenarioScoped: boolean;
  fields: FieldDefinition[];
}

export interface OrganizationProfile {
  organizationType: string;
  modality: string;
  processStage: string;
  processType: string;
  activeProgramsPerYear: number;
  runsPerMonth: number;
  users: number;
  sites: number;
  scaleRange: string;
  instrumentsPerWorkflow: number;
  vendorsPerWorkflow: number;
  transferEventsPerYear: number;
  newUsersPerYear: number;
}

export interface CurrentState {
  scientistDataAggregationHoursPerRun: number;
  engineerDataAggregationHoursPerRun: number;
  technicianDataAggregationHoursPerRun: number;
  reportingHoursPerRun: number;
  troubleshootingHoursPerRun: number;
  manualWorkflowExecutionHoursPerRun: number;
  averageRerunRate: number;
  averageFailedRunRate: number;
  deviationsPerYear: number;
  investigationHoursPerDeviation: number;
  campaignDurationWeeks: number;
  transferPackagePreparationHours: number;
  onboardingHoursPerUser: number;
  timeToDecisionLagHours: number;
}

export interface CostBasis {
  scientistHourlyCost: number;
  engineerHourlyCost: number;
  technicianHourlyCost: number;
  qaHourlyCost: number;
  costPerRerun: number;
  costPerFailedRun: number;
  costPerDeviation: number;
  valuePerWeekOfAcceleration: number;
  costPerTransferDelayEvent: number;
  annualSoftwareCost: number;
  oneTimeImplementationCost: number;
  annualSupportCost: number;
  validationCost: number;
  internalProjectHours: number;
  internalProjectHourlyCost: number;
  initialTrainingHours: number;
  trainingHourlyCost: number;
  discountRate: number;
}

export interface ImprovementAssumptions {
  reductionInDataAggregation: number;
  reductionInReporting: number;
  reductionInTroubleshooting: number;
  reductionInManualWorkflowExecution: number;
  reductionInReruns: number;
  reductionInFailedRuns: number;
  reductionInDeviations: number;
  reductionInCampaignDuration: number;
  reductionInTransferPreparation: number;
  reductionInOnboarding: number;
  reductionInDecisionLag: number;
  reductionInTransferDelayRisk: number;
}

export interface RiskAndRealization {
  laborTreatmentMode: LaborTreatmentMode;
  mixedLaborHardSavingsShare: number;
  captureFactor: number;
  confidenceFactor: number;
  adoptionRampMonths: number;
  firstYearRealization: number;
  integrationComplexity: IntegrationComplexity;
  validationIntensity: ValidationIntensity;
  changeManagementRisk: ChangeManagementRisk;
  accelerationValueCategory: AccelerationValueCategory;
}

export interface AdvancedSettings {
  enableStrategicProxyValues: boolean;
  strategicProxyPerMaturityPoint: number;
  enableTransferDelayAvoidance: boolean;
  enableOnboardingValue: boolean;
  showAggressiveScenario: boolean;
  currencyCode: string;
  decimalPlaces: number;
}

export interface ScenarioModel {
  currentState: CurrentState;
  costBasis: CostBasis;
  improvementAssumptions: ImprovementAssumptions;
  riskAndRealization: RiskAndRealization;
}

export interface ReviewAndSignOff {
  reviewStatus: ReviewStatus;
  reviewerName: string;
  reviewedAt: string;
  reviewNotes: string;
  internalDiscussionApproval: boolean;
}

export interface ScenarioJustification {
  hardSavingsClassification: string;
  mixedLaborSplit: string;
  strategicProxyActivation: string;
  highCaptureFactor: string;
  highConfidenceFactor: string;
  aggressiveScenarioUse: string;
  stretchAssumption: string;
  transferDelayAvoidance: string;
}

export interface EditableModel {
  organizationProfile: OrganizationProfile;
  scenarios: Record<ScenarioId, ScenarioModel>;
  advancedSettings: AdvancedSettings;
  reviewAndSignOff: ReviewAndSignOff;
  scenarioJustifications: Record<ScenarioId, ScenarioJustification>;
}

export interface LeadCaptureFormInput {
  firstName: string;
  lastName: string;
  workEmail: string;
  company: string;
  jobTitle: string;
  countryRegion: string;
  consentToContact: boolean;
}

export interface LeadCaptureRecord extends LeadCaptureFormInput {
  submittedAt: string;
  storageMode: "database" | "local_only";
  storageMessage: string;
}

export interface ProvenanceEntry {
  label: string;
  assumption: string;
  section: string;
  scenario: ScenarioId | "global";
  sourceLabel: SourceLabel;
  provenanceClass: ProvenanceClass;
  sourceQuality: SourceQualityTier;
  valueCategoryImpact: string;
  notes: string;
  benchmarkHint?: string;
  lastUpdatedAt: string;
}

export type ProvenanceMap = Record<string, ProvenanceEntry>;

export interface ChangeLogEntry {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
}

export interface OverrideRecord {
  id: string;
  scenario: ScenarioId | "global";
  section: SectionId | "export";
  field: string;
  type: OverrideType;
  reason: string;
  previousValue: string;
  newValue: string;
  createdAt: string;
}

const selectOptions = {
  organizationType: [
    { value: "Innovator Pharma", label: "Innovator Pharma" },
    { value: "Biotech", label: "Biotech" },
    { value: "CDMO", label: "Contract Development and Manufacturing Organization (CDMO)" },
    {
      value: "Biologics Manufacturer",
      label: "Biologics Manufacturer",
    },
    {
      value: "Vaccine Developer or Manufacturer",
      label: "Vaccine Developer or Manufacturer",
    },
    {
      value: "Cell and Gene Therapy Developer",
      label: "Cell and Gene Therapy Developer",
    },
    {
      value: "Cell and Gene Therapy CDMO",
      label: "Cell and Gene Therapy CDMO",
    },
    {
      value: "Microbial Fermentation Operator",
      label: "Microbial Fermentation Operator",
    },
    {
      value: "Academic or Translational Center",
      label: "Academic or Translational Center",
    },
  ],
  modality: [
    { value: "Monoclonal Antibody", label: "Monoclonal Antibody" },
    { value: "Cell Therapy", label: "Cell Therapy" },
    { value: "Gene Therapy", label: "Gene Therapy" },
    { value: "Recombinant Protein", label: "Recombinant Protein" },
    { value: "Viral Vector", label: "Viral Vector" },
    { value: "Vaccine", label: "Vaccine" },
    { value: "Microbial Fermentation", label: "Microbial Fermentation" },
    { value: "Plasmid DNA", label: "Plasmid DNA" },
    { value: "mRNA or RNA", label: "mRNA or RNA" },
    { value: "Bispecific or Complex Biologic", label: "Bispecific or Complex Biologic" },
    { value: "Enzyme or Industrial Biologic", label: "Enzyme or Industrial Biologic" },
    { value: "Exosome or Extracellular Vesicle", label: "Exosome or Extracellular Vesicle" },
  ],
  processStage: [
    { value: "Discovery", label: "Discovery" },
    {
      value: "Cell Line or Strain Development",
      label: "Cell Line or Strain Development",
    },
    { value: "Process Development", label: "Process Development" },
    { value: "Scale-Up", label: "Scale-Up" },
    { value: "Tech Transfer", label: "Tech Transfer" },
    { value: "Clinical Manufacturing", label: "Clinical Manufacturing" },
    { value: "Commercial Manufacturing", label: "Commercial Manufacturing" },
    { value: "Lifecycle Optimization", label: "Lifecycle Optimization" },
  ],
  processType: [
    { value: "Upstream", label: "Upstream" },
    { value: "Harvest or Clarification", label: "Harvest or Clarification" },
    { value: "Downstream", label: "Downstream" },
    { value: "Analytical/QC", label: "Analytical / QC" },
    { value: "Fill-Finish", label: "Fill-Finish" },
    { value: "Manufacturing Data & Quality", label: "Manufacturing Data & Quality" },
    { value: "Integrated", label: "Integrated" },
  ],
  scaleRange: [
    { value: "Screening to Bench", label: "Screening to Bench" },
    { value: "Bench to Pilot", label: "Bench to Pilot" },
    { value: "Pilot to Clinical", label: "Pilot to Clinical" },
    { value: "Clinical to Commercial", label: "Clinical to Commercial" },
    { value: "Commercial or Multi-Site", label: "Commercial or Multi-Site" },
  ],
  laborTreatmentMode: [
    { value: "hard_savings", label: "Hard Savings" },
    { value: "redeployed_capacity", label: "Redeployed Capacity" },
    { value: "mixed", label: "Mixed" },
  ],
  integrationComplexity: [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ],
  validationIntensity: [
    { value: "light", label: "Light" },
    { value: "standard", label: "Standard" },
    { value: "intensive", label: "Intensive" },
  ],
  changeManagementRisk: [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ],
  accelerationValueCategory: [
    { value: "hard-dollar", label: "Hard-Dollar" },
    { value: "capacity", label: "Capacity" },
    { value: "strategic", label: "Strategic" },
  ],
  reviewStatus: [
    { value: "Not Reviewed", label: "Not Reviewed" },
    { value: "Under Review", label: "Under Review" },
    { value: "Reviewed with Concerns", label: "Reviewed with Concerns" },
    { value: "Reviewed", label: "Reviewed" },
    {
      value: "Approved for Internal Discussion",
      label: "Approved for Internal Discussion",
    },
  ],
} satisfies Record<string, OptionDefinition[]>;

export const GLOBAL_FIELD_GROUPS: FieldGroup[] = [
  {
    id: "organizationProfile",
    title: "Organization Profile",
    description:
      "Describe the operating environment for this estimate. These inputs apply across every scenario.",
    scenarioScoped: false,
    fields: [
      {
        key: "organizationType",
        label: "Organization Type",
        kind: "select",
        options: selectOptions.organizationType,
        valueCategoryImpact: "Context",
      },
      {
        key: "modality",
        label: "Modality",
        kind: "select",
        options: selectOptions.modality,
        valueCategoryImpact: "Context",
      },
      {
        key: "processStage",
        label: "Process Stage",
        kind: "select",
        options: selectOptions.processStage,
        valueCategoryImpact: "Context",
      },
      {
        key: "processType",
        label: "Process Type",
        kind: "select",
        options: selectOptions.processType,
        valueCategoryImpact: "Context",
      },
      {
        key: "activeProgramsPerYear",
        label: "Active Programs per Year",
        kind: "number",
        min: 1,
        max: 1000,
        step: 1,
        valueCategoryImpact: "Cycle-Time, Strategic",
      },
      {
        key: "runsPerMonth",
        label: "Runs per Month",
        kind: "number",
        min: 1,
        max: 500,
        step: 1,
        valueCategoryImpact: "Labor, Reruns, Failed Runs",
      },
      {
        key: "users",
        label: "Users",
        kind: "number",
        min: 1,
        max: 5000,
        step: 1,
        valueCategoryImpact: "Onboarding, Strategic",
      },
      {
        key: "sites",
        label: "Sites",
        kind: "number",
        min: 1,
        max: 100,
        step: 1,
        valueCategoryImpact: "Strategic, Transfer",
      },
      {
        key: "scaleRange",
        label: "Scale Range",
        kind: "select",
        options: selectOptions.scaleRange,
        valueCategoryImpact: "Context",
      },
      {
        key: "instrumentsPerWorkflow",
        label: "Instruments per Workflow",
        kind: "number",
        min: 1,
        max: 200,
        step: 1,
        valueCategoryImpact: "Strategic",
      },
      {
        key: "vendorsPerWorkflow",
        label: "Vendors per Workflow",
        kind: "number",
        min: 1,
        max: 50,
        step: 1,
        valueCategoryImpact: "Strategic",
      },
      {
        key: "transferEventsPerYear",
        label: "Transfer Events per Year",
        kind: "number",
        min: 0,
        max: 250,
        step: 1,
        valueCategoryImpact: "Transfer",
      },
      {
        key: "newUsersPerYear",
        label: "New Users per Year",
        kind: "number",
        min: 0,
        max: 1000,
        step: 1,
        valueCategoryImpact: "Onboarding",
      },
    ],
  },
  {
    id: "advancedSettings",
    title: "Advanced Settings",
    description:
      "Control optional value categories, display preferences, and export settings.",
    scenarioScoped: false,
    fields: [
      {
        key: "enableStrategicProxyValues",
        label: "Enable Strategic Proxy Values",
        kind: "switch",
        valueCategoryImpact: "Strategic",
      },
      {
        key: "strategicProxyPerMaturityPoint",
        label: "Strategic Proxy per Maturity Point",
        kind: "number",
        min: 0,
        max: 5000000,
        step: 1000,
        valueCategoryImpact: "Strategic",
      },
      {
        key: "enableTransferDelayAvoidance",
        label: "Enable Transfer Delay Avoidance",
        kind: "switch",
        valueCategoryImpact: "Hard-Dollar",
      },
      {
        key: "enableOnboardingValue",
        label: "Enable Onboarding Value",
        kind: "switch",
        valueCategoryImpact: "Hard-Dollar, Capacity",
      },
      {
        key: "showAggressiveScenario",
        label: "Show Aggressive Scenario",
        kind: "switch",
        valueCategoryImpact: "Governance",
      },
      {
        key: "currencyCode",
        label: "Currency Code",
        kind: "text",
        placeholder: "USD",
        valueCategoryImpact: "Display",
      },
      {
        key: "decimalPlaces",
        label: "Decimal Places",
        kind: "number",
        min: 0,
        max: 4,
        step: 1,
        valueCategoryImpact: "Display",
      },
    ],
  },
  {
    id: "reviewAndSignOff",
    title: "Review and Sign-Off",
    description:
      "Track review progress and internal notes. Status helps frame discussion, but it does not certify results.",
    scenarioScoped: false,
    fields: [
      {
        key: "reviewStatus",
        label: "Review Status",
        kind: "select",
        options: selectOptions.reviewStatus,
        valueCategoryImpact: "Governance",
      },
      {
        key: "reviewerName",
        label: "Reviewer Name",
        kind: "text",
        placeholder: "Name or functional role",
        valueCategoryImpact: "Governance",
      },
      {
        key: "reviewedAt",
        label: "Reviewed At",
        kind: "text",
        placeholder: "YYYY-MM-DD",
        valueCategoryImpact: "Governance",
      },
      {
        key: "reviewNotes",
        label: "Review Notes",
        kind: "textarea",
        valueCategoryImpact: "Governance",
      },
      {
        key: "internalDiscussionApproval",
        label: "Internal Discussion Approval",
        kind: "switch",
        valueCategoryImpact: "Governance",
      },
    ],
  },
];

export const SCENARIO_FIELD_GROUPS: FieldGroup[] = [
  {
    id: "currentState",
    title: "Current State",
    description:
      "These values capture the baseline workflow burden that the calculator compares against potential orchestration improvements.",
    scenarioScoped: true,
    fields: [
      {
        key: "scientistDataAggregationHoursPerRun",
        label: "Scientist Data Aggregation Hours per Run",
        kind: "number",
        min: 0,
        max: 200,
        step: 0.25,
        valueCategoryImpact: "Labor",
      },
      {
        key: "engineerDataAggregationHoursPerRun",
        label: "Engineer Data Aggregation Hours per Run",
        kind: "number",
        min: 0,
        max: 200,
        step: 0.25,
        valueCategoryImpact: "Labor",
      },
      {
        key: "technicianDataAggregationHoursPerRun",
        label: "Technician Data Aggregation Hours per Run",
        kind: "number",
        min: 0,
        max: 200,
        step: 0.25,
        valueCategoryImpact: "Labor",
      },
      {
        key: "reportingHoursPerRun",
        label: "Reporting Hours per Run",
        kind: "number",
        min: 0,
        max: 200,
        step: 0.25,
        valueCategoryImpact: "Labor",
      },
      {
        key: "troubleshootingHoursPerRun",
        label: "Troubleshooting Hours per Run",
        kind: "number",
        min: 0,
        max: 200,
        step: 0.25,
        valueCategoryImpact: "Labor",
      },
      {
        key: "manualWorkflowExecutionHoursPerRun",
        label: "Manual Workflow Execution Hours per Run",
        kind: "number",
        min: 0,
        max: 200,
        step: 0.25,
        valueCategoryImpact: "Labor",
      },
      {
        key: "averageRerunRate",
        label: "Average Rerun Rate (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        valueCategoryImpact: "Hard-Dollar",
      },
      {
        key: "averageFailedRunRate",
        label: "Average Failed Run Rate (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        valueCategoryImpact: "Hard-Dollar",
      },
      {
        key: "deviationsPerYear",
        label: "Deviations per Year",
        kind: "number",
        min: 0,
        max: 10000,
        step: 1,
        valueCategoryImpact: "Hard-Dollar",
      },
      {
        key: "investigationHoursPerDeviation",
        label: "Investigation Hours per Deviation",
        kind: "number",
        min: 0,
        max: 500,
        step: 0.5,
        valueCategoryImpact: "Hard-Dollar",
      },
      {
        key: "campaignDurationWeeks",
        label: "Campaign Duration (Weeks)",
        kind: "number",
        min: 0,
        max: 260,
        step: 0.5,
        valueCategoryImpact: "Cycle-Time",
      },
      {
        key: "transferPackagePreparationHours",
        label: "Transfer Package Preparation Hours",
        kind: "number",
        min: 0,
        max: 500,
        step: 0.5,
        valueCategoryImpact: "Transfer",
      },
      {
        key: "onboardingHoursPerUser",
        label: "Onboarding Hours per User",
        kind: "number",
        min: 0,
        max: 500,
        step: 0.5,
        valueCategoryImpact: "Onboarding",
      },
      {
        key: "timeToDecisionLagHours",
        label: "Time to Decision Lag (Hours)",
        kind: "number",
        min: 0,
        max: 500,
        step: 0.5,
        valueCategoryImpact: "Not Monetized in Version 1",
      },
    ],
  },
  {
    id: "costBasis",
    title: "Cost Basis",
    description:
      "Enter direct costs, labor rates, implementation cost, support cost, and discounting assumptions used in the financial results.",
    scenarioScoped: true,
    fields: [
      {
        key: "scientistHourlyCost",
        label: "Scientist Hourly Cost",
        kind: "number",
        min: 0,
        max: 2000,
        step: 1,
        valueCategoryImpact: "Labor",
      },
      {
        key: "engineerHourlyCost",
        label: "Engineer Hourly Cost",
        kind: "number",
        min: 0,
        max: 2000,
        step: 1,
        valueCategoryImpact: "Labor",
      },
      {
        key: "technicianHourlyCost",
        label: "Technician Hourly Cost",
        kind: "number",
        min: 0,
        max: 2000,
        step: 1,
        valueCategoryImpact: "Labor",
      },
      {
        key: "qaHourlyCost",
        label: "Quality Assurance (QA) Hourly Cost",
        kind: "number",
        min: 0,
        max: 2000,
        step: 1,
        valueCategoryImpact: "Hard-Dollar",
      },
      {
        key: "costPerRerun",
        label: "Cost per Rerun",
        kind: "number",
        min: 0,
        max: 10000000,
        step: 100,
        valueCategoryImpact: "Hard-Dollar",
      },
      {
        key: "costPerFailedRun",
        label: "Cost per Failed Run",
        kind: "number",
        min: 0,
        max: 10000000,
        step: 100,
        valueCategoryImpact: "Hard-Dollar",
      },
      {
        key: "costPerDeviation",
        label: "Cost per Deviation",
        kind: "number",
        min: 0,
        max: 10000000,
        step: 100,
        valueCategoryImpact: "Hard-Dollar",
      },
      {
        key: "valuePerWeekOfAcceleration",
        label: "Value per Week of Acceleration",
        kind: "number",
        min: 0,
        max: 100000000,
        step: 1000,
        valueCategoryImpact: "Hard-Dollar, Capacity, Strategic",
      },
      {
        key: "costPerTransferDelayEvent",
        label: "Cost per Transfer Delay Event",
        kind: "number",
        min: 0,
        max: 100000000,
        step: 1000,
        valueCategoryImpact: "Hard-Dollar",
      },
      {
        key: "annualSoftwareCost",
        label: "Annual Software Cost",
        kind: "number",
        min: 0,
        max: 100000000,
        step: 1000,
        valueCategoryImpact: "Investment",
      },
      {
        key: "oneTimeImplementationCost",
        label: "One-Time Implementation Cost",
        kind: "number",
        min: 0,
        max: 100000000,
        step: 1000,
        valueCategoryImpact: "Investment",
      },
      {
        key: "annualSupportCost",
        label: "Annual Support Cost",
        kind: "number",
        min: 0,
        max: 100000000,
        step: 1000,
        valueCategoryImpact: "Investment",
      },
      {
        key: "validationCost",
        label: "Validation Cost",
        kind: "number",
        min: 0,
        max: 100000000,
        step: 1000,
        valueCategoryImpact: "Investment",
      },
      {
        key: "internalProjectHours",
        label: "Internal Project Hours",
        kind: "number",
        min: 0,
        max: 100000,
        step: 1,
        valueCategoryImpact: "Investment",
      },
      {
        key: "internalProjectHourlyCost",
        label: "Internal Project Hourly Cost",
        kind: "number",
        min: 0,
        max: 5000,
        step: 1,
        valueCategoryImpact: "Investment",
      },
      {
        key: "initialTrainingHours",
        label: "Initial Training Hours",
        kind: "number",
        min: 0,
        max: 100000,
        step: 1,
        valueCategoryImpact: "Investment",
      },
      {
        key: "trainingHourlyCost",
        label: "Training Hourly Cost",
        kind: "number",
        min: 0,
        max: 5000,
        step: 1,
        valueCategoryImpact: "Investment",
      },
      {
        key: "discountRate",
        label: "Discount Rate (%)",
        kind: "number",
        min: 0,
        max: 50,
        step: 0.5,
        valueCategoryImpact: "Financial",
      },
    ],
  },
  {
    id: "improvementAssumptions",
    title: "Improvement Assumptions",
    description:
      "Set the expected improvement range for each workflow area. Reference benchmarks are directional only and never replace your inputs.",
    scenarioScoped: true,
    fields: [
      {
        key: "reductionInDataAggregation",
        label: "Reduction in Data Aggregation (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        benchmarkHint: "Contextual reference range: 10%-30% for disciplined orchestration programs.",
        valueCategoryImpact: "Labor",
      },
      {
        key: "reductionInReporting",
        label: "Reduction in Reporting (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        benchmarkHint: "Contextual reference range: 10%-25% when report assembly is partially automated.",
        valueCategoryImpact: "Labor",
      },
      {
        key: "reductionInTroubleshooting",
        label: "Reduction in Troubleshooting (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        benchmarkHint: "Contextual reference range: 5%-20% when issue context is easier to retrieve.",
        valueCategoryImpact: "Labor",
      },
      {
        key: "reductionInManualWorkflowExecution",
        label: "Reduction in Manual Workflow Execution (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        benchmarkHint: "Contextual reference range: 10%-30% for workflow orchestration with structured execution.",
        valueCategoryImpact: "Labor",
      },
      {
        key: "reductionInReruns",
        label: "Reduction in Reruns (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        benchmarkHint: "Contextual reference range: 5%-15% without process redesign.",
        valueCategoryImpact: "Hard-Dollar",
      },
      {
        key: "reductionInFailedRuns",
        label: "Reduction in Failed Runs (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        benchmarkHint: "Contextual reference range: 3%-10% when exception handling improves.",
        valueCategoryImpact: "Hard-Dollar",
      },
      {
        key: "reductionInDeviations",
        label: "Reduction in Deviations (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        benchmarkHint: "Contextual reference range: 5%-20% when workflow evidence capture is stronger.",
        valueCategoryImpact: "Hard-Dollar",
      },
      {
        key: "reductionInCampaignDuration",
        label: "Reduction in Campaign Duration (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        benchmarkHint: "Contextual reference range: 2%-10% for digital coordination gains without process redesign.",
        valueCategoryImpact: "Hard-Dollar, Capacity, Strategic",
      },
      {
        key: "reductionInTransferPreparation",
        label: "Reduction in Transfer Preparation (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        benchmarkHint: "Contextual reference range: 10%-25% when transfer packages are standardized.",
        valueCategoryImpact: "Hard-Dollar, Capacity",
      },
      {
        key: "reductionInOnboarding",
        label: "Reduction in Onboarding (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        benchmarkHint: "Contextual reference range: 10%-30% with guided workflows and reusable templates.",
        valueCategoryImpact: "Hard-Dollar, Capacity",
      },
      {
        key: "reductionInDecisionLag",
        label: "Reduction in Decision Lag (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        benchmarkHint: "Tracked for transparency only in version 1. It is not monetized independently.",
        valueCategoryImpact: "Tracked Only",
      },
      {
        key: "reductionInTransferDelayRisk",
        label: "Reduction in Transfer Delay Risk (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        benchmarkHint: "Contextual reference range: 5%-15% without changing the scientific plan itself.",
        valueCategoryImpact: "Hard-Dollar",
      },
    ],
  },
  {
    id: "riskAndRealization",
    title: "Risk & Realization",
    description:
      "Adjust how much value is expected to be captured, how quickly benefits ramp, and which delivery risks may affect timing.",
    scenarioScoped: true,
    fields: [
      {
        key: "laborTreatmentMode",
        label: "Labor Treatment Mode",
        kind: "select",
        options: selectOptions.laborTreatmentMode,
        valueCategoryImpact: "Hard-Dollar, Capacity",
      },
      {
        key: "mixedLaborHardSavingsShare",
        label: "Mixed Labor Hard-Savings Share (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        valueCategoryImpact: "Hard-Dollar",
      },
      {
        key: "captureFactor",
        label: "Capture Factor (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        valueCategoryImpact: "Hard-Dollar, Capacity, Strategic",
      },
      {
        key: "confidenceFactor",
        label: "Confidence Factor (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        valueCategoryImpact: "Hard-Dollar, Capacity, Strategic",
      },
      {
        key: "adoptionRampMonths",
        label: "Adoption Ramp (Months)",
        kind: "number",
        min: 0,
        max: 36,
        step: 1,
        valueCategoryImpact: "Financial",
      },
      {
        key: "firstYearRealization",
        label: "First-Year Realization (%)",
        kind: "number",
        min: 0,
        max: 100,
        step: 1,
        valueCategoryImpact: "Financial",
      },
      {
        key: "integrationComplexity",
        label: "Integration Complexity",
        kind: "select",
        options: selectOptions.integrationComplexity,
        valueCategoryImpact: "Model Risk",
      },
      {
        key: "validationIntensity",
        label: "Validation Intensity",
        kind: "select",
        options: selectOptions.validationIntensity,
        valueCategoryImpact: "Model Risk",
      },
      {
        key: "changeManagementRisk",
        label: "Change Management Risk",
        kind: "select",
        options: selectOptions.changeManagementRisk,
        valueCategoryImpact: "Model Risk",
      },
      {
        key: "accelerationValueCategory",
        label: "Acceleration Value Category",
        kind: "select",
        options: selectOptions.accelerationValueCategory,
        valueCategoryImpact: "Hard-Dollar, Capacity, Strategic",
      },
    ],
  },
  {
    id: "scenarioJustification",
    title: "Scenario Justification",
    description:
      "Use this space to explain aggressive or high-confidence inputs so reviewers understand the rationale behind the scenario.",
    scenarioScoped: true,
    fields: [
      {
        key: "hardSavingsClassification",
        label: "Hard Savings Classification",
        kind: "textarea",
        valueCategoryImpact: "Governance",
      },
      {
        key: "mixedLaborSplit",
        label: "Mixed Labor Split",
        kind: "textarea",
        valueCategoryImpact: "Governance",
      },
      {
        key: "strategicProxyActivation",
        label: "Strategic Proxy Activation",
        kind: "textarea",
        valueCategoryImpact: "Governance",
      },
      {
        key: "highCaptureFactor",
        label: "High Capture Factor",
        kind: "textarea",
        valueCategoryImpact: "Governance",
      },
      {
        key: "highConfidenceFactor",
        label: "High Confidence Factor",
        kind: "textarea",
        valueCategoryImpact: "Governance",
      },
      {
        key: "aggressiveScenarioUse",
        label: "Aggressive Scenario Use",
        kind: "textarea",
        valueCategoryImpact: "Governance",
      },
      {
        key: "stretchAssumption",
        label: "Stretch Assumption",
        kind: "textarea",
        valueCategoryImpact: "Governance",
      },
      {
        key: "transferDelayAvoidance",
        label: "Transfer Delay Avoidance",
        kind: "textarea",
        valueCategoryImpact: "Governance",
      },
    ],
  },
];

const numberField = (label: string, min: number, max: number) =>
  z
    .number()
    .min(min, `${label} must be at least ${min}.`)
    .max(max, `${label} must be at most ${max}.`);

const nonEmptyText = (label: string, max = 120) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`);

const textArea = (label: string, max = 1500) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`);

export const organizationProfileSchema = z.object({
  organizationType: nonEmptyText("Organization Type"),
  modality: nonEmptyText("Modality"),
  processStage: nonEmptyText("Process Stage"),
  processType: nonEmptyText("Process Type"),
  activeProgramsPerYear: numberField("Active Programs per Year", 1, 1000),
  runsPerMonth: numberField("Runs per Month", 1, 500),
  users: numberField("Users", 1, 5000),
  sites: numberField("Sites", 1, 100),
  scaleRange: nonEmptyText("Scale Range"),
  instrumentsPerWorkflow: numberField("Instruments per Workflow", 1, 200),
  vendorsPerWorkflow: numberField("Vendors per Workflow", 1, 50),
  transferEventsPerYear: numberField("Transfer Events per Year", 0, 250),
  newUsersPerYear: numberField("New Users per Year", 0, 1000),
});

export const currentStateSchema = z.object({
  scientistDataAggregationHoursPerRun: numberField(
    "Scientist Data Aggregation Hours per Run",
    0,
    200,
  ),
  engineerDataAggregationHoursPerRun: numberField(
    "Engineer Data Aggregation Hours per Run",
    0,
    200,
  ),
  technicianDataAggregationHoursPerRun: numberField(
    "Technician Data Aggregation Hours per Run",
    0,
    200,
  ),
  reportingHoursPerRun: numberField("Reporting Hours per Run", 0, 200),
  troubleshootingHoursPerRun: numberField("Troubleshooting Hours per Run", 0, 200),
  manualWorkflowExecutionHoursPerRun: numberField(
    "Manual Workflow Execution Hours per Run",
    0,
    200,
  ),
  averageRerunRate: numberField("Average Rerun Rate (%)", 0, 100),
  averageFailedRunRate: numberField("Average Failed Run Rate (%)", 0, 100),
  deviationsPerYear: numberField("Deviations per Year", 0, 10000),
  investigationHoursPerDeviation: numberField(
    "Investigation Hours per Deviation",
    0,
    500,
  ),
  campaignDurationWeeks: numberField("Campaign Duration (Weeks)", 0, 260),
  transferPackagePreparationHours: numberField(
    "Transfer Package Preparation Hours",
    0,
    500,
  ),
  onboardingHoursPerUser: numberField("Onboarding Hours per User", 0, 500),
  timeToDecisionLagHours: numberField("Time to Decision Lag (Hours)", 0, 500),
});

export const costBasisSchema = z.object({
  scientistHourlyCost: numberField("Scientist Hourly Cost", 0, 2000),
  engineerHourlyCost: numberField("Engineer Hourly Cost", 0, 2000),
  technicianHourlyCost: numberField("Technician Hourly Cost", 0, 2000),
  qaHourlyCost: numberField("Quality Assurance (QA) Hourly Cost", 0, 2000),
  costPerRerun: numberField("Cost per Rerun", 0, 10000000),
  costPerFailedRun: numberField("Cost per Failed Run", 0, 10000000),
  costPerDeviation: numberField("Cost per Deviation", 0, 10000000),
  valuePerWeekOfAcceleration: numberField("Value per Week of Acceleration", 0, 100000000),
  costPerTransferDelayEvent: numberField("Cost per Transfer Delay Event", 0, 100000000),
  annualSoftwareCost: numberField("Annual Software Cost", 0, 100000000),
  oneTimeImplementationCost: numberField("One-Time Implementation Cost", 0, 100000000),
  annualSupportCost: numberField("Annual Support Cost", 0, 100000000),
  validationCost: numberField("Validation Cost", 0, 100000000),
  internalProjectHours: numberField("Internal Project Hours", 0, 100000),
  internalProjectHourlyCost: numberField("Internal Project Hourly Cost", 0, 5000),
  initialTrainingHours: numberField("Initial Training Hours", 0, 100000),
  trainingHourlyCost: numberField("Training Hourly Cost", 0, 5000),
  discountRate: numberField("Discount Rate (%)", 0, 50),
});

export const improvementAssumptionsSchema = z.object({
  reductionInDataAggregation: numberField("Reduction in Data Aggregation (%)", 0, 100),
  reductionInReporting: numberField("Reduction in Reporting (%)", 0, 100),
  reductionInTroubleshooting: numberField("Reduction in Troubleshooting (%)", 0, 100),
  reductionInManualWorkflowExecution: numberField(
    "Reduction in Manual Workflow Execution (%)",
    0,
    100,
  ),
  reductionInReruns: numberField("Reduction in Reruns (%)", 0, 100),
  reductionInFailedRuns: numberField("Reduction in Failed Runs (%)", 0, 100),
  reductionInDeviations: numberField("Reduction in Deviations (%)", 0, 100),
  reductionInCampaignDuration: numberField("Reduction in Campaign Duration (%)", 0, 100),
  reductionInTransferPreparation: numberField("Reduction in Transfer Preparation (%)", 0, 100),
  reductionInOnboarding: numberField("Reduction in Onboarding (%)", 0, 100),
  reductionInDecisionLag: numberField("Reduction in Decision Lag (%)", 0, 100),
  reductionInTransferDelayRisk: numberField("Reduction in Transfer Delay Risk (%)", 0, 100),
});

export const riskAndRealizationSchema = z.object({
  laborTreatmentMode: z.enum(["hard_savings", "redeployed_capacity", "mixed"]),
  mixedLaborHardSavingsShare: numberField("Mixed Labor Hard-Savings Share (%)", 0, 100),
  captureFactor: numberField("Capture Factor (%)", 0, 100),
  confidenceFactor: numberField("Confidence Factor (%)", 0, 100),
  adoptionRampMonths: numberField("Adoption Ramp (Months)", 0, 36),
  firstYearRealization: numberField("First-Year Realization (%)", 0, 100),
  integrationComplexity: z.enum(["low", "medium", "high"]),
  validationIntensity: z.enum(["light", "standard", "intensive"]),
  changeManagementRisk: z.enum(["low", "medium", "high"]),
  accelerationValueCategory: z.enum(["hard-dollar", "capacity", "strategic"]),
});

export const advancedSettingsSchema = z.object({
  enableStrategicProxyValues: z.boolean(),
  strategicProxyPerMaturityPoint: numberField("Strategic Proxy per Maturity Point", 0, 5000000),
  enableTransferDelayAvoidance: z.boolean(),
  enableOnboardingValue: z.boolean(),
  showAggressiveScenario: z.boolean(),
  currencyCode: z
    .string()
    .trim()
    .length(3, "Currency Code must be a 3-letter ISO code.")
    .transform((value) => value.toUpperCase()),
  decimalPlaces: numberField("Decimal Places", 0, 4),
});

export const reviewAndSignOffSchema = z.object({
  reviewStatus: z.enum([
    "Not Reviewed",
    "Under Review",
    "Reviewed with Concerns",
    "Reviewed",
    "Approved for Internal Discussion",
  ]),
  reviewerName: nonEmptyText("Reviewer Name", 120),
  reviewedAt: nonEmptyText("Reviewed At", 32),
  reviewNotes: textArea("Review Notes", 1500),
  internalDiscussionApproval: z.boolean(),
});

export const scenarioJustificationSchema = z.object({
  hardSavingsClassification: textArea("Hard Savings Classification"),
  mixedLaborSplit: textArea("Mixed Labor Split"),
  strategicProxyActivation: textArea("Strategic Proxy Activation"),
  highCaptureFactor: textArea("High Capture Factor"),
  highConfidenceFactor: textArea("High Confidence Factor"),
  aggressiveScenarioUse: textArea("Aggressive Scenario Use"),
  stretchAssumption: textArea("Stretch Assumption"),
  transferDelayAvoidance: textArea("Transfer Delay Avoidance"),
});

export const scenarioModelSchema = z.object({
  currentState: currentStateSchema,
  costBasis: costBasisSchema,
  improvementAssumptions: improvementAssumptionsSchema,
  riskAndRealization: riskAndRealizationSchema,
});

export const editableModelSchema = z.object({
  organizationProfile: organizationProfileSchema,
  scenarios: z.object({
    conservative: scenarioModelSchema,
    expected: scenarioModelSchema,
    aggressive: scenarioModelSchema,
  }),
  advancedSettings: advancedSettingsSchema,
  reviewAndSignOff: reviewAndSignOffSchema,
  scenarioJustifications: z.object({
    conservative: scenarioJustificationSchema,
    expected: scenarioJustificationSchema,
    aggressive: scenarioJustificationSchema,
  }),
});

export const leadCaptureSchema = z.object({
  firstName: nonEmptyText("First Name", 80).min(1, "First Name is required."),
  lastName: nonEmptyText("Last Name", 80).min(1, "Last Name is required."),
  workEmail: z
    .string()
    .trim()
    .email("Enter a valid work email.")
    .refine((value) => !/(gmail|yahoo|hotmail|outlook)\./i.test(value), {
      message: "Use a work email rather than a personal mailbox.",
    }),
  company: nonEmptyText("Company", 120).min(1, "Company is required."),
  jobTitle: nonEmptyText("Job Title", 120).min(1, "Job Title is required."),
  countryRegion: nonEmptyText("Country or Region", 120).min(
    1,
    "Country or Region is required.",
  ),
  consentToContact: z
    .boolean()
    .refine((value) => value === true, {
      message: "Consent is required before unlocking the calculator.",
    }),
});

export const defaultLeadCaptureInput: LeadCaptureFormInput = {
  firstName: "",
  lastName: "",
  workEmail: "",
  company: "",
  jobTitle: "",
  countryRegion: "",
  consentToContact: false,
};

const baseCurrentState: CurrentState = {
  scientistDataAggregationHoursPerRun: 4,
  engineerDataAggregationHoursPerRun: 3,
  technicianDataAggregationHoursPerRun: 2.5,
  reportingHoursPerRun: 3.5,
  troubleshootingHoursPerRun: 2,
  manualWorkflowExecutionHoursPerRun: 3,
  averageRerunRate: 12,
  averageFailedRunRate: 5,
  deviationsPerYear: 26,
  investigationHoursPerDeviation: 12,
  campaignDurationWeeks: 18,
  transferPackagePreparationHours: 80,
  onboardingHoursPerUser: 24,
  timeToDecisionLagHours: 16,
};

const baseCostBasis: CostBasis = {
  scientistHourlyCost: 165,
  engineerHourlyCost: 155,
  technicianHourlyCost: 95,
  qaHourlyCost: 145,
  costPerRerun: 18000,
  costPerFailedRun: 42000,
  costPerDeviation: 9000,
  valuePerWeekOfAcceleration: 85000,
  costPerTransferDelayEvent: 125000,
  annualSoftwareCost: 180000,
  oneTimeImplementationCost: 340000,
  annualSupportCost: 95000,
  validationCost: 140000,
  internalProjectHours: 1200,
  internalProjectHourlyCost: 115,
  initialTrainingHours: 320,
  trainingHourlyCost: 95,
  discountRate: 10,
};

const conservativeImprovements: ImprovementAssumptions = {
  reductionInDataAggregation: 12,
  reductionInReporting: 10,
  reductionInTroubleshooting: 8,
  reductionInManualWorkflowExecution: 10,
  reductionInReruns: 6,
  reductionInFailedRuns: 4,
  reductionInDeviations: 6,
  reductionInCampaignDuration: 3,
  reductionInTransferPreparation: 10,
  reductionInOnboarding: 12,
  reductionInDecisionLag: 8,
  reductionInTransferDelayRisk: 5,
};

const expectedImprovements: ImprovementAssumptions = {
  reductionInDataAggregation: 20,
  reductionInReporting: 18,
  reductionInTroubleshooting: 14,
  reductionInManualWorkflowExecution: 18,
  reductionInReruns: 10,
  reductionInFailedRuns: 7,
  reductionInDeviations: 12,
  reductionInCampaignDuration: 6,
  reductionInTransferPreparation: 18,
  reductionInOnboarding: 20,
  reductionInDecisionLag: 14,
  reductionInTransferDelayRisk: 9,
};

const aggressiveImprovements: ImprovementAssumptions = {
  reductionInDataAggregation: 28,
  reductionInReporting: 26,
  reductionInTroubleshooting: 22,
  reductionInManualWorkflowExecution: 25,
  reductionInReruns: 15,
  reductionInFailedRuns: 10,
  reductionInDeviations: 18,
  reductionInCampaignDuration: 10,
  reductionInTransferPreparation: 24,
  reductionInOnboarding: 28,
  reductionInDecisionLag: 20,
  reductionInTransferDelayRisk: 14,
};

const conservativeRisk: RiskAndRealization = {
  laborTreatmentMode: "redeployed_capacity",
  mixedLaborHardSavingsShare: 30,
  captureFactor: 40,
  confidenceFactor: 55,
  adoptionRampMonths: 9,
  firstYearRealization: 45,
  integrationComplexity: "high",
  validationIntensity: "intensive",
  changeManagementRisk: "high",
  accelerationValueCategory: "capacity",
};

const expectedRisk: RiskAndRealization = {
  laborTreatmentMode: "mixed",
  mixedLaborHardSavingsShare: 35,
  captureFactor: 55,
  confidenceFactor: 65,
  adoptionRampMonths: 6,
  firstYearRealization: 60,
  integrationComplexity: "medium",
  validationIntensity: "standard",
  changeManagementRisk: "medium",
  accelerationValueCategory: "hard-dollar",
};

const aggressiveRisk: RiskAndRealization = {
  laborTreatmentMode: "mixed",
  mixedLaborHardSavingsShare: 50,
  captureFactor: 75,
  confidenceFactor: 80,
  adoptionRampMonths: 4,
  firstYearRealization: 75,
  integrationComplexity: "medium",
  validationIntensity: "standard",
  changeManagementRisk: "medium",
  accelerationValueCategory: "hard-dollar",
};

export const defaultEditableModel: EditableModel = {
  organizationProfile: {
    organizationType: "Biotech",
    modality: "Monoclonal Antibody",
    processStage: "Process Development",
    processType: "Integrated",
    activeProgramsPerYear: 6,
    runsPerMonth: 18,
    users: 42,
    sites: 2,
    scaleRange: "Bench to Pilot",
    instrumentsPerWorkflow: 12,
    vendorsPerWorkflow: 4,
    transferEventsPerYear: 6,
    newUsersPerYear: 16,
  },
  scenarios: {
    conservative: {
      currentState: baseCurrentState,
      costBasis: baseCostBasis,
      improvementAssumptions: conservativeImprovements,
      riskAndRealization: conservativeRisk,
    },
    expected: {
      currentState: baseCurrentState,
      costBasis: baseCostBasis,
      improvementAssumptions: expectedImprovements,
      riskAndRealization: expectedRisk,
    },
    aggressive: {
      currentState: baseCurrentState,
      costBasis: baseCostBasis,
      improvementAssumptions: aggressiveImprovements,
      riskAndRealization: aggressiveRisk,
    },
  },
  advancedSettings: {
    enableStrategicProxyValues: false,
    strategicProxyPerMaturityPoint: 25000,
    enableTransferDelayAvoidance: true,
    enableOnboardingValue: true,
    showAggressiveScenario: true,
    currencyCode: "USD",
    decimalPlaces: 0,
  },
  reviewAndSignOff: {
    reviewStatus: "Not Reviewed",
    reviewerName: "Internal business case owner",
    reviewedAt: "YYYY-MM-DD",
    reviewNotes:
      "Use this section to capture internal review notes, open questions, and planning decisions.",
    internalDiscussionApproval: false,
  },
  scenarioJustifications: {
    conservative: {
      hardSavingsClassification: "",
      mixedLaborSplit: "",
      strategicProxyActivation: "",
      highCaptureFactor: "",
      highConfidenceFactor: "",
      aggressiveScenarioUse: "",
      stretchAssumption: "",
      transferDelayAvoidance: "",
    },
    expected: {
      hardSavingsClassification: "",
      mixedLaborSplit: "",
      strategicProxyActivation: "",
      highCaptureFactor: "",
      highConfidenceFactor: "",
      aggressiveScenarioUse: "",
      stretchAssumption: "",
      transferDelayAvoidance: "",
    },
    aggressive: {
      hardSavingsClassification: "",
      mixedLaborSplit: "",
      strategicProxyActivation: "",
      highCaptureFactor: "",
      highConfidenceFactor: "",
      aggressiveScenarioUse: "",
      stretchAssumption: "",
      transferDelayAvoidance: "",
    },
  },
};

const globalGroupPath = (group: FieldGroup) => {
  if (group.id === "organizationProfile") {
    return "organizationProfile";
  }

  if (group.id === "advancedSettings") {
    return "advancedSettings";
  }

  return "reviewAndSignOff";
};

const scenarioGroupPath = (group: FieldGroup, scenarioId: ScenarioId) => {
  if (group.id === "scenarioJustification") {
    return `scenarioJustifications.${scenarioId}`;
  }

  return `scenarios.${scenarioId}.${group.id}`;
};

const sectionLabelMap: Record<SectionId, string> = {
  organizationProfile: "Organization Profile",
  currentState: "Current State",
  costBasis: "Cost Basis",
  improvementAssumptions: "Improvement Assumptions",
  riskAndRealization: "Risk & Realization",
  advancedSettings: "Advanced Settings",
  reviewAndSignOff: "Review and Sign-Off",
  scenarioJustification: "Scenario Justification",
};

export const getSectionLabel = (sectionId: SectionId) => sectionLabelMap[sectionId];

const allFieldEntries = [
  ...GLOBAL_FIELD_GROUPS.flatMap((group) =>
    group.fields.map((field) => ({
      path: `${globalGroupPath(group)}.${field.key}`,
      field,
      section: group.id,
      scenario: "global" as const,
    })),
  ),
  ...SCENARIO_IDS.flatMap((scenarioId) =>
    SCENARIO_FIELD_GROUPS.flatMap((group) =>
      group.fields.map((field) => ({
        path: `${scenarioGroupPath(group, scenarioId)}.${field.key}`,
        field,
        section: group.id,
        scenario: scenarioId,
      })),
    ),
  ),
];

export const FIELD_METADATA_BY_PATH = Object.fromEntries(
  allFieldEntries.map((entry) => [entry.path, entry]),
) as Record<
  string,
  {
    path: string;
    field: FieldDefinition;
    section: SectionId;
    scenario: ScenarioId | "global";
  }
>;

export const buildInitialProvenanceMap = () => {
  const timestamp = new Date().toISOString();

  return allFieldEntries.reduce<ProvenanceMap>((accumulator, entry) => {
    accumulator[entry.path] = {
      label: entry.field.label,
      assumption: entry.field.label,
      section: sectionLabelMap[entry.section],
      scenario: entry.scenario,
      sourceLabel: "Default",
      provenanceClass: "default_placeholder",
      sourceQuality: "generic_placeholder",
      valueCategoryImpact: entry.field.valueCategoryImpact,
      notes:
        entry.field.benchmarkHint ??
        "Default placeholder value. Replace with direct operating data when available.",
      benchmarkHint: entry.field.benchmarkHint,
      lastUpdatedAt: timestamp,
    };

    return accumulator;
  }, {});
};

export const buildImportedProvenanceMap = (note: string) => {
  const importedMap = buildInitialProvenanceMap();
  const timestamp = new Date().toISOString();

  return Object.fromEntries(
    Object.entries(importedMap).map(([path, entry]) => [
      path,
      {
        ...entry,
        sourceLabel: "User",
        provenanceClass: "imported_external" as const,
        sourceQuality: "generic_placeholder" as const,
        notes: note,
        lastUpdatedAt: timestamp,
      },
    ]),
  ) as ProvenanceMap;
};

export const buildEmptyJustification = (): ScenarioJustification => ({
  hardSavingsClassification: "",
  mixedLaborSplit: "",
  strategicProxyActivation: "",
  highCaptureFactor: "",
  highConfidenceFactor: "",
  aggressiveScenarioUse: "",
  stretchAssumption: "",
  transferDelayAvoidance: "",
});

export const REVIEW_APPROVAL_DISCLAIMER =
  "Review status helps your team track progress. It does not guarantee outcomes or replace financial, quality, or regulatory review.";
