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

const internalAssessmentPath = "/internal/biopilot-assessment-7f6d2c";

const unlockInternalMode = async (page: Page) => {
  await page.route("**/api/admin/authorize", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ authorized: true, message: "Internal mode authorized." }),
    });
  });
  await page.goto(internalAssessmentPath);
  await expect(page.getByText("Internal Review Tools Locked")).toBeVisible();
  await page.getByLabel("Internal mode admin key").fill("test-admin-key");
  await page.getByRole("button", { name: "Unlock" }).click();
  await expect(page.getByRole("button", { name: "Launch Example Session" })).toBeVisible();
};

const launchExampleSession = async (page: Page) => {
  await unlockInternalMode(page);
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
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "biopilot-fit-assessment-state-v3",
        JSON.stringify({
          activePrograms: 99,
          runsPerYear: 777,
          sites: 42,
        }),
      );
    });

    await page.goto("/");

    await expect(page.getByText("Ready For Your Details")).toBeVisible();
    await expect(page.getByText("Actual Session")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Launch Example Session" })).toHaveCount(0);
    await expect(page.getByText("Internal Review Tools Locked")).toHaveCount(0);
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
    await page.getByRole("button", { name: "Start Assessment" }).click();

    await expect(page.getByText("Choose The Bioprocess Type")).toBeVisible();
    await expect(page.getByText(`${actualLead.firstName} ${actualLead.lastName}`)).toBeVisible();
    await expect(page.getByText(actualLead.company)).toBeVisible();

    const persistedLead = await page.evaluate(() => {
      const rawStore = window.localStorage.getItem("bioprocess-roi-calculator");
      return rawStore ? JSON.parse(rawStore).state?.leadCapture : null;
    });
    expect(persistedLead).toMatchObject(actualLead);

    await continueToInputs(page);
    await expect(page.getByText("Sample Scenario")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Apply Sample Data" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Apply Survey Benchmark" })).toHaveCount(0);
    await expect(page.getByLabel("Process Runs Per Year")).not.toHaveValue("777");

    const legacyInputs = await page.evaluate(() =>
      window.localStorage.getItem("biopilot-fit-assessment-state-v3"),
    );
    expect(legacyInputs).toBeNull();
  });

  test("example session seeds sample contact data and starts the example flow", async ({ page }) => {
    await launchExampleSession(page);
    await expect(page.getByRole("button", { name: /Step 2 Process Type/i })).toBeVisible();
  });

  test("places Cell Therapy in the advanced therapy cluster and selects it normally", async ({ page }) => {
    await launchExampleSession(page);

    const processCards = page.locator("button[aria-pressed]");
    await expect(processCards.nth(5)).toContainText("Viral Vector");
    await expect(processCards.nth(6)).toContainText("Cell Therapy");
    await expect(processCards.nth(7)).toContainText("Plasmid DNA");

    await processCards.nth(6).click();
    await expect(processCards.nth(6)).toHaveAttribute("aria-pressed", "true");

    await continueToInputs(page);
    await expect(page.getByText("Cell Therapy").first()).toBeVisible();
    await expect(page.getByText("Guided Execution And SOP Adherence")).toBeVisible();
  });

  test("keeps process-family cards spaced without overlap on desktop and mobile", async ({ page }) => {
    const assertProcessCardLayout = async () => {
      const processCards = page.locator("button[aria-pressed]");
      await expect(processCards).toHaveCount(9);

      const boxes = await processCards.evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            text: element.textContent?.replace(/\s+/g, " ").trim() ?? "",
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          };
        }),
      );

      for (const box of boxes) {
        expect(box.width, `${box.text} card should have stable width`).toBeGreaterThan(150);
        expect(box.height, `${box.text} card should have stable height`).toBeGreaterThan(170);
      }

      for (let leftIndex = 0; leftIndex < boxes.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < boxes.length; rightIndex += 1) {
          const left = boxes[leftIndex];
          const right = boxes[rightIndex];
          const overlapX = Math.min(left.right, right.right) - Math.max(left.left, right.left);
          const overlapY = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top);

          expect(
            overlapX > 1 && overlapY > 1,
            `${left.text} should not overlap ${right.text}`,
          ).toBe(false);
        }
      }
    };

    await launchExampleSession(page);
    await assertProcessCardLayout();

    await page.setViewportSize({ width: 390, height: 900 });
    await expect(page.getByRole("button", { name: /Cell Therapy/i })).toBeVisible();
    await assertProcessCardLayout();
  });

  test("generates valid final report outputs for Cell Therapy", async ({ page }) => {
    await launchExampleSession(page);

    const processCards = page.locator("button[aria-pressed]");
    await processCards.nth(6).click();
    await continueToInputs(page);
    await confirmAllInputSections(page);

    const progressRequestPromise = page.waitForRequest((request) =>
      request.url().includes("/api/assessment-progress") &&
      request.method() === "POST" &&
      Boolean(request.postData()?.includes('"status":"report_ready"')) &&
      Boolean(request.postData()?.includes('"processProfileId":"cell-therapy"')),
    );
    const submissionRequestPromise = page.waitForRequest((request) =>
      request.url().includes("/api/assessment-submissions") &&
      request.method() === "POST" &&
      Boolean(request.postData()?.includes('"processProfileId":"cell-therapy"')),
    );

    await page.getByRole("button", { name: "Generate Final Report" }).click();

    const progressPayload = (await progressRequestPromise).postDataJSON();
    const submissionPayload = (await submissionRequestPromise).postDataJSON();

    await expect(page.locator("section").getByText("Cell Therapy Assessment Report")).toBeVisible();
    await expect(page.getByText("Cell Therapy in process development shows")).toBeVisible();
    await expect(page.getByText("How The Estimate Was Calculated")).toBeVisible();
    await expect(page.getByText("DPMM-Aligned Maturity Heatmap")).toBeVisible();
    await expect(page.getByText("BioPilot Investment Basis", { exact: true }).first()).toBeVisible();
    expect(progressPayload.inputs.processProfileId).toBe("cell-therapy");
    expect(submissionPayload.inputs.processProfileId).toBe("cell-therapy");
    expect(progressPayload.modelVersion).toBe("2.2.1");
    expect(submissionPayload.modelVersion).toBe("2.2.1");
    expect(submissionPayload.inputs.runsPerYear).toBeGreaterThan(0);
    expect(submissionPayload.inputs.costPerFailedRun).toBeGreaterThan(0);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export PDF" }).click(),
    ]);
    const pdfPath = await download.path();

    expect(pdfPath).toBeTruthy();
    expect(statSync(pdfPath as string).size).toBeGreaterThan(100_000);
    expect(readFileSync(pdfPath as string).subarray(0, 4).toString()).toBe("%PDF");
  });

  test("generates final report and exports a PDF from an example session", async ({ page }) => {
    await launchExampleSession(page);
    await continueToInputs(page);
    await confirmAllInputSections(page);

    await page.getByRole("button", { name: "Generate Final Report" }).click();
    await expect(page.locator("section").getByText(/Assessment Report$/)).toBeVisible();
    await expect(page.getByText("Very Strong BioPilot Fit", { exact: true })).toBeVisible();
    await expect(page.getByText("How The Fit Score Was Calculated")).toBeVisible();
    await expect(page.getByText("Digital coverage gap x 38%").first()).toBeVisible();
    await expect(page.getByText("DPMM-Aligned Maturity Heatmap")).toBeVisible();
    await expect(page.getByText("Largest Maturity Gaps")).toBeVisible();
    await expect(page.getByText("BioPhorum DPMM 3.0 / 3.1 aligned")).toBeVisible();
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
      const rawInputs = window.localStorage.getItem("biopilot-fit-assessment-state-v4");
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
        modelVersion: "2.2.1",
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
