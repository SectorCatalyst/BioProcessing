"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ArrowRight,
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

type AdjustableFieldKey = Exclude<
  keyof BioPilotAssessmentInputs,
  "processProfileId" | "lifecycleStageId"
>;

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
    label: "Active programs in scope",
    description: "Number of products, campaigns, or programs using this operating model in the next 12 months.",
    min: 1,
    max: 18,
    step: 1,
    kind: "number",
  },
  runsPerYear: {
    label: "Process runs per year",
    description: "Number of upstream or end-to-end runs expected in this scope over the next 12 months.",
    min: 1,
    max: 220,
    step: 1,
    kind: "number",
  },
  sites: {
    label: "Sites or partners in scope",
    description: "Number of facilities, CDMOs, or major partners that must reproduce or review this process.",
    min: 1,
    max: 8,
    step: 1,
    kind: "number",
  },
  transferEventsPerYear: {
    label: "Annual transfer events",
    description: "Number of scale-up, site-transfer, validation, or partner handoff packages expected in the next 12 months.",
    min: 0,
    max: 12,
    step: 1,
    kind: "number",
  },
  vendorPlatforms: {
    label: "Data platforms in scope",
    description: "Number of separate bioreactor, analyzer, historian, LIMS/MES, modeling, or spreadsheet systems used for one process record.",
    min: 1,
    max: 8,
    step: 1,
    kind: "number",
  },
  blendedHourlyRate: {
    label: "Loaded labor rate",
    description: "Average fully loaded USD/hr rate for scientists, engineers, operators, QA, and review contributors.",
    min: 80,
    max: 260,
    step: 5,
    suffix: "$/hr",
    kind: "number",
  },
  costPerFailedRun: {
    label: "Failed-run impact",
    description: "USD impact of one lost, unusable, or repeated run including materials, labor, analytics, and schedule drag.",
    min: 15000,
    max: 250000,
    step: 5000,
    suffix: "USD",
    kind: "number",
  },
  valuePerDayAcceleration: {
    label: "Value of one day faster",
    description: "USD value of moving one key process decision, transfer milestone, or campaign release forward by one day.",
    min: 10000,
    max: 150000,
    step: 5000,
    suffix: "USD",
    kind: "number",
  },
  plannedProgramInvestment: {
    label: "First-wave BioPilot investment",
    description:
      "Estimated first-wave BioPilot investment used to convert the opportunity into directional ROI. Refine this once proposal pricing is known.",
    min: 100000,
    max: 900000,
    step: 10000,
    suffix: "USD",
    kind: "number",
  },
  bioreactorConnectivity: {
    label: "Bioreactor connectivity",
    description: "Score 0-100: share of reactor and control data available in a shared digital operating view.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  sensorCoverage: {
    label: "Core sensor coverage",
    description: "Score 0-100: share of critical process parameters captured digitally with timestamped signal history.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  patCoverage: {
    label: "PAT coverage",
    description: "Score 0-100: share of process understanding supported by PAT or online measurements instead of offline interpretation.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  analyzerConnectivity: {
    label: "Analyzer connectivity",
    description: "Score 0-100: share of at-line and offline analyzer results linked to batch, unit operation, and time context.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  downstreamVisibility: {
    label: "Downstream visibility",
    description: "Score 0-100: share of purification, filtration, and downstream evidence visible with upstream context.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  dataContextualization: {
    label: "Data contextualization",
    description: "Score 0-100: share of run data linked to recipe, phase, intervention, sample, and deviation context.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  sopAutomation: {
    label: "SOP automation",
    description: "Score 0-100: share of execution steps guided, captured, or checked digitally instead of manually coordinated.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  reviewByException: {
    label: "Review-by-exception readiness",
    description: "Score 0-100: share of review evidence that is already complete, contextualized, and exception-ready after each run.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  crossSiteCollaboration: {
    label: "Cross-site collaboration",
    description: "Score 0-100: share of site or partner work that can rely on one reusable digital operating record.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  manualTranscriptionShare: {
    label: "Manual transcription share",
    description: "Percent of run execution, analysis, and review work still dependent on manual entry or spreadsheet stitching.",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    kind: "range",
  },
  offlineDataDelayHours: {
    label: "Offline data delay",
    description: "Average hours between sample collection and analyzer evidence becoming usable for process decisions.",
    min: 1,
    max: 36,
    step: 1,
    suffix: "hrs",
    kind: "number",
  },
  batchReviewHours: {
    label: "Batch review hours",
    description: "Average specialist hours required to assemble, check, and review the evidence package for one run.",
    min: 2,
    max: 48,
    step: 1,
    suffix: "hrs",
    kind: "number",
  },
  deviationInvestigationHours: {
    label: "Deviation investigation hours",
    description: "Average investigation hours required when one deviation, excursion, or unexplained process event opens.",
    min: 2,
    max: 48,
    step: 1,
    suffix: "hrs",
    kind: "number",
  },
  techTransferPackageHours: {
    label: "Transfer package hours",
    description: "Average hours required to assemble one scale-up, site-transfer, or partner handoff package.",
    min: 8,
    max: 160,
    step: 2,
    suffix: "hrs",
    kind: "number",
  },
  onboardingDays: {
    label: "Operator ramp days",
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
    title: "Operating frame",
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
    title: "Connected bioprocess stack",
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
    title: "Manual burden and review drag",
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
    label: "Manual hours per run",
    currentKey: "manualHoursPerRun",
    currentSuffix: " hrs",
  },
  {
    label: "Batch review time",
    currentKey: "reviewHours",
    currentSuffix: " hrs",
  },
  {
    label: "Decision lag",
    currentKey: "decisionLagHours",
    currentSuffix: " hrs",
  },
  {
    label: "Run success rate",
    currentKey: "runSuccessRate",
    currentSuffix: "%",
  },
  {
    label: "Transfer package effort",
    currentKey: "transferPackageHours",
    currentSuffix: " hrs",
  },
  {
    label: "Operator ramp",
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
          Input section
        </p>
        <p className="mt-2 font-heading text-[1.45rem] tracking-[-0.03em] text-[color:var(--foreground)]">
          {section.title}
        </p>
        <p className="mt-1 max-w-[60ch] text-lg leading-7 text-[color:var(--muted-foreground)]">
          {section.description}
        </p>
      </div>
      <div className="grid auto-rows-fr gap-4 px-5 py-5 md:grid-cols-2">
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
        const isActive = step.id === currentStep;
        const isComplete = index < currentIndex;
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
            aria-label="Return to main page"
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
              Assessment overview
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
              {leadCapture ? `${leadCapture.firstName} ${leadCapture.lastName}` : "Assessment session"}
            </p>
            <p className="mt-1 text-base leading-6 text-[color:var(--muted-foreground)]">
              {leadCapture?.company ?? "BioPilot assessment"}
            </p>
          </div>

          {currentStep !== "profile" ? (
            <div className={cn(SOFT_CARD, "grid gap-3 p-4")}>
              <div>
                <p className="text-[12px] uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                  Process type
                </p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">{profile.label}</p>
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                  Lifecycle stage
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
    <div className={cn(SOFT_CARD, "flex h-full min-h-[260px] flex-col p-4")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-[color:var(--foreground)]">{copy.label}</p>
          <p className="mt-1 text-lg leading-7 text-[color:var(--muted-foreground)]">
            {copy.description}
          </p>
        </div>
        <div className="shrink-0 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-1.5 text-base font-semibold text-[color:var(--foreground)]">
          {copy.suffix === "%" ? formatPercent(value) : `${formatNumber(value)} ${copy.suffix ?? ""}`}
        </div>
      </div>
      <div className="mt-auto pt-5">
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
    <div className={cn(SOFT_CARD, "flex h-full min-h-[260px] flex-col p-4")}>
      <div>
        <p className="text-lg font-semibold text-[color:var(--foreground)]">{copy.label}</p>
        <p className="mt-1 text-lg leading-7 text-[color:var(--muted-foreground)]">
          {copy.description}
        </p>
      </div>
      <div className="mt-auto flex items-center gap-3 pt-5">
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

  useEffect(() => {
    form.reset(mapLeadToFormDefaults(initialLead));
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
              aria-label="Return to main page"
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

          <div className="mt-6 max-w-[760px]">
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
            <div className="mt-6">
              <a
                href="https://www.yokogawa.com/us/solutions/products-and-services/solutions/production-management/biopilot/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-[14px] border border-white/14 bg-white/8 px-4 text-[0.95rem] font-semibold text-white shadow-[0_10px_24px_rgba(5,20,39,0.14)] backdrop-blur-sm transition-colors duration-150 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(8,34,67,0.9)]"
              >
                Explore BioPilot
              </a>
            </div>
          </div>
        </div>
      </section>

      <Card className={cn(PANEL_CARD, "p-0")}>
        <CardHeader className="border-b border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(247,250,252,0.94))] px-5 py-3.5">
          <CardTitle className="font-heading text-[1.7rem] tracking-[-0.03em] text-[color:var(--foreground)]">
            Start the assessment
          </CardTitle>
          <CardDescription className="text-base leading-7 text-[color:var(--muted-foreground)]">
            Enter your details to begin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5 px-5 py-3.5">
          <form className="space-y-2.5" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-base font-semibold text-[color:var(--foreground)]">
                  First name
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
                  Last name
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
                  Work email
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
                  Job title
                </label>
                <Input className={cn(INPUT_CLASS, "h-[48px] text-base")} {...form.register("jobTitle")} />
              </div>
              <div className="space-y-2">
                <label className="text-base font-semibold text-[color:var(--foreground)]">
                  Country or region
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
                  Consent to contact
                </p>
                <p className="mt-1 text-base leading-6 text-[color:var(--muted-foreground)]">
                  I agree to be contacted about BioPilot and the next steps needed to validate the business case.
                </p>
              </div>
            </div>

            <Button type="submit" className={cn(PRIMARY_BUTTON, "w-full")} disabled={isSubmitting}>
              {isSubmitting ? "Saving details..." : "Continue to process selection"}
            </Button>

            <div className="grid gap-3 border-t border-[color:var(--border)] pt-2 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
              <div className="flex items-start gap-3">
                <FlaskConical className="mt-1 size-5 text-[color:var(--brand-yellow)]" />
                <div>
                  <p className="text-base font-semibold text-[color:var(--foreground)]">
                    Need a fast walkthrough?
                  </p>
                  <p className="mt-1 text-base leading-6 text-[color:var(--muted-foreground)]">
                    Load a sample session instead of typing every field manually.
                  </p>
                </div>
              </div>
              <Button type="button" className={ACCENT_BUTTON} onClick={onUseSample}>
                Launch example session
              </Button>
            </div>
          </form>
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
          Choose the bioprocess type
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
            Continue to inputs
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
  onBack,
  onGenerate,
  reportError,
  isGeneratingReport,
}: {
  inputs: BioPilotAssessmentInputs;
  onPatch: (patch: Partial<BioPilotAssessmentInputs>) => void;
  onLoadSample: (sampleId: string) => void;
  onReset: () => void;
  onBack: () => void;
  onGenerate: () => void;
  reportError: string | null;
  isGeneratingReport: boolean;
}) {
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [activeInputSectionId, setActiveInputSectionId] = useState<InputSectionId>(
    INPUT_SECTIONS[0].id,
  );
  const profile = PROCESS_PROFILE_MAP[inputs.processProfileId];
  const stage = LIFECYCLE_STAGE_MAP[inputs.lifecycleStageId];
  const selectedSample = BIOPILOT_SAMPLE_CONFIGS.find((item) => item.id === selectedSampleId) ?? null;
  const activeInputSectionIndex = Math.max(
    INPUT_SECTIONS.findIndex((section) => section.id === activeInputSectionId),
    0,
  );
  const activeInputSection = INPUT_SECTIONS[activeInputSectionIndex];
  const inputSectionProgress = ((activeInputSectionIndex + 1) / INPUT_SECTIONS.length) * 100;

  const handleResetInputs = () => {
    setSelectedSampleId("");
    onReset();
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
            Enter current-state inputs
          </CardTitle>
          <CardDescription className="text-xl leading-8 text-[color:var(--muted-foreground)]">
            Fill in the operating profile using the current state of your process, systems, and review flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6 grid gap-5 p-0">
          <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]">
            <Card className={cn(PANEL_CARD, "p-5")}>
              <CardHeader className="p-0">
                <CardTitle className="font-heading text-[1.45rem] tracking-[-0.03em]">
                  Process family
                </CardTitle>
                <CardDescription className="text-lg leading-7 text-[color:var(--muted-foreground)]">
                  Review the selected process family or go back to choose a different one.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-4 grid gap-4 p-0">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                    Process family
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
                  Change process family
                </Button>
              </CardContent>
            </Card>

            <Card className={cn(PANEL_CARD, "p-5")}>
              <CardHeader className="p-0">
                <CardTitle className="font-heading text-[1.45rem] tracking-[-0.03em]">
                  Scenario setup
                </CardTitle>
                <CardDescription className="text-lg leading-7 text-[color:var(--muted-foreground)]">
                  Set the lifecycle stage, or apply a sample scenario before editing the numbers.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-4 grid gap-4 p-0 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                <div className="grid gap-2">
                  <p className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                    Lifecycle stage
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
                    }}
                  >
                    <SelectTrigger className={cn(INPUT_CLASS, "w-full justify-between")}>
                      <SelectValue placeholder="Choose lifecycle stage">
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
                    Sample scenario
                  </p>
                  <Select
                    value={selectedSampleId || undefined}
                    onValueChange={(value) => setSelectedSampleId(value ?? "")}
                  >
                    <SelectTrigger className={cn(INPUT_CLASS, "w-full justify-between")}>
                      <SelectValue placeholder="Select a sample scenario" />
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
                        ? `${selectedSample.description} Click Apply sample data to replace the fields below.`
                        : "Choose a sample to preview it. The fields below will not change until you click Apply sample data."}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      className={ACCENT_BUTTON}
                      onClick={() => {
                        if (selectedSampleId) {
                          onLoadSample(selectedSampleId);
                        }
                      }}
                      disabled={!selectedSampleId}
                    >
                      Apply sample data
                    </Button>
                    <Button type="button" variant="outline" className={SECONDARY_BUTTON} onClick={handleResetInputs}>
                      Reset inputs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className={cn(PANEL_CARD, "overflow-hidden p-0")}>
            <CardHeader className="border-b border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(247,250,252,0.96))] px-5 py-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)] lg:items-end">
                <div>
                  <p className="text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                    Input progress
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
                    <span>Section {activeInputSectionIndex + 1} of {INPUT_SECTIONS.length}</span>
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
                <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-2)] p-2 md:grid-cols-3">
                  {INPUT_SECTIONS.map((section, index) => (
                    <TabsTrigger
                      key={section.id}
                      value={section.id}
                      className="h-auto justify-start rounded-[18px] border border-transparent px-4 py-3 text-left text-base font-semibold text-[color:var(--muted-foreground)] data-active:border-[rgba(0,79,155,0.18)] data-active:bg-white data-active:text-[color:var(--brand-blue)] data-active:shadow-[0_10px_24px_rgba(11,28,59,0.08)]"
                    >
                      <span className="mr-2 rounded-full bg-[rgba(0,79,155,0.08)] px-2 py-0.5 text-sm text-[color:var(--brand-blue)]">
                        {index + 1}
                      </span>
                      {section.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {INPUT_SECTIONS.map((section) => (
                  <TabsContent key={section.id} value={section.id} className="mt-0">
                    <InputSectionCard section={section} inputs={inputs} onPatch={onPatch} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <Alert className="border-[color:var(--border)] bg-[color:var(--surface-2)]">
            <CircleAlert className="size-4 text-[color:var(--brand-blue)]" />
            <AlertTitle>Planning estimate</AlertTitle>
            <AlertDescription>
              The report estimates value from recoverable time, avoided failed runs, faster decisions,
              and cleaner transfer work. Confirm proposal pricing before treating ROI as final.
            </AlertDescription>
          </Alert>

          {reportError ? (
            <Alert className="border-[color:var(--destructive)]/20 bg-[color:var(--surface-2)]">
              <CircleAlert className="size-4 text-[color:var(--destructive)]" />
              <AlertTitle>Report could not be generated</AlertTitle>
              <AlertDescription>{reportError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button type="button" variant="outline" className={SECONDARY_BUTTON} onClick={onBack}>
              <ChevronLeft className="size-4" />
              Back
            </Button>
            <Button type="button" className={PRIMARY_BUTTON} onClick={onGenerate} disabled={isGeneratingReport}>
              {isGeneratingReport ? "Generating report..." : "Generate final report"}
              <ChevronRight className="size-4" />
            </Button>
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
  storageMode,
  storageMessage,
  onEditInputs,
  onNewAssessment,
  onChangeContact,
}: {
  inputs: BioPilotAssessmentInputs;
  results: BioPilotAssessmentResults;
  leadCapture: LeadCaptureRecord | null;
  storageMode: "database" | "local_only" | null;
  storageMessage: string | null;
  onEditInputs: () => void;
  onNewAssessment: () => void;
  onChangeContact: () => void;
}) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
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

  return (
    <div className="grid gap-4">
      <section className={cn(DARK_PANEL, "overflow-hidden p-0")}>
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_minmax(460px,520px)]">
          <div className="p-6">
            <CardHeader className="relative z-10 p-0">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full bg-white/10 px-3 py-1 text-white">Final report</Badge>
                <Badge className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-white/86">
                  {results.fitBand}
                </Badge>
                <Badge className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-white/86">
                  {results.stage.label}
                </Badge>
              </div>
              <CardTitle className="mt-4 font-heading text-[2.55rem] tracking-[-0.05em] text-white">
                {results.profile.label} assessment report
              </CardTitle>
              <CardDescription className="mt-2 max-w-[920px] text-[1.08rem] leading-8 text-white/74">
                {results.executiveSummary}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 mt-6 grid gap-4 p-0 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className={cn(REPORT_FRAME_CARD, "p-4")}>
                <p className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--brand-blue)]/80">
                  Process frame
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
                    Digital coverage
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
                    Manual burden
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
                label="Fit score"
                value={formatPercent(results.fitScore)}
                detail="How strongly the current operating state suggests BioPilot can help."
              />
              <ReportMetricCard
                label="Annual value"
                value={formatCurrency(results.annualValuePotential)}
                detail="Estimated annual value from the submitted assumptions."
              />
              <ReportMetricCard
                label="3-year ROI"
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
                Modeled basis
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="font-heading text-[1.55rem] leading-none tracking-[-0.05em] text-[#9bdaf7]">
                    {formatNumber(results.annualRecoveredHours)}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-white/66">hours recovered per year</p>
                </div>
                <div>
                  <p className="font-heading text-[1.55rem] leading-none tracking-[-0.05em] text-[#9bdaf7]">
                    {formatDecimal(results.avoidedFailedRuns)}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-white/66">failed or degraded runs avoided</p>
                </div>
                <div>
                  <p className="font-heading text-[1.55rem] leading-none tracking-[-0.05em] text-[#9bdaf7]">
                    {topValueLever ? formatCurrency(topValueLever.annualValue) : "$0"}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-white/66">largest annual value driver</p>
                </div>
              </div>
              {topPriority ? (
                <p className="mt-4 border-t border-white/8 pt-3 text-[0.96rem] leading-6 text-white/72">
                  Strongest priority: {topPriority.title.toLowerCase()}.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <div className="grid gap-4">
          <Card className={cn(PANEL_CARD, "h-fit p-5")}>
            <CardHeader className="p-0">
              <CardTitle className="font-heading text-[1.7rem] tracking-[-0.03em]">
                Recommended BioPilot priorities
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
                Main improvement opportunities
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
                Operating change summary
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
                Estimated operating improvement
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
                Value drivers
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

      <Card className={cn(PANEL_CARD, "p-5")}>
        <CardHeader className="p-0">
          <CardTitle className="font-heading text-[1.7rem] tracking-[-0.03em]">
            Submitted process profile
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
              <ContextMetric label="Lifecycle stage" value={results.stage.label} />
              <ContextMetric label="Active programs" value={formatNumber(inputs.activePrograms)} />
              <ContextMetric label="Runs per year" value={formatNumber(inputs.runsPerYear)} />
              <ContextMetric label="Sites or partners" value={formatNumber(inputs.sites)} />
              <ContextMetric label="Transfer events" value={formatNumber(inputs.transferEventsPerYear)} />
              <ContextMetric label="Vendor platforms" value={formatNumber(inputs.vendorPlatforms)} />
            </div>
            <Alert className="border-[color:var(--border)] bg-[color:var(--surface-2)]">
              <ShieldCheck className="size-4 text-[color:var(--brand-blue)]" />
              <AlertTitle>Use this estimate as a planning tool</AlertTitle>
              <AlertDescription>
                Confirm the most important operating numbers before relying on this report for formal planning.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <Card className={cn(PANEL_CARD, "p-6")}>
        <CardHeader className="p-0">
          <CardTitle className="font-heading text-[1.8rem] tracking-[-0.03em]">Next move</CardTitle>
          <CardDescription className="text-xl leading-8 text-[color:var(--muted-foreground)]">
            Recommended next step based on the submitted operating profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-5 grid gap-4 p-0 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.05fr)] xl:items-start">
          <div className={cn(SOFT_CARD, "min-w-0 p-4")}>
            <p className="text-[13px] uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
              Recommended next step
            </p>
            <p className="mt-2 max-w-[56ch] text-lg leading-7 text-[color:var(--foreground)]">
              {results.nextStep}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className={SECONDARY_BUTTON} onClick={onEditInputs}>
              Edit inputs
            </Button>
            <Button variant="outline" className={SECONDARY_BUTTON} onClick={onChangeContact}>
              Change contact
            </Button>
            <Button className={PRIMARY_BUTTON} onClick={onNewAssessment}>
              Start another assessment
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
              <AlertTitle>PDF export did not complete</AlertTitle>
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
                {storageMode === "database" ? "Assessment saved" : "Saved on this device"}
              </AlertTitle>
              <AlertDescription>{storageMessage}</AlertDescription>
            </Alert>
          </CardContent>
        ) : null}
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
  const [inputs, setInputs] = useState<BioPilotAssessmentInputs>(loadInitialInputs);
  const [reportResults, setReportResults] = useState<BioPilotAssessmentResults | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [assessmentStorageMode, setAssessmentStorageMode] = useState<"database" | "local_only" | null>(null);
  const [assessmentStorageMessage, setAssessmentStorageMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handle = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    return () => window.cancelAnimationFrame(handle);
  }, [currentStep]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs]);

  const patchInputs = (patch: Partial<BioPilotAssessmentInputs>) => {
    setInputs((current) => normalizeAssessmentInputs({ ...current, ...patch }));
  };

  const handleLoadSample = (sampleId: string) => {
    setInputs(buildRandomizedSampleInputs(sampleId));
    setReportError(null);
    setAssessmentStorageMode(null);
    setAssessmentStorageMessage(null);
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
    setReportError(null);
    setAssessmentStorageMode(null);
    setAssessmentStorageMessage(null);
  };

  const handleSubmitLead = (record: LeadCaptureRecord) => {
    completeLeadCapture(record);
    setCurrentStep("profile");
  };

  const handleGenerateReport = async () => {
    if (!leadCapture) {
      setReportError("Enter contact details before generating the report.");
      return;
    }

    setIsGeneratingReport(true);
    setReportError(null);
    setAssessmentStorageMode(null);
    setAssessmentStorageMessage(null);

    try {
      const normalizedInputs = normalizeAssessmentInputs(inputs);
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
          inputs: normalizedInputs,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            storageMode?: "database" | "local_only";
            results?: BioPilotAssessmentResults;
          }
        | null;
      const nextResults = payload?.results ?? assessBioPilotFit(normalizedInputs);
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
      setAssessmentStorageMode(payload?.storageMode ?? "local_only");
      setAssessmentStorageMessage(
        payload?.message ??
          "Your report was created. Online saving status was not returned.",
      );
      setCurrentStep("report");
    } catch (error) {
      console.error("Final report generation failed", error);
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
    setReportResults(null);
    setInputs(DEFAULT_BIOPILOT_ASSESSMENT_INPUTS);
    setReportError(null);
    setAssessmentStorageMode(null);
    setAssessmentStorageMessage(null);
    setCurrentStep("profile");
  };

  const handleChangeContact = () => {
    clearLeadCapture();
    setReportResults(null);
    setReportError(null);
    setAssessmentStorageMode(null);
    setAssessmentStorageMessage(null);
    setCurrentStep("intro");
  };

  const handleUseSampleContact = () => {
      completeLeadCapture({
        ...SAMPLE_LEAD,
        submittedAt: new Date().toISOString(),
        storageMode: "local_only",
        storageMessage: "Sample session loaded on this device.",
      });
    setInputs(BIOPILOT_SAMPLE_CONFIGS[0]?.inputs ?? DEFAULT_BIOPILOT_ASSESSMENT_INPUTS);
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
        Loading BioPilot assessment...
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
