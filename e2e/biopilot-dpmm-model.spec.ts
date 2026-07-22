import { expect, test } from "@playwright/test";

import {
  assessBioPilotFit,
  BIOPHORUM_DPMM_REFERENCE,
  DEFAULT_BIOPILOT_ASSESSMENT_INPUTS,
  PROCESS_PROFILE_MAP,
  PROCESS_PROFILES,
  type BioPilotAssessmentInputs,
} from "../lib/biopilot-fit-assessment";

const highMaturityInputs: BioPilotAssessmentInputs = {
  ...DEFAULT_BIOPILOT_ASSESSMENT_INPUTS,
  bioreactorConnectivity: 86,
  sensorCoverage: 84,
  patCoverage: 82,
  analyzerConnectivity: 86,
  downstreamVisibility: 82,
  dataContextualization: 84,
  sopAutomation: 80,
  reviewByException: 78,
  crossSiteCollaboration: 76,
  manualTranscriptionShare: 14,
  offlineDataDelayHours: 3,
  batchReviewHours: 7,
  deviationInvestigationHours: 7,
  weeksSinceLastBatchFailure: 132,
  failureCauseExposureScore: 12,
  failedRunRecoveryHours: 12,
  techTransferPackageHours: 18,
  onboardingDays: 8,
  vendorPlatforms: 2,
  sites: 2,
  transferEventsPerYear: 2,
};

const lowMaturityInputs: BioPilotAssessmentInputs = {
  ...DEFAULT_BIOPILOT_ASSESSMENT_INPUTS,
  bioreactorConnectivity: 12,
  sensorCoverage: 18,
  patCoverage: 8,
  analyzerConnectivity: 10,
  downstreamVisibility: 18,
  dataContextualization: 12,
  sopAutomation: 10,
  reviewByException: 8,
  crossSiteCollaboration: 12,
  manualTranscriptionShare: 88,
  offlineDataDelayHours: 30,
  batchReviewHours: 42,
  deviationInvestigationHours: 40,
  weeksSinceLastBatchFailure: 12,
  failureCauseExposureScore: 82,
  failedRunRecoveryHours: 180,
  techTransferPackageHours: 132,
  onboardingDays: 96,
  vendorPlatforms: 8,
  sites: 7,
  transferEventsPerYear: 10,
};

test.describe("DPMM-aligned maturity calibration", () => {
  test("adds source-aligned maturity domains, levels, and gap metadata", () => {
    const results = assessBioPilotFit(DEFAULT_BIOPILOT_ASSESSMENT_INPUTS);
    const maturity = results.digitalPlantMaturity;

    expect(results.modelVersion).toBe("2.2.1");
    expect(maturity.sourceLabel).toBe(BIOPHORUM_DPMM_REFERENCE.label);
    expect(maturity.caveat).toContain("not a completed BioPhorum workbook assessment");
    expect(maturity.domains).toHaveLength(8);
    expect(maturity.topGaps).toHaveLength(3);
    expect(maturity.domains.map((domain) => domain.sourceDimension)).toEqual([
      "Manufacturing execution and process automation",
      "Process development",
      "Quality control labs",
      "Quality management systems",
      "Manufacturing support",
      "Supply chain",
      "People and culture",
      "Cybersecurity and operations",
    ]);
    expect(
      maturity.domains.every(
        (domain) =>
          domain.level >= 1 &&
          domain.level <= 5 &&
          domain.criteria.length >= 3 &&
          domain.linkedValueLevers.length >= 1,
      ),
    ).toBe(true);
  });

  test("moves maturity level upward when connected evidence and review readiness improve", () => {
    const low = assessBioPilotFit(lowMaturityInputs).digitalPlantMaturity;
    const high = assessBioPilotFit(highMaturityInputs).digitalPlantMaturity;

    expect(high.score).toBeGreaterThan(low.score);
    expect(high.level).toBeGreaterThanOrEqual(low.level);
    expect(low.topGaps[0].gapScore).toBeGreaterThanOrEqual(high.topGaps[0].gapScore);
  });

  test("places Cell Therapy in the advanced-therapy cluster and applies its profile assumptions", () => {
    const processProfileIds = PROCESS_PROFILES.map((profile) => profile.id);

    expect(processProfileIds.indexOf("cell-therapy")).toBeGreaterThan(
      processProfileIds.indexOf("viral-vector"),
    );
    expect(processProfileIds.indexOf("cell-therapy")).toBeLessThan(
      processProfileIds.indexOf("plasmid-dna"),
    );
    expect(PROCESS_PROFILE_MAP["cell-therapy"]).toMatchObject({
      label: "Cell Therapy",
      base: {
        manualHoursPerRun: 28,
        reviewHours: 22,
        runSuccessRate: 84,
        deviationRate: 0.13,
      },
    });

    const results = assessBioPilotFit({
      ...DEFAULT_BIOPILOT_ASSESSMENT_INPUTS,
      processProfileId: "cell-therapy",
    });
    const defaultResults = assessBioPilotFit(DEFAULT_BIOPILOT_ASSESSMENT_INPUTS);

    expect(results.profile.label).toBe("Cell Therapy");
    expect(results.currentState.manualHoursPerRun).toBeGreaterThan(
      defaultResults.currentState.manualHoursPerRun,
    );
    expect(results.executiveSummary).toContain("Cell Therapy");
  });

  test("produces valid ROI outputs for every supported process family", () => {
    for (const profile of PROCESS_PROFILES) {
      const results = assessBioPilotFit({
        ...DEFAULT_BIOPILOT_ASSESSMENT_INPUTS,
        processProfileId: profile.id,
      });

      expect(results.profile.id).toBe(profile.id);
      expect(results.executiveSummary).toContain(profile.label);
      expect(Number.isFinite(results.fitScore)).toBe(true);
      expect(results.fitScore).toBeGreaterThanOrEqual(8);
      expect(results.fitScore).toBeLessThanOrEqual(98);
      expect(Number.isFinite(results.annualRecoveredHours)).toBe(true);
      expect(results.annualRecoveredHours).toBeGreaterThan(0);
      expect(Number.isFinite(results.annualValuePotential)).toBe(true);
      expect(results.annualValuePotential).toBeGreaterThan(0);
      expect(Number.isFinite(results.threeYearRoi)).toBe(true);
      expect(Number.isFinite(results.paybackMonths)).toBe(true);
      expect(results.investment.totalThreeYearInvestment).toBeGreaterThan(0);
      expect(results.valueLevers.length).toBeGreaterThanOrEqual(4);
      expect(results.buyingSignals.length).toBeGreaterThan(0);
      expect(results.digitalPlantMaturity.domains).toHaveLength(8);
      expect(results.digitalPlantMaturity.topGaps).toHaveLength(3);
      expect(results.currentState.manualHoursPerRun).toBeGreaterThan(
        results.bioPilotState.manualHoursPerRun,
      );
      expect(results.currentState.reviewHours).toBeGreaterThan(results.bioPilotState.reviewHours);
    }
  });
});
