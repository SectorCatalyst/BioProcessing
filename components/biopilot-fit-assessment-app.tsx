"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  BIOPILOT_SAMPLE_CONFIGS,
  buildRandomizedSampleInputs,
  DEFAULT_BIOPILOT_ASSESSMENT_INPUTS,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const STORAGE_KEY = "biopilot-fit-assessment-state-v1";

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
  "h-11 rounded-[14px] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(135deg,#004f9b,#0b7fff)] px-4 text-[0.95rem] font-semibold text-white shadow-[0_10px_24px_rgba(0,95,189,0.18)] hover:shadow-[0_14px_30px_rgba(0,95,189,0.22)]";
const SECONDARY_BUTTON =
  "h-11 rounded-[14px] border-[color:var(--border-strong)] bg-[color:var(--surface-3)] px-4 text-[0.95rem] font-semibold text-[color:var(--foreground)] hover:bg-[color:var(--surface-elevated)]";
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

  const animationFrame = window.requestAnimationFrame(() => {
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

  return () => window.cancelAnimationFrame(animationFrame);
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

type AdjustableFieldKey = BioPilotAdjustableInputKey;

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
    step: number;
    suffix?: string;
    kind: "number" | "range";
  }
> = {
  activePrograms: {
    label: "Active Programs In Scope",
    description: "Number of products, campaigns, or programs using this operating model in the next 12 months.",
    min: 1,
    max: 18,
    step: 1,
    kind: "number",
  },
  runsPerYear: {
    label: "Process Runs Per Year",
    description: "Number of upstream or end-to-end runs expected in this scope over the next 12 months.",
    min: 1,
    max: 220,
    step: 1,
    kind: "number",
  },
  sites: {
    label: "Sites Or Partners In Scope",
    description: "Number of facilities, CDMOs, or major partners that must reproduce or review this process.",
    min: 1,
    max: 8,
    step: 1,
    kind: "number",
  },
  transferEventsPerYear: {
    label: "Annual Transfer Events",
    description: "Number of scale-up, site-transfer, validation, or partner handoff packages expected in the next 12 months.",
    min: 0,
    max: 12,
    step: 1,
    kind: "number",
  },
  vendorPlatforms: {
    label: "Data Platforms In Scope",
    description: "Number of separate bioreactor, analyzer, historian, LIMS/MES, modeling, or spreadsheet systems used for one process record.",
    min: 1,
    max: 8,
    step: 1,
    kind: "number",
  },
  blendedHourlyRate: {
    label: "Loaded Labor Rate",
    description: "Average fully loaded USD/hr rate for scientists, engineers, operators, QA, and review contributors.",
    min: 80,
    max: 260,
    step: 5,
    suffix: "$/hr",
    kind: "number",
  },
  costPerFailedRun: {
    label: "Failed-Run Impact",
    description: "USD impact of one lost, unusable, or repeated run including materials, labor, analytics, and schedule drag.",
    min: 15000,
    max: 250000,
    step: 5000,
    suffix: "USD",
    kind: "number",
  },
  valuePerDayAcceleration: {
    label: "Value Of One Day Faster",
    description: "USD value of moving one key process decision, transfer milestone, or campaign release forward by one day.",
    min: 10000,
    max: 150000,
    step: 5000,
    suffix: "USD",
    kind: "number",
  },
  plannedProgramInvestment: {
    label: "First-Wave BioPilot Investment",
    description:
      "Estimated first-wave BioPilot investment used to convert the opportunity into directional ROI. Refine this once proposal pricing is known.",
    min: 100000,
    max: 900000,
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
    max: 40,
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
      "plannedProgramInvestment",
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
    "These values set the scale of the business case. Annual run count, failed-run cost, and investment assumptions usually move the ROI most.",
  "connected-stack":
    "These 0-100 scores define the digital plant maturity baseline across instruments, PAT, analyzer context, and operating evidence.",
  "manual-burden":
    "These time assumptions directly drive recoverable hours. Use recent run reviews or team estimates when exact data is not available.",
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

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return DEFAULT_BIOPILOT_ASSESSMENT_INPUTS;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<BioPilotAssessmentInputs>;
    return normalizeAssessmentInputs(parsed);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_BIOPILOT_ASSESSMENT_INPUTS;
  }
}

function buildInputSources(source: AssessmentInputSource) {
  return Object.fromEntries(
    BIOPILOT_ADJUSTABLE_INPUT_KEYS.map((key) => [key, source]),
  ) as Partial<Record<AdjustableFieldKey, AssessmentInputSource>>;
}

function mapLeadToFormDefaults(
  leadCapture: LeadCaptureRecord | null,
): LeadCaptureFormInput {
  if (!leadCapture) {
    return defaultLeadCaptureInput;
  }

  return {
    firstName: leadCapture.firstName,
    lastName: leadCapture.lastName,
    workEmail: leadCapture.workEmail,
    company: leadCapture.company,
    jobTitle: leadCapture.jobTitle,
    countryRegion: leadCapture.countryRegion,
    consentToContact: leadCapture.consentToContact,
  };
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
              key={field}
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
  const handleValueChange = (rawValue: string) => {
    const normalizedValue = rawValue.replace(/[^\d.]/g, "");

    if (!normalizedValue) {
      onChange(copy.min);
      return;
    }

    const parsedValue = Number(normalizedValue);
    if (!Number.isFinite(parsedValue)) {
      return;
    }

    const decimals = copy.step < 1 ? 1 : 0;
    const roundedValue =
      decimals > 0 ? Number(parsedValue.toFixed(decimals)) : Math.round(parsedValue);

    onChange(Math.min(copy.max, Math.max(copy.min, roundedValue)));
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
          value={String(value)}
          onChange={(event) => handleValueChange(event.target.value)}
        />
        {copy.suffix ? (
          <div className="min-w-fit rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-2 text-base font-semibold text-[color:var(--muted-foreground)]">
            {copy.suffix}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function IntroStep({
  initialLead,
  onSubmitLead,
  onUseSample,
  onGoHome,
}: {
  initialLead: LeadCaptureRecord | null;
  onSubmitLead: (record: LeadCaptureRecord) => void;
  onUseSample: () => void;
  onGoHome: () => void;
}) {
  const form = useForm<LeadCaptureFormInput>({
    resolver: zodResolver(leadCaptureSchema),
    mode: "onBlur",
    defaultValues: mapLeadToFormDefaults(initialLead),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActualSessionOpen, setIsActualSessionOpen] = useState(Boolean(initialLead));

  useEffect(() => {
    form.reset(mapLeadToFormDefaults(initialLead));
    setIsActualSessionOpen(Boolean(initialLead));
  }, [form, initialLead]);

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
            Choose Your Assessment Path
          </CardTitle>
          <CardDescription className="text-base leading-7 text-[color:var(--muted-foreground)]">
            Use an example session for a fast walkthrough, or select an actual session to assess a real process.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5 px-5 py-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
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
  completedInputSectionIds,
  onCompleteInputSection,
  onInvalidateInputSection,
  onBack,
  onGenerate,
  reportError,
  isGeneratingReport,
}: {
  inputs: BioPilotAssessmentInputs;
  onPatch: (patch: Partial<BioPilotAssessmentInputs>) => void;
  onLoadSample: (sampleId: string) => void;
  onReset: () => void;
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
  const hasMountedInputStep = useRef(false);
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

  useEffect(() => {
    if (!hasMountedInputStep.current) {
      hasMountedInputStep.current = true;
      return undefined;
    }

    return scheduleElementScroll("input-progress-panel");
  }, [activeInputSectionId]);

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

  const handleCompleteSection = (sectionId: InputSectionId) => {
    setCompletionError(null);
    onCompleteInputSection(sectionId);

    const nextSection = INPUT_SECTIONS[activeInputSectionIndex + 1];

    if (nextSection) {
      setActiveInputSectionId(nextSection.id);
    }
  };

  const handleGenerateClick = () => {
    if (incompleteSections.length) {
      setCompletionError(
        `Confirm ${incompleteSections[0].title.toLowerCase()} before generating the final report.`,
      );
      setActiveInputSectionId(incompleteSections[0].id);
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
              <CardContent className="mt-4 grid gap-5 p-0 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
                <div className="rounded-[24px] border border-[rgba(0,49,108,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,248,252,0.96))] p-3">
                  <ProcessFamilyIllustration profileId={profile.id} variant="panel" />
                </div>
                <div className="grid gap-4">
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
                        className="rounded-full border border-[rgba(11,79,155,0.12)] bg-[rgba(0,79,155,0.05)] px-3 py-1.5 text-sm font-semibold text-[color:var(--brand-blue)]"
                      >
                        {focus}
                      </span>
                    ))}
                  </div>
                  <Button type="button" variant="outline" className={SECONDARY_BUTTON} onClick={onBack}>
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
                  Set the lifecycle stage, or apply a sample scenario before editing the numbers.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-4 grid gap-4 p-0 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
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
                        plannedProgramInvestment: nextStage.annualProgramInvestment,
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
                      Changing the stage updates stage assumptions and the investment default.
                    </p>
                  </div>
                </div>

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
                <TabsList className="grid !h-auto w-full grid-cols-1 gap-2 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-2)] p-2 md:grid-cols-3">
                  {INPUT_SECTIONS.map((section, index) => {
                    const isComplete = completedSectionSet.has(section.id);
                    const isActiveTab = section.id === activeInputSectionId;

                    return (
                      <TabsTrigger
                        key={section.id}
                        value={section.id}
                        aria-label={`${section.title}${isComplete ? " Completed" : ""}`}
                        className="h-auto justify-start rounded-[18px] border border-transparent px-4 py-3 text-left text-base font-semibold text-[color:var(--muted-foreground)] after:hidden data-active:border-[rgba(0,79,155,0.24)] data-active:bg-[color:var(--brand-indigo)] data-active:text-white data-active:shadow-[0_10px_24px_rgba(11,28,59,0.1)]"
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
                        <span>{section.title}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                {INPUT_SECTIONS.map((section) => (
                  <TabsContent key={section.id} value={section.id} className="mt-0">
                    <div id={section.id === activeInputSectionId ? "input-question-set" : undefined}>
                      <InputSectionCard
                        section={section}
                        inputs={inputs}
                        onPatch={(patch) => {
                          onPatch(patch);
                          onInvalidateInputSection(section.id);
                        }}
                      />
                    </div>
                    <div className="mt-4 grid gap-3 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                      <p className="text-base leading-6 text-[color:var(--muted-foreground)]">
                        {completedSectionSet.has(section.id)
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
                          setActiveInputSectionId(previousSection.id);
                        }}
                        disabled={activeInputSectionIndex === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        className={
                          completedSectionSet.has(section.id)
                            ? SECONDARY_BUTTON
                            : PRIMARY_BUTTON
                        }
                        onClick={() => handleCompleteSection(section.id)}
                      >
                        {activeInputSectionIndex === INPUT_SECTIONS.length - 1
                          ? "Confirm Section"
                          : "Confirm And Continue"}
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <Alert className="border-[color:var(--border)] bg-[color:var(--surface-2)]">
            <CircleAlert className="size-4 text-[color:var(--brand-blue)]" />
            <AlertTitle>Planning Estimate</AlertTitle>
            <AlertDescription>
              The report estimates value from recoverable time, avoided failed runs, faster decisions,
              and cleaner transfer work. Confirm proposal pricing before treating ROI as final.
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
          <details key={item.label} className={cn(SOFT_CARD, "group p-4")}>
            <summary className="cursor-pointer text-base font-semibold text-[color:var(--foreground)]">
              {item.label}
            </summary>
            <div className="mt-3 grid gap-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
              <p>{item.basis}</p>
              <p>{item.formula}</p>
              <p>{item.sensitivity}</p>
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
            <ContextMetric label="Active Programs" value={formatNumber(inputs.activePrograms)} />
            <ContextMetric label="Runs Per Year" value={formatNumber(inputs.runsPerYear)} />
            <ContextMetric label="Sites Or Partners" value={formatNumber(inputs.sites)} />
            <ContextMetric label="Transfer Events" value={formatNumber(inputs.transferEventsPerYear)} />
            <ContextMetric label="Vendor Platforms" value={formatNumber(inputs.vendorPlatforms)} />
          </div>
          <Alert className="border-[color:var(--border)] bg-[color:var(--surface-2)]">
            <ShieldCheck className="size-4 text-[color:var(--brand-blue)]" />
            <AlertTitle>Use This Estimate As A Planning Tool</AlertTitle>
            <AlertDescription>
              Confirm the most important operating numbers before relying on this report for formal planning.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-4">
      <section className={cn(DARK_PANEL, "overflow-hidden p-0")}>
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_minmax(460px,520px)]">
          <div className="p-6">
            <CardHeader className="relative z-10 p-0">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full bg-white/10 px-3 py-1 text-white">Final Report</Badge>
                <Badge className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-white/86">
                  {results.fitBand}
                </Badge>
                <Badge className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-white/86">
                  {results.stage.label}
                </Badge>
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
                label="3-Year ROI"
                value={formatPercent(results.threeYearRoi)}
                detail="Estimated 3-year return against the submitted investment."
              />
              <ReportMetricCard
                label="Payback"
                value={`${formatDecimal(results.paybackMonths)} mo`}
                detail="Estimated payback period for the submitted scenario."
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
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

        <div className="grid gap-4">
          <Card className={cn(PANEL_CARD, "h-fit p-5")}>
            <CardHeader className="p-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="font-heading text-[1.7rem] tracking-[-0.03em]">
                    Evidence Confidence
                  </CardTitle>
                  <CardDescription className="text-lg leading-7 text-[color:var(--muted-foreground)]">
                    {results.evidenceConfidence.summary}
                  </CardDescription>
                </div>
                <Badge className="rounded-full bg-[color:var(--brand-indigo)] px-3 py-1.5 text-white">
                  {results.evidenceConfidence.band}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="mt-5 grid gap-4 p-0">
              <div className={cn(SOFT_CARD, "p-4")}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-semibold text-[color:var(--foreground)]">
                    Confidence Score
                  </p>
                  <p className="font-heading text-[1.75rem] leading-none tracking-[-0.05em] text-[color:var(--brand-blue)]">
                    {formatPercent(results.evidenceConfidence.score)}
                  </p>
                </div>
                <div className="mt-3 grid gap-2 text-sm leading-5 text-[color:var(--muted-foreground)] sm:grid-cols-3">
                  <span>{results.evidenceConfidence.userEnteredFields} User-Entered Fields</span>
                  <span>{results.evidenceConfidence.sampleFields} Sample Fields</span>
                  <span>{results.evidenceConfidence.defaultFields} Default Fields</span>
                </div>
              </div>
              {results.evidenceConfidence.warnings.length ? (
                <Alert className="border-[color:var(--brand-yellow)]/40 bg-[rgba(255,238,0,0.08)]">
                  <CircleAlert className="size-4 text-[color:var(--brand-indigo)]" />
                  <AlertTitle>Before Formal Planning</AlertTitle>
                  <AlertDescription>
                    {results.evidenceConfidence.warnings.join(" ")}
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>
        </div>
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

      {submittedProcessProfileCard}

      {estimateCalculationCard}

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

export function BioPilotFitAssessmentApp() {
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
    Partial<Record<AdjustableFieldKey, AssessmentInputSource>>
  >(() => buildInputSources("default"));
  const [usedSampleData, setUsedSampleData] = useState(false);

  useEffect(() => schedulePageTopScroll(), [currentStep]);

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
    setInputs((current) => normalizeAssessmentInputs({ ...current, ...patch }));
    setInputSources((current) => {
      const next = { ...current };

      for (const key of BIOPILOT_ADJUSTABLE_INPUT_KEYS) {
        if (key in patch) {
          next[key] = source;
        }
      }

      return next;
    });
  };

  const handleLoadSample = (sampleId: string) => {
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
    setInputs((current) => {
      const currentStage = LIFECYCLE_STAGE_MAP[current.lifecycleStageId];

      return normalizeAssessmentInputs({
        ...DEFAULT_BIOPILOT_ASSESSMENT_INPUTS,
        processProfileId: current.processProfileId,
        lifecycleStageId: current.lifecycleStageId,
        plannedProgramInvestment: currentStage.annualProgramInvestment,
      });
    });
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
              initialLead={leadCapture}
              onSubmitLead={handleSubmitLead}
              onUseSample={handleUseSampleContact}
              onGoHome={handleGoHome}
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
