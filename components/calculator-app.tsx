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
import { exportExcel, exportJson, exportPdf } from "@/lib/exporters";
import {
  defaultLeadCaptureInput,
  editableModelSchema,
  GLOBAL_FIELD_GROUPS,
  leadCaptureSchema,
  REVIEW_APPROVAL_DISCLAIMER,
  SCENARIO_FIELD_GROUPS,
  SCENARIO_IDS,
  SCENARIO_LABELS,
  TOP_LEVEL_NAV,
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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  hardDollar: "#5aa9ff",
  capacity: "#56d0b3",
  strategic: "#d6a14d",
  muted: "#5b6b86",
  warning: "#cf7b4d",
};

const NAV_IDS: Record<(typeof TOP_LEVEL_NAV)[number], string> = {
  "Organization Profile": "organization-profile",
  "Current State": "current-state",
  "Cost Basis": "cost-basis",
  "Improvement Assumptions": "improvement-assumptions",
  "Risk & Realization": "risk-realization",
  "Advanced Settings": "advanced-settings",
  Results: "results",
  "Assumptions Register": "assumptions-register",
  Export: "export",
};

const OVERRIDE_TYPES = [
  "Routine Override",
  "Material Override",
  "Credibility-Sensitive Override",
  "Benchmark Override",
  "Post-Review Override",
] as const;

const OVERRIDE_SECTIONS = [
  "organizationProfile",
  "currentState",
  "costBasis",
  "improvementAssumptions",
  "riskAndRealization",
  "advancedSettings",
  "reviewAndSignOff",
  "scenarioJustification",
] as const;

const OVERRIDE_DEFAULT: OverrideDraft = {
  type: "Routine Override",
  section: "improvementAssumptions",
  field: "",
  previousValue: "",
  newValue: "",
  reason: "",
};

