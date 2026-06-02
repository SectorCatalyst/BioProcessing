import { expect, test, type Page } from "@playwright/test";
import { readFileSync, statSync } from "node:fs";

const actualLead = {
  firstName: "Avery",
  lastName: "Stone",
  workEmail: "avery.stone@bioprocess.example",
  company: "Northstar Biologics",
  jobTitle: "Process Development Lead",
  countryRegion: "United States",
};

const expectedInputKeys = [
  "processProfileId",
  "lifecycleStageId",
  "activePrograms",
  "runsPerYear",
  "sites",
  "transferEventsPerYear",
  "vendorPlatforms",
  "blendedHourlyRate",
  "costPerFailedRun",
  "valuePerDayAcceleration",
  "bioPilotTierId",
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
].sort();

const launchExampleSession = async (page: Page) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Launch Example Session" }).click();
  await expect(page.getByText("Choose The Bioprocess Type")).toBeVisible();
  await expect(page.getByText("Sample Reviewer")).toBeVisible();
  await expect(page.getByText("Yokogawa Demo")).toBeVisible();
};

const continueToInputs = async (page: Page) => {
  await page.getByRole("button", { name: "Continue To Inputs" }).click();
  await expect(page.getByText("Enter Current-State Inputs")).toBeVisible();
  await expect(page.getByText("Input Progress")).toBeVisible();
};

const confirmAllInputSections = async (page: Page) => {
  await page.getByRole("button", { name: "Confirm And Continue" }).click();
  await expect(page.locator("#input-question-set").getByText("BioPilot Deployment Scope")).toBeVisible();
  await expect(page.locator("#input-question-set").getByText("Scope First")).toBeVisible();
  await expect(page.locator("#input-question-set").getByLabel("Online Bioreactors")).toBeVisible();
  await expect(page.locator("#input-question-set").getByLabel("Customer Engineering Time")).toBeVisible();
  await expect(page.locator("#input-question-set").getByText("$3,000")).toHaveCount(0);
  await expect(page.locator("#input-question-set").getByText("Monthly Subscription")).toHaveCount(0);
  await expect(page.locator("#input-question-set").getByText("3-Year BioPilot Investment")).toHaveCount(0);
  await expect(page.getByText("Input Progress")).toBeVisible();

  await page.getByRole("button", { name: "Confirm And Continue" }).click();
  await expect(page.getByText("Bioreactor Connectivity")).toBeVisible();
  await expect(page.getByText("Input Progress")).toBeVisible();

  await page.getByRole("button", { name: "Confirm And Continue" }).click();
  await expect(page.getByText("Manual Transcription Share")).toBeVisible();
  await expect(page.getByText("Input Progress")).toBeVisible();

  await page.getByRole("button", { name: "Confirm And Continue" }).click();
  await expect(page.locator("#input-question-set").getByText("Batch Failure And Recovery")).toBeVisible();
  await expect(page.getByLabel("Weeks Since Last Batch Failure")).toBeVisible();

  await page.getByRole("button", { name: "Confirm Section" }).click();
  await expect(page.getByRole("button", { name: "Generate Final Report" })).toBeVisible();
};

