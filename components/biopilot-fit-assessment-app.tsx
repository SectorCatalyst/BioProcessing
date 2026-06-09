"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  FileDown,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  assessBioPilotFit,
  BIOPILOT_ADJUSTABLE_INPUT_KEYS,
  BIOPILOT_INPUT_SECTION_IDS,
  BIOPILOT_MODEL_VERSION,
  BIOPILOT_OPERATING_FRAME_LIMITS,
  BIOPILOT_SAMPLE_CONFIGS,
  BIOPLAN_2023_BATCH_FAILURE_BENCHMARK,
  buildRandomizedSampleInputs,
  DEFAULT_BIOPILOT_ASSESSMENT_INPUTS,
  inferBioPilotTierId,
  LIFECYCLE_STAGES,
  LIFECYCLE_STAGE_MAP,
  normalizeAssessmentInputs,
  PROCESS_PROFILES,
  PROCESS_PROFILE_MAP,
  type BioPilotAssessmentInputs,
  type BioPilotAssessmentResults,
  type AssessmentEvidenceMeta,
  type AssessmentInputSource,
  type BioPilotAdjustableInputKey,
  type BioPilotInputSectionId,
  type BioPilotNumericInputKey,
  type ProcessProfileId,
} from "@/lib/biopilot-fit-assessment";
import {
  defaultLeadCaptureInput,
  leadCaptureSchema,
  type LeadCaptureFormInput,
  type LeadCaptureRecord,
} from "@/lib/model";
import { exportBioPilotAssessmentPdf } from "@/lib/biopilot-fit-export";
import { cn } from "@/lib/utils";
import { useCalculatorStore } from "@/store/use-calculator-store";
import { ProcessFamilyIllustration } from "@/components/biopilot-process-illustrations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const LEGACY_STORAGE_KEYS = [
  "biopilot-fit-assessment-state-v2",
  "biopilot-fit-assessment-state-v1",
] as const;
const STORAGE_KEY = "biopilot-fit-assessment-state-v3";

const SHELL_CARD =
  "glass-edge relative rounded-[40px] border border-[color:var(--border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(245,248,252,0.96))] backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-x-12 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/90 before:to-transparent";
const PANEL_CARD =
  "glass-edge relative rounded-[30px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,249,252,0.98))] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/95 before:to-transparent";
const SOFT_CARD =
  "relative rounded-[24px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(240,245,251,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_12px_26px_rgba(11,28,59,0.06)]";
const DARK_PANEL =
  "relative overflow-hidden rounded-[30px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(155deg,#051427_0%,#082243_58%,#0b2f5f_100%)] text-white shadow-[0_28px_80px_rgba(7,20,43,0.24)]";
const DARK_SOFT =
  "rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const INPUT_CLASS =
  "h-[56px] rounded-[18px] border-[color:var(--input)] bg-[color:var(--surface-3)] px-4 text-lg font-medium text-[color:var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] placeholder:text-[color:var(--muted-foreground)] focus-visible:border-[color:var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]";
const PRIMARY_BUTTON =
  "h-11 rounded-[14px] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(135deg,#004f9b,#0b7fff)] px-4 text-[0.95rem] font-semibold text-white shadow-[0_10px_24px_rgba(0,95,189,0.18)] hover:text-white hover:shadow-[0_14px_30px_rgba(0,95,189,0.22)]";
const SECONDARY_BUTTON =
  "h-11 rounded-[14px] border-[color:var(--border-strong)] bg-[color:var(--surface-3)] px-4 text-[0.95rem] font-semibold text-[color:var(--foreground)] hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--foreground)]";
const ACCENT_BUTTON =
  "h-11 rounded-[14px] border border-[rgba(255,238,0,0.28)] bg-[linear-gradient(135deg,#ffee00,#f2da00)] px-4 text-[0.95rem] font-semibold text-[color:var(--brand-indigo)] shadow-[0_8px_18px_rgba(255,238,0,0.14)] hover:shadow-[0_12px_24px_rgba(255,238,0,0.18)]";
const SELECT_CONTENT_CLASS =
  "border-[color:var(--border)] bg-[color:var(--popover)] text-[color:var(--foreground)] text-lg shadow-[0_24px_50px_rgba(11,28,59,0.16)] backdrop-blur-xl";
const SELECT_ITEM_CLASS = "min-h-[48px] px-3 py-2 text-lg leading-7";

const schedulePageTopScroll = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  const animationFrame = window.requestAnimationFrame(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  });

  return () => window.cancelAnimationFrame(animationFrame);
};

