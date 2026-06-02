import { expect, test, type Page } from "@playwright/test";

const submittedInputs = {
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
  onboardingDays: 60,
};

const generatedReport = {
  modelVersion: "2.1.0",
  executiveSummary:
    "The submitted assessment shows material review drag and a strong opportunity to connect the operating stack.",
  salesFollowUp: {
    priority: "Validate current review workflow",
    discoveryFocus: ["Review handoff", "Analyzer context", "Batch-failure recovery"],
    recommendedAction: "Schedule a technical discovery session.",
    proposalUse: "Use as planning evidence for BioPilot scoping.",
  },
  investment: {
    tierId: "professional",
    tierLabel: "Professional",
    monthlySubscription: 9000,
    annualSubscription: 108000,
    subscriptionTermYears: 3,
    threeYearSubscription: 324000,
    includedEngineeringLabel: "Basic engineering included",
    includedMaintenanceLabel: "Maintenance included",
    bioreactors: 4,
    recipesRunning: 4,
    recipeStorage: 20,
    patEquipment: 10,
    users: 8,
    customerEngineeringHours: 160,
    customerEngineeringHourlyRate: 145,
    customerEngineeringInvestment: 23200,
    additionalServicesInvestment: 0,
    firstYearInvestment: 131200,
    totalThreeYearInvestment: 347200,
    yearOneValue: 252000,
    yearTwoValue: 378000,
    yearThreeValue: 420000,
    threeYearValue: 1050000,
    netThreeYearBenefit: 702800,
    paybackMonths: 8.2,
  },
  valueLevers: [
    {
      id: "review-time",
      label: "Review time",
      annualValue: 185000,
      summary: "Recovered review time from faster evidence assembly.",
    },
  ],
  buyingSignals: [
    {
      id: "manual-review",
      title: "Manual review drag",
      severity: "Material",
      summary: "The assessment indicates review effort is still being assembled manually.",
      action: "Review workflow evidence.",
    },
  ],
};

const longFeedbackComment =
  "This is a deliberately long feedback comment that must remain readable in the admin page detail view. It includes the original concern about input values above 40, spacing, and the need to review the complete comment without relying on a truncated table column.";