test.describe("BioPilot assessment flow", () => {
  test("actual session starts selected with blank contact fields", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Actual Session Selected")).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toHaveValue("");
    await expect(page.locator('input[name="lastName"]')).toHaveValue("");
    await expect(page.locator('input[name="workEmail"]')).toHaveValue("");
    await expect(page.locator('input[name="company"]')).toHaveValue("");

    await page.locator('input[name="firstName"]').fill(actualLead.firstName);
    await page.locator('input[name="lastName"]').fill(actualLead.lastName);
    await page.locator('input[name="workEmail"]').fill(actualLead.workEmail);
    await page.locator('input[name="company"]').fill(actualLead.company);
    await page.locator('input[name="jobTitle"]').fill(actualLead.jobTitle);
    await page.locator('input[name="countryRegion"]').fill(actualLead.countryRegion);
    await page.locator('[role="checkbox"]').click();
    await page.getByRole("button", { name: "Start Actual Assessment" }).click();

    await expect(page.getByText("Choose The Bioprocess Type")).toBeVisible();
    await expect(page.getByText(`${actualLead.firstName} ${actualLead.lastName}`)).toBeVisible();
    await expect(page.getByText(actualLead.company)).toBeVisible();

    const persistedLead = await page.evaluate(() => {
      const rawStore = window.localStorage.getItem("bioprocess-roi-calculator");
      return rawStore ? JSON.parse(rawStore).state?.leadCapture : null;
    });
    expect(persistedLead).toMatchObject(actualLead);
  });

  test("example session seeds sample contact data and starts the example flow", async ({ page }) => {
    await launchExampleSession(page);
    await expect(page.getByRole("button", { name: /Step 2 Process Type/i })).toBeVisible();
  });

  test("generates final report and exports a PDF from an example session", async ({ page }) => {
    await launchExampleSession(page);
    await continueToInputs(page);
    await confirmAllInputSections(page);

    await page.getByRole("button", { name: "Generate Final Report" }).click();
    await expect(page.locator("section").getByText(/Assessment Report$/)).toBeVisible();
    await expect(page.getByText("Very Strong BioPilot Fit", { exact: true })).toBeVisible();
    await expect(page.getByText("BioPilot Investment Basis", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("3-Year BioPilot Investment", { exact: true }).first()).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export PDF" }).click(),
    ]);
    const pdfPath = await download.path();

    expect(pdfPath).toBeTruthy();
    expect(statSync(pdfPath as string).size).toBeGreaterThan(100_000);
    expect(readFileSync(pdfPath as string).subarray(0, 4).toString()).toBe("%PDF");
  });

  test("accepts current-state inputs above 40 and applies neutral survey benchmark values", async ({ page }) => {
    await launchExampleSession(page);
    await continueToInputs(page);

    await page.getByRole("button", { name: "Apply Survey Benchmark" }).click();
    await expect(page.locator("#input-question-set").getByText("Batch Failure And Recovery")).toBeVisible();
    await expect(page.getByLabel("Weeks Since Last Batch Failure")).toHaveValue("64");
    await expect(page.getByLabel("Failure-Cause Exposure")).toHaveValue("35");
    await page.getByLabel("Operator Ramp Days").fill("60");
    await expect(page.getByLabel("Operator Ramp Days")).toHaveValue("60");

    await page.getByRole("tab", { name: "Operating Frame" }).click();
    await page.getByLabel("Process Runs Per Year").fill("350");
    await page.getByLabel("Sites Or Partners In Scope").fill("12");
    await page.getByLabel("Failed-Run Impact").fill("300000");
    await expect(page.getByLabel("Process Runs Per Year")).toHaveValue("350");
    await expect(page.getByLabel("Sites Or Partners In Scope")).toHaveValue("12");
    await expect(page.getByLabel("Failed-Run Impact")).toHaveValue("300000");
    await expect(
      page.getByText("Outside typical planning range. Confirm before relying on ROI.").first(),
    ).toBeVisible();
    await confirmAllInputSections(page);
    await page.getByRole("button", { name: "Generate Final Report" }).click();
    await expect(page.locator("section").getByText(/Assessment Report$/)).toBeVisible();
    await expect(page.getByText("Survey Benchmark Used")).toBeVisible();
    await expect(page.getByText("Model Version")).toBeVisible();
  });

  test("saves contact details and all current inputs in progress and submission payloads", async ({ page }) => {
    await launchExampleSession(page);
    await continueToInputs(page);

    await page.getByRole("button", { name: "Apply Survey Benchmark" }).click();
    await page.getByLabel("Operator Ramp Days").fill("60");
    await page.getByRole("tab", { name: "Operating Frame" }).click();
    await page.getByLabel("Process Runs Per Year").fill("350");
    await page.getByLabel("Loaded Labor Rate").fill("300");

    const persistedLead = await page.evaluate(() => {
      const rawStore = window.localStorage.getItem("bioprocess-roi-calculator");
      return rawStore ? JSON.parse(rawStore).state?.leadCapture : null;
    });
    expect(persistedLead).toMatchObject({
      firstName: "Sample",
      lastName: "Reviewer",
      workEmail: "sample.session@yokogawa-demo.com",
      company: "Yokogawa Demo",
      jobTitle: "Bioprocess Strategy Lead",
      countryRegion: "United States",
      consentToContact: true,
    });

    const persistedInputs = await page.evaluate(() => {
      const rawInputs = window.localStorage.getItem("biopilot-fit-assessment-state-v3");
      return rawInputs ? JSON.parse(rawInputs) : null;
    });
    expect(Object.keys(persistedInputs).sort()).toEqual(expectedInputKeys);
    expect(persistedInputs).toMatchObject({
      runsPerYear: 350,
      blendedHourlyRate: 300,
      bioPilotTierId: expect.any(String),
      bioPilotBioreactors: expect.any(Number),
      bioPilotRecipesRunning: expect.any(Number),
      bioPilotRecipeStorage: expect.any(Number),
      bioPilotPatEquipment: expect.any(Number),
      bioPilotUsers: expect.any(Number),
      customerEngineeringHours: expect.any(Number),
      customerEngineeringHourlyRate: 300,
      additionalServicesInvestment: expect.any(Number),
      weeksSinceLastBatchFailure: 64,
      failureCauseExposureScore: 35,
      onboardingDays: 60,
    });

    await confirmAllInputSections(page);

    const progressRequestPromise = page.waitForRequest((request) =>
      request.url().includes("/api/assessment-progress") &&
      request.method() === "POST" &&
      Boolean(request.postData()?.includes('"status":"report_ready"')),
    );
    const submissionRequestPromise = page.waitForRequest((request) =>
      request.url().includes("/api/assessment-submissions") && request.method() === "POST",
    );

    await page.getByRole("button", { name: "Generate Final Report" }).click();

    const progressPayload = (await progressRequestPromise).postDataJSON();
    const submissionPayload = (await submissionRequestPromise).postDataJSON();

    for (const payload of [progressPayload, submissionPayload]) {
      expect(payload).toMatchObject({
        firstName: "Sample",
        lastName: "Reviewer",
        workEmail: "sample.session@yokogawa-demo.com",
        company: "Yokogawa Demo",
        jobTitle: "Bioprocess Strategy Lead",
        countryRegion: "United States",
        consentToContact: true,
        modelVersion: "2.1.1",
      });
      expect(Object.keys(payload.inputs).sort()).toEqual(expectedInputKeys);
      expect(payload.inputs).toMatchObject({
        runsPerYear: 350,
        blendedHourlyRate: 300,
        bioPilotTierId: expect.any(String),
        bioPilotBioreactors: expect.any(Number),
        bioPilotRecipesRunning: expect.any(Number),
        bioPilotRecipeStorage: expect.any(Number),
        bioPilotPatEquipment: expect.any(Number),
        bioPilotUsers: expect.any(Number),
        customerEngineeringHours: expect.any(Number),
        customerEngineeringHourlyRate: 300,
        additionalServicesInvestment: expect.any(Number),
        weeksSinceLastBatchFailure: 64,
        failureCauseExposureScore: 35,
        onboardingDays: 60,
      });
    }

    expect(progressPayload.completedSectionIds.sort()).toEqual([
      "batch-failure",
      "connected-stack",
      "manual-burden",
      "operating-frame",
      "solution-investment",
    ]);
    expect(submissionPayload.evidenceMeta.completedSectionIds.sort()).toEqual([
      "batch-failure",
      "connected-stack",
      "manual-burden",
      "operating-frame",
      "solution-investment",
    ]);
    await expect(page.locator("section").getByText(/Assessment Report$/)).toBeVisible();
  });

  test("jumps back to the first skipped input section when a later section is confirmed", async ({ page }) => {
    await launchExampleSession(page);
    await continueToInputs(page);

    await page.getByRole("button", { name: "Confirm And Continue" }).click();
    await expect(page.locator("#input-question-set").getByText("BioPilot Deployment Scope")).toBeVisible();

    await page.getByRole("button", { name: "Confirm And Continue" }).click();
    await expect(page.locator("#input-question-set").getByText("Connected Bioprocess Stack")).toBeVisible();

    await page.getByRole("button", { name: "Confirm And Continue" }).click();
    await expect(page.locator("#input-question-set").getByText("Manual Burden And Review Drag")).toBeVisible();

    await page.getByRole("tab", { name: "Batch Failure And Recovery" }).click();
    await expect(page.locator("#input-question-set").getByText("Batch Failure And Recovery")).toBeVisible();

    await page.getByRole("button", { name: "Confirm Section" }).click();
    await expect(page.locator("#input-question-set").getByText("Manual Burden And Review Drag")).toBeVisible();
    await expect(page.getByText("Manual Burden And Review Drag still needs confirmation")).toBeVisible();
  });
});
