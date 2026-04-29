"use client";

import {
  useDeferredValue,
  useEffect,
  useState,
  startTransition,
  type ReactNode,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch, type FieldErrors, type Path } from "react-hook-form";
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  CircleAlert,
  Download,
  FlaskConical,
  Info,
  Minus,
  Plus,
  RefreshCcw,
  ShieldAlert,
  Sigma,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  calculateAllScenarios,
  formatCurrency,
  formatNumber,
  formatPercent,
  getAnnualValueComposition,
  getBridgeRows,
  getScenarioComparisonRows,
  type AssumptionRegisterRow,
  type RiskFlag,
  type ScenarioResult,
} from "@/lib/calculations";
import {
  getLikelyShortfalls,
  getOrderedValueChainStages,
  type ShortfallFinding,
  type ValueChainStageView,
} from "@/lib/bioprocess-value-chain";
import { exportCsvBundle, exportJson, exportPdf } from "@/lib/exporters";
import {
  defaultLeadCaptureInput,
  editableModelSchema,
  GLOBAL_FIELD_GROUPS,
  getSectionLabel,
  leadCaptureSchema,
  SCENARIO_FIELD_GROUPS,
  SCENARIO_IDS,
  SCENARIO_LABELS,
  type EditableModel,
  type FieldDefinition,
  type LeadCaptureFormInput,
  type LeadCaptureRecord,
  type ScenarioId,
  type SectionId,
} from "@/lib/model";
import { getTestDatasetById, TEST_DATASETS } from "@/lib/test-data";
import { cn } from "@/lib/utils";
import {
  useCalculatorStore,
  type VersioningState,
} from "@/store/use-calculator-store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface OverrideDraft {
  type: string;
  section: string;
  field: string;
  previousValue: string;
  newValue: string;
  reason: string;
}

const CHART_COLORS = {
  hardDollar: "#1f1c17",
  capacity: "#677a8c",
  strategic: "#b88737",
  muted: "#b7afa2",
  warning: "#005aa9",
};

const CLIENT_READINESS_LABELS: Record<ScenarioResult["readinessStatus"], string> = {
  Incomplete: "Needs More Input",
  "Minimally Calculable": "Early Estimate",
  "Review-Ready": "Ready for Review",
  "Decision-Support Ready": "Planning Ready",
};

const WORKSPACE_VIEWS = [
  { label: "Overview", value: "overview" },
  { label: "Value Chain", value: "value-chain" },
  { label: "Inputs", value: "inputs" },
  { label: "Assumptions", value: "assumptions" },
  { label: "Change Notes", value: "notes" },
  { label: "Export", value: "export" },
] as const;

type WorkspaceView = (typeof WORKSPACE_VIEWS)[number]["value"];

const OVERRIDE_TYPES = [
  "Standard Note",
  "Material Change",
  "High-Confidence Input",
  "Benchmark Adjustment",
  "Post-Review Update",
] as const;

const OVERRIDE_SECTIONS: SectionId[] = [
  "organizationProfile",
  "currentState",
  "costBasis",
  "improvementAssumptions",
  "riskAndRealization",
  "advancedSettings",
  "reviewAndSignOff",
  "scenarioJustification",
];

const SOURCE_LABELS: Record<string, string> = {
  User: "Entered",
  Default: "Starting Value",
  Derived: "Calculated",
};

const OVERRIDE_DEFAULT: OverrideDraft = {
  type: "Standard Note",
  section: "improvementAssumptions",
  field: "",
  previousValue: "",
  newValue: "",
  reason: "",
};

const DEFAULT_TEST_DATASET_ID = TEST_DATASETS[0]?.id ?? "";
const SAMPLE_SESSION_CONTACT: LeadCaptureFormInput = {
  firstName: "Sample",
  lastName: "Reviewer",
  workEmail: "sample.session@yokogawa-demo.com",
  company: "Yokogawa Demo",
  jobTitle: "Solutions Lead",
  countryRegion: "United States",
  consentToContact: true,
};

const SURFACE_CARD =
  "border border-black/15 bg-[#fbf8ef] shadow-[0_16px_32px_rgba(32,28,23,0.08)]";
const SOFT_PANEL = "rounded-[2rem] border border-black/12 bg-[#f2eee2]";
const INPUT_SURFACE =
  "border-black/12 bg-[#fbf8ef] text-[#1f1c17] placeholder:text-[#8c8579]";
const OUTLINE_BUTTON =
  "border-black/15 bg-[#fbf8ef] text-[#1f1c17] hover:bg-[#efe9db]";
const PRIMARY_BUTTON = "bg-[#1f1c17] text-white hover:bg-[#35312c]";
const ACCENT_BUTTON = "bg-[#005aa9] text-white hover:bg-[#00498a]";
const BRAND_BADGE = "w-fit rounded-full border border-black/10 bg-[#ece7d8] text-[#6e6559]";

const buildSampleLeadCapture = (datasetLabel: string): LeadCaptureRecord => ({
  ...SAMPLE_SESSION_CONTACT,
  submittedAt: new Date().toISOString(),
  storageMode: "local_only",
  storageMessage: `${datasetLabel} loaded with sample contact details for review.`,
});

const getOptionLabel = (
  options: FieldDefinition["options"] | undefined,
  value: unknown,
) => {
  if (typeof value === "object" && value !== null) {
    return "";
  }

  return options?.find((option) => option.value === String(value))?.label ?? String(value ?? "");
};

const coerceTooltipNumber = (
  value: number | string | ReadonlyArray<number | string> | undefined,
) => {
  const candidate = Array.isArray(value) ? value[0] : value;
  return Number(candidate ?? 0);
};

const countErrors = (errors: FieldErrors): number =>
  Object.values(errors).reduce((sum, value) => {
    if (!value) {
      return sum;
    }

    if (typeof value === "object" && "message" in value) {
      return sum + 1;
    }

    if (typeof value === "object") {
      return sum + countErrors(value as FieldErrors);
    }

    return sum;
  }, 0);

const getNestedValue = (source: unknown, path: string) =>
  path.split(".").reduce<unknown>((accumulator, segment) => {
    if (accumulator === null || accumulator === undefined || typeof accumulator !== "object") {
      return undefined;
    }

    return (accumulator as Record<string, unknown>)[segment];
  }, source);

const getFieldError = (errors: FieldErrors<EditableModel>, path: string) => {
  const value = getNestedValue(errors, path) as { message?: string } | undefined;
  return value?.message;
};

const getGroundingRatio = (selectedScenarioId: ScenarioId, versioning: VersioningState) => {
  return Math.max(
    0.15,
    Math.min(
      1,
      0.25 +
        versioning.changedSections.length * 0.05 +
        (selectedScenarioId === "aggressive" ? 0 : 0.1),
    ),
  );
};

function ProgressRing({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const clampedValue = Math.max(0, Math.min(1, value));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clampedValue);

  return (
    <div
      className="relative flex size-24 items-center justify-center"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clampedValue * 100)}
      aria-label={label}
    >
      <svg viewBox="0 0 96 96" className="size-24 -rotate-90">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(31, 28, 23, 0.12)" strokeWidth="6" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="#1f1c17"
          strokeLinecap="round"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-heading text-2xl tracking-tight text-[#1f1c17]">
          {formatPercent(clampedValue * 100, 0)}
        </p>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#7a7267]">{label}</p>
      </div>
    </div>
  );
}

function ApplianceMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-[0.18em] text-[#7b7468]">{label}</p>
      <p className="font-heading text-[2rem] leading-none tracking-tight text-[#1f1c17]">{value}</p>
      {hint ? <p className="text-sm text-[#7b7468]">{hint}</p> : null}
    </div>
  );
}