const installAdminApiMocks = async (page: Page) => {
  await page.route("**/api/lead-capture", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        entries: [
          {
            id: "lead-1",
            sessionMode: "actual",
            firstName: "Maya",
            lastName: "Chen",
            workEmail: "maya.chen@example-bioprocess.com",
            company: "Northstar Biologics",
            jobTitle: "Process Development Lead",
            countryRegion: "United States",
            consentToContact: true,
            source: "bioprocess-roi-calculator",
            createdAt: "2026-05-11T16:00:00.000Z",
            updatedAt: "2026-05-11T16:10:00.000Z",
          },
        ],
      }),
    });
  });

  await page.route("**/api/assessment-submissions", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        entries: [
          {
            id: "assessment-1",
            leadCaptureId: "lead-1",
            sessionMode: "actual",
            firstName: "Maya",
            lastName: "Chen",
            workEmail: "maya.chen@example-bioprocess.com",
            company: "Northstar Biologics",
            jobTitle: "Process Development Lead",
            countryRegion: "United States",
            processProfileId: "mab-cho",
            lifecycleStageId: "clinical-manufacturing",
            fitBand: "Very Strong BioPilot Fit",
            fitScore: 88,
            annualValuePotential: 420000,
            threeYearRoi: 315,
            paybackMonths: 8.2,
            digitalCoverage: 44,
            manualBurdenIndex: 72,
            modelVersion: "2.1.0",
            digitalPlantMaturityScore: 48,
            digitalPlantMaturityLevel: 2,
            evidenceConfidenceScore: 91,
            evidenceConfidenceBand: "High",
            topPriority: "Validate current review workflow",
            salesFollowUp: "Schedule a technical discovery session.",
            executiveSummary: generatedReport.executiveSummary,
            evidenceMeta: {
              completedSectionIds: [
                "operating-frame",
                "solution-investment",
                "connected-stack",
                "manual-burden",
                "batch-failure",
              ],
              usedSampleData: false,
            },
            submittedInputs,
            generatedReport,
            createdAt: "2026-05-11T16:20:00.000Z",
            updatedAt: "2026-05-11T16:20:00.000Z",
          },
        ],
      }),
    });
  });

  await page.route("**/api/assessment-progress", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        entries: [
          {
            id: "progress-1",
            sessionId: "session-123456",
            sessionMode: "actual",
            leadCaptureId: "lead-1",
            firstName: "Maya",
            lastName: "Chen",
            workEmail: "maya.chen@example-bioprocess.com",
            company: "Northstar Biologics",
            jobTitle: "Process Development Lead",
            countryRegion: "United States",
            currentStep: "inputs",
            status: "input_section_confirmed",
            completedSections: ["operating-frame", "connected-stack"],
            processProfileId: "mab-cho",
            lifecycleStageId: "clinical-manufacturing",
            fitBand: "Strong BioPilot Fit",
            fitScore: 78,
            annualValuePotential: 330000,
            modelVersion: "2.1.0",
            evidenceConfidenceScore: 62,
            evidenceConfidenceBand: "Directional",
            topPriority: "Complete manual burden review",
            evidenceMeta: {
              completedSectionIds: ["operating-frame", "connected-stack"],
              usedSampleData: false,
            },
            submittedInputs,
            generatedReport,
            createdAt: "2026-05-11T16:15:00.000Z",
            updatedAt: "2026-05-11T16:18:00.000Z",
          },
        ],
      }),
    });
  });

  await page.route("**/api/feedback", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        entries: [
          {
            id: "feedback-1",
            assessmentId: "assessment-1",
            workEmail: "maya.chen@example-bioprocess.com",
            company: "Northstar Biologics",
            rating: 4,
            usefulness: 5,
            clarity: 3,
            comment: longFeedbackComment,
            page: "final-report",
            createdAt: "2026-05-11T16:30:00.000Z",
          },
        ],
      }),
    });
  });
};

test("admin rows open clear full-detail views for leads, assessments, progress, and feedback", async ({
  page,
}) => {
  await installAdminApiMocks(page);

  await page.goto("/admin/leads");
  await page.getByPlaceholder("Enter admin key").fill("test-admin-key");
  await page.getByRole("button", { name: "Load records" }).click();

  await expect(page.getByText("Loaded 1 leads, 1 assessments, 1 progress records, and 1 feedback records.")).toBeVisible();

  await page.getByRole("button", { name: "View feedback details for maya.chen@example-bioprocess.com" }).click();
  await expect(page.locator("#record-detail-panel")).toContainText("Full comment");
  await expect(page.locator("#record-detail-panel")).toContainText(longFeedbackComment);

  await page.getByRole("button", { name: "View assessment details for maya.chen@example-bioprocess.com" }).click();
  await expect(page.locator("#record-detail-panel")).toContainText("Submitted inputs");
  await expect(page.locator("#record-detail-panel")).toContainText("BioPilot investment basis");
  await expect(page.locator("#record-detail-panel")).toContainText("Professional");
  await expect(page.locator("#record-detail-panel")).toContainText("Calculated 3-year BioPilot investment");
  await expect(page.locator("#record-detail-panel")).toContainText("Operator ramp days");
  await expect(page.locator("#record-detail-panel")).toContainText("60 days");
  await expect(page.locator("#record-detail-panel")).toContainText("Recommended follow-up");

  await page.getByRole("button", { name: "View lead details for maya.chen@example-bioprocess.com" }).click();
  await expect(page.locator("#record-detail-panel")).toContainText("Consent to contact");
  await expect(page.locator("#record-detail-panel")).toContainText("Yes");

  await page.getByRole("button", { name: "View progress details for maya.chen@example-bioprocess.com" }).click();
  await expect(page.locator("#record-detail-panel")).toContainText("Saved inputs");
  await expect(page.locator("#record-detail-panel")).toContainText("Operating Frame, Connected Stack");
});
