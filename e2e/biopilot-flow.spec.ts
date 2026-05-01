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
  await expect(page.getByText("Bioreactor Connectivity")).toBeVisible();
  await expect(page.getByText("Input Progress")).toBeVisible();

  await page.getByRole("button", { name: "Confirm And Continue" }).click();
  await expect(page.getByText("Manual Transcription Share")).toBeVisible();
  await expect(page.getByText("Input Progress")).toBeVisible();

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
    await expect(page.getByText("Final Report")).toBeVisible();
    await expect(page.getByText("Very Strong BioPilot Fit", { exact: true })).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export PDF" }).click(),
    ]);
    const pdfPath = await download.path();

    expect(pdfPath).toBeTruthy();
    expect(statSync(pdfPath as string).size).toBeGreaterThan(100_000);
    expect(readFileSync(pdfPath as string).subarray(0, 4).toString()).toBe("%PDF");
  });
});