function SectionShell({
  id,
  title,
  description,
  action,
  children,
}: {
  id: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card id={id} className={cn(SURFACE_CARD, "scroll-mt-6 rounded-[2rem]")}>
      <CardHeader>
        <div>
          <CardTitle className="font-heading text-[1.35rem] tracking-tight text-[#1f1c17]">
            {title}
          </CardTitle>
          <CardDescription className="mt-1 text-[#746b60]">{description}</CardDescription>
        </div>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function KpiCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <Card size="sm" className={cn(SOFT_PANEL, "shadow-none")}>
      <CardHeader className="gap-2">
        <CardTitle className="text-sm uppercase tracking-[0.16em] text-[#6f685d]">{title}</CardTitle>
        <CardDescription className="text-xs text-[#81796e]">{hint}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="font-heading text-2xl tracking-tight text-[#1f1c17]">{value}</div>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card size="sm" className={cn(SOFT_PANEL, "shadow-none")}>
      <CardHeader>
        <CardTitle className="font-heading text-xl tracking-tight text-[#1f1c17]">{title}</CardTitle>
        <CardDescription className="text-[#746b60]">{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function RelevanceBadge({ relevance }: { relevance: ValueChainStageView["relevance"] }) {
  const classes =
    relevance === "Core"
      ? "border-[#005aa9]/20 bg-[#e8f0f9] text-[#005aa9]"
      : relevance === "Adjacent"
        ? "border-[#b88737]/30 bg-[#f3ead7] text-[#7d5c16]"
        : "border-black/10 bg-[#ece7d8] text-[#5e564a]";

  return <Badge className={cn("rounded-full border", classes)}>{relevance}</Badge>;
}

function ShortfallSeverityBadge({
  severity,
}: {
  severity: ShortfallFinding["severity"];
}) {
  const classes =
    severity === "High"
      ? "border-[#c64f3d]/30 bg-[#f8e2de] text-[#8b2e22]"
      : severity === "Material"
        ? "border-[#b88737]/30 bg-[#f3ead7] text-[#7d5c16]"
        : "border-black/10 bg-[#ece7d8] text-[#5e564a]";

  return <Badge className={cn("rounded-full border", classes)}>{severity}</Badge>;
}

function DiagnosticFindingCard({
  finding,
  stageTitleMap,
}: {
  finding: ShortfallFinding;
  stageTitleMap: Record<string, string>;
}) {
  return (
    <Card size="sm" className={cn(SOFT_PANEL, "shadow-none")}>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="font-heading text-xl tracking-tight text-[#1f1c17]">
              {finding.title}
            </CardTitle>
            <CardDescription className="max-w-2xl text-[#746b60]">
              {finding.whyItAppears}
            </CardDescription>
          </div>
          <ShortfallSeverityBadge severity={finding.severity} />
        </div>
        <div className="flex flex-wrap gap-2">
          {finding.stageIds.map((stageId) => (
            <Badge
              key={`${finding.id}-${stageId}`}
              className="rounded-full border border-black/10 bg-[#fbf8ef] text-[#5e564a]"
            >
              {stageTitleMap[stageId] ?? stageId}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-3">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
            Evidence in Current Inputs
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-[#746b60]">
            {finding.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
            Likely Business Effect
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-[#746b60]">
            {finding.likelyImpact.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
            What to Ask Next
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-[#746b60]">
            {finding.nextQuestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function ValueChainExplorer({
  stages,
  findings,
}: {
  stages: ValueChainStageView[];
  findings: ShortfallFinding[];
}) {
  return (
    <Accordion
      multiple
      defaultValue={stages.slice(0, 4).map((stage) => stage.id)}
      className="w-full"
    >
      {stages.map((stage) => {
        const relatedFindings = findings.filter((finding) => finding.stageIds.includes(stage.id));

        return (
          <AccordionItem key={stage.id} value={stage.id} className="border-b border-black/10">
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="space-y-2 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-heading text-xl tracking-tight text-[#1f1c17]">
                    {stage.title}
                  </p>
                  <RelevanceBadge relevance={stage.relevance} />
                  <Badge className="rounded-full border border-black/10 bg-[#fbf8ef] text-[#5e564a]">
                    {stage.lifecycle}
                  </Badge>
                </div>
                <p className="max-w-4xl text-sm font-normal text-[#746b60]">
                  {stage.description}
                </p>
                {relatedFindings.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {relatedFindings.map((finding) => (
                      <Badge
                        key={`${stage.id}-${finding.id}`}
                        className="rounded-full border border-[#005aa9]/20 bg-[#e8f0f9] text-[#005aa9]"
                      >
                        {finding.title}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5">
              <div className="grid gap-4 xl:grid-cols-3">
                <div className={cn(SOFT_PANEL, "space-y-3 p-4")}>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                    Typical Unit Operations
                  </h4>
                  <ul className="space-y-2 text-sm text-[#746b60]">
                    {stage.unitOperations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className={cn(SOFT_PANEL, "space-y-3 p-4")}>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                    Common Shortfalls
                  </h4>
                  <ul className="space-y-2 text-sm text-[#746b60]">
                    {stage.commonShortfalls.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className={cn(SOFT_PANEL, "space-y-3 p-4")}>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                    Operational Signals
                  </h4>
                  <ul className="space-y-2 text-sm text-[#746b60]">
                    {stage.operationalSignals.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className={cn(SOFT_PANEL, "space-y-3 p-4")}>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                    Data to Review
                  </h4>
                  <ul className="space-y-2 text-sm text-[#746b60]">
                    {stage.dataToReview.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className={cn(SOFT_PANEL, "space-y-3 p-4")}>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                    Discovery Questions
                  </h4>
                  <ul className="space-y-2 text-sm text-[#746b60]">
                    {stage.diagnosticQuestions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className={cn(SOFT_PANEL, "space-y-3 p-4")}>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                    Digital Improvement Levers
                  </h4>
                  <ul className="space-y-2 text-sm text-[#746b60]">
                    {stage.digitalInterventions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className={cn(SOFT_PANEL, "mt-4 p-4")}>
                <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                  Applicability
                </h4>
                <p className="mt-3 text-sm leading-7 text-[#746b60]">{stage.applicability}</p>
                {relatedFindings.length > 0 ? (
                  <>
                    <Separator className="my-4 bg-black/10" />
                    <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                      Related Shortfall Signals
                    </h4>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {relatedFindings.map((finding) => (
                        <Badge
                          key={`${stage.id}-${finding.id}-footer`}
                          className="rounded-full border border-black/10 bg-[#fbf8ef] text-[#5e564a]"
                        >
                          {finding.title}
                        </Badge>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

function RiskFlagBadge({ flag }: { flag: RiskFlag }) {
  const classes =
    flag.severity === "High Risk"
      ? "border-[#c64f3d]/30 bg-[#f8e2de] text-[#8b2e22]"
      : flag.severity === "Warning"
        ? "border-[#b88737]/30 bg-[#f3ead7] text-[#7d5c16]"
        : "border-black/10 bg-[#ece7d8] text-[#5e564a]";

  return (
    <Badge className={cn("rounded-full border", classes)}>
      {flag.family}: {flag.severity}
    </Badge>
  );
}

function FieldControl({
  control,
  name,
  field,
  error,
  onTouched,
}: {
  control: ReturnType<typeof useForm<EditableModel>>["control"];
  name: string;
  field: FieldDefinition;
  error?: string;
  onTouched: () => void;
}) {
  return (
    <Controller
      control={control}
      name={name as Path<EditableModel>}
      render={({ field: controllerField }) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[#1f1c17]">{field.label}</label>
            {field.benchmarkHint ? (
              <Tooltip>
                <TooltipTrigger className="inline-flex text-[#857d71] transition hover:text-[#005aa9]">
                  <Info className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs border border-black/10 bg-[#fbf8ef] text-[#1f1c17]">
                  {field.benchmarkHint}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>

          {field.kind === "select" ? (
            <Select
              value={String(controllerField.value)}
              onValueChange={(value) => {
                controllerField.onChange(value);
                onTouched();
              }}
            >
              <SelectTrigger
                className={cn(
                  `h-10 w-full ${INPUT_SURFACE}`,
                  error ? "border-[#c64f3d]/60" : "",
                )}
              >
                <span className="truncate">{getOptionLabel(field.options, controllerField.value)}</span>
              </SelectTrigger>
              <SelectContent className="border border-black/10 bg-[#fbf8ef] text-[#1f1c17]">
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {field.kind === "switch" ? (
            <div className={cn(SOFT_PANEL, "flex h-10 items-center justify-between px-3")}>
              <span className="text-sm text-[#6f675c]">
                {controllerField.value ? "Enabled" : "Disabled"}
              </span>
              <Switch
                checked={Boolean(controllerField.value)}
                onCheckedChange={(checked) => {
                  controllerField.onChange(checked);
                  onTouched();
                }}
              />
            </div>
          ) : null}

          {field.kind === "textarea" ? (
            <Textarea
              className={cn(
                `min-h-24 ${INPUT_SURFACE}`,
                error ? "border-[#c64f3d]/60" : "",
              )}
              value={String(controllerField.value ?? "")}
              onChange={(event) => controllerField.onChange(event.target.value)}
              onBlur={() => {
                controllerField.onBlur();
                onTouched();
              }}
              placeholder={field.placeholder}
            />
          ) : null}

          {field.kind === "text" ? (
            <Input
              className={cn(
                `h-10 ${INPUT_SURFACE}`,
                error ? "border-[#c64f3d]/60" : "",
              )}
              value={String(controllerField.value ?? "")}
              onChange={(event) => controllerField.onChange(event.target.value)}
              onBlur={() => {
                controllerField.onBlur();
                onTouched();
              }}
              placeholder={field.placeholder}
            />
          ) : null}

          {field.kind === "number" ? (
            <Input
              type="number"
              className={cn(
                `h-10 ${INPUT_SURFACE}`,
                error ? "border-[#c64f3d]/60" : "",
              )}
              min={field.min}
              max={field.max}
              step={field.step}
              value={Number.isFinite(Number(controllerField.value)) ? Number(controllerField.value) : 0}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                controllerField.onChange(Number.isNaN(nextValue) ? 0 : nextValue);
              }}
              onBlur={() => {
                controllerField.onBlur();
                onTouched();
              }}
            />
          ) : null}

          {error ? <p className="text-xs text-[#a43e31]">{error}</p> : null}
          {!error && field.benchmarkHint ? (
            <p className="text-xs text-[#81796e]">{field.benchmarkHint}</p>
          ) : null}
        </div>
      )}
    />
  );
}

function AssumptionsTable({
  rows,
  currencyCode,
}: {
  rows: AssumptionRegisterRow[];
  currencyCode: string;
}) {
  return (
    <div className={SOFT_PANEL}>
      <Table>
        <TableHeader>
          <TableRow className="border-black/10">
            <TableHead>Assumption</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Scenario</TableHead>
            <TableHead>Display Value</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Value Category Impact</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 18).map((row) => (
            <TableRow key={`${row.assumption}-${row.section}-${row.scenario}`} className="border-black/10">
              <TableCell className="max-w-[14rem] whitespace-normal text-[#1f1c17]">{row.assumption}</TableCell>
              <TableCell className="text-[#71695f]">{row.section}</TableCell>
              <TableCell className="text-[#71695f]">{row.scenario}</TableCell>
              <TableCell className="text-[#1f1c17]">
                {typeof row.rawValue === "number" && row.assumption.includes("Total Investment")
                  ? formatCurrency(Number(row.rawValue), currencyCode, 0)
                  : row.displayValue}
              </TableCell>
              <TableCell>
                <Badge
                  className={cn(
                    "border",
                    row.source === "User"
                      ? "border-black/10 bg-[#ece7d8] text-[#5e564a]"
                      : row.source === "Derived"
                        ? "border-[#005aa9]/20 bg-[#e8f0f9] text-[#005aa9]"
                        : "border-black/10 bg-[#f6f1e4] text-[#6e665b]",
                  )}
                >
                  {SOURCE_LABELS[row.source] ?? row.source}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[12rem] whitespace-normal text-[#71695f]">
                {row.valueCategoryImpact}
              </TableCell>
              <TableCell className="max-w-[18rem] whitespace-normal text-[#82796d]">{row.notes}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TracePanel({ scenario }: { scenario: ScenarioResult }) {
  return (
    <div className="space-y-3">
      {scenario.formulaTrace.map((trace) => (
        <Card key={trace.id} size="sm" className={cn(SOFT_PANEL, "shadow-none")}>
          <CardHeader>
            <CardTitle className="font-heading text-xl tracking-tight text-[#1f1c17]">
              {trace.title}
            </CardTitle>
            <CardDescription className="text-[#746b60]">{trace.formula}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">Source Inputs</h4>
              <ul className="mt-2 space-y-1 text-sm text-[#1f1c17]">
                {trace.sourceInputs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">Intermediate Steps</h4>
              <ul className="mt-2 space-y-1 text-sm text-[#1f1c17]">
                {trace.intermediateSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">Category Allocation</h4>
              <p className="mt-2 text-sm text-[#1f1c17]">{trace.categoryAllocation}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">Risk Adjustments</h4>
              <ul className="mt-2 space-y-1 text-sm text-[#1f1c17]">
                {trace.riskAdjustments.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">Phasing Adjustments</h4>
              <ul className="mt-2 space-y-1 text-sm text-[#1f1c17]">
                {trace.phasingAdjustments.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">Cost Adjustments</h4>
              <ul className="mt-2 space-y-1 text-sm text-[#1f1c17]">
                {trace.costAdjustments.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">Notes</h4>
              <ul className="mt-2 space-y-1 text-sm text-[#1f1c17]">
                {trace.notes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">Watchouts</h4>
              <ul className="mt-2 space-y-1 text-sm text-[#1f1c17]">
                {trace.relatedWarnings.length > 0 ? trace.relatedWarnings.map((item) => <li key={item}>{item}</li>) : <li>No watchouts for this calculation.</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LeadCaptureGate({
  onComplete,
  onStartSampleSession,
}: {
  onComplete: (leadCapture: LeadCaptureRecord) => void;
  onStartSampleSession: (datasetId: string) => void;
}) {
  const form = useForm<LeadCaptureFormInput>({
    resolver: zodResolver(leadCaptureSchema),
    mode: "onBlur",
    defaultValues: defaultLeadCaptureInput,
  });
  const [submissionError, setSubmissionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTestDatasetId, setSelectedTestDatasetId] = useState(DEFAULT_TEST_DATASET_ID);
  const selectedTestDataset = getTestDatasetById(selectedTestDatasetId) ?? TEST_DATASETS[0];

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmissionError("");

    let storageMode: LeadCaptureRecord["storageMode"] = "local_only";
    let storageMessage =
      "Your details were saved for this browser session.";

    try {
      const response = await fetch("/api/lead-capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            storageMode?: LeadCaptureRecord["storageMode"];
            message?: string;
          }
        | null;

      if (response.ok) {
        storageMode = payload?.storageMode === "database" ? "database" : "local_only";
        storageMessage = payload?.message ?? storageMessage;
      } else {
        storageMessage =
          payload?.message ??
          "Your details were saved for this browser session.";
      }
    } catch {
      storageMessage = "Your details were saved for this browser session.";
    } finally {
      setIsSubmitting(false);
    }

    onComplete({
      ...values,
      submittedAt: new Date().toISOString(),
      storageMode,
      storageMessage,
    });
  });

  return (
    <div className="min-h-screen bg-[#f3f0e4] text-[#1f1c17]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] items-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full rounded-[2.5rem] border border-black/15 bg-[#f6f3e8] p-4 shadow-[0_18px_48px_rgba(32,28,23,0.08)] sm:p-6 lg:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-black/10 pb-4 text-sm text-[#756d61]">
            <span>Bioprocess Shortfall Explorer</span>
            <span>Access required before workspace launch</span>
          </div>

          <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,420px)]">
          <Card className={SURFACE_CARD}>
            <CardHeader className="gap-4">
              <Badge className={BRAND_BADGE}>Get Started</Badge>
              <CardTitle className="font-heading text-[3rem] leading-[0.95] tracking-tight text-[#1f1c17] sm:text-[4rem]">
                Bioprocess Shortfall & ROI Explorer
              </CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7 text-[#746b60]">
                Share your contact details to open the workspace. The full experience stays hidden
                until this step is complete.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Alert className="border-black/10 bg-[#efe9db]">
                <CircleAlert className="size-4 text-[#005aa9]" />
                <AlertTitle>Before you continue</AlertTitle>
                <AlertDescription>
                  This workspace is designed to help clients identify bioprocess shortfalls first,
                  then connect the material gaps to a directional business case. We ask for your
                  details first so follow-up can stay relevant.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-3">
                <div className={cn(SOFT_PANEL, "p-4")}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                    Unlocks
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#746b60]">
                    Full inputs, value-chain discovery, scenario views, results, exports, and
                    calculation detail.
                  </p>
                </div>
                <div className={cn(SOFT_PANEL, "p-4")}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                    Includes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#746b60]">
                    Sample data, scenario switching, export tools, and saved in-browser progress.
                  </p>
                </div>
                <div className={cn(SOFT_PANEL, "p-4")}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                    Follow-Up
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#746b60]">
                    We use your details to personalize the conversation and share next steps if
                    requested.
                  </p>
                </div>
              </div>

              <div className={cn(SOFT_PANEL, "space-y-4 p-5")}>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#1f1c17]">Testing mode</p>
                  <p className="text-sm leading-6 text-[#746b60]">
                    Need a quick review path? Start a sample session with example contact details
                    and preloaded assumptions.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Select
                    value={selectedTestDatasetId}
                    onValueChange={(value) =>
                      setSelectedTestDatasetId(value ?? DEFAULT_TEST_DATASET_ID)
                    }
                  >
                    <SelectTrigger className={cn("h-11 w-full", INPUT_SURFACE)}>
                      <span className="truncate">{selectedTestDataset?.label}</span>
                    </SelectTrigger>
                    <SelectContent className="border border-black/10 bg-[#fbf8ef] text-[#1f1c17]">
                      {TEST_DATASETS.map((dataset) => (
                        <SelectItem key={dataset.id} value={dataset.id}>
                          {dataset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    className={ACCENT_BUTTON}
                    onClick={() => onStartSampleSession(selectedTestDatasetId)}
                  >
                    Load Sample Session
                  </Button>
                </div>
                <p className="text-sm text-[#746b60]">
                  {selectedTestDataset?.description ?? "No sample data set selected."}
                </p>
              </div>

              <p className="max-w-3xl text-sm leading-7 text-[#81796e]">
                This model is estimate-based and should be validated against actual process data,
                adoption conditions, and implementation scope.
              </p>
            </CardContent>
          </Card>

          <Card className={SURFACE_CARD}>
            <CardHeader>
              <CardTitle className="font-heading text-3xl tracking-tight text-[#1f1c17]">
                Enter Your Details
              </CardTitle>
              <CardDescription className="text-[#746b60]">
                Use your work email so we can tailor the experience to your organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1f1c17]">First Name</label>
                    <Input
                      className={cn("h-11", INPUT_SURFACE)}
                      {...form.register("firstName")}
                    />
                    {form.formState.errors.firstName ? (
                      <p className="text-xs text-[#a43e31]">
                        {form.formState.errors.firstName.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1f1c17]">Last Name</label>
                    <Input
                      className={cn("h-11", INPUT_SURFACE)}
                      {...form.register("lastName")}
                    />
                    {form.formState.errors.lastName ? (
                      <p className="text-xs text-[#a43e31]">
                        {form.formState.errors.lastName.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1f1c17]">Work Email</label>
                  <Input
                    className={cn("h-11", INPUT_SURFACE)}
                    type="email"
                    {...form.register("workEmail")}
                  />
                  {form.formState.errors.workEmail ? (
                    <p className="text-xs text-[#a43e31]">
                      {form.formState.errors.workEmail.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1f1c17]">Company</label>
                  <Input
                    className={cn("h-11", INPUT_SURFACE)}
                    {...form.register("company")}
                  />
                  {form.formState.errors.company ? (
                    <p className="text-xs text-[#a43e31]">
                      {form.formState.errors.company.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1f1c17]">Job Title</label>
                    <Input
                      className={cn("h-11", INPUT_SURFACE)}
                      {...form.register("jobTitle")}
                    />
                    {form.formState.errors.jobTitle ? (
                      <p className="text-xs text-[#a43e31]">
                        {form.formState.errors.jobTitle.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1f1c17]">Country or Region</label>
                    <Input
                      className={cn("h-11", INPUT_SURFACE)}
                      {...form.register("countryRegion")}
                    />
                    {form.formState.errors.countryRegion ? (
                      <p className="text-xs text-[#a43e31]">
                        {form.formState.errors.countryRegion.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <Controller
                  control={form.control}
                  name="consentToContact"
                  render={({ field }) => (
                    <div className={cn(SOFT_PANEL, "p-4")}>
                      <label className="flex items-start gap-3">
                        <Checkbox
                          checked={Boolean(field.value)}
                          onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                          className="mt-1"
                        />
                        <span className="text-sm leading-6 text-[#746b60]">
                          I agree to be contacted about this workspace and related follow-up.
                        </span>
                      </label>
                      {form.formState.errors.consentToContact ? (
                        <p className="mt-2 text-xs text-[#a43e31]">
                          {form.formState.errors.consentToContact.message}
                        </p>
                      ) : null}
                    </div>
                  )}
                />

                {submissionError ? (
                  <p className="text-sm text-[#a43e31]">{submissionError}</p>
                ) : null}

                <Button
                  type="submit"
                  className={cn("h-11 w-full", PRIMARY_BUTTON)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Opening workspace..." : "Open Workspace"}
                </Button>
              </form>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalculatorWorkspace({
  leadCapture,
  onClearLeadCapture,
}: {
  leadCapture: LeadCaptureRecord;
  onClearLeadCapture: () => void;
}) {
  const {
    hasHydrated,
    resetKey,
    demoBackup,
    provenance,
    overrides,
    changeLog,
    versioning,
    saveModel,
    noteFieldEdit,
    copyScenario,
    addOverride,
    markCalculated,
    markExported,
    applyTestDataset,
    restoreWorkingModel,
    resetModel,
  } = useCalculatorStore(
    useShallow((state) => ({
      hasHydrated: state.hasHydrated,
      resetKey: state.resetKey,
      demoBackup: state.demoBackup,
      provenance: state.provenance,
      overrides: state.overrides,
      changeLog: state.changeLog,
      versioning: state.versioning,
      saveModel: state.saveModel,
      noteFieldEdit: state.noteFieldEdit,
      copyScenario: state.copyScenario,
      addOverride: state.addOverride,
      markCalculated: state.markCalculated,
      markExported: state.markExported,
      applyTestDataset: state.applyTestDataset,
      restoreWorkingModel: state.restoreWorkingModel,
      resetModel: state.resetModel,
    })),
  );

  const form = useForm<EditableModel>({
    resolver: zodResolver(editableModelSchema),
    mode: "onChange",
    defaultValues: useCalculatorStore.getState().model,
  });

  const [selectedScenarioId, setSelectedScenarioId] = useState<ScenarioId>(
    useCalculatorStore.getState().versioning.selectedScenarioAtLastSave,
  );
  const [selectedWorkspaceView, setSelectedWorkspaceView] = useState<WorkspaceView>("overview");
  const [selectedTestDatasetId, setSelectedTestDatasetId] = useState(DEFAULT_TEST_DATASET_ID);
  const [copyTarget, setCopyTarget] = useState<ScenarioId>("conservative");
  const [overrideDraft, setOverrideDraft] = useState<OverrideDraft>(OVERRIDE_DEFAULT);
  const [overrideMessage, setOverrideMessage] = useState("");

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    form.reset(useCalculatorStore.getState().model);
  }, [form, hasHydrated, resetKey]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    let timeoutId: number | undefined;
    const subscription = form.watch((value) => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        saveModel(value as EditableModel);
      }, 300);
    });

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, [form, hasHydrated, saveModel]);

  const watchedModel = (useWatch({
    control: form.control,
  }) ?? form.getValues()) as EditableModel;
  const deferredModel = useDeferredValue(watchedModel);
  const currentModel = deferredModel ?? watchedModel;

  const bundle = calculateAllScenarios({
    model: currentModel,
    provenance,
    overrides,
    versioning,
  });

  useEffect(() => {
    if (!bundle.visibleScenarioIds.includes(selectedScenarioId)) {
      startTransition(() => setSelectedScenarioId("expected"));
    }
  }, [bundle.visibleScenarioIds, selectedScenarioId]);

  const selectedScenario = bundle.scenarioResults[selectedScenarioId];
  const comparisonRows = getScenarioComparisonRows(bundle);
  const errorCount = countErrors(form.formState.errors);
  const groundingRatio = getGroundingRatio(selectedScenarioId, versioning);
  const selectedTestDataset = getTestDatasetById(selectedTestDatasetId) ?? TEST_DATASETS[0];
  const selectedScenarioIndex = bundle.visibleScenarioIds.indexOf(selectedScenarioId);
  const orderedValueChainStages = getOrderedValueChainStages(currentModel);
  const shortfallFindings = getLikelyShortfalls(currentModel, selectedScenarioId);
  const primaryShortfall = shortfallFindings[0];
  const valueChainStageTitleMap = Object.fromEntries(
    orderedValueChainStages.map((stage) => [stage.id, stage.title]),
  );
  const coreStageCount = orderedValueChainStages.filter((stage) => stage.relevance === "Core").length;

  const touchField = (section: SectionId, scenario: ScenarioId | "global", path: string) => {
    noteFieldEdit({ path, section, scenario });
  };

  const renderFieldGrid = (
    group: (typeof GLOBAL_FIELD_GROUPS)[number] | (typeof SCENARIO_FIELD_GROUPS)[number],
    scenarioId?: ScenarioId,
  ) => {
    const basePath =
      group.id === "organizationProfile"
        ? "organizationProfile"
        : group.id === "advancedSettings"
        ? "advancedSettings"
        : group.id === "reviewAndSignOff"
          ? "reviewAndSignOff"
          : group.id === "scenarioJustification"
              ? `scenarioJustifications.${scenarioId}`
              : `scenarios.${scenarioId}.${group.id}`;

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {group.fields.map((field) => {
          const name = `${basePath}.${field.key}`;
          return (
            <FieldControl
              key={name}
              control={form.control}
              name={name}
              field={field}
              error={getFieldError(form.formState.errors, name)}
              onTouched={() =>
                touchField(group.id, group.scenarioScoped ? scenarioId ?? "expected" : "global", name)
              }
            />
          );
        })}
      </div>
    );
  };

  const handleCopyScenario = () => {
    if (copyTarget === selectedScenarioId) {
      setOverrideMessage("Choose a different scenario before copying.");
      return;
    }

    const nextModel = copyScenario({
      from: selectedScenarioId,
      to: copyTarget,
      model: form.getValues(),
    });

    form.reset(nextModel);
    startTransition(() => setSelectedScenarioId(copyTarget));
    setOverrideMessage(`Copied ${SCENARIO_LABELS[selectedScenarioId]} into ${SCENARIO_LABELS[copyTarget]}.`);
  };

  const handleAddOverride = () => {
    if (overrideDraft.field.trim().length === 0 || overrideDraft.reason.trim().length === 0) {
      setOverrideMessage("Enter the field name and reason before saving the note.");
      return;
    }

    addOverride({
      scenario: selectedScenarioId,
      section: overrideDraft.section as SectionId,
      field: overrideDraft.field.trim(),
      type: overrideDraft.type as (typeof OVERRIDE_TYPES)[number],
      reason: overrideDraft.reason.trim(),
      previousValue: overrideDraft.previousValue.trim(),
      newValue: overrideDraft.newValue.trim(),
    });

    setOverrideDraft(OVERRIDE_DEFAULT);
    setOverrideMessage("Change note saved.");
  };

  const handleApplyTestDataset = () => {
    if (!selectedTestDataset) {
      setOverrideMessage("No sample data set is available.");
      return;
    }

    const nextModel = applyTestDataset({
      datasetLabel: selectedTestDataset.label,
      model: structuredClone(selectedTestDataset.model),
    });

    form.reset(nextModel);
    startTransition(() => setSelectedScenarioId(selectedTestDataset.preferredScenario));
    setOverrideMessage(`Loaded ${selectedTestDataset.label}.`);
  };

  const handleRestoreWorkingModel = () => {
    const restoredModel = restoreWorkingModel();

    if (!restoredModel) {
      setOverrideMessage("There are no saved inputs to restore.");
      return;
    }

    form.reset(restoredModel);
    startTransition(
      () =>
        setSelectedScenarioId(useCalculatorStore.getState().versioning.selectedScenarioAtLastSave),
    );
    setOverrideMessage("Restored your previous inputs.");
  };

  const cycleScenario = (direction: -1 | 1) => {
    if (bundle.visibleScenarioIds.length === 0) {
      return;
    }

    const nextIndex =
      (selectedScenarioIndex + direction + bundle.visibleScenarioIds.length) %
      bundle.visibleScenarioIds.length;

    startTransition(() => setSelectedScenarioId(bundle.visibleScenarioIds[nextIndex] ?? "expected"));
  };

  const handleExport = (format: "json" | "csv" | "pdf") => {
    const latestModel = form.getValues();
    const latestBundle = calculateAllScenarios({
      model: latestModel,
      provenance: useCalculatorStore.getState().provenance,
      overrides: useCalculatorStore.getState().overrides,
      versioning: useCalculatorStore.getState().versioning,
    });

    if (format === "json") {
      exportJson({
        model: latestModel,
        bundle: latestBundle,
        selectedScenarioId,
        provenance: useCalculatorStore.getState().provenance,
        overrides: useCalculatorStore.getState().overrides,
        versioning: useCalculatorStore.getState().versioning,
      });
      markExported("JSON");
      return;
    }

    if (format === "csv") {
      exportCsvBundle({
        model: latestModel,
        bundle: latestBundle,
        selectedScenarioId,
      });
      markExported("CSV");
      return;
    }

    exportPdf({
      model: latestModel,
      bundle: latestBundle,
      selectedScenarioId,
    });
    markExported("PDF");
  };

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f0e4] text-[#746b60]">
        Loading calculator...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f0e4] text-[#1f1c17]">
      <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-black/15 bg-[#f6f3e8] p-4 shadow-[0_18px_48px_rgba(32,28,23,0.08)] sm:p-6 lg:p-8">
          <div className="flex flex-col gap-2 border-b border-black/10 pb-4 text-sm text-[#746b60] sm:flex-row sm:items-center sm:justify-between">
            <span>
              Opened by {leadCapture.firstName} {leadCapture.lastName} for {leadCapture.company}
            </span>
            <span>{leadCapture.storageMessage}</span>
          </div>

          <div className="space-y-6 pt-5">
            <header className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl space-y-3">
                  <Badge className={BRAND_BADGE}>Client Diagnostic Workspace</Badge>
                  <div className="space-y-2">
                    <h1 className="font-heading text-[3.3rem] leading-[0.92] tracking-tight text-[#1f1c17] sm:text-[4.5rem]">
                      Bioprocess Shortfall Explorer
                    </h1>
                    <p className="max-w-2xl text-base leading-7 text-[#746b60]">
                      Map likely shortfalls across development, transfer, manufacturing, analytics,
                      quality, and network operations, then translate the most material gaps into a
                      directional business case.
                    </p>
                  </div>
                </div>

                <div className={cn(SOFT_PANEL, "w-full max-w-md p-4")}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#7a7267]">Session Contact</p>
                      <p className="mt-2 text-lg font-medium text-[#1f1c17]">{leadCapture.workEmail}</p>
                      <p className="mt-1 text-sm text-[#746b60]">
                        {leadCapture.jobTitle} · {leadCapture.countryRegion}
                      </p>
                    </div>
                    <Button variant="outline" className={OUTLINE_BUTTON} onClick={onClearLeadCapture}>
                      Change Contact
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-[2.25rem] border border-black/15 bg-[#fbf8ef] p-4 sm:p-5">
                <div className="grid gap-4 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="size-14 rounded-full border-black/15 bg-transparent text-[#1f1c17] hover:bg-[#efe9db]"
                      onClick={() => cycleScenario(-1)}
                      aria-label="Previous scenario"
                    >
                      <Minus className="size-5" />
                    </Button>
                    <div>
                      <p className="font-heading text-[3.5rem] leading-none tracking-tight text-[#1f1c17] sm:text-[4.75rem]">
                        {formatPercent(selectedScenario.metrics.threeYearRoi * 100, 0)}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[#7a7267]">
                        {SCENARIO_LABELS[selectedScenarioId]} 3-Year ROI
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="size-14 rounded-full border-black/15 bg-transparent text-[#1f1c17] hover:bg-[#efe9db]"
                      onClick={() => cycleScenario(1)}
                      aria-label="Next scenario"
                    >
                      <Plus className="size-5" />
                    </Button>
                  </div>

                  <div className="space-y-3 px-0 xl:px-4">
                    <p className="text-2xl leading-tight text-[#1f1c17] sm:text-[2rem]">
                      {selectedScenario.metrics.paybackPeriodMonths === null
                        ? "Payback is not yet established with the current assumptions."
                        : `Payback arrives in ${selectedScenario.metrics.paybackPeriodMonths} months.`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-[#746b60]">
                      <Badge className="rounded-full bg-[#1f1c17] px-3 py-1 text-white">
                        {CLIENT_READINESS_LABELS[selectedScenario.readinessStatus]}
                      </Badge>
                      <span>Review status: {currentModel.reviewAndSignOff.reviewStatus}</span>
                    </div>
                  </div>

                  <div className="flex justify-start xl:justify-end">
                    <ProgressRing value={groundingRatio} label="complete" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <div className={cn(SOFT_PANEL, "space-y-5 p-5")}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#7a7267]">Operations Profile</p>
                      <p className="mt-2 text-sm text-[#746b60]">Core scale indicators for the selected business case.</p>
                    </div>
                    <span className="text-sm text-[#746b60]">{currentModel.organizationProfile.organizationType}</span>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <ApplianceMetric
                      label="Programs / Year"
                      value={formatNumber(currentModel.organizationProfile.activeProgramsPerYear, 0)}
                    />
                    <ApplianceMetric
                      label="Runs / Year"
                      value={formatNumber(currentModel.organizationProfile.runsPerMonth * 12, 0)}
                    />
                    <ApplianceMetric
                      label="Users"
                      value={formatNumber(currentModel.organizationProfile.users, 0)}
                    />
                    <ApplianceMetric
                      label="Transfers / Year"
                      value={formatNumber(currentModel.organizationProfile.transferEventsPerYear, 0)}
                    />
                  </div>
                </div>

                <div className={cn(SOFT_PANEL, "space-y-5 p-5")}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#7a7267]">Likely Shortfall</p>
                      <p className="mt-2 text-sm text-[#746b60]">
                        The strongest directional bottleneck inferred from the current inputs.
                      </p>
                    </div>
                    {primaryShortfall ? (
                      <ShortfallSeverityBadge severity={primaryShortfall.severity} />
                    ) : null}
                  </div>
                  <div className="space-y-4">
                    <p className="font-heading text-[2rem] leading-tight tracking-tight text-[#1f1c17]">
                      {primaryShortfall?.title ?? "No major pressure point signaled yet"}
                    </p>
                    <p className="text-sm leading-7 text-[#746b60]">
                      {primaryShortfall?.whyItAppears ??
                        "Complete more of the input model to surface directional bottleneck signals."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(primaryShortfall?.stageIds ?? []).slice(0, 3).map((stageId) => (
                        <Badge
                          key={`primary-shortfall-${stageId}`}
                          className="rounded-full border border-black/10 bg-[#fbf8ef] text-[#5e564a]"
                        >
                          {valueChainStageTitleMap[stageId] ?? stageId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={cn(SOFT_PANEL, "space-y-5 p-5")}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#7a7267]">Value Snapshot</p>
                      <p className="mt-2 text-sm text-[#746b60]">Direct, capacity, and long-range value remain separated.</p>
                    </div>
                    <ShieldAlert className="size-4 text-[#005aa9]" />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <ApplianceMetric
                      label="Direct Value"
                      value={formatCurrency(selectedScenario.metrics.annualHardDollarValue, currentModel.advancedSettings.currencyCode, 0)}
                    />
                    <ApplianceMetric
                      label="Capacity Value"
                      value={formatCurrency(selectedScenario.metrics.annualCapacityValue, currentModel.advancedSettings.currencyCode, 0)}
                    />
                    <ApplianceMetric
                      label="Net Benefit"
                      value={formatCurrency(selectedScenario.metrics.threeYearNetBenefit, currentModel.advancedSettings.currencyCode, 0)}
                    />
                    <ApplianceMetric
                      label="Investment"
                      value={formatCurrency(selectedScenario.metrics.totalInvestment, currentModel.advancedSettings.currencyCode, 0)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div className={cn(SOFT_PANEL, "p-5")}>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#7a7267]">Scenario Lines</p>
                      <p className="mt-2 text-sm text-[#746b60]">Compare the active scenario against the other operating cases.</p>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-[1.75rem] border border-black/10 bg-[#fbf8ef]">
                    {bundle.visibleScenarioIds.map((scenarioId, index) => {
                      const row = comparisonRows[index];
                      if (!row) {
                        return null;
                      }

                      const isActive = scenarioId === selectedScenarioId;
                      return (
                        <button
                          key={scenarioId}
                          type="button"
                          onClick={() => startTransition(() => setSelectedScenarioId(scenarioId))}
                          className={cn(
                            "grid w-full gap-3 px-4 py-4 text-left transition-colors sm:grid-cols-[1.2fr_0.8fr_1fr_auto]",
                            index > 0 ? "border-t border-black/10" : "",
                            isActive ? "bg-[#1f1c17] text-white" : "hover:bg-[#f2eee2]",
                          )}
                        >
                          <span className={cn("font-semibold", isActive ? "text-white" : "text-[#1f1c17]")}>
                            {row.scenario}
                          </span>
                          <span className={cn(isActive ? "text-white/80" : "text-[#746b60]")}>
                            {formatPercent(row.threeYearRoi * 100, 0)}
                          </span>
                          <span className={cn(isActive ? "text-white/80" : "text-[#746b60]")}>
                            {CLIENT_READINESS_LABELS[row.readinessStatus]}
                          </span>
                          <span
                            className={cn(
                              "justify-self-start rounded-full px-3 py-1 text-sm sm:justify-self-end",
                              isActive ? "bg-white text-[#1f1c17]" : "bg-[#ece7d8] text-[#5e564a]",
                            )}
                          >
                            {isActive ? "Active" : "View"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className={cn(SOFT_PANEL, "space-y-4 p-5")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#7a7267]">Sample Data</p>
                        <p className="mt-2 text-sm text-[#746b60]">Load a complete example case for review or restore your working model.</p>
                      </div>
                      <FlaskConical className="size-4 text-[#005aa9]" />
                    </div>
                    <Select
                      value={selectedTestDatasetId}
                      onValueChange={(value) => setSelectedTestDatasetId(value ?? DEFAULT_TEST_DATASET_ID)}
                    >
                      <SelectTrigger className={cn("h-11 w-full", INPUT_SURFACE)}>
                        <span className="truncate">{selectedTestDataset?.label}</span>
                      </SelectTrigger>
                      <SelectContent className="border border-black/10 bg-[#fbf8ef] text-[#1f1c17]">
                        {TEST_DATASETS.map((dataset) => (
                          <SelectItem key={dataset.id} value={dataset.id}>
                            {dataset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm leading-6 text-[#746b60]">
                      {selectedTestDataset?.description ?? "No sample data set selected."}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button className={ACCENT_BUTTON} onClick={handleApplyTestDataset}>
                        Load Sample Data
                      </Button>
                      <Button
                        variant="outline"
                        className={OUTLINE_BUTTON}
                        onClick={handleRestoreWorkingModel}
                        disabled={!demoBackup}
                      >
                        Restore My Inputs
                      </Button>
                    </div>
                  </div>

                  <div className={cn(SOFT_PANEL, "space-y-4 p-5")}>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#7a7267]">Quick Actions</p>
                      <p className="mt-2 text-sm text-[#746b60]">Copy scenarios, refresh calculations, or reset the working model.</p>
                    </div>
                    <Select
                      value={copyTarget}
                      onValueChange={(value) => setCopyTarget((value ?? selectedScenarioId) as ScenarioId)}
                    >
                      <SelectTrigger className={cn("h-10 w-full", INPUT_SURFACE)}>
                        <span className="truncate">{SCENARIO_LABELS[copyTarget]}</span>
                      </SelectTrigger>
                      <SelectContent className="border border-black/10 bg-[#fbf8ef] text-[#1f1c17]">
                        {SCENARIO_IDS.map((scenarioId) => (
                          <SelectItem key={scenarioId} value={scenarioId}>
                            {SCENARIO_LABELS[scenarioId]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button variant="outline" className={OUTLINE_BUTTON} onClick={handleCopyScenario}>
                        <ArrowRightLeft className="size-4" />
                        Copy Scenario
                      </Button>
                      <Button className={PRIMARY_BUTTON} onClick={() => markCalculated(selectedScenarioId)}>
                        <Sigma className="size-4" />
                        Refresh Results
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      className={OUTLINE_BUTTON}
                      onClick={() => {
                        resetModel();
                        setOverrideMessage("Calculator reset to starting values.");
                      }}
                    >
                      <RefreshCcw className="size-4" />
                      Reset Inputs
                    </Button>
                  </div>
                </div>
              </div>

              {overrideMessage ? (
                <Alert className="border-black/10 bg-[#efe9db]">
                  <CircleAlert className="size-4 text-[#005aa9]" />
                  <AlertTitle>Update</AlertTitle>
                  <AlertDescription>{overrideMessage}</AlertDescription>
                </Alert>
              ) : null}
            </header>

            {errorCount > 0 ? (
              <Alert variant="destructive" className="border border-[#d8b6af] bg-[#f9e8e4] text-[#7c2d20]">
                <AlertTriangle className="size-4" />
                <AlertTitle>Please review highlighted fields</AlertTitle>
                <AlertDescription>
                  {errorCount} field{errorCount === 1 ? "" : "s"} need attention. Results remain
                  visible, but the scenario will show lower confidence until these issues are resolved.
                </AlertDescription>
              </Alert>
            ) : null}

            <Tabs
              value={selectedWorkspaceView}
              onValueChange={(value) => setSelectedWorkspaceView((value as WorkspaceView) ?? "overview")}
              className="gap-6"
            >
              <TabsList
                variant="line"
                className="w-full flex-wrap justify-start rounded-[2rem] border border-black/10 bg-[#fbf8ef] p-2"
              >
                {WORKSPACE_VIEWS.map((item) => (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="rounded-full px-4 py-2 data-active:bg-[#1f1c17] data-active:text-white after:hidden"
                  >
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview">
                <SectionShell
                  id="results"
                  title="Results"
                  description="See the current estimate, key drivers, review notes, and detailed calculations."
                >
                  <Tabs defaultValue="overview" className="gap-5">
                    <TabsList
                      variant="line"
                      className="w-full flex-wrap justify-start rounded-[1.5rem] border border-black/10 bg-[#f2eee2] p-2"
                    >
                      <TabsTrigger value="overview" className="rounded-full px-4 py-2 data-active:bg-[#1f1c17] data-active:text-white after:hidden">Overview</TabsTrigger>
                      <TabsTrigger value="review" className="rounded-full px-4 py-2 data-active:bg-[#1f1c17] data-active:text-white after:hidden">Review</TabsTrigger>
                      <TabsTrigger value="sensitivity" className="rounded-full px-4 py-2 data-active:bg-[#1f1c17] data-active:text-white after:hidden">Sensitivity</TabsTrigger>
                      <TabsTrigger value="details" className="rounded-full px-4 py-2 data-active:bg-[#1f1c17] data-active:text-white after:hidden">Calculation Details</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                      <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          <KpiCard
                            title="Total Investment"
                            value={formatCurrency(selectedScenario.metrics.totalInvestment, currentModel.advancedSettings.currencyCode, 0)}
                            hint="One-time investment plus three years of recurring cost."
                          />
                          <KpiCard
                            title="3-Year ROI"
                            value={formatPercent(selectedScenario.metrics.threeYearRoi * 100, 0)}
                            hint="Three-year net benefit divided by total investment."
                          />
                          <KpiCard
                            title="Payback Period"
                            value={selectedScenario.metrics.paybackPeriodMonths === null ? "N/A" : `${selectedScenario.metrics.paybackPeriodMonths} mo`}
                            hint="Interpolated to the first month cumulative net benefit crosses zero."
                          />
                          <KpiCard
                            title="NPV"
                            value={formatCurrency(selectedScenario.metrics.npv, currentModel.advancedSettings.currencyCode, 0)}
                            hint="Discounted three-year net cash flow."
                          />
                          <KpiCard
                            title="Annual Direct Value"
                            value={formatCurrency(selectedScenario.metrics.annualHardDollarValue, currentModel.advancedSettings.currencyCode, 0)}
                            hint="Directly monetized annual value."
                          />
                          <KpiCard
                            title="Annual Capacity Value"
                            value={formatCurrency(selectedScenario.metrics.annualCapacityValue, currentModel.advancedSettings.currencyCode, 0)}
                            hint="Recovered capacity held separate from direct savings."
                          />
                          <KpiCard
                            title="Annual Strategic Value"
                            value={formatCurrency(selectedScenario.metrics.annualStrategicValue, currentModel.advancedSettings.currencyCode, 0)}
                            hint="Shown only when strategic value is enabled."
                          />
                          <KpiCard
                            title="Annual Recurring Cost"
                            value={formatCurrency(selectedScenario.metrics.annualRecurringCost, currentModel.advancedSettings.currencyCode, 0)}
                            hint="Annual software plus annual support."
                          />
                          <KpiCard
                            title="3-Year Net Benefit"
                            value={formatCurrency(selectedScenario.metrics.threeYearNetBenefit, currentModel.advancedSettings.currencyCode, 0)}
                            hint="Three-year gross benefit less investment burden."
                          />
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                          <ChartCard
                            title="Annual Value Composition"
                            description="Direct savings, capacity value, and strategic value are shown separately."
                          >
                            <div className="h-72">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={getAnnualValueComposition(selectedScenario)}>
                                  <CartesianGrid stroke="#d7d0c2" strokeDasharray="3 3" />
                                  <XAxis dataKey="category" stroke="#7b7468" />
                                  <YAxis stroke="#7b7468" tickFormatter={(value) => formatNumber(value / 1000, 0)} />
                                  <RechartsTooltip
                                    formatter={(value) =>
                                      formatCurrency(coerceTooltipNumber(value), currentModel.advancedSettings.currencyCode, 0)
                                    }
                                  />
                                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                    <Cell fill={CHART_COLORS.hardDollar} />
                                    <Cell fill={CHART_COLORS.capacity} />
                                    <Cell fill={CHART_COLORS.strategic} />
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </ChartCard>

                          <ChartCard
                            title="3-Year Benefit Bridge"
                            description="Shows phased benefits, costs, and net impact across the three-year horizon."
                          >
                            <div className="h-72">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={getBridgeRows(selectedScenario)}>
                                  <CartesianGrid stroke="#d7d0c2" strokeDasharray="3 3" />
                                  <XAxis dataKey="label" stroke="#7b7468" angle={-18} textAnchor="end" height={70} />
                                  <YAxis stroke="#7b7468" tickFormatter={(value) => formatNumber(value / 1000, 0)} />
                                  <RechartsTooltip
                                    formatter={(value) =>
                                      formatCurrency(coerceTooltipNumber(value), currentModel.advancedSettings.currencyCode, 0)
                                    }
                                  />
                                  <Bar dataKey="value" fill={CHART_COLORS.warning} radius={[10, 10, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </ChartCard>

                          <ChartCard
                            title="Scenario Comparison"
                            description="Compare three-year ROI and estimate confidence across the visible scenarios."
                          >
                            <div className="h-72">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonRows}>
                                  <CartesianGrid stroke="#d7d0c2" strokeDasharray="3 3" />
                                  <XAxis dataKey="scenario" stroke="#7b7468" />
                                  <YAxis stroke="#7b7468" tickFormatter={(value) => `${value}%`} />
                                  <RechartsTooltip formatter={(value) => formatPercent(coerceTooltipNumber(value) * 100, 0)} />
                                  <Bar dataKey="threeYearRoi" fill={CHART_COLORS.hardDollar} radius={[10, 10, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <Separator className="my-4 bg-black/10" />
                            <div className="grid gap-2 text-sm text-[#746b60]">
                              {comparisonRows.map((row) => (
                                <div
                                  key={row.scenario}
                                  className="flex items-center justify-between rounded-[1.25rem] border border-black/10 bg-[#fbf8ef] px-3 py-2"
                                >
                                  <span>{row.scenario}</span>
                                  <span>{CLIENT_READINESS_LABELS[row.readinessStatus]}</span>
                                </div>
                              ))}
                            </div>
                          </ChartCard>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="review">
                      <div className="space-y-4">
                        <ChartCard
                          title="Estimate Review Panel"
                          description="Confidence level, watchouts, concentration, and recommended next steps."
                        >
                          <div className="space-y-5">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="rounded-full bg-[#1f1c17] px-3 py-1 text-white">
                                Confidence Tier: {selectedScenario.modelRisk.confidenceTier}
                              </Badge>
                              {selectedScenario.modelRisk.flagSummary.map((flag) => (
                                <RiskFlagBadge key={`${flag.family}-${flag.severity}`} flag={flag} />
                              ))}
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                              <div className={cn(SOFT_PANEL, "space-y-3 p-4")}>
                                <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                                  Risk Dimensions
                                </h4>
                                {selectedScenario.modelRisk.riskDimensions.map((dimension) => (
                                  <div key={dimension.label}>
                                    <p className="text-sm font-medium text-[#1f1c17]">{dimension.label}</p>
                                    <p className="text-sm text-[#746b60]">{dimension.value}</p>
                                  </div>
                                ))}
                              </div>
                              <div className={cn(SOFT_PANEL, "space-y-3 p-4")}>
                                <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                                  Input Coverage Summary
                                </h4>
                                <p className="text-sm text-[#746b60]">
                                  {selectedScenario.modelRisk.dataGroundingSummary}
                                </p>
                                <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                                  Value Concentration Summary
                                </h4>
                                <p className="text-sm text-[#746b60]">
                                  {selectedScenario.modelRisk.valueConcentrationSummary}
                                </p>
                              </div>
                            </div>

                            <div className={cn(SOFT_PANEL, "p-4")}>
                              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                                Recommended Actions
                              </h4>
                              <ul className="mt-3 space-y-2 text-sm text-[#746b60]">
                                {selectedScenario.modelRisk.recommendedActions.map((action) => (
                                  <li key={action}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </ChartCard>

                        <ChartCard
                          title="Narrative Summary"
                          description="Plain-language summary of the current scenario."
                        >
                          <p className="leading-7 text-[#746b60]">{selectedScenario.narrative}</p>
                        </ChartCard>
                      </div>
                    </TabsContent>

                    <TabsContent value="sensitivity">
                      <ChartCard
                        title="Sensitivity of 3-Year ROI to Key Assumptions"
                        description="Shows which assumptions have the biggest directional effect on 3-year ROI."
                      >
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={selectedScenario.sensitivity} layout="vertical" margin={{ left: 30 }}>
                              <CartesianGrid stroke="#d7d0c2" strokeDasharray="3 3" />
                              <XAxis type="number" stroke="#7b7468" tickFormatter={(value) => `${Math.round(value * 100)}%`} />
                              <YAxis dataKey="assumption" type="category" stroke="#7b7468" width={150} />
                              <RechartsTooltip formatter={(value) => formatPercent(coerceTooltipNumber(value) * 100, 0)} />
                              <Bar dataKey="roiDelta" fill={CHART_COLORS.capacity} radius={[0, 10, 10, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </ChartCard>
                    </TabsContent>

                    <TabsContent value="details">
                      <ChartCard
                        title="Calculation Details"
                        description="Detailed view of how each major result is calculated."
                      >
                        <TracePanel scenario={selectedScenario} />
                      </ChartCard>
                    </TabsContent>
                  </Tabs>
                </SectionShell>
              </TabsContent>

              <TabsContent value="value-chain">
                <SectionShell
                  id="value-chain"
                  title="Bioprocess Value Chain"
                  description="Use this view to identify where shortfalls are most likely to exist across the full bioprocess lifecycle, not just in one unit operation."
                  action={
                    <Badge className="rounded-full border border-[#005aa9]/20 bg-[#e8f0f9] text-[#005aa9]">
                      Directional diagnostic
                    </Badge>
                  }
                >
                  <div className="space-y-6">
                    <Alert className="border-black/10 bg-[#efe9db]">
                      <CircleAlert className="size-4 text-[#005aa9]" />
                      <AlertTitle>How to read this</AlertTitle>
                      <AlertDescription>
                        This layer maps the current inputs to common bioprocess bottlenecks across
                        development, scale-up, transfer, manufacturing, analytics, quality, and
                        workforce readiness. It is intentionally broad so the same frontend can
                        handle mAbs, recombinant proteins, vaccines, microbial workflows, and
                        advanced therapies.
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <KpiCard
                        title="Likely Pressure Points"
                        value={formatNumber(shortfallFindings.length, 0)}
                        hint="Directional bottleneck patterns triggered by the current inputs."
                      />
                      <KpiCard
                        title="Core Stages in Focus"
                        value={formatNumber(coreStageCount, 0)}
                        hint="Value-chain stages most aligned to the selected process type and stage."
                      />
                      <KpiCard
                        title="Selected Modality"
                        value={currentModel.organizationProfile.modality}
                        hint="Used to keep the stage explorer broad but relevant."
                      />
                      <KpiCard
                        title="Current Process Lens"
                        value={`${currentModel.organizationProfile.processStage} / ${currentModel.organizationProfile.processType}`}
                        hint="Used to prioritize which parts of the value chain appear first."
                      />
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
                      <ChartCard
                        title="Likely Shortfalls Indicated by Current Inputs"
                        description="These are not claims of root cause. They are the strongest directional pressure points suggested by the current model."
                      >
                        <div className="space-y-4">
                          {shortfallFindings.map((finding) => (
                            <DiagnosticFindingCard
                              key={finding.id}
                              finding={finding}
                              stageTitleMap={valueChainStageTitleMap}
                            />
                          ))}
                        </div>
                      </ChartCard>

                      <ChartCard
                        title="What This Frontend Now Covers"
                        description="The value-chain model is broad enough to support discovery conversations across most bioprocess operating contexts."
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className={cn(SOFT_PANEL, "space-y-3 p-4")}>
                            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                              Lifecycle Coverage
                            </h4>
                            <ul className="space-y-2 text-sm text-[#746b60]">
                              <li>Strategy, CMC planning, and stage-gate evidence</li>
                              <li>Construct, cell line, or strain development</li>
                              <li>Process development, characterization, and scale-down models</li>
                              <li>Materials, media, buffers, and single-use readiness</li>
                              <li>Upstream, harvest, downstream, formulation, and fill-finish</li>
                              <li>Analytics, QC, transfer, quality, and network operations</li>
                            </ul>
                          </div>
                          <div className={cn(SOFT_PANEL, "space-y-3 p-4")}>
                            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                              Use Cases Supported
                            </h4>
                            <ul className="space-y-2 text-sm text-[#746b60]">
                              <li>Discovery and development organizations</li>
                              <li>Clinical and commercial biologics manufacturing</li>
                              <li>CDMO and partner-transfer environments</li>
                              <li>Vaccine, viral vector, and microbial workflows</li>
                              <li>Cell and gene therapy programs with complex handoffs</li>
                              <li>Data, quality, and cross-site operating model diagnostics</li>
                            </ul>
                          </div>
                          <div className={cn(SOFT_PANEL, "space-y-3 p-4 md:col-span-2")}>
                            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7267]">
                              How to Use It with Clients
                            </h4>
                            <p className="text-sm leading-7 text-[#746b60]">
                              Start with the flagged shortfalls, then open the relevant stages
                              below. Each stage gives you the language to ask better discovery
                              questions, identify missing evidence, and connect operational pain to
                              a more defensible business case.
                            </p>
                          </div>
                        </div>
                      </ChartCard>
                    </div>

                    <ChartCard
                      title="Full Value-Chain Explorer"
                      description="This explorer is intentionally verbose so the same app can support broad discovery across many bioprocessing environments."
                    >
                      <ValueChainExplorer
                        stages={orderedValueChainStages}
                        findings={shortfallFindings}
                      />
                    </ChartCard>
                  </div>
                </SectionShell>
              </TabsContent>

              <TabsContent value="inputs">
                <SectionShell
                  id="inputs"
                  title="Inputs"
                  description={`Update organization details and the ${SCENARIO_LABELS[selectedScenarioId]} scenario assumptions.`}
                >
                  <Accordion
                    multiple
                    defaultValue={["organizationProfile", "currentState", "improvementAssumptions"]}
                    className="w-full"
                  >
                    {[...GLOBAL_FIELD_GROUPS, ...SCENARIO_FIELD_GROUPS].map((group) => {
                      const itemDescription = group.scenarioScoped
                        ? `${group.description} Applies to the ${SCENARIO_LABELS[selectedScenarioId]} scenario.`
                        : group.description;

                      return (
                        <AccordionItem key={group.id} value={group.id} className="border-b border-black/10">
                          <AccordionTrigger className="py-4 hover:no-underline">
                            <div className="space-y-1 text-left">
                              <p className="font-heading text-xl tracking-tight text-[#1f1c17]">{group.title}</p>
                              <p className="text-sm font-normal text-[#746b60]">{itemDescription}</p>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-5">
                            {renderFieldGrid(group, group.scenarioScoped ? selectedScenarioId : undefined)}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </SectionShell>
              </TabsContent>

              <TabsContent value="assumptions">
                <SectionShell
                  id="assumptions-register"
                  title="Assumptions Register"
                  description="Reference table showing each input, its source, and how it affects value."
                >
                  <ChartCard
                    title="Assumptions Register Preview"
                    description="Reference view of the current inputs, derived values, and sources."
                  >
                    <AssumptionsTable
                      rows={selectedScenario.assumptionRegister}
                      currencyCode={currentModel.advancedSettings.currencyCode}
                    />
                  </ChartCard>
                </SectionShell>
              </TabsContent>

              <TabsContent value="notes">
                <SectionShell
                  id="change-notes"
                  title="Change Notes"
                  description="Document manual adjustments so teammates can understand why values changed."
                >
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1f1c17]">Note Type</label>
                        <Select
                          value={overrideDraft.type}
                          onValueChange={(value) =>
                            setOverrideDraft((current) => ({
                              ...current,
                              type: value ?? OVERRIDE_DEFAULT.type,
                            }))
                          }
                        >
                          <SelectTrigger className={cn("h-10 w-full", INPUT_SURFACE)}>
                            <span className="truncate">{overrideDraft.type}</span>
                          </SelectTrigger>
                          <SelectContent className="border border-black/10 bg-[#fbf8ef] text-[#1f1c17]">
                            {OVERRIDE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1f1c17]">Section</label>
                        <Select
                          value={overrideDraft.section}
                          onValueChange={(value) =>
                            setOverrideDraft((current) => ({
                              ...current,
                              section: value ?? OVERRIDE_DEFAULT.section,
                            }))
                          }
                        >
                          <SelectTrigger className={cn("h-10 w-full", INPUT_SURFACE)}>
                            <span className="truncate">{getSectionLabel(overrideDraft.section as SectionId)}</span>
                          </SelectTrigger>
                          <SelectContent className="border border-black/10 bg-[#fbf8ef] text-[#1f1c17]">
                            {OVERRIDE_SECTIONS.map((section) => (
                              <SelectItem key={section} value={section}>
                                {getSectionLabel(section)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-[#1f1c17]">Field</label>
                        <Input
                          className={cn("h-10", INPUT_SURFACE)}
                          value={overrideDraft.field}
                          onChange={(event) =>
                            setOverrideDraft((current) => ({ ...current, field: event.target.value }))
                          }
                          placeholder="Example: Reduction in Campaign Duration"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1f1c17]">Previous Value</label>
                        <Input
                          className={cn("h-10", INPUT_SURFACE)}
                          value={overrideDraft.previousValue}
                          onChange={(event) =>
                            setOverrideDraft((current) => ({
                              ...current,
                              previousValue: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1f1c17]">New Value</label>
                        <Input
                          className={cn("h-10", INPUT_SURFACE)}
                          value={overrideDraft.newValue}
                          onChange={(event) =>
                            setOverrideDraft((current) => ({ ...current, newValue: event.target.value }))
                          }
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-[#1f1c17]">Reason</label>
                        <Textarea
                          className={cn("min-h-28", INPUT_SURFACE)}
                          value={overrideDraft.reason}
                          onChange={(event) =>
                            setOverrideDraft((current) => ({ ...current, reason: event.target.value }))
                          }
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Button variant="outline" className={OUTLINE_BUTTON} onClick={handleAddOverride}>
                          <CheckCircle2 className="size-4" />
                          Save Change Note
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className={cn(SOFT_PANEL, "overflow-hidden")}>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-black/10">
                              <TableHead>Timestamp</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Field</TableHead>
                              <TableHead>Reason</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {overrides.slice(0, 8).map((record) => (
                              <TableRow key={record.id} className="border-black/10">
                                <TableCell className="text-[#746b60]">{record.createdAt}</TableCell>
                                <TableCell className="text-[#1f1c17]">{record.type}</TableCell>
                                <TableCell className="text-[#746b60]">{record.field}</TableCell>
                                <TableCell className="max-w-[18rem] whitespace-normal text-[#81796e]">
                                  {record.reason}
                                </TableCell>
                              </TableRow>
                            ))}
                            {overrides.length === 0 ? (
                              <TableRow className="border-black/10">
                                <TableCell colSpan={4} className="text-[#81796e]">
                                  No change notes saved yet.
                                </TableCell>
                              </TableRow>
                            ) : null}
                          </TableBody>
                        </Table>
                      </div>

                      <ChartCard
                        title="Recent Activity"
                        description="Latest saves, recalculations, exports, and sample-data actions."
                      >
                        <div className="space-y-3">
                          {changeLog.slice(0, 6).map((entry) => (
                            <div key={entry.id} className={cn(SOFT_PANEL, "p-3")}>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-[#1f1c17]">{entry.action}</p>
                                <span className="text-xs text-[#81796e]">{entry.timestamp}</span>
                              </div>
                              <p className="mt-2 text-sm text-[#746b60]">{entry.detail}</p>
                            </div>
                          ))}
                        </div>
                      </ChartCard>
                    </div>
                  </div>
                </SectionShell>
              </TabsContent>

              <TabsContent value="export">
                <SectionShell
                  id="export"
                  title="Export"
                  description="Download JSON, CSV, or PDF versions of the current calculator view."
                >
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Button className={PRIMARY_BUTTON} onClick={() => handleExport("json")}>
                          <Download className="size-4" />
                          Export JSON
                        </Button>
                        <Button variant="outline" className={OUTLINE_BUTTON} onClick={() => handleExport("csv")}>
                          <Download className="size-4" />
                          Export CSV
                        </Button>
                        <Button variant="outline" className={OUTLINE_BUTTON} onClick={() => handleExport("pdf")}>
                          <Download className="size-4" />
                          Export PDF
                        </Button>
                      </div>
                      <Alert className="border-black/10 bg-[#efe9db]">
                        <CircleAlert className="size-4 text-[#005aa9]" />
                        <AlertTitle>What exports include</AlertTitle>
                        <AlertDescription>
                          PDF exports include the summary, KPI overview, value breakdown, scenario
                          comparison, confidence view, assumptions highlights, and methodology notes.
                          CSV and JSON keep the same structured output for easier sharing.
                        </AlertDescription>
                      </Alert>
                    </div>
                    <Card size="sm" className={cn(SOFT_PANEL, "shadow-none")}>
                      <CardHeader>
                        <CardTitle className="font-heading text-xl tracking-tight text-[#1f1c17]">
                          Export Activity
                        </CardTitle>
                        <CardDescription className="text-[#746b60]">
                          Current session details and download counts.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-[#746b60]">
                        <p>Session ID: {versioning.modelId}</p>
                        <p>Version: {versioning.modelRevision}</p>
                        <p>Saves: {versioning.saveCount}</p>
                        <p>Exports: {versioning.exportCount}</p>
                        <p>Last Refresh: {versioning.modelLastCalculatedAt || "Not yet recorded"}</p>
                        <p>Last Export: {versioning.modelLastExportedAt || "Not yet recorded"}</p>
                      </CardContent>
                    </Card>
                  </div>
                </SectionShell>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CalculatorApp() {
  const { hasHydrated, leadCapture, completeLeadCapture, clearLeadCapture, applyTestDataset } = useCalculatorStore(
    useShallow((state) => ({
      hasHydrated: state.hasHydrated,
      leadCapture: state.leadCapture,
      completeLeadCapture: state.completeLeadCapture,
      clearLeadCapture: state.clearLeadCapture,
      applyTestDataset: state.applyTestDataset,
    })),
  );

  const handleStartSampleSession = (datasetId: string) => {
    const dataset = getTestDatasetById(datasetId) ?? TEST_DATASETS[0];

    completeLeadCapture(buildSampleLeadCapture(dataset.label));
    applyTestDataset({
      datasetLabel: dataset.label,
      model: structuredClone(dataset.model),
    });
  };

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f0e4] text-[#746b60]">
        Loading calculator...
      </div>
    );
  }

  if (!leadCapture) {
    return (
      <LeadCaptureGate
        onComplete={completeLeadCapture}
        onStartSampleSession={handleStartSampleSession}
      />
    );
  }

  return (
    <CalculatorWorkspace
      leadCapture={leadCapture}
      onClearLeadCapture={clearLeadCapture}
    />
  );
}