const scheduleElementScroll = (elementId: string) => {
  if (typeof window === "undefined") {
    return undefined;
  }

  let layoutFrame: number | undefined;
  const animationFrame = window.requestAnimationFrame(() => {
    layoutFrame = window.requestAnimationFrame(() => {
      const target = window.document.getElementById(elementId);
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!target) {
        return;
      }

      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  });

  return () => {
    window.cancelAnimationFrame(animationFrame);
    if (layoutFrame !== undefined) {
      window.cancelAnimationFrame(layoutFrame);
    }
  };
};

const SAMPLE_LEAD: LeadCaptureFormInput = {
  firstName: "Sample",
  lastName: "Reviewer",
  workEmail: "sample.session@yokogawa-demo.com",
  company: "Yokogawa Demo",
  jobTitle: "Bioprocess Strategy Lead",
  countryRegion: "United States",
  consentToContact: true,
};

const STEP_ORDER = [
  { id: "intro", label: "Contact" },
  { id: "profile", label: "Process Type" },
  { id: "inputs", label: "Operating Inputs" },
  { id: "report", label: "Final Report" },
] as const;

type AssessmentStep = (typeof STEP_ORDER)[number]["id"];

type AssessmentSessionMode = "example" | "actual";

type AssessmentProgressStatus =
  | "contact_captured"
  | "process_selected"
  | "inputs_started"
  | "input_section_confirmed"
  | "report_ready"
  | "report_generation_failed"
  | "report_generated";

type AdjustableFieldKey = BioPilotNumericInputKey;
type InputSourceFieldKey = BioPilotAdjustableInputKey;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const FIELD_COPY: Record<
  AdjustableFieldKey,
  {
    label: string;
    description: string;
    min: number;
    max: number;
    typicalMin?: number;
    typicalMax?: number;
    step: number;
    suffix?: string;
    kind: "number" | "range";
  }
> = {
  activePrograms: {
    label: "Active Programs In Scope",
    description: "Number of products, campaigns, or programs using this operating model in the next 12 months.",
    min: BIOPILOT_OPERATING_FRAME_LIMITS.activePrograms.min,
    max: BIOPILOT_OPERATING_FRAME_LIMITS.activePrograms.max,
    typicalMin: BIOPILOT_OPERATING_FRAME_LIMITS.activePrograms.typicalMin,
    typicalMax: BIOPILOT_OPERATING_FRAME_LIMITS.activePrograms.typicalMax,
    step: 1,
    kind: "number",
  },
  runsPerYear: {
    label: "Process Runs Per Year",
    description: "Number of upstream or end-to-end runs expected in this scope over the next 12 months.",
    min: BIOPILOT_OPERATING_FRAME_LIMITS.runsPerYear.min,
    max: BIOPILOT_OPERATING_FRAME_LIMITS.runsPerYear.max,
    typicalMin: BIOPILOT_OPERATING_FRAME_LIMITS.runsPerYear.typicalMin,
    typicalMax: BIOPILOT_OPERATING_FRAME_LIMITS.runsPerYear.typicalMax,
    step: 1,
    kind: "number",
  },
  sites: {
    label: "Sites Or Partners In Scope",
    description: "Number of facilities, CDMOs, or major partners that must reproduce or review this process.",
    min: BIOPILOT_OPERATING_FRAME_LIMITS.sites.min,
    max: BIOPILOT_OPERATING_FRAME_LIMITS.sites.max,
    typicalMin: BIOPILOT_OPERATING_FRAME_LIMITS.sites.typicalMin,
    typicalMax: BIOPILOT_OPERATING_FRAME_LIMITS.sites.typicalMax,
    step: 1,
    kind: "number",
  },
  transferEventsPerYear: {
    label: "Annual Transfer Events",
    description: "Number of scale-up, site-transfer, validation, or partner handoff packages expected in the next 12 months.",
    min: BIOPILOT_OPERATING_FRAME_LIMITS.transferEventsPerYear.min,
    max: BIOPILOT_OPERATING_FRAME_LIMITS.transferEventsPerYear.max,
    typicalMin: BIOPILOT_OPERATING_FRAME_LIMITS.transferEventsPerYear.typicalMin,
    typicalMax: BIOPILOT_OPERATING_FRAME_LIMITS.transferEventsPerYear.typicalMax,
    step: 1,
    kind: "number",
  },
  vendorPlatforms: {
    label: "Data Platforms In Scope",
    description: "Number of separate bioreactor, analyzer, historian, LIMS/MES, modeling, or spreadsheet systems used for one process record.",
    min: BIOPILOT_OPERATING_FRAME_LIMITS.vendorPlatforms.min,
    max: BIOPILOT_OPERATING_FRAME_LIMITS.vendorPlatforms.max,
    typicalMin: BIOPILOT_OPERATING_FRAME_LIMITS.vendorPlatforms.typicalMin,
    typicalMax: BIOPILOT_OPERATING_FRAME_LIMITS.vendorPlatforms.typicalMax,
    step: 1,
    kind: "number",
  },
  blendedHourlyRate: {
    label: "Loaded Labor Rate",
    description: "Average fully loaded USD/hr rate for scientists, engineers, operators, QA, and review contributors.",
    min: BIOPILOT_OPERATING_FRAME_LIMITS.blendedHourlyRate.min,
    max: BIOPILOT_OPERATING_FRAME_LIMITS.blendedHourlyRate.max,
    typicalMin: BIOPILOT_OPERATING_FRAME_LIMITS.blendedHourlyRate.typicalMin,
    typicalMax: BIOPILOT_OPERATING_FRAME_LIMITS.blendedHourlyRate.typicalMax,
    step: 5,
    suffix: "$/hr",
    kind: "number",
  },
  costPerFailedRun: {
    label: "Failed-Run Impact",
    description: "USD impact of one lost, unusable, or repeated run including materials, labor, analytics, and schedule drag.",
    min: BIOPILOT_OPERATING_FRAME_LIMITS.costPerFailedRun.min,
    max: BIOPILOT_OPERATING_FRAME_LIMITS.costPerFailedRun.max,
    typicalMin: BIOPILOT_OPERATING_FRAME_LIMITS.costPerFailedRun.typicalMin,
    typicalMax: BIOPILOT_OPERATING_FRAME_LIMITS.costPerFailedRun.typicalMax,
    step: 5000,
    suffix: "USD",
    kind: "number",
  },
  valuePerDayAcceleration: {
    label: "Value Of One Day Faster",
    description: "USD value of moving one key process decision, transfer milestone, or campaign release forward by one day.",
    min: BIOPILOT_OPERATING_FRAME_LIMITS.valuePerDayAcceleration.min,
    max: BIOPILOT_OPERATING_FRAME_LIMITS.valuePerDayAcceleration.max,
    typicalMin: BIOPILOT_OPERATING_FRAME_LIMITS.valuePerDayAcceleration.typicalMin,
    typicalMax: BIOPILOT_OPERATING_FRAME_LIMITS.valuePerDayAcceleration.typicalMax,
    step: 5000,
    suffix: "USD",
    kind: "number",
  },
  bioPilotBioreactors: {
    label: "Online Bioreactors",
    description: "Number of bioreactors expected to be connected in the BioPilot scope.",
    min: 1,
    max: 20,
    step: 1,
    kind: "number",
  },
  bioPilotRecipesRunning: {
    label: "Active Recipes",
    description: "Number of recipes expected to be running online in the initial BioPilot scope.",
    min: 1,
    max: 20,
    step: 1,
    kind: "number",
  },
  bioPilotRecipeStorage: {
    label: "Stored Recipes",
    description: "Number of stored recipes expected to remain available for reuse and review.",
    min: 1,
    max: 100,
    step: 1,
    kind: "number",
  },
  bioPilotPatEquipment: {
    label: "PAT Equipment",
    description: "Number of PAT or analyzer equipment connections included in the BioPilot scope.",
    min: 0,
    max: 60,
    step: 1,
    kind: "number",
  },
  bioPilotUsers: {
    label: "Users",
    description: "Number of users expected to access the BioPilot workflow in the selected scope.",
    min: 1,
    max: 50,
    step: 1,
    kind: "number",
  },
  customMonthlySubscription: {
    label: "Inferred Monthly Subscription",
    description: "Use this when the BioPilot subscription is outside the standard scope options.",
    min: 1000,
    max: 50000,
    step: 500,
    suffix: "USD/mo",
    kind: "number",
  },
  customerEngineeringHours: {
    label: "Customer Engineering Time",
    description: "Estimated customer-side engineering hours needed to prepare, connect, validate, and adopt the first workflow.",
    min: 0,
    max: 1000,
    step: 5,
    suffix: "hrs",
    kind: "number",
  },
  customerEngineeringHourlyRate: {
    label: "Engineering Hourly Rate",
    description: "Loaded USD/hr rate for customer engineering, validation, automation, and system-support time.",
    min: 80,
    max: 350,
    step: 5,
    suffix: "$/hr",
    kind: "number",
  },
  additionalServicesInvestment: {
    label: "Additional Services",
    description: "Optional one-time amount for selected templates, consulting, or added launch support.",
    min: 0,
    max: 500000,
    step: 5000,
    suffix: "USD",
    kind: "number",
  },
  plannedProgramInvestment: {
    label: "Calculated 3-Year BioPilot Investment",
    description:
      "Derived compatibility value from subscription scope, customer engineering time, and additional services.",
    min: 0,
    max: 2000000,
    step: 10000,
    suffix: "USD",
    kind: "number",
  },
  bioreactorConnectivity: {
    label: "Bioreactor Connectivity",
    description: "Score 0-100: share of reactor and control data available in a shared digital operating view.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  sensorCoverage: {
    label: "Core Sensor Coverage",
    description: "Score 0-100: share of critical process parameters captured digitally with timestamped signal history.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  patCoverage: {
    label: "PAT Coverage",
    description: "Score 0-100: share of process understanding supported by PAT or online measurements instead of offline interpretation.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  analyzerConnectivity: {
    label: "Analyzer Connectivity",
    description: "Score 0-100: share of at-line and offline analyzer results linked to batch, unit operation, and time context.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  downstreamVisibility: {
    label: "Downstream Visibility",
    description: "Score 0-100: share of purification, filtration, and downstream evidence visible with upstream context.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  dataContextualization: {
    label: "Data Contextualization",
    description: "Score 0-100: share of run data linked to recipe, phase, intervention, sample, and deviation context.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  sopAutomation: {
    label: "SOP Automation",
    description: "Score 0-100: share of execution steps guided, captured, or checked digitally instead of manually coordinated.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  reviewByException: {
    label: "Review-By-Exception Readiness",
    description: "Score 0-100: share of review evidence that is already complete, contextualized, and exception-ready after each run.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  crossSiteCollaboration: {
    label: "Cross-Site Collaboration",
    description: "Score 0-100: share of site or partner work that can rely on one reusable digital operating record.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  manualTranscriptionShare: {
    label: "Manual Transcription Share",
    description: "Percent of run execution, analysis, and review work still dependent on manual entry or spreadsheet stitching.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  offlineDataDelayHours: {
    label: "Offline Data Delay",
    description: "Average hours between sample collection and analyzer evidence becoming usable for process decisions.",
    min: 1,
    max: 36,
    step: 1,
    suffix: "hrs",
    kind: "number",
  },
  batchReviewHours: {
    label: "Batch Review Hours",
    description: "Average specialist hours required to assemble, check, and review the evidence package for one run.",
    min: 2,
    max: 48,
    step: 1,
    suffix: "hrs",
    kind: "number",
  },
  deviationInvestigationHours: {
    label: "Deviation Investigation Hours",
    description: "Average investigation hours required when one deviation, excursion, or unexplained process event opens.",
    min: 2,
    max: 48,
    step: 1,
    suffix: "hrs",
    kind: "number",
  },
  weeksSinceLastBatchFailure: {
    label: "Weeks Since Last Batch Failure",
    description: "Weeks since the most recent lost, repeated, or materially degraded run in this operating scope.",
    min: 0,
    max: 156,
    step: 1,
    suffix: "weeks",
    kind: "number",
  },
  failureCauseExposureScore: {
    label: "Failure-Cause Exposure",
    description: "Score 0-100 for exposure to equipment failure, contamination, operator error, material failure, specification misses, or cross-product contamination.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  failedRunRecoveryHours: {
    label: "Failed-Run Recovery Hours",
    description: "Specialist hours required to investigate, recover, restart, or rebuild evidence after one failed or materially degraded run.",
    min: 0,
    max: 240,
    step: 1,
    suffix: "hrs",
    kind: "number",
  },
  techTransferPackageHours: {
    label: "Transfer Package Hours",
    description: "Average hours required to assemble one scale-up, site-transfer, or partner handoff package.",
    min: 8,
    max: 160,
    step: 2,
    suffix: "hrs",
    kind: "number",
  },
  onboardingDays: {
    label: "Operator Ramp Days",
    description: "Typical calendar days before a new operator, scientist, or reviewer can work independently in this process.",
    min: 3,
    max: 120,
    step: 1,
    suffix: "days",
    kind: "number",
  },
};

const INPUT_SECTIONS = [
  {
    id: "operating-frame",
    title: "Operating Frame",
    description: "Enter count, rate, and USD assumptions for the current 12-month operating model.",
    fields: [
      "activePrograms",
      "runsPerYear",
      "sites",
      "transferEventsPerYear",
      "vendorPlatforms",
      "blendedHourlyRate",
      "costPerFailedRun",
      "valuePerDayAcceleration",
    ] as AdjustableFieldKey[],
  },
  {
    id: "solution-investment",
    title: "BioPilot Deployment Scope",
    description: "Define the connected workflow scale and customer engineering time without introducing pricing yet.",
    fields: [
      "bioPilotBioreactors",
      "bioPilotRecipesRunning",
      "bioPilotRecipeStorage",
      "bioPilotPatEquipment",
      "bioPilotUsers",
      "customerEngineeringHours",
    ] as AdjustableFieldKey[],
  },
  {
    id: "connected-stack",
    title: "Connected Bioprocess Stack",
    description: "Use 0-100 scores to estimate current digital coverage across instruments, data, and review evidence.",
    fields: [
      "bioreactorConnectivity",
      "sensorCoverage",
      "patCoverage",
      "analyzerConnectivity",
      "downstreamVisibility",
      "dataContextualization",
      "sopAutomation",
      "reviewByException",
      "crossSiteCollaboration",
    ] as AdjustableFieldKey[],
  },
  {
    id: "manual-burden",
    title: "Manual Burden And Review Drag",
    description: "Enter current delay, review, investigation, transfer, and ramp effort as measurable time assumptions.",
    fields: [
      "manualTranscriptionShare",
      "offlineDataDelayHours",
      "batchReviewHours",
      "deviationInvestigationHours",
    ] as AdjustableFieldKey[],
  },
  {
    id: "batch-failure",
    title: "Batch Failure And Recovery",
    description: "Use recent failure occurrence, cause exposure, and recovery effort to size failure-risk value explicitly.",
    fields: [
      "weeksSinceLastBatchFailure",
      "failureCauseExposureScore",
      "failedRunRecoveryHours",
      "techTransferPackageHours",
      "onboardingDays",
    ] as AdjustableFieldKey[],
  },
] as const;

type InputSectionId = (typeof INPUT_SECTIONS)[number]["id"];

const createAssessmentSessionId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getAssessmentProgressStatus = ({
  currentStep,
  completedInputSectionIds,
  hasReport,
}: {
  currentStep: AssessmentStep;
  completedInputSectionIds: InputSectionId[];
  hasReport: boolean;
}): AssessmentProgressStatus => {
  const allInputSectionsComplete = BIOPILOT_INPUT_SECTION_IDS.every((sectionId) =>
    completedInputSectionIds.includes(sectionId),
  );

  if (currentStep === "report" || hasReport) {
    return "report_generated";
  }

  if (allInputSectionsComplete) {
    return "report_ready";
  }

  if (completedInputSectionIds.length > 0) {
    return "input_section_confirmed";
  }

  if (currentStep === "inputs") {
    return "inputs_started";
  }

  if (currentStep === "profile") {
    return "process_selected";
  }

  return "contact_captured";
};

const INPUT_SECTION_GUIDANCE: Record<InputSectionId, string> = {
  "operating-frame":
    "These values set the scale of the business case. Typical planning ranges are guidance only; larger values are accepted and flagged for confirmation.",
  "solution-investment":
    "These values size the likely BioPilot deployment. The report will introduce the inferred investment basis after the operating value is established.",
  "connected-stack":
    "These 0-100 scores define the digital plant maturity baseline across instruments, PAT, analyzer context, and operating evidence.",
  "manual-burden":
    "These time assumptions directly drive recoverable hours. Use recent run reviews or team estimates when exact data is not available.",
  "batch-failure":
    "These values separate ordinary review effort from failure occurrence and recovery. Use site records when available, or apply the survey benchmark as a planning starting point.",
};

const HERO_SUPPORT_BULLETS = [
  "Map bioreactors, PAT, analyzers, and review friction in one flow.",
  "Compare the current state to an estimated BioPilot operating model.",
  "Leave with a fit score, estimated value, and a recommended next step.",
] as const;

const PROCESS_FAMILY_TAGS: Record<ProcessProfileId, string> = {
  "mab-cho": "Antibody",
  "biosimilar-antibody": "Comparability",
  "recombinant-protein": "Protein",
  "microbial-fermentation": "Fermentation",
  vaccines: "Vaccine",
  "viral-vector": "Vector",
  "plasmid-dna": "Plasmid",
  "mrna-rna": "RNA",
};

const REPORT_CHANGE_ITEMS = [
  {
    label: "Manual Hours Per Run",
    currentKey: "manualHoursPerRun",
    currentSuffix: " hrs",
  },
  {
    label: "Batch Review Time",
    currentKey: "reviewHours",
    currentSuffix: " hrs",
  },
  {
    label: "Decision Lag",
    currentKey: "decisionLagHours",
    currentSuffix: " hrs",
  },
  {
    label: "Run Success Rate",
    currentKey: "runSuccessRate",
    currentSuffix: "%",
  },
  {
    label: "Failure Recovery Effort",
    currentKey: "failureRecoveryHours",
    currentSuffix: " hrs",
  },
  {
    label: "Transfer Package Effort",
    currentKey: "transferPackageHours",
    currentSuffix: " hrs",
  },
  {
    label: "Operator Ramp",
    currentKey: "onboardingDays",
    currentSuffix: " days",
  },
] as const;

const REPORT_FRAME_CARD =
  "rounded-[30px] border border-[#c7daec] bg-[#e9f3fb] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]";

function loadInitialInputs(): BioPilotAssessmentInputs {
  if (typeof window === "undefined") {
    return DEFAULT_BIOPILOT_ASSESSMENT_INPUTS;
  }

  const saved =
    window.localStorage.getItem(STORAGE_KEY) ??
    LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(
      (value): value is string => Boolean(value),
    );
  if (!saved) {
    return DEFAULT_BIOPILOT_ASSESSMENT_INPUTS;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<BioPilotAssessmentInputs>;
    const migrated = normalizeAssessmentInputs(parsed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    for (const key of LEGACY_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
    return DEFAULT_BIOPILOT_ASSESSMENT_INPUTS;
  }
}

function buildInputSources(source: AssessmentInputSource) {
  return Object.fromEntries(
    BIOPILOT_ADJUSTABLE_INPUT_KEYS.map((key) => [key, source]),
  ) as Partial<Record<InputSourceFieldKey, AssessmentInputSource>>;
}

function InputSectionCard({
  section,
  inputs,
  onPatch,
}: {
  section: (typeof INPUT_SECTIONS)[number];
  inputs: BioPilotAssessmentInputs;
  onPatch: (patch: Partial<BioPilotAssessmentInputs>) => void;
}) {
  return (
    <div className={cn(PANEL_CARD, "overflow-hidden p-0")}>
      <div className="border-b border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(247,250,252,0.96))] px-5 py-4">
        <p className="text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
          Input Section
        </p>
        <p className="mt-2 font-heading text-[1.45rem] tracking-[-0.03em] text-[color:var(--foreground)]">
          {section.title}
        </p>
        <p className="mt-1 max-w-[70ch] text-base leading-6 text-[color:var(--muted-foreground)]">
          {section.description}
        </p>
        <Alert className="mt-4 border-[color:var(--border)] bg-[color:var(--surface-2)]">
          <ShieldCheck className="size-4 text-[color:var(--brand-blue)]" />
          <AlertTitle>Evidence Guidance</AlertTitle>
          <AlertDescription>{INPUT_SECTION_GUIDANCE[section.id]}</AlertDescription>
        </Alert>
      </div>
      {section.id === "solution-investment" ? <BioPilotDeploymentScopePanel /> : null}
      <div className="grid auto-rows-fr gap-3 px-4 py-4 md:grid-cols-2 2xl:grid-cols-3">
        {section.fields.map((field) =>
          FIELD_COPY[field].kind === "range" ? (
            <RangeField
              key={field}
              field={field}
              value={inputs[field]}
              onChange={(next) => onPatch({ [field]: next })}
            />
          ) : (
            <NumberField
              key={`${field}-${inputs[field]}`}
              field={field}
              value={inputs[field]}
              onChange={(next) => onPatch({ [field]: next })}
            />
          ),
        )}
      </div>
    </div>
  );
}

function BioPilotDeploymentScopePanel() {
  return (
    <div className="border-b border-[color:var(--border)] bg-[rgba(255,255,255,0.46)] px-4 py-4">
      <Alert className="border-[color:var(--border)] bg-[color:var(--surface-2)]">
        <ShieldCheck className="size-4 text-[color:var(--brand-blue)]" />
        <AlertTitle>Scope First</AlertTitle>
        <AlertDescription>
          Enter the connected assets, users, and customer engineering time expected for the first workflow. The final report will infer the commercial scope after the value case is established.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function ReportMetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  const isLongValue = value.length >= 9;

  return (
    <div className={cn(DARK_SOFT, "min-w-0 min-h-[148px] p-4")}>
      <p className="text-[12px] uppercase tracking-[0.18em] text-white/52">{label}</p>
      <p
        className={cn(
          "mt-3 max-w-full font-heading leading-[0.92] text-white [font-variant-numeric:tabular-nums]",
          isLongValue
            ? "text-[clamp(1.8rem,2.9vw,2.3rem)] tracking-[-0.075em]"
            : "text-[clamp(2rem,3.8vw,2.85rem)] tracking-[-0.06em]",
        )}
      >
        {value}
      </p>
      <p className="mt-3 text-[0.96rem] leading-6 text-white/70">{detail}</p>
    </div>
  );
}

function LaneScoreCard({
  label,
  currentScore,
  enabledScore,
  summary,
  leverage,
}: {
  label: string;
  currentScore: number;
  enabledScore: number;
  summary: string;
  leverage: string;
}) {
  return (
    <div className={cn(SOFT_CARD, "p-4")}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-semibold text-[color:var(--foreground)]">{label}</p>
        <span className="rounded-full bg-[rgba(0,79,155,0.08)] px-3 py-1 text-sm font-semibold text-[color:var(--brand-blue)]">
          {formatPercent(enabledScore)}
        </span>
      </div>
      <p className="mt-2 text-base leading-6 text-[color:var(--muted-foreground)]">{summary}</p>
      <div className="mt-4 grid gap-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-[13px] uppercase tracking-[0.14em] text-[color:var(--muted-foreground)]">
            <span>Current</span>
            <span>{formatPercent(currentScore)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-[rgba(11,79,155,0.08)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#96c9ff,#4d8fda)]"
              style={{ width: `${Math.max(8, currentScore)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[13px] uppercase tracking-[0.14em] text-[color:var(--muted-foreground)]">
            <span>With BioPilot</span>
            <span>{formatPercent(enabledScore)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-[rgba(11,79,155,0.08)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#0b4f9b,#14b7cf)]"
              style={{ width: `${Math.max(8, enabledScore)}%` }}
            />
          </div>
        </div>
      </div>
      <p className="mt-4 text-base leading-6 text-[color:var(--foreground)]">{leverage}</p>
    </div>
  );
}

function ValueLeverCard({
  label,
  annualValue,
  summary,
  maxValue,
}: {
  label: string;
  annualValue: number;
  summary: string;
  maxValue: number;
}) {
  const width = maxValue > 0 ? (annualValue / maxValue) * 100 : 0;

  return (
    <div className={cn(SOFT_CARD, "p-4")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-[color:var(--foreground)]">{label}</p>
          <p className="mt-2 text-base leading-6 text-[color:var(--muted-foreground)]">{summary}</p>
        </div>
        <p className="font-heading text-[1.35rem] tracking-[-0.03em] text-[color:var(--foreground)]">
          {formatCurrency(annualValue)}
        </p>
      </div>
      <div className="mt-4 h-2.5 rounded-full bg-[rgba(11,79,155,0.08)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#0b4f9b,#2bb3cf)]"
          style={{ width: `${Math.max(12, width)}%` }}
        />
      </div>
    </div>
  );
}

function ContextMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={cn(SOFT_CARD, "p-4")}>
      <p className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-2 text-[1.4rem] font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatNumber(value: number) {
  return numberFormatter.format(Math.round(value));
}

function formatDecimal(value: number) {
  return decimalFormatter.format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatFieldLimit(value: number, suffix?: string) {
  if (suffix === "USD") {
    return formatCurrency(value);
  }

  if (suffix === "$/hr") {
    return `${formatCurrency(value)}/hr`;
  }

  if (suffix === "USD/mo") {
    return `${formatCurrency(value)}/mo`;
  }

  return `${formatNumber(value)}${suffix ? ` ${suffix}` : ""}`;
}

function formatPaybackMonths(value: number) {
  return value >= 60 ? "60+ mo" : `${formatDecimal(value)} mo`;
}

function StepTracker({
  currentStep,
  onSelectStep,
  vertical = false,
}: {
  currentStep: AssessmentStep;
  onSelectStep?: (step: AssessmentStep) => void;
  vertical?: boolean;
}) {
  const currentIndex = STEP_ORDER.findIndex((step) => step.id === currentStep);

  return (
    <div
      className={cn(
        PANEL_CARD,
        "relative grid gap-3 p-4",
        vertical ? "grid-cols-1" : "md:grid-cols-4",
      )}
    >
      {!vertical ? (
        <div className="pointer-events-none absolute inset-x-8 top-[34px] hidden h-px bg-gradient-to-r from-transparent via-[rgba(0,79,155,0.16)] to-transparent md:block" />
      ) : null}
      {STEP_ORDER.map((step, index) => {
        const isFinalReportComplete = step.id === "report" && currentStep === "report";
        const isComplete = index < currentIndex || isFinalReportComplete;
        const isActive = step.id === currentStep && !isFinalReportComplete;
        const isAccessible = index <= currentIndex;

        return (
          <button
            key={step.id}
            type="button"
            disabled={!isAccessible}
            onClick={() => {
              if (isAccessible && onSelectStep) {
                onSelectStep(step.id);
              }
            }}
            className={cn(
              SOFT_CARD,
              "relative flex items-center gap-3 px-4 py-3 text-left transition-colors",
              isAccessible && "cursor-pointer hover:bg-[color:var(--surface-elevated)]",
              !isAccessible && "cursor-not-allowed opacity-65",
              isActive &&
                "border-[color:rgba(0,79,155,0.18)] bg-[linear-gradient(180deg,rgba(0,79,155,0.09),rgba(255,255,255,0.96))] shadow-[0_14px_24px_rgba(0,79,155,0.08)]",
              isComplete &&
                "border-[color:rgba(0,160,76,0.16)] bg-[linear-gradient(180deg,rgba(0,160,76,0.06),rgba(255,255,255,0.94))]",
            )}
          >
            <div
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-full border text-base font-semibold",
                isActive
                  ? "border-[rgba(255,255,255,0.08)] bg-[linear-gradient(135deg,#00316c,#005fbd)] text-white"
                  : isComplete
                    ? "border-[rgba(255,255,255,0.08)] bg-[linear-gradient(135deg,#00964a,#00b861)] text-white"
                    : "border-[color:var(--border)] bg-white text-[color:var(--muted-foreground)]",
              )}
            >
              {index + 1}
            </div>
            <div>
              <p
                className={cn(
                  "uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]",
                  vertical ? "text-[12px]" : "text-[13px]",
                )}
              >
                Step {index + 1}
              </p>
              <p className="text-lg font-semibold text-[color:var(--foreground)]">{step.label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function WorkspaceSidebar({
  currentStep,
  onSelectStep,
  onGoHome,
  leadCapture,
  inputs,
}: {
  currentStep: AssessmentStep;
  onSelectStep?: (step: AssessmentStep) => void;
  onGoHome: () => void;
  leadCapture: LeadCaptureRecord | null;
  inputs: BioPilotAssessmentInputs;
}) {
  const profile = PROCESS_PROFILE_MAP[inputs.processProfileId];
  const stage = LIFECYCLE_STAGE_MAP[inputs.lifecycleStageId];

  return (
    <aside className="grid gap-4 content-start xl:sticky xl:top-6">
      <Card className={cn(PANEL_CARD, "p-4")}>
        <CardContent className="p-0">
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex rounded-[22px] bg-white px-4 py-3 shadow-[0_14px_30px_rgba(11,28,59,0.08)] transition-shadow duration-150 hover:shadow-[0_18px_34px_rgba(11,28,59,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface)]"
            aria-label="Return To Main Page"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/yokogawa-logo.png"
              alt="Yokogawa"
              width={220}
              height={32}
              className="h-auto w-[180px]"
            />
          </button>
          <div className="mt-4">
            <p className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
              Assessment Overview
            </p>
            <p className="mt-2 text-lg leading-7 text-[color:var(--foreground)]">
              Assess BioPilot fit and estimate the value of a more connected operating model.
            </p>
          </div>
        </CardContent>
      </Card>

      <StepTracker currentStep={currentStep} onSelectStep={onSelectStep} vertical />

      <Card className={cn(PANEL_CARD, "p-5")}>
        <CardHeader className="p-0">
          <CardTitle className="font-heading text-[1.35rem] tracking-[-0.03em]">
            Session
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-4 grid gap-3 p-0">
          <div className={cn(SOFT_CARD, "p-4")}>
            <p className="text-[12px] uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
              Contact
            </p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
              {leadCapture ? `${leadCapture.firstName} ${leadCapture.lastName}` : "Assessment Session"}
            </p>
            <p className="mt-1 text-base leading-6 text-[color:var(--muted-foreground)]">
              {leadCapture?.company ?? "BioPilot Assessment"}
            </p>
          </div>

          {currentStep !== "profile" ? (
            <div className={cn(SOFT_CARD, "grid gap-3 p-4")}>
              <div>
                <p className="text-[12px] uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                  Process Type
                </p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">{profile.label}</p>
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                  Lifecycle Stage
                </p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">{stage.label}</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </aside>
  );
}

function RangeField({
  field,
  value,
  onChange,
}: {
  field: AdjustableFieldKey;
  value: number;
  onChange: (next: number) => void;
}) {
  const copy = FIELD_COPY[field];

  return (
    <div className={cn(SOFT_CARD, "flex h-full min-h-[224px] flex-col p-4")}>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_92px] sm:items-start">
        <div className="min-w-0">
          <p className="text-base font-semibold text-[color:var(--foreground)]">{copy.label}</p>
          <p className="mt-1 min-h-[72px] text-base leading-6 text-[color:var(--muted-foreground)]">
            {copy.description}
          </p>
        </div>
        <div className="w-[92px] shrink-0 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-1.5 text-center text-base font-semibold tabular-nums text-[color:var(--foreground)]">
          {copy.suffix === "%" ? formatPercent(value) : `${formatNumber(value)} ${copy.suffix ?? ""}`}
        </div>
      </div>
      <div className="mt-auto pt-4">
        <input
          aria-label={copy.label}
          className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-[rgba(0,79,155,0.12)] accent-[color:var(--brand-blue)]"
          type="range"
          min={copy.min}
          max={copy.max}
          step={copy.step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
      <div className="mt-3 flex justify-between text-[13px] uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
        <span>{copy.min}{copy.suffix ? ` ${copy.suffix}` : ""}</span>
        <span>{copy.max}{copy.suffix ? ` ${copy.suffix}` : ""}</span>
      </div>
    </div>
  );
}

function NumberField({
  field,
  value,
  onChange,
}: {
  field: AdjustableFieldKey;
  value: number;
  onChange: (next: number) => void;
}) {
  const copy = FIELD_COPY[field];
  const [draftValue, setDraftValue] = useState(String(value));
  const [rangeError, setRangeError] = useState<string | null>(null);
  const hasTypicalRange =
    typeof copy.typicalMin === "number" && typeof copy.typicalMax === "number";
  const parsedDraftValue = Number(draftValue);
  const isOutsideTypicalRange =
    hasTypicalRange &&
    Number.isFinite(parsedDraftValue) &&
    parsedDraftValue >= copy.min &&
    parsedDraftValue <= copy.max &&
    (parsedDraftValue < copy.typicalMin! || parsedDraftValue > copy.typicalMax!);

  const handleValueChange = (rawValue: string) => {
    const normalizedValue = rawValue.replace(/[^\d.]/g, "");
    setDraftValue(normalizedValue);

    if (!normalizedValue) {
      setRangeError(
        `Enter a value from ${formatFieldLimit(copy.min, copy.suffix)} to ${formatFieldLimit(copy.max, copy.suffix)}.`,
      );
      return;
    }

    const parsedValue = Number(normalizedValue);
    if (!Number.isFinite(parsedValue)) {
      setRangeError("Enter a valid number.");
      return;
    }

    if (parsedValue < copy.min || parsedValue > copy.max) {
      setRangeError(
        `System limit: ${formatFieldLimit(copy.min, copy.suffix)} to ${formatFieldLimit(copy.max, copy.suffix)}.`,
      );
      return;
    }

    const decimals = copy.step < 1 ? 1 : 0;
    const roundedValue =
      decimals > 0 ? Number(parsedValue.toFixed(decimals)) : Math.round(parsedValue);

    setRangeError(null);
    onChange(roundedValue);
  };

  return (
    <div className={cn(SOFT_CARD, "flex h-full min-h-[200px] flex-col p-4")}>
      <div>
        <p className="text-base font-semibold text-[color:var(--foreground)]">{copy.label}</p>
        <p className="mt-1 text-base leading-6 text-[color:var(--muted-foreground)]">
          {copy.description}
        </p>
      </div>
      <div className="mt-auto flex items-center gap-3 pt-4">
        <Input
          className={INPUT_CLASS}
          type="text"
          inputMode={copy.step < 1 ? "decimal" : "numeric"}
          aria-label={copy.label}
          aria-invalid={Boolean(rangeError)}
          value={draftValue}
          onChange={(event) => handleValueChange(event.target.value)}
          onBlur={() => {
            if (!draftValue || rangeError) {
              setDraftValue(String(value));
              setRangeError(null);
            }
          }}
        />
        {copy.suffix ? (
          <div className="min-w-fit rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-2 text-base font-semibold text-[color:var(--muted-foreground)]">
            {copy.suffix}
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-[13px] leading-5 text-[color:var(--muted-foreground)]">
        <span>
          {hasTypicalRange
            ? `Typical planning range: ${formatFieldLimit(copy.typicalMin!, copy.suffix)}-${formatFieldLimit(copy.typicalMax!, copy.suffix)}`
            : `Range: ${formatFieldLimit(copy.min, copy.suffix)}-${formatFieldLimit(copy.max, copy.suffix)}`}
        </span>
        {rangeError ? (
          <span className="font-semibold text-[color:var(--destructive)]">{rangeError}</span>
        ) : null}
        {!rangeError && isOutsideTypicalRange ? (
          <span className="font-semibold text-[color:var(--brand-blue)]">
            Outside typical planning range. Confirm before relying on ROI.
          </span>
        ) : null}
      </div>
    </div>
  );
}

function IntroStep({
  onSubmitLead,
  onUseSample,
  onGoHome,
  internalModeRequested,
  internalModeUnlocked,
  onUnlockInternalMode,
}: {
  onSubmitLead: (record: LeadCaptureRecord) => void;
  onUseSample: () => void;
  onGoHome: () => void;
  internalModeRequested: boolean;
  internalModeUnlocked: boolean;
  onUnlockInternalMode: (adminKey: string) => Promise<void>;
}) {
  const form = useForm<LeadCaptureFormInput>({
    resolver: zodResolver(leadCaptureSchema),
    mode: "onBlur",
    defaultValues: defaultLeadCaptureInput,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActualSessionOpen, setIsActualSessionOpen] = useState(true);
  const [internalAdminKey, setInternalAdminKey] = useState("");
  const [isUnlockingInternalMode, setIsUnlockingInternalMode] = useState(false);
  const [internalUnlockError, setInternalUnlockError] = useState<string | null>(null);
  const showInternalControls = internalModeRequested && internalModeUnlocked;

  useEffect(() => {
    form.reset(defaultLeadCaptureInput);
    setIsActualSessionOpen(true);
  }, [form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);

    let storageMode: LeadCaptureRecord["storageMode"] = "local_only";
    let storageMessage = "Your details are saved on this device for now.";

    try {
      const response = await fetch("/api/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json().catch(() => null)) as
        | { storageMode?: LeadCaptureRecord["storageMode"]; message?: string }
        | null;

      if (response.ok) {
        storageMode = payload?.storageMode === "database" ? "database" : "local_only";
        storageMessage = payload?.message ?? storageMessage;
      }
    } catch {
      storageMessage = "Your details are saved on this device for now.";
    } finally {
      setIsSubmitting(false);
    }

    onSubmitLead({
      ...values,
      submittedAt: new Date().toISOString(),
      storageMode,
      storageMessage,
    });
  });

  const handleUnlockInternalMode = async () => {
    const trimmedKey = internalAdminKey.trim();

    if (!trimmedKey) {
      setInternalUnlockError("Enter the admin key to unlock internal review tools.");
      return;
    }

    setIsUnlockingInternalMode(true);
    setInternalUnlockError(null);

    try {
      await onUnlockInternalMode(trimmedKey);
      setInternalAdminKey("");
    } catch (error) {
      setInternalUnlockError(
        error instanceof Error ? error.message : "Internal mode could not be unlocked.",
      );
    } finally {
      setIsUnlockingInternalMode(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)] xl:items-stretch">
      <section className={cn(DARK_PANEL, "p-5 sm:p-6")}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(103,187,255,0.18),transparent_0_24%),radial-gradient(circle_at_88%_18%,rgba(255,238,0,0.08),transparent_0_16%)]" />
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center">
            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex rounded-[18px] bg-white px-4 py-3 shadow-[0_18px_40px_rgba(5,20,39,0.18)] transition-shadow duration-150 hover:shadow-[0_22px_44px_rgba(5,20,39,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(8,34,67,0.9)]"
              aria-label="Return To Main Page"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/yokogawa-logo.png"
                alt="Yokogawa"
                width={260}
                height={39}
                className="h-auto w-[220px] sm:w-[260px]"
              />
            </button>
          </div>

          <div className="mt-12 max-w-[760px] xl:mt-16">
            <p className="text-[0.82rem] font-semibold uppercase tracking-[0.24em] text-white/58">
              BioPilot Fit Assessment
            </p>
            <h1 className="mt-3 font-heading text-[2.5rem] leading-[0.96] tracking-[-0.055em] text-white sm:text-[3.15rem] xl:text-[3.55rem]">
              <span className="block text-balance">See where your bioprocess is losing</span>
              <span className="block text-balance text-[#9ed3ff]">control, speed, and value.</span>
            </h1>
            <p className="mt-4 max-w-[700px] text-[1.02rem] leading-7 text-white/78 sm:text-[1.08rem] sm:leading-8">
              BioPilot brings disconnected instruments, delayed evidence, and review drag into one
              clear fit assessment and business case.
            </p>
          </div>

          <div className="mt-5 max-w-[760px]">
            <p className="text-[1.02rem] leading-7 text-white/78 sm:text-[1.08rem] sm:leading-8">
              The assessment stays focused on one job: identify where disconnected equipment,
              delayed evidence, and manual review effort are slowing the process.
            </p>
            <ul className="mt-5 space-y-0 text-[0.9rem] leading-[1.45rem] text-white/72 sm:text-[0.96rem] sm:leading-[1.5rem]">
              {HERO_SUPPORT_BULLETS.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-[0.65rem] size-1.5 shrink-0 rounded-full bg-[#9ed3ff]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Card className={cn(PANEL_CARD, "p-0")}>
        <CardHeader className="border-b border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(247,250,252,0.94))] px-5 py-3.5">
          <CardTitle className="font-heading text-[1.7rem] tracking-[-0.03em] text-[color:var(--foreground)]">
            {showInternalControls ? "Choose Your Assessment Path" : "Start Your Assessment"}
          </CardTitle>
          <CardDescription className="text-base leading-7 text-[color:var(--muted-foreground)]">
            {showInternalControls
              ? "Use an example session for internal review, or select an actual session to assess a real process."
              : "Enter your contact details to assess a real process and generate a directional BioPilot fit report."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5 px-5 py-3.5">
          {internalModeRequested && !internalModeUnlocked ? (
            <div className={cn(SOFT_CARD, "grid gap-3 p-4")}>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 size-5 text-[color:var(--brand-blue)]" />
                <div>
                  <p className="text-base font-semibold text-[color:var(--foreground)]">
                    Internal Review Tools Locked
                  </p>
                  <p className="mt-1 text-base leading-6 text-[color:var(--muted-foreground)]">
                    Admin authorization is required before internal sample sessions and benchmark-loading controls are available.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Input
                  className={cn(INPUT_CLASS, "h-11 text-base")}
                  type="password"
                  value={internalAdminKey}
                  placeholder="Enter admin key"
                  onChange={(event) => setInternalAdminKey(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleUnlockInternalMode();
                    }
                  }}
                  aria-label="Internal mode admin key"
                />
                <Button
                  type="button"
                  className={PRIMARY_BUTTON}
                  onClick={() => void handleUnlockInternalMode()}
                  disabled={isUnlockingInternalMode}
                >
                  {isUnlockingInternalMode ? "Unlocking..." : "Unlock"}
                </Button>
              </div>
              {internalUnlockError ? (
                <p className="text-base text-[color:var(--destructive)]">{internalUnlockError}</p>
              ) : null}
            </div>
          ) : null}

          <div className={cn("grid gap-3", showInternalControls ? "sm:grid-cols-2" : "")}>
            {showInternalControls ? (
              <div className={cn(SOFT_CARD, "grid gap-3 p-4")}>
                <div className="flex items-start gap-3">
                  <FlaskConical className="mt-1 size-5 text-[color:var(--brand-yellow)]" />
                  <div>
                    <p className="text-base font-semibold text-[color:var(--foreground)]">
                      Example Session
                    </p>
                    <p className="mt-1 text-base leading-6 text-[color:var(--muted-foreground)]">
                      Walk through BioPilot fit using realistic sample data. Best for a quick demo or internal review.
                    </p>
                  </div>
                </div>
                <Button type="button" className={ACCENT_BUTTON} onClick={onUseSample}>
                  Launch Example Session
                </Button>
              </div>
            ) : null}
            <div className={cn(SOFT_CARD, "grid gap-3 p-4")}>
              <div>
                <p className="text-base font-semibold text-[color:var(--foreground)]">
                  Actual Session
                </p>
                <p className="mt-1 text-base leading-6 text-[color:var(--muted-foreground)]">
                  Use your own operating data to create a directional value estimate and BioPilot fit report.
                </p>
              </div>
              {isActualSessionOpen ? (
                <div
                  className="flex h-11 items-center gap-2 rounded-[14px] border border-[rgba(24,184,199,0.22)] bg-[rgba(24,184,199,0.08)] px-4 text-[0.95rem] font-semibold text-[color:var(--brand-blue)]"
                  role="status"
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Actual Session Selected
                </div>
              ) : (
                <Button
                  type="button"
                  aria-controls="actual-session-form"
                  aria-expanded={isActualSessionOpen}
                  className={PRIMARY_BUTTON}
                  onClick={() => setIsActualSessionOpen(true)}
                >
                  Select Actual Session
                </Button>
              )}
            </div>
          </div>

          {isActualSessionOpen ? (
            <form id="actual-session-form" className="space-y-2.5" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-base font-semibold text-[color:var(--foreground)]">
                    First Name
                  </label>
                  <Input className={cn(INPUT_CLASS, "h-[48px] text-base")} {...form.register("firstName")} />
                  {form.formState.errors.firstName ? (
                    <p className="text-base text-[color:var(--destructive)]">
                      {form.formState.errors.firstName.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-base font-semibold text-[color:var(--foreground)]">
                    Last Name
                  </label>
                  <Input className={cn(INPUT_CLASS, "h-[48px] text-base")} {...form.register("lastName")} />
                  {form.formState.errors.lastName ? (
                    <p className="text-base text-[color:var(--destructive)]">
                      {form.formState.errors.lastName.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-base font-semibold text-[color:var(--foreground)]">
                    Work Email
                  </label>
                  <Input
                    className={cn(INPUT_CLASS, "h-[48px] text-base")}
                    type="email"
                    {...form.register("workEmail")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-base font-semibold text-[color:var(--foreground)]">
                    Company
                  </label>
                  <Input className={cn(INPUT_CLASS, "h-[48px] text-base")} {...form.register("company")} />
                </div>
              </div>
              {form.formState.errors.workEmail ? (
                <p className="-mt-1 text-base text-[color:var(--destructive)]">
                  {form.formState.errors.workEmail.message}
                </p>
              ) : null}
              {form.formState.errors.company ? (
                <p className="-mt-1 text-base text-[color:var(--destructive)]">
                  {form.formState.errors.company.message}
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-base font-semibold text-[color:var(--foreground)]">
                    Job Title
                  </label>
                  <Input className={cn(INPUT_CLASS, "h-[48px] text-base")} {...form.register("jobTitle")} />
                </div>
                <div className="space-y-2">
                  <label className="text-base font-semibold text-[color:var(--foreground)]">
                    Country Or Region
                  </label>
                  <Input className={cn(INPUT_CLASS, "h-[48px] text-base")} {...form.register("countryRegion")} />
                </div>
              </div>

              <div className={cn(SOFT_CARD, "flex items-start gap-3 p-3")}>
                <Checkbox
                  checked={form.watch("consentToContact")}
                  onCheckedChange={(checked) =>
                    form.setValue("consentToContact", Boolean(checked), {
                      shouldValidate: true,
                    })
                  }
                />
                <div>
                  <p className="text-base font-semibold text-[color:var(--foreground)]">
                    Consent To Contact
                  </p>
                  <p className="mt-1 text-base leading-6 text-[color:var(--muted-foreground)]">
                    I agree to be contacted about BioPilot and the next steps needed to validate the business case.
                  </p>
                </div>
              </div>

              <Button type="submit" className={cn(PRIMARY_BUTTON, "w-full")} disabled={isSubmitting}>
                {isSubmitting ? "Saving Details..." : "Start Actual Assessment"}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function ProcessTypeStep({
  inputs,
  onPatch,
  onNext,
  onBack,
}: {
  inputs: BioPilotAssessmentInputs;
  onPatch: (patch: Partial<BioPilotAssessmentInputs>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <Card className={cn(PANEL_CARD, "p-6")}>
      <CardHeader className="p-0">
        <CardTitle className="font-heading text-[2.1rem] tracking-[-0.04em] text-[color:var(--foreground)]">
          Choose The Bioprocess Type
        </CardTitle>
        <CardDescription className="max-w-4xl text-xl leading-8 text-[color:var(--muted-foreground)]">
          Choose the family that best matches the process you want to evaluate with BioPilot.
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-6 grid gap-4 p-0">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PROCESS_PROFILES.map((item) => {
            const isActive = item.id === inputs.processProfileId;

            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  onPatch({
                    processProfileId: item.id,
                  })
                }
                className={cn(
                  "group relative overflow-hidden rounded-[26px] border p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 ease-[var(--ease-premium)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.992]",
                  isActive
                    ? "border-[rgba(0,95,189,0.34)] bg-[linear-gradient(180deg,rgba(228,241,255,1),rgba(216,233,252,1))] shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_16px_34px_rgba(0,79,155,0.1)]"
                    : "border-[rgba(0,49,108,0.11)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,251,254,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_8px_18px_rgba(11,28,59,0.04)] hover:border-[rgba(0,95,189,0.18)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.94),0_12px_26px_rgba(0,79,155,0.06)]",
                )}
              >
                <div
                  className={cn(
                    "rounded-[22px] border p-3 transition-colors duration-150",
                    isActive
                      ? "border-[rgba(0,95,189,0.18)] bg-[linear-gradient(180deg,rgba(243,249,255,0.96),rgba(231,242,252,0.96))]"
                      : "border-[rgba(0,49,108,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,249,253,0.92))]",
                  )}
                >
                  <ProcessFamilyIllustration profileId={item.id} variant="tile" />
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                      {PROCESS_FAMILY_TAGS[item.id]}
                    </p>
                    <p className="mt-2 text-[1.08rem] font-semibold leading-[1.18] tracking-[-0.02em] text-[color:var(--foreground)] text-balance">
                      {item.label}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "mt-1 h-3 w-3 shrink-0 rounded-full border transition-colors duration-150",
                      isActive
                        ? "border-[color:var(--brand-blue)] bg-[color:var(--brand-blue)]"
                        : "border-[rgba(11,79,155,0.18)] bg-white",
                    )}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" className={SECONDARY_BUTTON} onClick={onBack}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button className={PRIMARY_BUTTON} onClick={onNext}>
            Continue To Inputs
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function InputsStep({
  inputs,
  onPatch,
  onLoadSample,
  onReset,
  showInternalControls,
  completedInputSectionIds,
  onCompleteInputSection,
  onInvalidateInputSection,
  onBack,
  onGenerate,
  reportError,
  isGeneratingReport,
}: {
  inputs: BioPilotAssessmentInputs;
  onPatch: (
    patch: Partial<BioPilotAssessmentInputs>,
    source?: AssessmentInputSource,
  ) => void;
  onLoadSample: (sampleId: string) => void;
  onReset: () => void;
  showInternalControls: boolean;
  completedInputSectionIds: InputSectionId[];
  onCompleteInputSection: (sectionId: InputSectionId) => void;
  onInvalidateInputSection: (sectionId: InputSectionId) => void;
  onBack: () => void;
  onGenerate: () => void;
  reportError: string | null;
  isGeneratingReport: boolean;
}) {
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [activeInputSectionId, setActiveInputSectionId] = useState<InputSectionId>(
    INPUT_SECTIONS[0].id,
  );
  const [completionError, setCompletionError] = useState<string | null>(null);
  const profile = PROCESS_PROFILE_MAP[inputs.processProfileId];
  const stage = LIFECYCLE_STAGE_MAP[inputs.lifecycleStageId];
  const selectedSample = BIOPILOT_SAMPLE_CONFIGS.find((item) => item.id === selectedSampleId) ?? null;
  const completedSectionSet = new Set(completedInputSectionIds);
  const confirmedInputSectionCount = INPUT_SECTIONS.filter((section) =>
    completedSectionSet.has(section.id),
  ).length;
  const activeInputSectionIndex = Math.max(
    INPUT_SECTIONS.findIndex((section) => section.id === activeInputSectionId),
    0,
  );
  const activeInputSection = INPUT_SECTIONS[activeInputSectionIndex];
  const inputSectionProgress =
    (confirmedInputSectionCount / INPUT_SECTIONS.length) * 100;
  const incompleteSections = INPUT_SECTIONS.filter(
    (section) => !completedSectionSet.has(section.id),
  );
  const allInputSectionsComplete = INPUT_SECTIONS.every((section) =>
    completedSectionSet.has(section.id),
  );

  const handleResetInputs = () => {
    setSelectedSampleId("");
    setCompletionError(null);
    onReset();
  };

  const handleLoadSelectedSample = () => {
    if (!selectedSampleId) {
      return;
    }

    setCompletionError(null);
    onLoadSample(selectedSampleId);
    setActiveInputSectionId(INPUT_SECTIONS[0].id);
  };

  const handleApplySurveyBenchmark = () => {
    setCompletionError(null);
    onPatch(
      {
        weeksSinceLastBatchFailure:
          BIOPLAN_2023_BATCH_FAILURE_BENCHMARK.weeksSinceLastBatchFailure,
        failureCauseExposureScore:
          BIOPLAN_2023_BATCH_FAILURE_BENCHMARK.failureCauseExposureScore,
      },
      "survey",
    );
    onInvalidateInputSection("batch-failure");
    setActiveInputSectionId("batch-failure");
    void scheduleElementScroll("input-progress-panel");
  };

  const handleCompleteSection = (sectionId: InputSectionId) => {
    setCompletionError(null);
    onCompleteInputSection(sectionId);

    const nextCompletedSectionSet = new Set([...completedInputSectionIds, sectionId]);
    const firstIncompleteSection = INPUT_SECTIONS.find(
      (section) => !nextCompletedSectionSet.has(section.id),
    );
    const firstIncompleteSectionIndex = firstIncompleteSection
      ? INPUT_SECTIONS.findIndex((section) => section.id === firstIncompleteSection.id)
      : -1;
    const nextSection = INPUT_SECTIONS[activeInputSectionIndex + 1];

    if (
      firstIncompleteSection &&
      (firstIncompleteSectionIndex < activeInputSectionIndex || !nextSection)
    ) {
      setCompletionError(
        `${firstIncompleteSection.title} still needs confirmation before the report can be generated.`,
      );
      setActiveInputSectionId(firstIncompleteSection.id);
      void scheduleElementScroll("input-progress-panel");
      return;
    }

    if (nextSection) {
      setActiveInputSectionId(nextSection.id);
      void scheduleElementScroll("input-progress-panel");
    }
  };

  const handleGenerateClick = () => {
    if (incompleteSections.length) {
      setCompletionError(
        `Confirm ${incompleteSections[0].title.toLowerCase()} before generating the final report.`,
      );
      setActiveInputSectionId(incompleteSections[0].id);
      void scheduleElementScroll("input-progress-panel");
      return;
    }

    setCompletionError(null);
    onGenerate();
  };

  const handleInputSectionChange = (value: string | null) => {
    if (!value || !INPUT_SECTIONS.some((section) => section.id === value)) {
      return;
    }

    setActiveInputSectionId(value as InputSectionId);
    void scheduleElementScroll("input-progress-panel");
  };

  return (
    <div className="grid gap-4">
      <Card className={cn(PANEL_CARD, "p-6")}>
        <CardHeader className="p-0">
          <CardTitle className="font-heading text-[2.1rem] tracking-[-0.04em] text-[color:var(--foreground)]">
            Enter Current-State Inputs
          </CardTitle>
          <CardDescription className="text-xl leading-8 text-[color:var(--muted-foreground)]">
            Fill in the operating profile using the current state of your process, systems, and review flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6 grid gap-5 p-0">
          <div className="grid gap-4">
            <Card className={cn(PANEL_CARD, "p-5")}>
              <CardHeader className="p-0">
                <CardTitle className="font-heading text-[1.45rem] tracking-[-0.03em]">
                  Process Family
                </CardTitle>
                <CardDescription className="text-lg leading-7 text-[color:var(--muted-foreground)]">
                  Review the selected process family or go back to choose a different one.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-4 grid gap-5 p-0 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] lg:items-stretch">
                <div className="flex h-full min-h-[300px] flex-col overflow-hidden rounded-[26px] border border-[rgba(0,95,189,0.18)] bg-[linear-gradient(180deg,rgba(228,241,255,0.95),rgba(216,233,252,0.96))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
                  <div className="rounded-[24px] border border-[rgba(0,49,108,0.08)] bg-[linear-gradient(180deg,rgba(244,249,253,0.96),rgba(233,243,251,0.96))] p-3">
                    <ProcessFamilyIllustration profileId={profile.id} variant="tile" />
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
                        {PROCESS_FAMILY_TAGS[profile.id]}
                      </p>
                      <p className="mt-3 text-[1.45rem] font-semibold leading-tight tracking-[-0.03em] text-[color:var(--foreground)] text-balance">
                        {profile.label}
                      </p>
                    </div>
                    <span className="mb-1 size-3 shrink-0 rounded-full bg-[color:var(--brand-blue)]" />
                  </div>
                </div>
                <div className="flex h-full min-w-0 flex-col gap-4">
                  <div>
                    <p className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                      Process Family
                    </p>
                    <p className="mt-2 font-heading text-[1.85rem] tracking-[-0.04em] text-[color:var(--foreground)]">
                      {profile.label}
                    </p>
                    <p className="mt-3 text-base leading-7 text-[color:var(--muted-foreground)]">
                      {profile.summary}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.focusAreas.slice(0, 3).map((focus) => (
                      <span
                        key={focus}
                        className="inline-flex min-h-[38px] items-center rounded-full border border-[rgba(11,79,155,0.12)] bg-[rgba(0,79,155,0.05)] px-3.5 py-0 text-sm font-semibold leading-tight text-[color:var(--brand-blue)]"
                      >
                        {focus}
                      </span>
                    ))}
                  </div>
                  <Button type="button" variant="outline" className={cn(SECONDARY_BUTTON, "mt-auto w-full")} onClick={onBack}>
                    <ChevronLeft className="size-4" />
                    Change Process Family
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={cn(PANEL_CARD, "p-5")}>
              <CardHeader className="p-0">
                <CardTitle className="font-heading text-[1.45rem] tracking-[-0.03em]">
                  Scenario Setup
                </CardTitle>
                <CardDescription className="text-lg leading-7 text-[color:var(--muted-foreground)]">
                  {showInternalControls
                    ? "Set the lifecycle stage, apply a sample scenario, or use a neutral survey benchmark for batch-failure fields."
                    : "Set the lifecycle stage for the process being assessed."}
                </CardDescription>
              </CardHeader>
              <CardContent
                className={cn(
                  "mt-4 grid gap-4 p-0",
                  showInternalControls ? "lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]" : "",
                )}
              >
                <div className="grid gap-2">
                  <p className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                    Lifecycle Stage
                  </p>
                  <Select
                    value={inputs.lifecycleStageId}
                    onValueChange={(value) => {
                      const nextStage = LIFECYCLE_STAGE_MAP[value as keyof typeof LIFECYCLE_STAGE_MAP];
                      if (!nextStage) {
                        return;
                      }

                      onPatch({
                        lifecycleStageId: nextStage.id,
                      });
                      onInvalidateInputSection("operating-frame");
                    }}
                  >
                    <SelectTrigger className={cn(INPUT_CLASS, "w-full justify-between")}>
                      <SelectValue placeholder="Choose Lifecycle Stage">
                        {LIFECYCLE_STAGE_MAP[inputs.lifecycleStageId]?.label}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className={SELECT_CONTENT_CLASS}>
                      {LIFECYCLE_STAGES.map((nextStage) => (
                        <SelectItem className={SELECT_ITEM_CLASS} key={nextStage.id} value={nextStage.id}>
                          {nextStage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className={cn(SOFT_CARD, "p-4")}>
                    <p className="text-base leading-6 text-[color:var(--muted-foreground)]">{stage.summary}</p>
                    <p className="mt-2 text-sm font-semibold text-[color:var(--brand-blue)]">
                      Changing the stage updates the baseline process assumptions used in the estimate.
                    </p>
                  </div>
                </div>

                {showInternalControls ? (
                  <>
                    <div className="grid gap-2">
                      <p className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                        Sample Scenario
                      </p>
                      <Select
                        value={selectedSampleId || undefined}
                        onValueChange={(value) => setSelectedSampleId(value ?? "")}
                      >
                        <SelectTrigger className={cn(INPUT_CLASS, "w-full justify-between")}>
                          <SelectValue placeholder="Select A Sample Scenario" />
                        </SelectTrigger>
                        <SelectContent className={SELECT_CONTENT_CLASS}>
                          {BIOPILOT_SAMPLE_CONFIGS.map((sample) => (
                            <SelectItem className={SELECT_ITEM_CLASS} key={sample.id} value={sample.id}>
                              {sample.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className={cn(SOFT_CARD, "p-4")}>
                        <p className="text-base leading-6 text-[color:var(--muted-foreground)]">
                          {selectedSample
                            ? `${selectedSample.description} Apply it to populate the fields, then confirm each section before generating the report.`
                            : "Choose a sample to preview it. The fields below will not change until you click Apply Sample Data."}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Button
                          type="button"
                          className={ACCENT_BUTTON}
                          onClick={handleLoadSelectedSample}
                          disabled={!selectedSampleId}
                        >
                          Apply Sample Data
                        </Button>
                        <Button type="button" variant="outline" className={SECONDARY_BUTTON} onClick={handleResetInputs}>
                          Reset Inputs
                        </Button>
                      </div>
                    </div>
                    <div className={cn(SOFT_CARD, "grid gap-3 p-4 lg:col-span-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center")}>
                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                          Neutral Batch-Failure Benchmark
                        </p>
                        <p className="mt-2 text-base leading-6 text-[color:var(--muted-foreground)]">
                          Apply {BIOPLAN_2023_BATCH_FAILURE_BENCHMARK.shortLabel} values for weeks since last batch failure and failure-cause exposure when site records are not available. Recovery hours remain user-entered because they vary by process.
                        </p>
                      </div>
                      <Button type="button" variant="outline" className={SECONDARY_BUTTON} onClick={handleApplySurveyBenchmark}>
                        Apply Survey Benchmark
                      </Button>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card id="input-progress-panel" className={cn(PANEL_CARD, "overflow-hidden p-0")}>
            <CardHeader className="border-b border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(247,250,252,0.96))] px-5 py-4">
              <div className="grid gap-4">
                <div>
                  <p className="text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                    Input Progress
                  </p>
                  <CardTitle className="mt-2 font-heading text-[1.65rem] tracking-[-0.03em] text-[color:var(--foreground)]">
                    {activeInputSection.title}
                  </CardTitle>
                  <CardDescription className="mt-1 text-lg leading-7 text-[color:var(--muted-foreground)]">
                    {activeInputSection.description}
                  </CardDescription>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                    <span>{confirmedInputSectionCount} Of {INPUT_SECTIONS.length} Sections Confirmed</span>
                    <span>{Math.round(inputSectionProgress)}%</span>
                  </div>
                  <Progress
                    value={inputSectionProgress}
                    className="[&_[data-slot=progress-indicator]]:bg-[linear-gradient(90deg,#004f9b,#18b8c7)] [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-[rgba(0,79,155,0.12)]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 p-5">
              <Tabs
                value={activeInputSectionId}
                onValueChange={handleInputSectionChange}
                className="gap-5"
              >
                <TabsList className="grid !h-auto w-full grid-cols-1 gap-2 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-2)] p-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                  {INPUT_SECTIONS.map((section, index) => {
                    const isComplete = completedSectionSet.has(section.id);
                    const isActiveTab = section.id === activeInputSectionId;

                    return (
                      <TabsTrigger
                        key={section.id}
                        value={section.id}
                        aria-label={`${section.title}${isComplete ? " Completed" : ""}`}
                        className="group/input-tab min-h-[64px] min-w-0 justify-start rounded-[18px] border border-transparent px-3 py-3 text-left text-[0.95rem] font-semibold leading-tight whitespace-normal text-[color:var(--muted-foreground)] after:hidden hover:text-[color:var(--foreground)] data-active:border-[rgba(0,79,155,0.24)] data-active:bg-[color:var(--brand-indigo)] data-active:!text-white data-active:shadow-[0_10px_24px_rgba(11,28,59,0.1)] data-active:hover:!text-white"
                      >
                        <span
                          className={cn(
                            "mr-2 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                            isActiveTab
                              ? "bg-white/18 text-white"
                              : isComplete
                                ? "bg-[rgba(24,184,199,0.18)] text-[color:var(--brand-blue)]"
                                : "bg-[rgba(0,79,155,0.08)] text-[color:var(--brand-blue)]",
                          )}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <span
                          className={cn(
                            "min-w-0 text-balance transition-colors",
                            isActiveTab
                              ? "text-white group-hover/input-tab:text-white"
                              : "text-[color:var(--muted-foreground)] group-hover/input-tab:text-[color:var(--foreground)]",
                          )}
                        >
                          {section.title}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                <div className="mt-0">
                  <div id="input-question-set">
                    <InputSectionCard
                      section={activeInputSection}
                      inputs={inputs}
                      onPatch={(patch) => {
                        onPatch(patch);
                        onInvalidateInputSection(activeInputSection.id);
                      }}
                    />
                  </div>
                  <div className="mt-4 grid gap-3 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                    <p className="text-base leading-6 text-[color:var(--muted-foreground)]">
                      {completedSectionSet.has(activeInputSection.id)
                        ? "This section is confirmed. Updating any field will mark it for review again."
                        : "Confirm this section once the values are suitable for the estimate."}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className={SECONDARY_BUTTON}
                      onClick={() => {
                        const previousSection =
                          INPUT_SECTIONS[Math.max(activeInputSectionIndex - 1, 0)];
                        setCompletionError(null);
                        setActiveInputSectionId(previousSection.id);
                        void scheduleElementScroll("input-progress-panel");
                      }}
                      disabled={activeInputSectionIndex === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      className={
                        completedSectionSet.has(activeInputSection.id)
                          ? SECONDARY_BUTTON
                          : PRIMARY_BUTTON
                      }
                      onClick={() => {
                        handleCompleteSection(activeInputSection.id);
                      }}
                    >
                      {activeInputSectionIndex === INPUT_SECTIONS.length - 1
                        ? "Confirm Section"
                        : "Confirm And Continue"}
                    </Button>
                  </div>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          <Alert className="border-[color:var(--border)] bg-[color:var(--surface-2)]">
            <CircleAlert className="size-4 text-[color:var(--brand-blue)]" />
            <AlertTitle>Planning Estimate</AlertTitle>
            <AlertDescription>
              The report estimates value from recoverable time, avoided failed runs, faster decisions,
              cleaner transfer work, and deployment effort. The final report introduces the BioPilot
              investment basis after the value case is visible.
            </AlertDescription>
          </Alert>

          {reportError ? (
            <Alert className="border-[color:var(--destructive)]/20 bg-[color:var(--surface-2)]">
              <CircleAlert className="size-4 text-[color:var(--destructive)]" />
              <AlertTitle>Report Could Not Be Generated</AlertTitle>
              <AlertDescription>{reportError}</AlertDescription>
            </Alert>
          ) : null}

          {completionError ? (
            <Alert className="border-[color:var(--destructive)]/20 bg-[color:var(--surface-2)]">
              <CircleAlert className="size-4 text-[color:var(--destructive)]" />
              <AlertTitle>Complete The Input Sections</AlertTitle>
              <AlertDescription>{completionError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button type="button" variant="outline" className={SECONDARY_BUTTON} onClick={onBack}>
              <ChevronLeft className="size-4" />
              Back
            </Button>
            {allInputSectionsComplete ? (
              <Button
                type="button"
                className={PRIMARY_BUTTON}
                onClick={handleGenerateClick}
                disabled={isGeneratingReport}
              >
                {isGeneratingReport ? "Generating Report..." : "Generate Final Report"}
                <ChevronRight className="size-4" />
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportStep({
  inputs,
  results,
  leadCapture,
  assessmentId,
  storageMode,
  storageMessage,
  onEditInputs,
  onNewAssessment,
  onChangeContact,
}: {
  inputs: BioPilotAssessmentInputs;
  results: BioPilotAssessmentResults;
  leadCapture: LeadCaptureRecord | null;
  assessmentId: string | null;
  storageMode: "database" | "local_only" | null;
  storageMessage: string | null;
  onEditInputs: () => void;
  onNewAssessment: () => void;
  onChangeContact: () => void;
}) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(4);
  const [feedbackUsefulness, setFeedbackUsefulness] = useState(4);
  const [feedbackClarity, setFeedbackClarity] = useState(4);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const maxLeverValue = results.valueLevers[0]?.annualValue ?? 0;
  const topValueLever = results.valueLevers[0];
  const topPriority = results.plays[0];
  const usesSurveyBenchmark = results.evidenceConfidence.surveyFields > 0;
  const investment = results.investment;

  const formatChangeValue = (
    key: (typeof REPORT_CHANGE_ITEMS)[number]["currentKey"],
    value: number,
  ) => {
    if (key === "runSuccessRate") {
      return formatPercent(value);
    }

    if (key === "onboardingDays") {
      return `${formatDecimal(value)} days`;
    }

    return `${formatDecimal(value)} hrs`;
  };

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    setExportError(null);

    void exportBioPilotAssessmentPdf({
      inputs,
      results,
      leadCapture,
    })
      .catch((error) => {
        console.error("BioPilot PDF export failed", error);
        setExportError("The PDF could not be generated. Try again in a fresh tab.");
      })
      .finally(() => {
        setIsExportingPdf(false);
      });
  };

  const handleSubmitFeedback = async () => {
    setIsSubmittingFeedback(true);
    setFeedbackMessage(null);
    setFeedbackError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assessmentId: assessmentId ? Number(assessmentId) : null,
          workEmail: leadCapture?.workEmail ?? "",
          company: leadCapture?.company ?? "",
          rating: feedbackRating,
          usefulness: feedbackUsefulness,
          clarity: feedbackClarity,
          comment: feedbackComment,
          page: "final-report",
        }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Feedback could not be saved.");
      }

      setFeedbackMessage(payload?.message ?? "Feedback saved.");
      setFeedbackComment("");
    } catch (error) {
      setFeedbackError(
        error instanceof Error ? error.message : "Feedback could not be saved.",
      );
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const estimateCalculationCard = (
    <Card className={cn(PANEL_CARD, "h-fit p-5")}>
      <CardHeader className="p-0">
        <CardTitle className="font-heading text-[1.7rem] tracking-[-0.03em]">
          How The Estimate Was Calculated
        </CardTitle>
        <CardDescription className="text-lg leading-7 text-[color:var(--muted-foreground)]">
          {results.assumptionTransparency.summary}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-5 grid gap-3 p-0">
        {results.assumptionTransparency.items.map((item) => (
          <details
            key={item.label}
            className={cn(
              SOFT_CARD,
              "group/calculation overflow-hidden [&>summary::-webkit-details-marker]:hidden",
            )}
          >
            <summary className="flex min-h-[58px] cursor-pointer list-none items-center gap-3 px-4 py-3 text-base font-semibold text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[rgba(0,79,155,0.08)] text-[color:var(--brand-blue)]">
                <ChevronRight className="size-4 transition-transform group-open/calculation:rotate-90" />
              </span>
              <span>{item.label}</span>
            </summary>
            <div className="grid gap-3 border-t border-[color:var(--border)] bg-[rgba(255,255,255,0.56)] p-4 text-sm leading-6 text-[color:var(--muted-foreground)] md:grid-cols-3">
              {[
                ["Basis", item.basis],
                ["Formula", item.formula],
                ["Sensitivity", item.sensitivity],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-3)] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--brand-blue)]">
                    {label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </details>
        ))}
        <Alert className="border-[color:var(--border)] bg-[color:var(--surface-2)]">
          <ShieldCheck className="size-4 text-[color:var(--brand-blue)]" />
          <AlertTitle>Planning Basis</AlertTitle>
          <AlertDescription>
            {results.assumptionTransparency.planningCaveat}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  const submittedProcessProfileCard = (
    <Card className={cn(PANEL_CARD, "p-5")}>
      <CardHeader className="p-0">
        <CardTitle className="font-heading text-[1.7rem] tracking-[-0.03em]">
          Submitted Process Profile
        </CardTitle>
        <CardDescription className="text-lg leading-7 text-[color:var(--muted-foreground)]">
          Reference details captured with this assessment.
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-5 grid gap-5 p-0 xl:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)] xl:items-start">
        <div className="rounded-[24px] border border-[rgba(0,49,108,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,248,252,0.96))] p-3">
          <ProcessFamilyIllustration profileId={results.profile.id} variant="report" />
        </div>
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <ContextMetric label="Lifecycle Stage" value={results.stage.label} />
            <ContextMetric label="Model Version" value={results.modelVersion ?? BIOPILOT_MODEL_VERSION} />
            <ContextMetric label="Active Programs" value={formatNumber(inputs.activePrograms)} />
            <ContextMetric label="Runs Per Year" value={formatNumber(inputs.runsPerYear)} />
            <ContextMetric label="Sites Or Partners" value={formatNumber(inputs.sites)} />
            <ContextMetric label="Transfer Events" value={formatNumber(inputs.transferEventsPerYear)} />
            <ContextMetric label="Vendor Platforms" value={formatNumber(inputs.vendorPlatforms)} />
            <ContextMetric label="Last Batch Failure" value={`${formatNumber(inputs.weeksSinceLastBatchFailure)} weeks`} />
            <ContextMetric label="Failure-Cause Exposure" value={formatPercent(inputs.failureCauseExposureScore)} />
            <ContextMetric label="Recovery Per Failure" value={`${formatNumber(inputs.failedRunRecoveryHours)} hrs`} />
          </div>
          <Alert className="border-[color:var(--border)] bg-[color:var(--surface-2)]">
            <ShieldCheck className="size-4 text-[color:var(--brand-blue)]" />
            <AlertTitle>
              {usesSurveyBenchmark ? "Survey Benchmark Used" : "Use This Estimate As A Planning Tool"}
            </AlertTitle>
            <AlertDescription>
              {usesSurveyBenchmark
                ? `${BIOPLAN_2023_BATCH_FAILURE_BENCHMARK.shortLabel} supported one or more batch-failure assumptions. Replace benchmark values with site evidence when available.`
                : "Confirm the most important operating numbers before relying on this report for formal planning."}
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );

  const fitScoreExplanationCard = (
    <Card className={cn(PANEL_CARD, "p-5")}>
      <CardHeader className="p-0">
        <CardTitle className="font-heading text-[1.7rem] tracking-[-0.03em]">
          How The Fit Score Was Calculated
        </CardTitle>
        <CardDescription className="text-lg leading-7 text-[color:var(--muted-foreground)]">
          The fit score is a weighted operating-fit score, separate from ROI. It measures how strongly the submitted current state matches BioPilot value patterns.
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-5 grid gap-4 p-0">
        <div className={cn(SOFT_CARD, "p-4")}>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-blue)]">
            Formula
          </p>
          <p className="mt-2 text-base leading-7 text-[color:var(--foreground)]">
            Digital coverage gap x 38% + manual burden x 28% + operating complexity x 18% + review-by-exception gap x 8% + SOP automation gap x 8%.
          </p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
            The final score is clamped from 8% to 98% so it remains directional rather than absolute.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {results.fitScoreDrivers.map((driver) => (
            <div key={driver.id} className={cn(SOFT_CARD, "p-4")}>
              <p className="text-sm font-semibold leading-5 text-[color:var(--foreground)]">
                {driver.label}
              </p>
              <p className="mt-2 font-heading text-[1.55rem] leading-none tracking-[-0.045em] text-[color:var(--brand-blue)]">
                {formatDecimal(driver.contribution)}
              </p>
              <p className="mt-2 text-[13px] leading-5 text-[color:var(--muted-foreground)]">
                {formatPercent(driver.score)} driver x {Math.round(driver.weight * 100)}% weight
              </p>
              <p className="mt-3 text-sm leading-5 text-[color:var(--muted-foreground)]">
                {driver.explanation}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const investmentBasisCard = (
    <Card className={cn(PANEL_CARD, "p-5")}>
      <CardHeader className="p-0">
        <CardTitle className="font-heading text-[1.7rem] tracking-[-0.03em]">
          BioPilot Investment Basis
        </CardTitle>
        <CardDescription className="text-lg leading-7 text-[color:var(--muted-foreground)]">
          Inferred subscription scope and customer engineering assumptions used in the ROI estimate.
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-5 grid gap-4 p-0">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ContextMetric label="Scope" value={investment.tierLabel} />
          <ContextMetric label="Monthly Subscription" value={formatCurrency(investment.monthlySubscription)} />
          <ContextMetric label="Annual Subscription" value={formatCurrency(investment.annualSubscription)} />
          <ContextMetric label="3-Year Subscription" value={formatCurrency(investment.threeYearSubscription)} />
          <ContextMetric label="Online Bioreactors" value={formatNumber(investment.bioreactors)} />
          <ContextMetric label="Active Recipes" value={formatNumber(investment.recipesRunning)} />
          <ContextMetric label="PAT Equipment" value={formatNumber(investment.patEquipment)} />
          <ContextMetric label="Users" value={formatNumber(investment.users)} />
          <ContextMetric
            label="Customer Engineering"
            value={`${formatNumber(investment.customerEngineeringHours)} hrs`}
          />
          <ContextMetric
            label="Engineering Investment"
            value={formatCurrency(investment.customerEngineeringInvestment)}
          />
          <ContextMetric
            label="Additional Services"
            value={formatCurrency(investment.additionalServicesInvestment)}
          />
          <ContextMetric
            label="3-Year BioPilot Investment"
            value={formatCurrency(investment.totalThreeYearInvestment)}
          />
        </div>
        <Alert className="border-[color:var(--border)] bg-[color:var(--surface-2)]">
          <ShieldCheck className="size-4 text-[color:var(--brand-blue)]" />
          <AlertTitle>{investment.includedEngineeringLabel}</AlertTitle>
          <AlertDescription>
            {investment.includedMaintenanceLabel}. Customer engineering time represents the customer-side effort expected to prepare, connect, validate, and adopt the first BioPilot workflow.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-4">
      <section className={cn(DARK_PANEL, "overflow-hidden p-0")}>
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_minmax(460px,520px)]">
          <div className="p-6">
            <CardHeader className="relative z-10 p-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="rounded-full bg-white/10 px-3 py-1 text-white">Final Report</Badge>
                  <Badge className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-white/86">
                    {results.fitBand}
                  </Badge>
                  <Badge className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-white/86">
                    {results.stage.label}
                  </Badge>
                </div>
                <div className="rounded-[16px] bg-white px-3 py-2 shadow-[0_18px_40px_rgba(5,20,39,0.16)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/yokogawa-logo.png"
                    alt="Yokogawa"
                    width={180}
                    height={27}
                    className="h-auto w-[150px] sm:w-[180px]"
                  />
                </div>
              </div>
              <CardTitle className="mt-4 font-heading text-[2.55rem] tracking-[-0.05em] text-white">
                {results.profile.label} Assessment Report
              </CardTitle>
              <CardDescription className="mt-2 max-w-[920px] text-[1.08rem] leading-8 text-white/74">
                {results.executiveSummary}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 mt-6 grid gap-4 p-0 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className={cn(REPORT_FRAME_CARD, "p-4")}>
                <p className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--brand-blue)]/80">
                  Process Frame
                </p>
                <div className="mt-4 rounded-[24px] border border-[#c7daec] bg-white/80 p-3">
                  <ProcessFamilyIllustration profileId={results.profile.id} variant="report" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {results.profile.focusAreas.slice(0, 3).map((focus) => (
                    <span
                      key={focus}
                      className="rounded-full border border-[#c7daec] bg-white px-3 py-1.5 text-sm font-semibold text-[color:var(--brand-blue)]"
                    >
                      {focus}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid gap-3">
                <div className={cn(REPORT_FRAME_CARD, "p-4")}>
                  <p className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--brand-blue)]/80">
                    Digital Coverage
                  </p>
                  <p className="mt-3 text-display text-[2.2rem] leading-none tracking-[-0.05em] text-[color:var(--brand-indigo)]">
                    {formatPercent(results.digitalCoverage)}
                  </p>
                  <p className="mt-3 text-[0.96rem] leading-6 text-[color:var(--brand-indigo)]/78">
                    Current connected operating coverage across instruments, data, and guided workflow.
                  </p>
                </div>
                <div className={cn(REPORT_FRAME_CARD, "p-4")}>
                  <p className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--brand-blue)]/80">
                    Manual Burden
                  </p>
                  <p className="mt-3 text-display text-[2.2rem] leading-none tracking-[-0.05em] text-[color:var(--brand-indigo)]">
                    {formatPercent(results.manualBurdenIndex)}
                  </p>
                  <p className="mt-3 text-[0.96rem] leading-6 text-[color:var(--brand-indigo)]/78">
                    Current reliance on manual transcription, review assembly, and delayed evidence.
                  </p>
                </div>
              </div>
            </CardContent>
          </div>

          <div className="flex h-full flex-col border-t border-white/8 bg-white/[0.03] p-6 xl:border-t-0 xl:border-l">
            <div className="grid gap-3 sm:grid-cols-2">
              <ReportMetricCard
                label="Fit Score"
                value={formatPercent(results.fitScore)}
                detail="How strongly the current operating state suggests BioPilot can help."
              />
              <ReportMetricCard
                label="Annual Value"
                value={formatCurrency(results.annualValuePotential)}
                detail="Estimated annual value from the submitted assumptions."
              />
              <ReportMetricCard
                label="BioPilot Scope"
                value={investment.tierLabel}
                detail={`${formatCurrency(investment.monthlySubscription)} monthly subscription scope used in the ROI model.`}
              />
              <ReportMetricCard
                label="3-Year Investment"
                value={formatCurrency(investment.totalThreeYearInvestment)}
                detail="Subscription, customer engineering time, and selected additional services."
              />
              <ReportMetricCard
                label="3-Year ROI"
                value={formatPercent(results.threeYearRoi)}
                detail="Estimated 3-year return against BioPilot scope and customer engineering assumptions."
              />
              <ReportMetricCard
                label="Payback"
                value={formatPaybackMonths(results.paybackMonths)}
                detail="Estimated payback using annual subscription billing and a phased value ramp."
              />
            </div>
            <div className={cn(DARK_SOFT, "mt-3 flex-1 p-4")}>
              <p className="text-[12px] uppercase tracking-[0.18em] text-white/52">
                Modeled Basis
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="font-heading text-[1.55rem] leading-none tracking-[-0.05em] text-[#9bdaf7]">
                    {formatNumber(results.annualRecoveredHours)}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-white/66">Hours Recovered Per Year</p>
                </div>
                <div>
                  <p className="font-heading text-[1.55rem] leading-none tracking-[-0.05em] text-[#9bdaf7]">
                    {formatDecimal(results.avoidedFailedRuns)}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-white/66">Failed Or Degraded Runs Avoided</p>
                </div>
                <div>
                  <p className="font-heading text-[1.55rem] leading-none tracking-[-0.05em] text-[#9bdaf7]">
                    {topValueLever ? formatCurrency(topValueLever.annualValue) : "$0"}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-white/66">Largest Annual Value Driver</p>
                </div>
              </div>
              {topPriority ? (
                <p className="mt-4 border-t border-white/8 pt-3 text-[0.96rem] leading-6 text-white/72">
                  Strongest Priority: {topPriority.title.toLowerCase()}.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {submittedProcessProfileCard}

      {fitScoreExplanationCard}

      {investmentBasisCard}

      {estimateCalculationCard}

      <div className="grid gap-4">
        <Card className={cn(PANEL_CARD, "h-fit p-5")}>
          <CardHeader className="p-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="font-heading text-[1.7rem] tracking-[-0.03em]">
                  Digital Plant Maturity
                </CardTitle>
                <CardDescription className="text-lg leading-7 text-[color:var(--muted-foreground)]">
                  {results.digitalPlantMaturity.summary}
                </CardDescription>
              </div>
              <Badge className="rounded-full bg-[color:var(--brand-blue)] px-3 py-1.5 text-white">
                Level {results.digitalPlantMaturity.level}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="mt-5 grid gap-4 p-0">
            <div className={cn(SOFT_CARD, "p-4")}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-semibold text-[color:var(--foreground)]">
                  {results.digitalPlantMaturity.label}
                </p>
                <p className="font-heading text-[1.75rem] leading-none tracking-[-0.05em] text-[color:var(--brand-blue)]">
                  {formatPercent(results.digitalPlantMaturity.score)}
                </p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-[rgba(0,79,155,0.12)]">
                <div
                  className="h-2 rounded-full bg-[linear-gradient(90deg,#004f9b,#18b8c7)]"
                  style={{ width: `${Math.round(results.digitalPlantMaturity.score)}%` }}
                />
              </div>
              <p className="mt-3 text-base leading-6 text-[color:var(--muted-foreground)]">
                {results.digitalPlantMaturity.nextStep}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {results.digitalPlantMaturity.domains.map((domain) => (
                <div key={domain.id} className={cn(SOFT_CARD, "p-4")}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-[color:var(--foreground)]">
                      {domain.label}
                    </p>
                    <span className="rounded-full bg-[rgba(0,79,155,0.08)] px-3 py-1 text-sm font-semibold text-[color:var(--brand-blue)]">
                      {formatPercent(domain.score)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-[color:var(--muted-foreground)]">
                    {domain.rationale}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <div className="grid gap-4">
          <Card className={cn(PANEL_CARD, "h-fit p-5")}>
            <CardHeader className="p-0">
              <CardTitle className="font-heading text-[1.7rem] tracking-[-0.03em]">
                Recommended BioPilot Priorities
              </CardTitle>
              <CardDescription className="text-lg leading-7 text-[color:var(--muted-foreground)]">
                These areas are most likely to improve the submitted operating profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-5 grid gap-3 p-0">
              {results.plays.map((play) => (
                <div key={play.id} className={cn(SOFT_CARD, "p-4")}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-lg font-semibold text-[color:var(--foreground)]">
                      {play.title}
                    </p>
                    <span className="rounded-full bg-[rgba(0,79,155,0.08)] px-3 py-1 text-sm font-semibold text-[color:var(--brand-blue)]">
                      {formatPercent(play.relevanceScore)}
                    </span>
                  </div>
                  <p className="mt-2 text-base leading-6 text-[color:var(--muted-foreground)]">
                    {play.summary}
                  </p>
                  <p className="mt-3 text-base leading-6 text-[color:var(--foreground)]">
                    {play.whyBioPilot}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className={cn(PANEL_CARD, "h-fit p-5")}>
            <CardHeader className="p-0">
              <CardTitle className="font-heading text-[1.7rem] tracking-[-0.03em]">
                Main Improvement Opportunities
              </CardTitle>
              <CardDescription className="text-lg leading-7 text-[color:var(--muted-foreground)]">
                The operating gaps with the biggest effect on process performance and value.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-5 grid gap-3 p-0">
              {results.buyingSignals.map((signal) => (
                <div key={signal.id} className={cn(SOFT_CARD, "p-4")}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-lg font-semibold text-[color:var(--foreground)]">{signal.title}</p>
                    <Badge
                      className={cn(
                        "rounded-full px-2.5 py-1",
                        signal.severity === "Critical"
                          ? "bg-[color:var(--brand-indigo)] text-white"
                          : signal.severity === "Material"
                            ? "bg-[color:var(--brand-blue)] text-white"
                            : "bg-[color:var(--brand-yellow)] text-[color:var(--brand-indigo)]",
                      )}
                    >
                      {signal.severity}
                    </Badge>
                  </div>
                  <p className="mt-2 text-base leading-6 text-[color:var(--muted-foreground)]">
                    {signal.summary}
                  </p>
                  <p className="mt-3 text-base leading-6 text-[color:var(--foreground)]">{signal.action}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className={cn(PANEL_CARD, "h-fit p-5")}>
            <CardHeader className="p-0">
              <CardTitle className="font-heading text-[1.7rem] tracking-[-0.03em]">
                Operating Change Summary
              </CardTitle>
              <CardDescription className="text-lg leading-7 text-[color:var(--muted-foreground)]">
                Submitted state compared with the estimated state after BioPilot adoption.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-5 grid gap-3 p-0">
              {REPORT_CHANGE_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    SOFT_CARD,
                    "grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center",
                  )}
                >
                  <p className="text-lg font-semibold text-[color:var(--foreground)]">{item.label}</p>
                  <div className="md:text-right">
                    <p className="text-[12px] uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                      Current
                    </p>
                    <p className="mt-1 font-heading text-[1.25rem] tracking-[-0.03em] text-[color:var(--foreground)]">
                      {formatChangeValue(item.currentKey, results.currentState[item.currentKey])}
                    </p>
                  </div>
                  <ArrowRight className="hidden size-4 text-[color:var(--muted-foreground)] md:block" />
                  <div className="md:text-right">
                    <p className="text-[12px] uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                      With BioPilot
                    </p>
                    <p className="mt-1 font-heading text-[1.25rem] tracking-[-0.03em] text-[color:var(--brand-blue)]">
                      {formatChangeValue(item.currentKey, results.bioPilotState[item.currentKey])}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          <Card className={cn(PANEL_CARD, "h-fit p-5")}>
            <CardHeader className="p-0">
              <CardTitle className="font-heading text-[1.7rem] tracking-[-0.03em]">
                Estimated Operating Improvement
              </CardTitle>
              <CardDescription className="text-lg leading-7 text-[color:var(--muted-foreground)]">
                Current state compared with the estimated state after BioPilot adoption.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-5 grid gap-3 p-0">
              {results.laneScores.map((lane) => (
                <LaneScoreCard
                  key={lane.id}
                  label={lane.label}
                  currentScore={lane.currentScore}
                  enabledScore={lane.enabledScore}
                  summary={lane.summary}
                  leverage={lane.leverage}
                />
              ))}
            </CardContent>
          </Card>

          <Card className={cn(PANEL_CARD, "h-fit p-5")}>
            <CardHeader className="p-0">
              <CardTitle className="font-heading text-[1.7rem] tracking-[-0.03em]">
                Value Drivers
              </CardTitle>
              <CardDescription className="text-lg leading-7 text-[color:var(--muted-foreground)]">
                The main sources of estimated value in this report.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-5 grid gap-3 p-0">
              {results.valueLevers.map((lever) => (
                <ValueLeverCard
                  key={lever.id}
                  label={lever.label}
                  annualValue={lever.annualValue}
                  summary={lever.summary}
                  maxValue={maxLeverValue}
                />
              ))}
            </CardContent>
          </Card>

        </div>
      </div>

      <Card className={cn(PANEL_CARD, "p-6")}>
        <CardHeader className="p-0">
          <CardTitle className="font-heading text-[1.8rem] tracking-[-0.03em]">Next Move</CardTitle>
          <CardDescription className="text-xl leading-8 text-[color:var(--muted-foreground)]">
            Recommended next step based on the submitted operating profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-5 grid gap-4 p-0">
          <div className={cn(SOFT_CARD, "min-w-0 p-4")}>
            <p className="text-[13px] uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
              Recommended Next Step
            </p>
            <p className="mt-2 max-w-[56ch] text-lg leading-7 text-[color:var(--foreground)]">
              {results.nextStep}
            </p>
          </div>
          <div className={cn(SOFT_CARD, "grid gap-3 p-4 lg:grid-cols-[0.72fr_1.28fr]")}>
            <div>
              <p className="text-[13px] uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                Follow-Up Focus
              </p>
              <p className="mt-2 text-lg font-semibold leading-7 text-[color:var(--foreground)]">
                {results.salesFollowUp.priority}
              </p>
            </div>
            <div className="grid gap-2 text-base leading-6 text-[color:var(--muted-foreground)]">
              {results.salesFollowUp.discoveryFocus.map((item) => (
                <p key={item}>- {item}</p>
              ))}
              <p className="font-semibold text-[color:var(--foreground)]">
                {results.salesFollowUp.recommendedAction}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Button variant="outline" className={SECONDARY_BUTTON} onClick={onEditInputs}>
              Edit Inputs
            </Button>
            <Button variant="outline" className={SECONDARY_BUTTON} onClick={onChangeContact}>
              Change Contact
            </Button>
            <Button className={PRIMARY_BUTTON} onClick={onNewAssessment}>
              Start Another Assessment
            </Button>
            <Button className={PRIMARY_BUTTON} onClick={handleExportPdf} disabled={isExportingPdf}>
              <FileDown className="size-4" />
              {isExportingPdf ? "Preparing PDF..." : "Export PDF"}
            </Button>
          </div>
        </CardContent>
        {exportError ? (
          <CardContent className="mt-4 p-0">
            <Alert className="border-[color:var(--destructive)]/20 bg-[color:var(--surface-2)]">
              <CircleAlert className="size-4 text-[color:var(--destructive)]" />
              <AlertTitle>PDF Export Did Not Complete</AlertTitle>
              <AlertDescription>{exportError}</AlertDescription>
            </Alert>
          </CardContent>
        ) : null}
        {storageMessage ? (
          <CardContent className="mt-4 p-0">
            <Alert
              className={cn(
                "bg-[color:var(--surface-2)]",
                storageMode === "database"
                  ? "border-[color:var(--border)]"
                  : "border-[color:var(--brand-yellow)]/30",
              )}
            >
              <ShieldCheck
                className={cn(
                  "size-4",
                  storageMode === "database"
                    ? "text-[color:var(--brand-blue)]"
                    : "text-[color:var(--brand-yellow)]",
                )}
              />
              <AlertTitle>
                {storageMode === "database" ? "Assessment Saved" : "Saved On This Device"}
              </AlertTitle>
              <AlertDescription>{storageMessage}</AlertDescription>
            </Alert>
          </CardContent>
        ) : null}
      </Card>

      <Card className={cn(PANEL_CARD, "p-6")}>
        <CardHeader className="p-0">
          <CardTitle className="font-heading text-[1.8rem] tracking-[-0.03em]">
            Improve This Assessment
          </CardTitle>
          <CardDescription className="text-xl leading-8 text-[color:var(--muted-foreground)]">
            Share quick feedback to help refine this assessment experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-5 grid gap-4 p-0">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                label: "Overall",
                value: feedbackRating,
                onChange: setFeedbackRating,
              },
              {
                label: "Usefulness",
                value: feedbackUsefulness,
                onChange: setFeedbackUsefulness,
              },
              {
                label: "Clarity",
                value: feedbackClarity,
                onChange: setFeedbackClarity,
              },
            ].map((item) => (
              <div key={item.label} className={cn(SOFT_CARD, "p-4")}>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                  {item.label}
                </p>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      className={cn(
                        "h-10 rounded-[12px] border text-sm font-semibold transition",
                        item.value === score
                          ? "border-[color:var(--brand-blue)] bg-[color:var(--brand-blue)] text-white"
                          : "border-[color:var(--border)] bg-white text-[color:var(--foreground)] hover:border-[color:var(--brand-blue)]",
                      )}
                      onClick={() => item.onChange(score)}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            <label className="text-base font-semibold text-[color:var(--foreground)]">
              What Should Be Improved?
            </label>
            <Textarea
              className="min-h-[112px] rounded-[18px] border-[color:var(--input)] bg-[color:var(--surface-3)] p-4 text-base leading-6 text-[color:var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] placeholder:text-[color:var(--muted-foreground)] focus-visible:border-[color:var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
              value={feedbackComment}
              onChange={(event) => setFeedbackComment(event.target.value)}
              placeholder="Add anything confusing, missing, or especially useful."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              {feedbackMessage ? (
                <p className="text-base text-[color:var(--brand-blue)]">{feedbackMessage}</p>
              ) : null}
              {feedbackError ? (
                <p className="text-base text-[color:var(--destructive)]">{feedbackError}</p>
              ) : null}
            </div>
            <Button
              type="button"
              className={PRIMARY_BUTTON}
              onClick={() => void handleSubmitFeedback()}
              disabled={isSubmittingFeedback}
            >
              {isSubmittingFeedback ? "Saving Feedback..." : "Submit Feedback"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function BioPilotFitAssessmentApp({
  internalModeRequested = false,
}: {
  internalModeRequested?: boolean;
} = {}) {
  const { hasHydrated, leadCapture, completeLeadCapture, clearLeadCapture } = useCalculatorStore(
    useShallow((state) => ({
      hasHydrated: state.hasHydrated,
      leadCapture: state.leadCapture,
      completeLeadCapture: state.completeLeadCapture,
      clearLeadCapture: state.clearLeadCapture,
    })),
  );

  const [currentStep, setCurrentStep] = useState<AssessmentStep>("intro");
  const [sessionId, setSessionId] = useState(createAssessmentSessionId);
  const [sessionMode, setSessionMode] = useState<AssessmentSessionMode>("actual");
  const [inputs, setInputs] = useState<BioPilotAssessmentInputs>(loadInitialInputs);
  const [reportResults, setReportResults] = useState<BioPilotAssessmentResults | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [assessmentStorageMode, setAssessmentStorageMode] = useState<"database" | "local_only" | null>(null);
  const [assessmentStorageMessage, setAssessmentStorageMessage] = useState<string | null>(null);
  const [assessmentRecordId, setAssessmentRecordId] = useState<string | null>(null);
  const [completedInputSectionIds, setCompletedInputSectionIds] = useState<InputSectionId[]>([]);
  const [inputSources, setInputSources] = useState<
    Partial<Record<InputSourceFieldKey, AssessmentInputSource>>
  >(() => buildInputSources("default"));
  const [usedSampleData, setUsedSampleData] = useState(false);
  const [isInternalModeUnlocked, setIsInternalModeUnlocked] = useState(false);
  const showInternalControls = internalModeRequested && isInternalModeUnlocked;

  useEffect(() => schedulePageTopScroll(), [currentStep]);

  useEffect(() => {
    if (!internalModeRequested) {
      setIsInternalModeUnlocked(false);
    }
  }, [internalModeRequested]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs]);

  const buildAssessmentProgressPayload = useCallback(
    (statusOverride?: AssessmentProgressStatus) => {
      if (!leadCapture) {
        return null;
      }

      const normalizedInputs = normalizeAssessmentInputs(inputs);
      const status =
        statusOverride ??
        getAssessmentProgressStatus({
          currentStep,
          completedInputSectionIds,
          hasReport: Boolean(reportResults),
        });
      const evidenceMeta: AssessmentEvidenceMeta = {
        completedSectionIds: completedInputSectionIds as BioPilotInputSectionId[],
        inputSources,
        usedSampleData,
        userConfirmedAt: status === "report_generated" ? new Date().toISOString() : null,
      };

      return {
        firstName: leadCapture.firstName,
        lastName: leadCapture.lastName,
        workEmail: leadCapture.workEmail,
        company: leadCapture.company,
        jobTitle: leadCapture.jobTitle,
        countryRegion: leadCapture.countryRegion,
        consentToContact: leadCapture.consentToContact,
        sessionId,
        sessionMode,
        currentStep,
        status,
        completedSectionIds: completedInputSectionIds,
        inputs: normalizedInputs,
        evidenceMeta,
        modelVersion: BIOPILOT_MODEL_VERSION,
      };
    },
    [
      completedInputSectionIds,
      currentStep,
      inputSources,
      inputs,
      leadCapture,
      reportResults,
      sessionId,
      sessionMode,
      usedSampleData,
    ],
  );

  const saveAssessmentProgress = useCallback(
    async (statusOverride?: AssessmentProgressStatus) => {
      const payload = buildAssessmentProgressPayload(statusOverride);

      if (!payload) {
        return;
      }

      try {
        await fetch("/api/assessment-progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error("Assessment progress save failed", error);
      }
    },
    [buildAssessmentProgressPayload],
  );

  useEffect(() => {
    if (!hasHydrated || !leadCapture || currentStep === "intro") {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveAssessmentProgress();
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [currentStep, hasHydrated, leadCapture, saveAssessmentProgress]);

  useEffect(() => {
    if (!hasHydrated || !leadCapture || currentStep === "intro") {
      return;
    }

    const saveFinalCheckpoint = () => {
      const payload = buildAssessmentProgressPayload();

      if (!payload) {
        return;
      }

      const body = JSON.stringify(payload);

      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/assessment-progress", blob);
        return;
      }

      void fetch("/api/assessment-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
        keepalive: true,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveFinalCheckpoint();
      }
    };

    window.addEventListener("pagehide", saveFinalCheckpoint);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", saveFinalCheckpoint);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [buildAssessmentProgressPayload, currentStep, hasHydrated, leadCapture]);

  const patchInputs = (
    patch: Partial<BioPilotAssessmentInputs>,
    source: AssessmentInputSource = "user",
  ) => {
    const shouldSyncEngineeringRate =
      typeof patch.blendedHourlyRate === "number" && !("customerEngineeringHourlyRate" in patch);
    const derivedPatch =
      shouldSyncEngineeringRate
        ? {
            ...patch,
            customerEngineeringHourlyRate: patch.blendedHourlyRate,
          }
        : patch;

    setInputs((current) => {
      const normalized = normalizeAssessmentInputs({ ...current, ...derivedPatch });
      const shouldInferTier =
        current.bioPilotTierId !== "custom" &&
        !("bioPilotTierId" in derivedPatch) &&
        ([
          "bioPilotBioreactors",
          "bioPilotRecipesRunning",
          "bioPilotRecipeStorage",
          "bioPilotPatEquipment",
          "bioPilotUsers",
        ] as const).some((key) => key in derivedPatch);

      if (!shouldInferTier) {
        return normalized;
      }

      return normalizeAssessmentInputs({
        ...normalized,
        bioPilotTierId: inferBioPilotTierId(normalized),
      });
    });
    setInputSources((current) => {
      const next = { ...current };

      for (const key of BIOPILOT_ADJUSTABLE_INPUT_KEYS) {
        if (key in derivedPatch) {
          next[key] = source;
        }
      }

      return next;
    });
  };

  const handleLoadSample = (sampleId: string) => {
    if (!showInternalControls) {
      return;
    }

    setInputs(buildRandomizedSampleInputs(sampleId));
    setInputSources(buildInputSources("sample"));
    setCompletedInputSectionIds([]);
    setUsedSampleData(true);
    setReportError(null);
    setAssessmentStorageMode(null);
    setAssessmentStorageMessage(null);
    setAssessmentRecordId(null);
  };

  const handleResetInputs = () => {
    if (!showInternalControls) {
      return;
    }

    setInputs((current) =>
      normalizeAssessmentInputs({
        ...DEFAULT_BIOPILOT_ASSESSMENT_INPUTS,
        processProfileId: current.processProfileId,
        lifecycleStageId: current.lifecycleStageId,
      }),
    );
    setInputSources(buildInputSources("default"));
    setCompletedInputSectionIds([]);
    setUsedSampleData(false);
    setReportError(null);
    setAssessmentStorageMode(null);
    setAssessmentStorageMessage(null);
    setAssessmentRecordId(null);
  };

  const handleCompleteInputSection = (sectionId: InputSectionId) => {
    setCompletedInputSectionIds((current) =>
      current.includes(sectionId) ? current : [...current, sectionId],
    );
  };

  const handleInvalidateInputSection = (sectionId: InputSectionId) => {
    setCompletedInputSectionIds((current) => current.filter((id) => id !== sectionId));
  };

  const handleSubmitLead = (record: LeadCaptureRecord) => {
    setSessionMode("actual");
    completeLeadCapture(record);
    setCurrentStep("profile");
  };

  const handleGenerateReport = async () => {
    if (!leadCapture) {
      setReportError("Enter contact details before generating the report.");
      return;
    }

    const allRequiredSectionsConfirmed = BIOPILOT_INPUT_SECTION_IDS.every((sectionId) =>
      completedInputSectionIds.includes(sectionId),
    );

    if (!allRequiredSectionsConfirmed) {
      setReportError("Confirm every input section before generating the final report.");
      return;
    }

    setIsGeneratingReport(true);
    setReportError(null);
    setAssessmentStorageMode(null);
    setAssessmentStorageMessage(null);
    setAssessmentRecordId(null);

    try {
      await saveAssessmentProgress("report_ready");

      const normalizedInputs = normalizeAssessmentInputs(inputs);
      const evidenceMeta: AssessmentEvidenceMeta = {
        completedSectionIds: completedInputSectionIds as BioPilotInputSectionId[],
        inputSources,
        usedSampleData,
        userConfirmedAt: new Date().toISOString(),
      };
      const response = await fetch("/api/assessment-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: leadCapture.firstName,
          lastName: leadCapture.lastName,
          workEmail: leadCapture.workEmail,
          company: leadCapture.company,
          jobTitle: leadCapture.jobTitle,
          countryRegion: leadCapture.countryRegion,
          consentToContact: leadCapture.consentToContact,
          sessionMode,
          inputs: normalizedInputs,
          evidenceMeta,
          modelVersion: BIOPILOT_MODEL_VERSION,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            storageMode?: "database" | "local_only";
            assessmentId?: string | null;
            results?: BioPilotAssessmentResults;
          }
        | null;
      const nextResults = payload?.results ?? assessBioPilotFit(normalizedInputs, evidenceMeta);
      const coreMetrics = [
        nextResults.fitScore,
        nextResults.annualValuePotential,
        nextResults.threeYearRoi,
        nextResults.paybackMonths,
      ];

      if (coreMetrics.some((value) => !Number.isFinite(value))) {
        throw new Error("Assessment metrics were not finite.");
      }

      if (!response.ok) {
        throw new Error(payload?.message ?? "Assessment storage failed.");
      }

      setInputs(normalizedInputs);
      setReportResults(nextResults);
      setAssessmentRecordId(payload?.assessmentId ?? null);
      setAssessmentStorageMode(payload?.storageMode ?? "local_only");
      setAssessmentStorageMessage(
        payload?.message ??
          "Your report was created. Online saving status was not returned.",
      );
      setCurrentStep("report");
    } catch (error) {
      console.error("Final report generation failed", error);
      await saveAssessmentProgress("report_generation_failed");
      setReportError(
        error instanceof Error
          ? error.message
          : "The report could not be generated from the current inputs. Review the numeric fields and try again.",
      );
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleStartAnotherAssessment = () => {
    setSessionId(createAssessmentSessionId());
    setSessionMode("actual");
    setReportResults(null);
    setInputs(DEFAULT_BIOPILOT_ASSESSMENT_INPUTS);
    setInputSources(buildInputSources("default"));
    setCompletedInputSectionIds([]);
    setUsedSampleData(false);
    setReportError(null);
    setAssessmentStorageMode(null);
    setAssessmentStorageMessage(null);
    setAssessmentRecordId(null);
    setCurrentStep("profile");
  };

  const handleChangeContact = () => {
    setSessionId(createAssessmentSessionId());
    setSessionMode("actual");
    clearLeadCapture();
    setReportResults(null);
    setReportError(null);
    setAssessmentStorageMode(null);
    setAssessmentStorageMessage(null);
    setAssessmentRecordId(null);
    setCurrentStep("intro");
  };

  const handleUseSampleContact = () => {
    if (!showInternalControls) {
      return;
    }

    setSessionId(createAssessmentSessionId());
    setSessionMode("example");
    completeLeadCapture({
      ...SAMPLE_LEAD,
      submittedAt: new Date().toISOString(),
      storageMode: "local_only",
      storageMessage: "Example session loaded on this device.",
    });
    setInputs(buildRandomizedSampleInputs(BIOPILOT_SAMPLE_CONFIGS[0]?.id ?? ""));
    setInputSources(buildInputSources("sample"));
    setCompletedInputSectionIds([]);
    setUsedSampleData(true);
    setReportResults(null);
    setReportError(null);
    setAssessmentStorageMode(null);
    setAssessmentStorageMessage(null);
    setAssessmentRecordId(null);
    setCurrentStep("profile");
  };

  const handleUnlockInternalMode = async (adminKey: string) => {
    const response = await fetch("/api/admin/authorize", {
      headers: {
        "x-admin-key": adminKey,
      },
    });
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      throw new Error(payload?.message ?? "Admin authorization failed.");
    }

    setIsInternalModeUnlocked(true);
  };

  const handleStepSelect = (step: AssessmentStep) => {
    const currentIndex = STEP_ORDER.findIndex((item) => item.id === currentStep);
    const nextIndex = STEP_ORDER.findIndex((item) => item.id === step);

    if (nextIndex > currentIndex) {
      return;
    }

    setCurrentStep(step);
  };

  const handleGoHome = () => {
    setCurrentStep("intro");
  };

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-xl text-muted-foreground">
        Loading BioPilot Assessment...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-4 text-foreground sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,127,255,0.08),transparent_68%)] blur-3xl" />
        <div className="absolute right-[4%] top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(0,49,108,0.08),transparent_72%)] blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-[1560px]">
        {currentStep === "intro" ? (
          <div className={cn(SHELL_CARD, "overflow-hidden p-4 sm:p-4 lg:p-5")}>
            <IntroStep
              onSubmitLead={handleSubmitLead}
              onUseSample={handleUseSampleContact}
              onGoHome={handleGoHome}
              internalModeRequested={internalModeRequested}
              internalModeUnlocked={isInternalModeUnlocked}
              onUnlockInternalMode={handleUnlockInternalMode}
            />
          </div>
        ) : (
          <div className={cn(SHELL_CARD, "overflow-hidden p-4 sm:p-4 lg:p-5")}>
            <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
              <WorkspaceSidebar
                currentStep={currentStep}
                onSelectStep={handleStepSelect}
                onGoHome={handleGoHome}
                leadCapture={leadCapture}
                inputs={inputs}
              />

              <div>
                {currentStep === "profile" ? (
                  <ProcessTypeStep
                    inputs={inputs}
                    onPatch={patchInputs}
                    onNext={() => setCurrentStep("inputs")}
                    onBack={() => setCurrentStep("intro")}
                  />
                ) : null}

                {currentStep === "inputs" ? (
                  <InputsStep
                    inputs={inputs}
                    onPatch={patchInputs}
                    onLoadSample={handleLoadSample}
                    onReset={handleResetInputs}
                    showInternalControls={showInternalControls}
                    completedInputSectionIds={completedInputSectionIds}
                    onCompleteInputSection={handleCompleteInputSection}
                    onInvalidateInputSection={handleInvalidateInputSection}
                    onBack={() => setCurrentStep("profile")}
                    onGenerate={handleGenerateReport}
                    reportError={reportError}
                    isGeneratingReport={isGeneratingReport}
                  />
                ) : null}

                {currentStep === "report" && reportResults ? (
                  <ReportStep
                    inputs={inputs}
                    results={reportResults}
                    leadCapture={leadCapture}
                    assessmentId={assessmentRecordId}
                    storageMode={assessmentStorageMode}
                    storageMessage={assessmentStorageMessage}
                    onEditInputs={() => setCurrentStep("inputs")}
                    onNewAssessment={handleStartAnotherAssessment}
                    onChangeContact={handleChangeContact}
                  />
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