const DEFAULT_TEST_DATASET_ID = TEST_DATASETS[0]?.id ?? "";

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
    <Card id={id} className="border border-white/10 bg-card/80 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-sm">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
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
    <Card size="sm" className="border border-white/10 bg-muted/20">
      <CardHeader className="gap-2">
        <CardTitle className="text-sm text-slate-100">{title}</CardTitle>
        <CardDescription className="text-xs text-slate-400">{hint}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold tracking-tight text-slate-50">{value}</div>
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
    <Card size="sm" className="border border-white/10 bg-muted/15">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function RiskFlagBadge({ flag }: { flag: RiskFlag }) {
  const variant =
    flag.severity === "High Risk" || flag.severity === "Warning" ? "destructive" : "secondary";

  return (
    <Badge variant={variant} className="rounded-full">
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
            <label className="text-sm font-medium text-slate-100">{field.label}</label>
            {field.benchmarkHint ? (
              <Tooltip>
                <TooltipTrigger className="inline-flex text-slate-400 transition hover:text-slate-200">
                  <Info className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-slate-100 text-slate-950">
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
                  "h-10 w-full border-white/10 bg-[#0d1423] text-slate-100",
                  error ? "border-amber-500/60" : "",
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border border-white/10 bg-[#101927] text-slate-100">
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {field.kind === "switch" ? (
            <div className="flex h-10 items-center justify-between rounded-lg border border-white/10 bg-[#0d1423] px-3">
              <span className="text-sm text-slate-300">
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
                "min-h-24 border-white/10 bg-[#0d1423] text-slate-100 placeholder:text-slate-500",
                error ? "border-amber-500/60" : "",
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
                "h-10 border-white/10 bg-[#0d1423] text-slate-100 placeholder:text-slate-500",
                error ? "border-amber-500/60" : "",
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
                "h-10 border-white/10 bg-[#0d1423] text-slate-100 placeholder:text-slate-500",
                error ? "border-amber-500/60" : "",
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

          {error ? <p className="text-xs text-amber-300">{error}</p> : null}
          {!error && field.benchmarkHint ? (
            <p className="text-xs text-slate-500">{field.benchmarkHint}</p>
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
    <div className="rounded-lg border border-white/10 bg-[#0d1423]/80">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10">
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
            <TableRow key={`${row.assumption}-${row.section}-${row.scenario}`} className="border-white/10">
              <TableCell className="max-w-[14rem] whitespace-normal text-slate-100">{row.assumption}</TableCell>
              <TableCell className="text-slate-300">{row.section}</TableCell>
              <TableCell className="text-slate-300">{row.scenario}</TableCell>
              <TableCell className="text-slate-100">
                {typeof row.rawValue === "number" && row.assumption.includes("Total Investment")
                  ? formatCurrency(Number(row.rawValue), currencyCode, 0)
                  : row.displayValue}
              </TableCell>
              <TableCell>
                <Badge variant={row.source === "User" ? "secondary" : row.source === "Derived" ? "outline" : "default"}>
                  {row.source}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[12rem] whitespace-normal text-slate-300">
                {row.valueCategoryImpact}
              </TableCell>
              <TableCell className="max-w-[18rem] whitespace-normal text-slate-400">{row.notes}</TableCell>
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
        <Card key={trace.id} size="sm" className="border border-white/10 bg-muted/15">
          <CardHeader>
            <CardTitle>{trace.title}</CardTitle>
            <CardDescription>{trace.formula}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Source Inputs</h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {trace.sourceInputs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Intermediate Steps</h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {trace.intermediateSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Category Allocation</h4>
              <p className="mt-2 text-sm text-slate-200">{trace.categoryAllocation}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Risk Adjustments</h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {trace.riskAdjustments.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Phasing Adjustments</h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {trace.phasingAdjustments.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cost Adjustments</h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {trace.costAdjustments.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Notes</h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {trace.notes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Related Warnings</h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {trace.relatedWarnings.length > 0 ? trace.relatedWarnings.map((item) => <li key={item}>{item}</li>) : <li>No related warnings.</li>}
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
}: {
  onComplete: (leadCapture: LeadCaptureRecord) => void;
}) {
  const form = useForm<LeadCaptureFormInput>({
    resolver: zodResolver(leadCaptureSchema),
    mode: "onBlur",
    defaultValues: defaultLeadCaptureInput,
  });
  const [submissionError, setSubmissionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmissionError("");

    let storageMode: LeadCaptureRecord["storageMode"] = "local_only";
    let storageMessage =
      "Lead details were captured locally. Configure DATABASE_URL on Render to persist records to Postgres.";

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
          "Lead details were captured locally because the server-side lead sink is not fully configured yet.";
      }
    } catch {
      storageMessage =
        "Lead details were captured locally because the server-side lead sink could not be reached.";
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
    <div className="min-h-screen bg-[#050b14] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,102,180,0.14),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(214,161,77,0.1),_transparent_36%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,420px)]">
          <Card className="border border-white/10 bg-card/85 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-sm">
            <CardHeader>
              <Badge className="w-fit rounded-full bg-[#12345c] text-slate-100">
                Access Gate
              </Badge>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                Bioprocess Development ROI Calculator
              </CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7 text-slate-300">
                Contact capture is required before the governed calculator unlocks. The full
                application remains hidden until this information is submitted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Alert className="border-white/10 bg-[#0b1423]">
                <CircleAlert className="size-4 text-[#d6a14d]" />
                <AlertTitle>Why this gate exists</AlertTitle>
                <AlertDescription>
                  This experience is intended for structured internal business-case evaluation. Lead
                  capture lets you persist the contact record before any modeled value is shown.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-[#0d1423] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Unlocks
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Full scenario inputs, results, exports, formula trace, and model governance
                    panels.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0d1423] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Includes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Demo-data controls, scenario switching, export tools, and persisted local model
                    state.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0d1423] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Storage
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    When `DATABASE_URL` is configured, the app saves lead records to Postgres
                    through the built-in `/api/lead-capture` route.
                  </p>
                </div>
              </div>

              <p className="max-w-3xl text-sm leading-7 text-slate-400">
                This model is estimate-based and should be validated against actual process data,
                adoption conditions, and implementation scope.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-card/85">
            <CardHeader>
              <CardTitle>Enter Contact Details</CardTitle>
              <CardDescription>
                Use a work email. Personal domains are blocked so the gate captures business context
                before the calculator unlocks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-100">First Name</label>
                    <Input
                      className="h-11 border-white/10 bg-[#0d1423] text-slate-100"
                      {...form.register("firstName")}
                    />
                    {form.formState.errors.firstName ? (
                      <p className="text-xs text-amber-300">
                        {form.formState.errors.firstName.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-100">Last Name</label>
                    <Input
                      className="h-11 border-white/10 bg-[#0d1423] text-slate-100"
                      {...form.register("lastName")}
                    />
                    {form.formState.errors.lastName ? (
                      <p className="text-xs text-amber-300">
                        {form.formState.errors.lastName.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-100">Work Email</label>
                  <Input
                    className="h-11 border-white/10 bg-[#0d1423] text-slate-100"
                    type="email"
                    {...form.register("workEmail")}
                  />
                  {form.formState.errors.workEmail ? (
                    <p className="text-xs text-amber-300">
                      {form.formState.errors.workEmail.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-100">Company</label>
                  <Input
                    className="h-11 border-white/10 bg-[#0d1423] text-slate-100"
                    {...form.register("company")}
                  />
                  {form.formState.errors.company ? (
                    <p className="text-xs text-amber-300">
                      {form.formState.errors.company.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-100">Job Title</label>
                    <Input
                      className="h-11 border-white/10 bg-[#0d1423] text-slate-100"
                      {...form.register("jobTitle")}
                    />
                    {form.formState.errors.jobTitle ? (
                      <p className="text-xs text-amber-300">
                        {form.formState.errors.jobTitle.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-100">Country or Region</label>
                    <Input
                      className="h-11 border-white/10 bg-[#0d1423] text-slate-100"
                      {...form.register("countryRegion")}
                    />
                    {form.formState.errors.countryRegion ? (
                      <p className="text-xs text-amber-300">
                        {form.formState.errors.countryRegion.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <Controller
                  control={form.control}
                  name="consentToContact"
                  render={({ field }) => (
                    <div className="rounded-xl border border-white/10 bg-[#0d1423] p-4">
                      <label className="flex items-start gap-3">
                        <Checkbox
                          checked={Boolean(field.value)}
                          onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                          className="mt-1"
                        />
                        <span className="text-sm leading-6 text-slate-300">
                          I consent to being contacted about this calculator and acknowledge that my
                          details may be stored for internal follow-up.
                        </span>
                      </label>
                      {form.formState.errors.consentToContact ? (
                        <p className="mt-2 text-xs text-amber-300">
                          {form.formState.errors.consentToContact.message}
                        </p>
                      ) : null}
                    </div>
                  )}
                />

                {submissionError ? (
                  <p className="text-sm text-amber-300">{submissionError}</p>
                ) : null}

                <Button
                  type="submit"
                  className="h-11 w-full bg-[#1f4f88] text-white hover:bg-[#255d9d]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Unlocking calculator..." : "Unlock Calculator"}
                </Button>
              </form>
            </CardContent>
          </Card>
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

  const touchField = (section: SectionId, scenario: ScenarioId | "global", path: string) => {
    noteFieldEdit({ path, section, scenario });
  };

  const renderFieldGroup = (
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

    const anchorBase =
      group.id === "organizationProfile"
        ? NAV_IDS["Organization Profile"]
        : group.id === "advancedSettings"
          ? NAV_IDS["Advanced Settings"]
          : group.id === "currentState"
            ? NAV_IDS["Current State"]
            : group.id === "costBasis"
              ? NAV_IDS["Cost Basis"]
              : group.id === "improvementAssumptions"
                ? NAV_IDS["Improvement Assumptions"]
                : group.id === "riskAndRealization"
                  ? NAV_IDS["Risk & Realization"]
                  : `${group.id}-${scenarioId ?? "global"}`;

    return (
      <SectionShell
        key={`${group.id}-${scenarioId ?? "global"}`}
        id={anchorBase}
        title={group.title}
        description={group.description}
      >
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
      </SectionShell>
    );
  };

  const handleCopyScenario = () => {
    if (copyTarget === selectedScenarioId) {
      setOverrideMessage("Choose a different target scenario before copying.");
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
      setOverrideMessage("Override field and reason are required.");
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
    setOverrideMessage("Override recorded in the change log.");
  };

  const handleApplyTestDataset = () => {
    if (!selectedTestDataset) {
      setOverrideMessage("No test dataset is available.");
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
      setOverrideMessage("No working-model backup is available.");
      return;
    }

    form.reset(restoredModel);
    startTransition(
      () =>
        setSelectedScenarioId(useCalculatorStore.getState().versioning.selectedScenarioAtLastSave),
    );
    setOverrideMessage("Restored the pre-demo working model.");
  };

  const handleExport = (format: "json" | "excel" | "pdf") => {
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

    if (format === "excel") {
      exportExcel({
        model: latestModel,
        bundle: latestBundle,
        selectedScenarioId,
      });
      markExported("Excel");
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
      <div className="flex min-h-screen items-center justify-center bg-[#050b14] text-slate-300">
        Loading governed calculator state...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,102,180,0.12),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(214,161,77,0.08),_transparent_32%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
          <Card className="border border-white/10 bg-card/85 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-sm">
            <CardHeader>
              <div className="space-y-3">
                <Badge className="w-fit rounded-full bg-[#12345c] text-slate-100">
                  Governed decision-support model
                </Badge>
                <CardTitle className="text-3xl font-semibold tracking-tight">
                  Bioprocess Development ROI Calculator
                </CardTitle>
                <CardDescription className="max-w-4xl text-base leading-7 text-slate-300">
                  A structured business-case tool for estimating the economic impact of digital
                  orchestration in pharmaceutical bioprocess development.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-white/10 bg-[#0b1423]">
                <CircleAlert className="size-4 text-[#d6a14d]" />
                <AlertTitle>Landing Disclaimer</AlertTitle>
                <AlertDescription>
                  This model is estimate-based and should be validated against actual process data,
                  adoption conditions, and implementation scope.
                </AlertDescription>
              </Alert>

              <p className="max-w-4xl text-sm leading-7 text-slate-400">
                Estimate hard-dollar savings, redeployed capacity, and strategic value across
                development workflows, using transparent assumptions and scenario-based modeling.
                Strategic value stays separate by default, cycle-time acceleration is risk-adjusted,
                and decision-lag reduction is tracked without independent monetization in version 1.
              </p>

              <div className="flex flex-wrap gap-2">
                {TOP_LEVEL_NAV.map((item) => (
                  <a
                    key={item}
                    href={`#${NAV_IDS[item]}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "rounded-full border-white/10 bg-[#0d1423] text-slate-200 hover:bg-[#12203a]",
                    )}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="border border-white/10 bg-card/85">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-[#d6a14d]" />
                  Model Readiness Status
                </CardTitle>
                <CardDescription>
                  Conservative readiness is separate from mathematical calculability.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Badge className="rounded-full bg-[#12345c] px-3 py-1 text-sm text-slate-100">
                  {selectedScenario.readinessStatus}
                </Badge>
                <div className="space-y-2 text-sm text-slate-300">
                  <p>Confidence Tier: {selectedScenario.modelRisk.confidenceTier}</p>
                  <p>Review Status: {currentModel.reviewAndSignOff.reviewStatus}</p>
                  <p>Changed Sections: {versioning.changedSections.join(", ")}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-card/85">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="size-4 text-[#5aa9ff]" />
                  Scenario and Test Data Controls
                </CardTitle>
                <CardDescription>
                  Scenario isolation, demo dataset loading, restore behavior, and explicit
                  calculation events.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-white/10 bg-[#0d1423] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        Access unlocked for {leadCapture.workEmail}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Clear the captured lead if you need to re-run the gate for another contact.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-white/10 bg-transparent text-slate-100 hover:bg-[#12203a]"
                      onClick={onClearLeadCapture}
                    >
                      Clear Gate
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#0d1423] p-4">
                  <p className="text-sm font-medium text-slate-100">Run Test Data</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Load an illustrative demo dataset without having to key in all assumptions
                    manually. A backup of the working model is kept until you restore it.
                  </p>
                  <div className="mt-3 grid gap-3">
                    <Select
                      value={selectedTestDatasetId}
                      onValueChange={(value) =>
                        setSelectedTestDatasetId(value ?? DEFAULT_TEST_DATASET_ID)
                      }
                    >
                      <SelectTrigger className="h-10 w-full border-white/10 bg-[#08111d] text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border border-white/10 bg-[#101927] text-slate-100">
                        {TEST_DATASETS.map((dataset) => (
                          <SelectItem key={dataset.id} value={dataset.id}>
                            {dataset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-400">
                      {selectedTestDataset?.description ?? "No test dataset selected."}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button
                        className="bg-[#1f4f88] text-white hover:bg-[#255d9d]"
                        onClick={handleApplyTestDataset}
                      >
                        Run Test Data
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white/10 bg-transparent text-slate-100 hover:bg-[#12203a]"
                        onClick={handleRestoreWorkingModel}
                        disabled={!demoBackup}
                      >
                        Restore Working Model
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  {bundle.visibleScenarioIds.map((scenarioId) => (
                    <Button
                      key={scenarioId}
                      variant={selectedScenarioId === scenarioId ? "default" : "outline"}
                      className={cn(
                        "justify-center",
                        selectedScenarioId === scenarioId
                          ? "bg-[#1f4f88] text-white hover:bg-[#255d9d]"
                          : "border-white/10 bg-[#0d1423] text-slate-200 hover:bg-[#12203a]",
                      )}
                      onClick={() => startTransition(() => setSelectedScenarioId(scenarioId))}
                    >
                      {SCENARIO_LABELS[scenarioId]}
                    </Button>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Select
                    value={copyTarget}
                    onValueChange={(value) =>
                      setCopyTarget((value ?? selectedScenarioId) as ScenarioId)
                    }
                  >
                    <SelectTrigger className="h-10 w-full border-white/10 bg-[#0d1423] text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border border-white/10 bg-[#101927] text-slate-100">
                      {SCENARIO_IDS.map((scenarioId) => (
                        <SelectItem key={scenarioId} value={scenarioId}>
                          {SCENARIO_LABELS[scenarioId]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="border-white/10 bg-[#0d1423] text-slate-100 hover:bg-[#12203a]"
                    onClick={handleCopyScenario}
                  >
                    <ArrowRightLeft className="size-4" />
                    Copy Scenario
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    className="bg-[#1f4f88] text-white hover:bg-[#255d9d]"
                    onClick={() => markCalculated(selectedScenarioId)}
                  >
                    <Sigma className="size-4" />
                    Calculate Now
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/10 bg-[#0d1423] text-slate-100 hover:bg-[#12203a]"
                    onClick={() => {
                      resetModel();
                      setOverrideMessage("Model reset to governed defaults.");
                    }}
                  >
                    <RefreshCcw className="size-4" />
                    Reset Model
                  </Button>
                </div>

                {overrideMessage ? (
                  <p className="text-sm text-slate-300">{overrideMessage}</p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </header>

        {errorCount > 0 ? (
          <Alert variant="destructive" className="border border-amber-500/40 bg-amber-950/30">
            <AlertTriangle className="size-4" />
            <AlertTitle>Validation attention required</AlertTitle>
            <AlertDescription>
              {errorCount} field{errorCount === 1 ? "" : "s"} currently fall outside the configured
              validation rules. Results remain visible, but readiness will stay conservative until
              these issues are resolved.
            </AlertDescription>
          </Alert>
        ) : null}

        <Alert className="border-white/10 bg-[#0b1423]">
          <CircleAlert className="size-4 text-[#5aa9ff]" />
          <AlertTitle>Lead Capture Status</AlertTitle>
          <AlertDescription>
            {leadCapture.firstName} {leadCapture.lastName} from {leadCapture.company} unlocked this
            session using {leadCapture.storageMode === "database" ? "database-backed" : "local-only"} lead
            capture. {leadCapture.storageMessage}
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
          <main className="space-y-6">
            {renderFieldGroup(GLOBAL_FIELD_GROUPS[0])}
            {renderFieldGroup(GLOBAL_FIELD_GROUPS[1])}
            {renderFieldGroup(GLOBAL_FIELD_GROUPS[2])}

            <SectionShell
              id="scenario-selector"
              title="Scenario Selector"
              description={`Editing ${SCENARIO_LABELS[selectedScenarioId]} scenario assumptions and governed outputs.`}
            >
              <div className="flex flex-wrap gap-2">
                {bundle.visibleScenarioIds.map((scenarioId) => (
                  <Button
                    key={scenarioId}
                    variant={selectedScenarioId === scenarioId ? "default" : "outline"}
                    className={cn(
                      selectedScenarioId === scenarioId
                        ? "bg-[#1f4f88] text-white hover:bg-[#255d9d]"
                        : "border-white/10 bg-[#0d1423] text-slate-100 hover:bg-[#12203a]",
                    )}
                    onClick={() => startTransition(() => setSelectedScenarioId(scenarioId))}
                  >
                    {SCENARIO_LABELS[scenarioId]}
                  </Button>
                ))}
              </div>
            </SectionShell>

            {renderFieldGroup(SCENARIO_FIELD_GROUPS[0], selectedScenarioId)}
            {renderFieldGroup(SCENARIO_FIELD_GROUPS[1], selectedScenarioId)}
            {renderFieldGroup(SCENARIO_FIELD_GROUPS[2], selectedScenarioId)}
            {renderFieldGroup(SCENARIO_FIELD_GROUPS[3], selectedScenarioId)}
            {renderFieldGroup(SCENARIO_FIELD_GROUPS[4], selectedScenarioId)}

            <SectionShell
              id={NAV_IDS.Results}
              title="Results"
              description="Category-separated KPI output, scenario comparison, sensitivity, model risk, narrative, and formula trace."
            >
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <KpiCard
                    title="Total Investment"
                    value={formatCurrency(
                      selectedScenario.metrics.totalInvestment,
                      currentModel.advancedSettings.currencyCode,
                      0,
                    )}
                    hint="One-time investment plus three years of recurring cost."
                  />
                  <KpiCard
                    title="3-Year ROI"
                    value={formatPercent(selectedScenario.metrics.threeYearRoi * 100, 0)}
                    hint="Three-year net benefit divided by total investment."
                  />
                  <KpiCard
                    title="Payback Period"
                    value={
                      selectedScenario.metrics.paybackPeriodMonths === null
                        ? "N/A"
                        : `${selectedScenario.metrics.paybackPeriodMonths} mo`
                    }
                    hint="Interpolated to the first month cumulative net benefit crosses zero."
                  />
                  <KpiCard
                    title="NPV"
                    value={formatCurrency(
                      selectedScenario.metrics.npv,
                      currentModel.advancedSettings.currencyCode,
                      0,
                    )}
                    hint="Discounted three-year net cash flow."
                  />
                  <KpiCard
                    title="Annual Hard-Dollar Value"
                    value={formatCurrency(
                      selectedScenario.metrics.annualHardDollarValue,
                      currentModel.advancedSettings.currencyCode,
                      0,
                    )}
                    hint="Directly monetized annual value."
                  />
                  <KpiCard
                    title="Annual Capacity Value"
                    value={formatCurrency(
                      selectedScenario.metrics.annualCapacityValue,
                      currentModel.advancedSettings.currencyCode,
                      0,
                    )}
                    hint="Redeployed capacity held separate from hard savings."
                  />
                  <KpiCard
                    title="Annual Strategic Value"
                    value={formatCurrency(
                      selectedScenario.metrics.annualStrategicValue,
                      currentModel.advancedSettings.currencyCode,
                      0,
                    )}
                    hint="Proxy value shown only when enabled."
                  />
                  <KpiCard
                    title="Annual Recurring Cost"
                    value={formatCurrency(
                      selectedScenario.metrics.annualRecurringCost,
                      currentModel.advancedSettings.currencyCode,
                      0,
                    )}
                    hint="Annual software plus annual support."
                  />
                  <KpiCard
                    title="3-Year Net Benefit"
                    value={formatCurrency(
                      selectedScenario.metrics.threeYearNetBenefit,
                      currentModel.advancedSettings.currencyCode,
                      0,
                    )}
                    hint="Three-year gross benefit less investment burden."
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <ChartCard
                    title="Annual Value Composition by Category"
                    description="Hard-Dollar, Capacity, and Strategic value remain visible as separate categories."
                  >
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getAnnualValueComposition(selectedScenario)}>
                          <CartesianGrid stroke="#203049" strokeDasharray="3 3" />
                          <XAxis dataKey="category" stroke="#8ba0c4" />
                          <YAxis stroke="#8ba0c4" tickFormatter={(value) => formatNumber(value / 1000, 0)} />
                          <RechartsTooltip
                            formatter={(value) =>
                              formatCurrency(
                                coerceTooltipNumber(value),
                                currentModel.advancedSettings.currencyCode,
                                0,
                              )
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
                    title="3-Year Benefit and Cost Bridge"
                    description="Bridge view of phased benefit and net benefit across the modeled horizon."
                  >
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getBridgeRows(selectedScenario)}>
                          <CartesianGrid stroke="#203049" strokeDasharray="3 3" />
                          <XAxis dataKey="label" stroke="#8ba0c4" angle={-18} textAnchor="end" height={70} />
                          <YAxis stroke="#8ba0c4" tickFormatter={(value) => formatNumber(value / 1000, 0)} />
                          <RechartsTooltip
                            formatter={(value) =>
                              formatCurrency(
                                coerceTooltipNumber(value),
                                currentModel.advancedSettings.currencyCode,
                                0,
                              )
                            }
                          />
                          <Bar dataKey="value" fill={CHART_COLORS.warning} radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>

                  <ChartCard
                    title="Scenario Comparison"
                    description="Compare three-year ROI and readiness across the visible scenarios."
                  >
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonRows}>
                          <CartesianGrid stroke="#203049" strokeDasharray="3 3" />
                          <XAxis dataKey="scenario" stroke="#8ba0c4" />
                          <YAxis stroke="#8ba0c4" tickFormatter={(value) => `${value}%`} />
                          <RechartsTooltip
                            formatter={(value) =>
                              formatPercent(coerceTooltipNumber(value) * 100, 0)
                            }
                          />
                          <Bar dataKey="threeYearRoi" fill={CHART_COLORS.hardDollar} radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <Separator className="my-4 bg-white/10" />
                    <div className="grid gap-2 text-sm text-slate-300">
                      {comparisonRows.map((row) => (
                        <div key={row.scenario} className="flex items-center justify-between rounded-md bg-[#0d1423] px-3 py-2">
                          <span>{row.scenario}</span>
                          <span>{row.readinessStatus}</span>
                        </div>
                      ))}
                    </div>
                  </ChartCard>

                  <ChartCard
                    title="Sensitivity of 3-Year ROI to Key Assumptions"
                    description="Directional impact from a modest upward shift in selected assumptions."
                  >
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={selectedScenario.sensitivity} layout="vertical" margin={{ left: 30 }}>
                          <CartesianGrid stroke="#203049" strokeDasharray="3 3" />
                          <XAxis type="number" stroke="#8ba0c4" tickFormatter={(value) => `${Math.round(value * 100)}%`} />
                          <YAxis dataKey="assumption" type="category" stroke="#8ba0c4" width={150} />
                          <RechartsTooltip
                            formatter={(value) =>
                              formatPercent(coerceTooltipNumber(value) * 100, 0)
                            }
                          />
                          <Bar dataKey="roiDelta" fill={CHART_COLORS.capacity} radius={[0, 10, 10, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>
                </div>

                <ChartCard
                  title="Model Risk Panel"
                  description="Required confidence tier, flag summary, risk dimensions, data grounding summary, value concentration summary, and recommended actions."
                >
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full bg-[#12345c] px-3 py-1 text-slate-100">
                        Confidence Tier: {selectedScenario.modelRisk.confidenceTier}
                      </Badge>
                      {selectedScenario.modelRisk.flagSummary.map((flag) => (
                        <RiskFlagBadge key={`${flag.family}-${flag.severity}`} flag={flag} />
                      ))}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-3 rounded-lg border border-white/10 bg-[#0d1423]/85 p-4">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Risk Dimensions
                        </h4>
                        {selectedScenario.modelRisk.riskDimensions.map((dimension) => (
                          <div key={dimension.label}>
                            <p className="text-sm font-medium text-slate-100">{dimension.label}</p>
                            <p className="text-sm text-slate-400">{dimension.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3 rounded-lg border border-white/10 bg-[#0d1423]/85 p-4">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Data Grounding Summary
                        </h4>
                        <p className="text-sm text-slate-300">{selectedScenario.modelRisk.dataGroundingSummary}</p>
                        <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Value Concentration Summary
                        </h4>
                        <p className="text-sm text-slate-300">{selectedScenario.modelRisk.valueConcentrationSummary}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-[#0d1423]/85 p-4">
                      <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Recommended Actions
                      </h4>
                      <ul className="mt-3 space-y-2 text-sm text-slate-300">
                        {selectedScenario.modelRisk.recommendedActions.map((action) => (
                          <li key={action}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </ChartCard>

                <ChartCard
                  title="Narrative Summary"
                  description="Narrative remains subordinate to the model and preserves uncertainty."
                >
                  <p className="leading-7 text-slate-300">{selectedScenario.narrative}</p>
                </ChartCard>

                <ChartCard
                  title="Formula Trace"
                  description="Auditable formulas, inputs, adjustments, and related warnings for major engines and KPIs."
                >
                  <TracePanel scenario={selectedScenario} />
                </ChartCard>
              </div>
            </SectionShell>

            <SectionShell
              id={NAV_IDS["Assumptions Register"]}
              title="Assumptions Register"
              description="Locked columns: Assumption, Section, Scenario, Raw Value, Display Value, Source, Value Category Impact, Notes."
            >
              <div className="space-y-4">
                <ChartCard
                  title="Assumptions Register Preview"
                  description="Preview of the register for the active scenario plus global and derived assumptions."
                >
                  <AssumptionsTable
                    rows={selectedScenario.assumptionRegister}
                    currencyCode={currentModel.advancedSettings.currencyCode}
                  />
                </ChartCard>
              </div>
            </SectionShell>

            <SectionShell
              id={NAV_IDS.Export}
              title="Export"
              description="Generate JSON, Excel, and PDF outputs in the required governed structure."
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Button
                      className="bg-[#1f4f88] text-white hover:bg-[#255d9d]"
                      onClick={() => handleExport("json")}
                    >
                      <Download className="size-4" />
                      Export JSON
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/10 bg-[#0d1423] text-slate-100 hover:bg-[#12203a]"
                      onClick={() => handleExport("excel")}
                    >
                      <Download className="size-4" />
                      Export Excel
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/10 bg-[#0d1423] text-slate-100 hover:bg-[#12203a]"
                      onClick={() => handleExport("pdf")}
                    >
                      <Download className="size-4" />
                      Export PDF
                    </Button>
                  </div>
                  <Alert className="border-white/10 bg-[#0d1423]">
                    <CircleAlert className="size-4 text-[#5aa9ff]" />
                    <AlertTitle>Export integrity rules</AlertTitle>
                    <AlertDescription>
                      PDF order is Cover Page, Executive Summary, KPI Overview, Value Composition,
                      Scenario Comparison, Model Readiness Status, Model Risk Summary, Assumptions
                      Highlights, Narrative Summary, Methodology Notes, Disclaimer. Excel and JSON
                      preserve the required sheet and root order.
                    </AlertDescription>
                  </Alert>
                </div>
                <Card size="sm" className="border border-white/10 bg-muted/15">
                  <CardHeader>
                    <CardTitle>Export Metadata</CardTitle>
                    <CardDescription>Current model lineage and export counts.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-slate-300">
                    <p>Model ID: {versioning.modelId}</p>
                    <p>Model Revision: {versioning.modelRevision}</p>
                    <p>Save Count: {versioning.saveCount}</p>
                    <p>Export Count: {versioning.exportCount}</p>
                    <p>Last Calculated: {versioning.modelLastCalculatedAt || "Not yet recorded"}</p>
                    <p>Last Exported: {versioning.modelLastExportedAt || "Not yet recorded"}</p>
                  </CardContent>
                </Card>
              </div>
            </SectionShell>

            <SectionShell
              id="override-governance"
              title="Override Governance"
              description="Routine Override, Material Override, Credibility-Sensitive Override, Benchmark Override, and Post-Review Override records remain visible in the model change log."
            >
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-100">Override Type</label>
                    <Select
                      value={overrideDraft.type}
                      onValueChange={(value) =>
                        setOverrideDraft((current) => ({
                          ...current,
                          type: value ?? OVERRIDE_DEFAULT.type,
                        }))
                      }
                    >
                      <SelectTrigger className="h-10 w-full border-white/10 bg-[#0d1423] text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border border-white/10 bg-[#101927] text-slate-100">
                        {OVERRIDE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-100">Section</label>
                    <Select
                      value={overrideDraft.section}
                      onValueChange={(value) =>
                        setOverrideDraft((current) => ({
                          ...current,
                          section: value ?? OVERRIDE_DEFAULT.section,
                        }))
                      }
                    >
                      <SelectTrigger className="h-10 w-full border-white/10 bg-[#0d1423] text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border border-white/10 bg-[#101927] text-slate-100">
                        {OVERRIDE_SECTIONS.map((section) => (
                          <SelectItem key={section} value={section}>
                            {section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-100">Field</label>
                    <Input
                      className="h-10 border-white/10 bg-[#0d1423] text-slate-100"
                      value={overrideDraft.field}
                      onChange={(event) =>
                        setOverrideDraft((current) => ({ ...current, field: event.target.value }))
                      }
                      placeholder="Example: reductionInCampaignDuration"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-100">Previous Value</label>
                    <Input
                      className="h-10 border-white/10 bg-[#0d1423] text-slate-100"
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
                    <label className="text-sm font-medium text-slate-100">New Value</label>
                    <Input
                      className="h-10 border-white/10 bg-[#0d1423] text-slate-100"
                      value={overrideDraft.newValue}
                      onChange={(event) =>
                        setOverrideDraft((current) => ({ ...current, newValue: event.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-100">Reason</label>
                    <Textarea
                      className="min-h-28 border-white/10 bg-[#0d1423] text-slate-100"
                      value={overrideDraft.reason}
                      onChange={(event) =>
                        setOverrideDraft((current) => ({ ...current, reason: event.target.value }))
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Button
                      variant="outline"
                      className="border-white/10 bg-[#0d1423] text-slate-100 hover:bg-[#12203a]"
                      onClick={handleAddOverride}
                    >
                      <CheckCircle2 className="size-4" />
                      Record Override
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#0d1423]/80">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overrides.slice(0, 8).map((record) => (
                        <TableRow key={record.id} className="border-white/10">
                          <TableCell className="text-slate-300">{record.createdAt}</TableCell>
                          <TableCell className="text-slate-100">{record.type}</TableCell>
                          <TableCell className="text-slate-300">{record.field}</TableCell>
                          <TableCell className="max-w-[18rem] whitespace-normal text-slate-400">
                            {record.reason}
                          </TableCell>
                        </TableRow>
                      ))}
                      {overrides.length === 0 ? (
                        <TableRow className="border-white/10">
                          <TableCell colSpan={4} className="text-slate-400">
                            No override records logged yet.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </SectionShell>
          </main>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
            <Card className="border border-white/10 bg-card/85">
              <CardHeader>
                <CardTitle>Quick Risk Snapshot</CardTitle>
                <CardDescription>Flag families active in the selected scenario.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedScenario.modelRisk.flagSummary.map((flag) => (
                  <div key={`${flag.family}-${flag.severity}`} className="rounded-lg border border-white/10 bg-[#0d1423] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-100">{flag.family}</p>
                      <Badge variant={flag.severity === "Info" ? "outline" : "destructive"}>
                        {flag.severity}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{flag.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-card/85">
              <CardHeader>
                <CardTitle>Model Grounding</CardTitle>
                <CardDescription>Persistence and edit-trace posture for the active scenario.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <div className="rounded-lg border border-white/10 bg-[#0d1423] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Grounding proxy
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-50">
                    {formatPercent(groundingRatio * 100, 0)}
                  </p>
                  <p className="mt-1 text-slate-400">
                    Proxy score derived from changed sections and scenario edit context.
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#0d1423] p-3">
                  <p>Selected Scenario at Last Save: {versioning.selectedScenarioAtLastSave}</p>
                  <p>Last Edited Scenario: {versioning.lastEditedScenario}</p>
                  <p>Last Edited Section: {versioning.lastEditedSection}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-card/85">
              <CardHeader>
                <CardTitle>Model Change Log</CardTitle>
                <CardDescription>Lineage, recalculation, export, and override events.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {changeLog.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-white/10 bg-[#0d1423] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-100">{entry.action}</p>
                      <span className="text-xs text-slate-500">{entry.timestamp}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{entry.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-card/85">
              <CardHeader>
                <CardTitle>Review and Sign-Off Guardrail</CardTitle>
                <CardDescription>Approval status does not certify correctness or readiness.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <p>Status: {currentModel.reviewAndSignOff.reviewStatus}</p>
                <p>Reviewer: {currentModel.reviewAndSignOff.reviewerName}</p>
                <p>Reviewed At: {currentModel.reviewAndSignOff.reviewedAt}</p>
                {currentModel.reviewAndSignOff.internalDiscussionApproval ? (
                  <Alert className="border-white/10 bg-[#0d1423]">
                    <CircleAlert className="size-4 text-[#d6a14d]" />
                    <AlertTitle>Internal discussion only</AlertTitle>
                    <AlertDescription>{REVIEW_APPROVAL_DISCLAIMER}</AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-slate-400">{REVIEW_APPROVAL_DISCLAIMER}</p>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

export function CalculatorApp() {
  const { hasHydrated, leadCapture, completeLeadCapture, clearLeadCapture } = useCalculatorStore(
    useShallow((state) => ({
      hasHydrated: state.hasHydrated,
      leadCapture: state.leadCapture,
      completeLeadCapture: state.completeLeadCapture,
      clearLeadCapture: state.clearLeadCapture,
    })),
  );

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050b14] text-slate-300">
        Loading governed calculator state...
      </div>
    );
  }

  if (!leadCapture) {
    return <LeadCaptureGate onComplete={completeLeadCapture} />;
  }

  return (
    <CalculatorWorkspace
      leadCapture={leadCapture}
      onClearLeadCapture={clearLeadCapture}
    />
  );
}
