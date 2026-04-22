"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Activity,
  CircleAlert,
  Database,
  FlaskConical,
  Gauge,
  Microscope,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  DEMO_CONFIGS,
  DEFAULT_SIMULATOR_INPUTS,
  PROCESS_TEMPLATE_MAP,
  PROCESS_TEMPLATES,
  simulateBioprocess,
  type InstrumentCategory,
  type SimulatorInputs,
} from "@/lib/bioprocess-simulator";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/calculations";
import {
  defaultLeadCaptureInput,
  leadCaptureSchema,
  type LeadCaptureFormInput,
  type LeadCaptureRecord,
} from "@/lib/model";
import { cn } from "@/lib/utils";
import { useCalculatorStore } from "@/store/use-calculator-store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SURFACE_CARD =
  "rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] shadow-[0_20px_60px_rgba(0,49,108,0.08)]";
const PANEL_CARD =
  "rounded-[24px] border border-[color:var(--border)] bg-[color:var(--panel)] shadow-[0_10px_30px_rgba(0,49,108,0.05)]";
const INSET_CARD =
  "rounded-[20px] border border-[color:var(--border)] bg-[color:var(--card)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]";
const INPUT_CLASS =
  "h-11 rounded-[16px] border-[color:var(--input)] bg-white text-[color:var(--foreground)] shadow-none placeholder:text-[color:var(--muted-foreground)]";
const PRIMARY_BUTTON =
  "h-11 rounded-[16px] bg-[color:var(--primary)] px-4 text-white hover:bg-[color:var(--primary-strong)]";
const SECONDARY_BUTTON =
  "h-11 rounded-[16px] border-[color:var(--border-strong)] bg-white text-[color:var(--foreground)] hover:bg-[color:var(--panel)]";
const YELLOW_BUTTON =
  "h-11 rounded-[16px] bg-[color:var(--brand-yellow)] px-4 text-[color:var(--brand-indigo)] hover:bg-[#f2dd00]";

const STORAGE_KEY = "bioprocess-simulator-state-v1";

const SAMPLE_LEAD: LeadCaptureFormInput = {
  firstName: "Sample",
  lastName: "Reviewer",
  workEmail: "sample.session@yokogawa-demo.com",
  company: "Yokogawa Demo",
  jobTitle: "Process Excellence Lead",
  countryRegion: "United States",
  consentToContact: true,
};

const loadInitialSimulatorInputs = (): SimulatorInputs => {
  if (typeof window === "undefined") {
    return DEFAULT_SIMULATOR_INPUTS;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return DEFAULT_SIMULATOR_INPUTS;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<SimulatorInputs>;
    return { ...DEFAULT_SIMULATOR_INPUTS, ...parsed };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_SIMULATOR_INPUTS;
  }
};

const CONTROL_SECTIONS = [
  {
    title: "Business Context",
    description: "Set the operating scale and the economic assumptions the simulator should value.",
    fields: [
      "activePrograms",
      "runsPerYear",
      "sites",
      "transferEventsPerYear",
      "blendedHourlyRate",
      "costPerFailedRun",
      "valuePerDayAcceleration",
    ] as const,
  },
  {
    title: "Instrumentation and Digital Coverage",
    description:
      "Model how much of the process is observable, contextualized, and supported by automation.",
    fields: [
      "sensorCoverage",
      "patCoverage",
      "analyzerCoverage",
      "automationCoverage",
      "historianIntegration",
      "processMaturity",
    ] as const,
  },
  {
    title: "Manual Operating Burden",
    description:
      "Model the parts of the workflow still driven by transcription, sampling, review assembly, and hand-built transfer packets.",
    fields: [
      "manualTranscriptionShare",
      "samplePullsPerDay",
      "batchReviewHours",
      "techTransferPackageHours",
      "onboardingDays",
    ] as const,
  },
] as const;

const CONTROL_COPY: Record<
  keyof SimulatorInputs,
  {
    label: string;
    description: string;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    kind: "slider" | "number";
  }
> = {
  processTemplateId: {
    label: "Process Template",
    description: "",
    kind: "number",
  },
  scaleProfileId: {
    label: "Scale Profile",
    description: "",
    kind: "number",
  },
  activePrograms: {
    label: "Active Programs",
    description: "How many programs or assets this operating model supports each year.",
    min: 1,
    max: 24,
    step: 1,
    kind: "number",
  },
  runsPerYear: {
    label: "Runs per Year",
    description: "Annual process executions across development or manufacturing.",
    min: 12,
    max: 400,
    step: 1,
    kind: "number",
  },
  sites: {
    label: "Sites",
    description: "How many sites or major partner locations must stay aligned.",
    min: 1,
    max: 8,
    step: 1,
    kind: "number",
  },
  transferEventsPerYear: {
    label: "Transfer Events / Year",
    description: "Internal or external handoffs that need a reusable evidence package.",
    min: 0,
    max: 20,
    step: 1,
    kind: "number",
  },
  blendedHourlyRate: {
    label: "Blended Hourly Rate",
    description: "Directional fully loaded rate for the operating team doing review and coordination.",
    min: 80,
    max: 260,
    step: 5,
    unit: "$/hr",
    kind: "number",
  },
  costPerFailedRun: {
    label: "Cost per Failed Run",
    description: "Directional cost of a materially lost or unusable run.",
    min: 15000,
    max: 200000,
    step: 5000,
    unit: "USD",
    kind: "number",
  },
  valuePerDayAcceleration: {
    label: "Value per Day of Acceleration",
    description: "Directional business value of compressing the cycle by one day.",
    min: 15000,
    max: 250000,
    step: 5000,
    unit: "USD",
    kind: "number",
  },
  sensorCoverage: {
    label: "Core Sensor Coverage",
    description: "How completely the process is covered by pH, DO, temperature, pressure, gas, biomass, and similar signals.",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    kind: "slider",
  },
  patCoverage: {
    label: "PAT Coverage",
    description: "How much near-real-time process understanding comes from PAT instead of delayed manual sampling.",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    kind: "slider",
  },
  analyzerCoverage: {
    label: "Analyzer Integration",
    description: "How much at-line and off-line analytical evidence is digitally connected to the process context.",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    kind: "slider",
  },
  automationCoverage: {
    label: "Automation Coverage",
    description: "How much of execution, orchestration, and review is guided digitally rather than manually coordinated.",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    kind: "slider",
  },
  historianIntegration: {
    label: "Historian / Contextualization",
    description: "How much operational, analytical, and event data is time-aligned and review-ready.",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    kind: "slider",
  },
  processMaturity: {
    label: "Process Maturity",
    description: "How mature, standardized, and evidence-backed the operating model is today.",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    kind: "slider",
  },
  manualTranscriptionShare: {
    label: "Manual Transcription Share",
    description: "Percent of the workflow still moved through spreadsheets, screenshots, or manual copy-paste.",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    kind: "slider",
  },
  samplePullsPerDay: {
    label: "Manual Sample Pulls / Day",
    description: "How often operators still need manual samples to understand process state.",
    min: 0,
    max: 16,
    step: 1,
    kind: "slider",
  },
  batchReviewHours: {
    label: "Batch Review Hours / Run",
    description: "How much time is spent assembling and reviewing evidence after each run.",
    min: 0,
    max: 32,
    step: 1,
    kind: "slider",
  },
  techTransferPackageHours: {
    label: "Transfer Package Hours",
    description: "How much effort is needed to assemble the packet required for the next site or partner.",
    min: 8,
    max: 180,
    step: 2,
    kind: "slider",
  },
  onboardingDays: {
    label: "Onboarding Days",
    description: "How long it takes a new team member to become independently effective.",
    min: 2,
    max: 30,
    step: 1,
    kind: "slider",
  },
};

function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn(SURFACE_CARD, className)}>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="font-heading text-[1.1rem] tracking-tight text-[color:var(--foreground)]">
              {title}
            </CardTitle>
            <CardDescription className="mt-1 max-w-3xl text-[color:var(--muted-foreground)]">
              {description}
            </CardDescription>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function MetricTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "accent" | "success";
}) {
  const toneClasses =
    tone === "accent"
      ? "border-[color:rgba(0,79,155,0.16)] bg-[color:rgba(0,79,155,0.06)]"
      : tone === "success"
        ? "border-[color:rgba(0,160,76,0.16)] bg-[color:rgba(0,160,76,0.06)]"
        : "border-[color:var(--border)] bg-[color:var(--panel)]";

  return (
    <div className={cn(INSET_CARD, toneClasses, "space-y-2 p-4")}>
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
        {label}
      </p>
      <p className="font-heading text-[2rem] leading-none tracking-[-0.03em] text-[color:var(--foreground)]">
        {value}
      </p>
      <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">{hint}</p>
    </div>
  );
}

function SliderField({
  label,
  description,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (next: number) => void;
}) {
  return (
    <div className={cn(INSET_CARD, "space-y-4 p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[color:var(--foreground)]">{label}</p>
          <p className="mt-1 text-sm leading-6 text-[color:var(--muted-foreground)]">
            {description}
          </p>
        </div>
        <Badge className="rounded-full bg-[color:var(--brand-indigo)] px-3 py-1 text-white">
          {formatNumber(value, 0)}
          {unit ?? ""}
        </Badge>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[color:rgba(0,79,155,0.12)] accent-[color:var(--brand-blue)]"
      />
      <div className="flex items-center justify-between text-xs text-[color:var(--muted-foreground)]">
        <span>
          {min}
          {unit ?? ""}
        </span>
        <span>
          {max}
          {unit ?? ""}
        </span>
      </div>
    </div>
  );
}

function NumberField({
  label,
  description,
  value,
  step = 1,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  onChange: (next: number) => void;
}) {
  return (
    <div className={cn(INSET_CARD, "space-y-3 p-4")}>
      <div>
        <p className="text-sm font-medium text-[color:var(--foreground)]">{label}</p>
        <p className="mt-1 text-sm leading-6 text-[color:var(--muted-foreground)]">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Input
          type="number"
          className={INPUT_CLASS}
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(event) => onChange(Number(event.target.value || 0))}
        />
        {unit ? (
          <Badge className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1 text-[color:var(--foreground)]">
            {unit}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

function MeterBar({
  label,
  value,
  tone = "blue",
}: {
  label: string;
  value: number;
  tone?: "blue" | "green";
}) {
  const colorClass =
    tone === "green" ? "bg-[color:var(--brand-green)]" : "bg-[color:var(--brand-blue)]";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
          {label}
        </p>
        <p className="text-sm text-[color:var(--muted-foreground)] tabular-nums">
          {formatPercent(value, 0)}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[color:rgba(0,79,155,0.1)]">
        <div
          className={cn("h-full rounded-full transition-[width] duration-200 ease-out", colorClass)}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function LeadGate({
  onComplete,
  onLoadDemo,
}: {
  onComplete: (record: LeadCaptureRecord) => void;
  onLoadDemo: (demoId: string) => void;
}) {
  const form = useForm<LeadCaptureFormInput>({
    resolver: zodResolver(leadCaptureSchema),
    mode: "onBlur",
    defaultValues: defaultLeadCaptureInput,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [selectedDemoId, setSelectedDemoId] = useState(DEMO_CONFIGS[0]?.id ?? "");

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmissionError("");

    let storageMode: LeadCaptureRecord["storageMode"] = "local_only";
    let storageMessage = "Your details were saved for this browser session.";

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

  const selectedDemo = DEMO_CONFIGS.find((demo) => demo.id === selectedDemoId) ?? DEMO_CONFIGS[0];

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <div className={cn(SURFACE_CARD, "overflow-hidden p-4 sm:p-6 lg:p-8")}>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.72fr)]">
            <div className="space-y-6">
              <div className={cn(PANEL_CARD, "p-6")}>
                <Badge className="rounded-full bg-[color:var(--brand-indigo)] px-3 py-1 text-white">
                  Process simulator
                </Badge>
                <h1 className="mt-4 max-w-4xl font-heading text-[3rem] leading-[0.92] tracking-[-0.05em] text-[color:var(--foreground)] sm:text-[4.75rem]">
                  Simulate the value of your bioprocess, not just the cost of your software.
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[color:var(--muted-foreground)]">
                  This workspace models bioreactors, sensors, PAT, analyzers, downstream steps,
                  batch review, transfer burden, and digital maturity so a client can adjust the
                  operating model and see where effectiveness and value move.
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <MetricTile
                    label="What It Covers"
                    value="4"
                    hint="mAb/CHO, microbial fermentation, viral vector, and cell therapy templates."
                  />
                  <MetricTile
                    label="What It Simulates"
                    value="16"
                    hint="Adjustable process, instrumentation, manual burden, and value levers."
                    tone="accent"
                  />
                  <MetricTile
                    label="Primary Outcome"
                    value="Gap"
                    hint="Find the process shortfall first, then quantify the operational and economic effect."
                    tone="success"
                  />
                </div>
              </div>

              <div className={cn(PANEL_CARD, "p-6")}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                      Demo path
                    </p>
                    <h2 className="mt-2 font-heading text-2xl tracking-tight text-[color:var(--foreground)]">
                      Load a sample operating model
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted-foreground)]">
                      Use a prebuilt configuration to review the simulator without typing every
                      business or process assumption by hand.
                    </p>
                  </div>
                  <FlaskConical className="mt-1 size-5 text-[color:var(--brand-blue)]" />
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                  <Select
                    value={selectedDemoId}
                    onValueChange={(value) => setSelectedDemoId(value ?? DEMO_CONFIGS[0]?.id ?? "")}
                  >
                    <SelectTrigger className={INPUT_CLASS}>
                      <span className="truncate">{selectedDemo?.label}</span>
                    </SelectTrigger>
                    <SelectContent className="border-[color:var(--border)] bg-white text-[color:var(--foreground)]">
                      {DEMO_CONFIGS.map((demo) => (
                        <SelectItem key={demo.id} value={demo.id}>
                          {demo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button className={YELLOW_BUTTON} onClick={() => onLoadDemo(selectedDemoId)}>
                    Load Demo Session
                  </Button>
                </div>
                <p className="mt-4 text-sm leading-6 text-[color:var(--muted-foreground)]">
                  {selectedDemo?.description}
                </p>
              </div>
            </div>

            <Card className={cn(SURFACE_CARD, "p-0")}>
              <CardHeader className="border-b border-[color:var(--border)] bg-[color:var(--panel)] px-6 py-5">
                <CardTitle className="font-heading text-[1.75rem] tracking-tight text-[color:var(--foreground)]">
                  Open the workspace
                </CardTitle>
                <CardDescription className="text-[color:var(--muted-foreground)]">
                  Save your contact details to unlock the simulator and keep the discussion tied to
                  a real operating context.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6 py-6">
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[color:var(--foreground)]">
                        First name
                      </label>
                      <Input className={INPUT_CLASS} {...form.register("firstName")} />
                      {form.formState.errors.firstName ? (
                        <p className="text-xs text-[color:var(--destructive)]">
                          {form.formState.errors.firstName.message}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[color:var(--foreground)]">
                        Last name
                      </label>
                      <Input className={INPUT_CLASS} {...form.register("lastName")} />
                      {form.formState.errors.lastName ? (
                        <p className="text-xs text-[color:var(--destructive)]">
                          {form.formState.errors.lastName.message}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[color:var(--foreground)]">
                      Work email
                    </label>
                    <Input className={INPUT_CLASS} type="email" {...form.register("workEmail")} />
                    {form.formState.errors.workEmail ? (
                      <p className="text-xs text-[color:var(--destructive)]">
                        {form.formState.errors.workEmail.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[color:var(--foreground)]">
                      Company
                    </label>
                    <Input className={INPUT_CLASS} {...form.register("company")} />
                    {form.formState.errors.company ? (
                      <p className="text-xs text-[color:var(--destructive)]">
                        {form.formState.errors.company.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[color:var(--foreground)]">
                        Job title
                      </label>
                      <Input className={INPUT_CLASS} {...form.register("jobTitle")} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[color:var(--foreground)]">
                        Country or region
                      </label>
                      <Input className={INPUT_CLASS} {...form.register("countryRegion")} />
                    </div>
                  </div>

                  <div className={cn(INSET_CARD, "flex items-start gap-3 p-4")}>
                    <Checkbox
                      checked={form.watch("consentToContact")}
                      onCheckedChange={(checked) =>
                        form.setValue("consentToContact", Boolean(checked), {
                          shouldValidate: true,
                        })
                      }
                    />
                    <div>
                      <p className="text-sm font-medium text-[color:var(--foreground)]">
                        Consent to contact
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[color:var(--muted-foreground)]">
                        I agree to be contacted about this simulator, my current operating model,
                        and possible follow-up actions.
                      </p>
                    </div>
                  </div>

                  {submissionError ? (
                    <p className="text-sm text-[color:var(--destructive)]">{submissionError}</p>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button type="submit" className={PRIMARY_BUTTON} disabled={isSubmitting}>
                      {isSubmitting ? "Opening workspace..." : "Open Workspace"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={SECONDARY_BUTTON}
                      onClick={() => onLoadDemo(selectedDemoId)}
                    >
                      Use Demo Contact
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimulatorWorkspace({
  leadCapture,
  onClearLeadCapture,
}: {
  leadCapture: LeadCaptureRecord;
  onClearLeadCapture: () => void;
}) {
  const [inputs, setInputs] = useState<SimulatorInputs>(loadInitialSimulatorInputs);
  const [selectedDemoId, setSelectedDemoId] = useState(DEMO_CONFIGS[0]?.id ?? "");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs]);

  const patchInputs = (patch: Partial<SimulatorInputs>) => {
    setInputs((current) => ({ ...current, ...patch }));
  };

  const template = PROCESS_TEMPLATE_MAP[inputs.processTemplateId];
  const scaleProfile =
    template.scaleProfiles.find((profile) => profile.id === inputs.scaleProfileId) ??
    template.scaleProfiles[0];
  const results = simulateBioprocess(inputs);

  const instrumentGroups = results.template.instruments.reduce<
    Record<InstrumentCategory, typeof results.template.instruments>
  >(
    (groups, instrument) => {
      groups[instrument.category] = [...(groups[instrument.category] ?? []), instrument];
      return groups;
    },
    {
      Bioreactors: [],
      "Core Sensors": [],
      PAT: [],
      "At-Line / Off-Line Analyzers": [],
      "Downstream Equipment": [],
      "Digital Systems": [],
    },
  );

  const applyDemo = (demoId: string) => {
    const demo = DEMO_CONFIGS.find((item) => item.id === demoId) ?? DEMO_CONFIGS[0];
    if (!demo) {
      return;
    }

    setSelectedDemoId(demo.id);
    setInputs(demo.inputs);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1520px]">
        <div className={cn(SURFACE_CARD, "overflow-hidden p-4 sm:p-6 lg:p-8")}>
          <div className="flex flex-col gap-3 border-b border-[color:var(--border)] pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                Premium simulator workspace
              </p>
              <h1 className="mt-2 font-heading text-[2.9rem] leading-[0.94] tracking-[-0.05em] text-[color:var(--foreground)] sm:text-[4.4rem]">
                Bioprocess Process Value Simulator
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[color:var(--muted-foreground)]">
                Simulate instrumentation, PAT, analyzers, manual review burden, and transfer
                discipline to see how process effectiveness and annual value move together.
              </p>
            </div>

            <div className={cn(PANEL_CARD, "w-full max-w-[420px] p-4")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                    Session contact
                  </p>
                  <p className="mt-2 text-lg font-medium text-[color:var(--foreground)]">
                    {leadCapture.firstName} {leadCapture.lastName}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                    {leadCapture.company} · {leadCapture.jobTitle}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                    {leadCapture.workEmail}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className={SECONDARY_BUTTON}
                  onClick={onClearLeadCapture}
                >
                  Change Contact
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(420px,0.85fr)]">
            <Panel
              title={template.name}
              description={template.summary}
              action={
                <Badge className="rounded-full bg-[color:var(--brand-indigo)] px-3 py-1 text-white">
                  {scaleProfile.label}
                </Badge>
              }
            >
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricTile
                    label="Process Effectiveness"
                    value={formatPercent(results.processEffectiveness, 0)}
                    hint="Composite score balancing run success, yield stability, review readiness, and transfer discipline."
                    tone="accent"
                  />
                  <MetricTile
                    label="Manual Hours / Run"
                    value={formatNumber(results.manualHoursPerRun, 1)}
                    hint="Estimated hands-on review, reporting, and coordination time."
                  />
                  <MetricTile
                    label="Decision Latency"
                    value={`${formatNumber(results.dataLatencyHours, 1)}h`}
                    hint="Estimated lag from data creation to decision-ready insight."
                  />
                  <MetricTile
                    label="Run Success"
                    value={formatPercent(results.runSuccessRate, 0)}
                    hint="Directional success rate based on observability, automation, and manual burden."
                    tone="success"
                  />
                </div>

                <div className={cn(INSET_CARD, "p-4")}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                        Process lane
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                        Each unit operation is scored live as you adjust instrumentation and manual
                        burden assumptions.
                      </p>
                    </div>
                    <Workflow className="mt-1 size-5 text-[color:var(--brand-blue)]" />
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    {results.unitOperations.map((unitOperation) => (
                      <div
                        key={unitOperation.id}
                        className={cn(
                          "rounded-[18px] border p-4",
                          unitOperation.effectivenessScore >= 80
                            ? "border-[color:rgba(0,160,76,0.16)] bg-[color:rgba(0,160,76,0.06)]"
                            : unitOperation.effectivenessScore >= 65
                              ? "border-[color:rgba(0,79,155,0.14)] bg-[color:rgba(0,79,155,0.05)]"
                              : "border-[color:rgba(255,238,0,0.45)] bg-[color:rgba(255,238,0,0.18)]",
                        )}
                      >
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                          Unit operation
                        </p>
                        <p className="mt-2 font-heading text-xl tracking-tight text-[color:var(--foreground)]">
                          {unitOperation.name}
                        </p>
                        <p className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--brand-indigo)]">
                          {formatPercent(unitOperation.effectivenessScore, 0)}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                          {unitOperation.objective}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>

            <Panel
              title="Annual Value Potential"
              description="Directional value created by lower manual burden, higher run reliability, faster decisions, and better transfer discipline."
            >
              <div className="space-y-4">
                <div className={cn(INSET_CARD, "space-y-4 p-5")}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                        Current estimate
                      </p>
                      <p className="mt-2 font-heading text-[3.25rem] leading-none tracking-[-0.05em] text-[color:var(--foreground)]">
                        {formatCurrency(results.annualValuePotential, "USD", 0)}
                      </p>
                    </div>
                    <TrendingUp className="size-8 text-[color:var(--brand-blue)]" />
                  </div>
                  <Separator className="bg-[color:var(--border)]" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <MetricTile
                      label="Recovered Hours"
                      value={formatNumber(results.annualRecoveredHours, 0)}
                      hint="Annual hours that move out of manual assembly and review work."
                    />
                    <MetricTile
                      label="Avoided Failed Runs"
                      value={formatNumber(results.avoidedFailedRuns, 1)}
                      hint="Directional improvement in successful run count."
                    />
                  </div>
                </div>

                <div className={cn(INSET_CARD, "space-y-3 p-4")}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[color:var(--foreground)]">
                      Load a different demo configuration
                    </p>
                    <Select
                      value={selectedDemoId}
                      onValueChange={(value) => setSelectedDemoId(value ?? DEMO_CONFIGS[0]?.id ?? "")}
                    >
                      <SelectTrigger className="h-10 min-w-[220px] rounded-[14px] border-[color:var(--input)] bg-white">
                        <span className="truncate">
                          {DEMO_CONFIGS.find((demo) => demo.id === selectedDemoId)?.label ??
                            DEMO_CONFIGS[0]?.label}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="border-[color:var(--border)] bg-white text-[color:var(--foreground)]">
                        {DEMO_CONFIGS.map((demo) => (
                          <SelectItem key={demo.id} value={demo.id}>
                            {demo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button className={YELLOW_BUTTON} onClick={() => applyDemo(selectedDemoId)}>
                      Load Demo
                    </Button>
                    <Button
                      variant="outline"
                      className={SECONDARY_BUTTON}
                      onClick={() => setInputs(DEFAULT_SIMULATOR_INPUTS)}
                    >
                      <RefreshCcw className="size-4" />
                      Reset Inputs
                    </Button>
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <Panel
              title="Simulator Context"
              description="Choose the process template and economic frame before tuning instrumentation and manual work."
            >
              <div className="grid gap-4">
                <div className={cn(INSET_CARD, "space-y-4 p-4")}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[color:var(--foreground)]">
                        Process template
                      </label>
                      <Select
                        value={inputs.processTemplateId}
                        onValueChange={(value) => {
                          const nextTemplate = PROCESS_TEMPLATE_MAP[value as keyof typeof PROCESS_TEMPLATE_MAP];
                          const nextScale = nextTemplate.scaleProfiles[0];
                          patchInputs({
                            processTemplateId: value as SimulatorInputs["processTemplateId"],
                            scaleProfileId: nextScale.id,
                            techTransferPackageHours: nextTemplate.base.transferPackageHours,
                          });
                        }}
                      >
                        <SelectTrigger className={INPUT_CLASS}>
                          <span className="truncate">{template.name}</span>
                        </SelectTrigger>
                        <SelectContent className="border-[color:var(--border)] bg-white text-[color:var(--foreground)]">
                          {PROCESS_TEMPLATES.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[color:var(--foreground)]">
                        Scale profile
                      </label>
                      <Select
                        value={inputs.scaleProfileId}
                        onValueChange={(value) =>
                          patchInputs({
                            scaleProfileId: value as SimulatorInputs["scaleProfileId"],
                          })
                        }
                      >
                        <SelectTrigger className={INPUT_CLASS}>
                          <span className="truncate">{scaleProfile.label}</span>
                        </SelectTrigger>
                        <SelectContent className="border-[color:var(--border)] bg-white text-[color:var(--foreground)]">
                          {template.scaleProfiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-[color:var(--border)] bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                      Why this template matters
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)]">
                      {scaleProfile.summary}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {template.coreOutcomes.map((outcome) => (
                        <Badge
                          key={outcome}
                          className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] text-[color:var(--foreground)]"
                        >
                          {outcome}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {CONTROL_SECTIONS[0].fields.map((fieldKey) => {
                    const field = CONTROL_COPY[fieldKey];
                    return (
                      <NumberField
                        key={fieldKey}
                        label={field.label}
                        description={field.description}
                        value={inputs[fieldKey] as number}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        unit={field.unit}
                        onChange={(next) => patchInputs({ [fieldKey]: next } as Partial<SimulatorInputs>)}
                      />
                    );
                  })}
                </div>
              </div>
            </Panel>

            <Panel
              title="Instrumentation Coverage"
              description="Model how observable and digitally controllable the process is today."
            >
              <div className="space-y-4">
                {CONTROL_SECTIONS[1].fields.map((fieldKey) => {
                  const field = CONTROL_COPY[fieldKey];
                  return (
                    <SliderField
                      key={fieldKey}
                      label={field.label}
                      description={field.description}
                      value={inputs[fieldKey] as number}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      unit={field.unit}
                      onChange={(next) => patchInputs({ [fieldKey]: next } as Partial<SimulatorInputs>)}
                    />
                  );
                })}
              </div>
            </Panel>

            <Panel
              title="Manual Process Burden"
              description="Model the steps still slowed by spreadsheets, sample pulls, review packet assembly, and manual handoffs."
            >
              <div className="space-y-4">
                {CONTROL_SECTIONS[2].fields.map((fieldKey) => {
                  const field = CONTROL_COPY[fieldKey];
                  return (
                    <SliderField
                      key={fieldKey}
                      label={field.label}
                      description={field.description}
                      value={inputs[fieldKey] as number}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      unit={field.unit}
                      onChange={(next) => patchInputs({ [fieldKey]: next } as Partial<SimulatorInputs>)}
                    />
                  );
                })}
              </div>
            </Panel>
          </div>

          <div className="mt-6">
            <Tabs defaultValue="process-map" className="gap-4">
              <TabsList className="h-auto w-full flex-wrap justify-start rounded-[20px] border border-[color:var(--border)] bg-[color:var(--panel)] p-2">
                <TabsTrigger
                  value="process-map"
                  className="rounded-[14px] px-4 py-2 data-active:bg-[color:var(--brand-indigo)] data-active:text-white after:hidden"
                >
                  Process Map
                </TabsTrigger>
                <TabsTrigger
                  value="instrument-stack"
                  className="rounded-[14px] px-4 py-2 data-active:bg-[color:var(--brand-indigo)] data-active:text-white after:hidden"
                >
                  Instrument Stack
                </TabsTrigger>
                <TabsTrigger
                  value="bottlenecks"
                  className="rounded-[14px] px-4 py-2 data-active:bg-[color:var(--brand-indigo)] data-active:text-white after:hidden"
                >
                  Bottlenecks
                </TabsTrigger>
                <TabsTrigger
                  value="value-model"
                  className="rounded-[14px] px-4 py-2 data-active:bg-[color:var(--brand-indigo)] data-active:text-white after:hidden"
                >
                  Value Model
                </TabsTrigger>
              </TabsList>

              <TabsContent value="process-map">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
                  <Panel
                    title="Unit Operation Performance"
                    description="Every card below updates live as instrumentation coverage and manual burden change."
                  >
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {results.unitOperations.map((unitOperation) => (
                        <div key={unitOperation.id} className={cn(PANEL_CARD, "space-y-4 p-4")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                                Effectiveness
                              </p>
                              <p className="mt-2 font-heading text-xl tracking-tight text-[color:var(--foreground)]">
                                {unitOperation.name}
                              </p>
                            </div>
                            <Badge className="rounded-full bg-[color:var(--brand-blue)] px-3 py-1 text-white">
                              {formatPercent(unitOperation.effectivenessScore, 0)}
                            </Badge>
                          </div>
                          <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
                            {unitOperation.objective}
                          </p>
                          <div className="space-y-2">
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                              Critical signals
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {unitOperation.criticalSignals.map((signal) => (
                                <Badge
                                  key={`${unitOperation.id}-${signal}`}
                                  className="rounded-full border border-[color:var(--border)] bg-white text-[color:var(--foreground)]"
                                >
                                  {signal}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
                            {unitOperation.diagnosis}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  <Panel
                    title="Live Outcome Panel"
                    description="This is the condensed operator view of what the current simulator settings imply."
                  >
                    <div className="space-y-4">
                      <div className={cn(INSET_CARD, "space-y-4 p-4")}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                              Process strength
                            </p>
                            <p className="mt-2 font-heading text-[2.35rem] tracking-[-0.04em] text-[color:var(--foreground)]">
                              {formatPercent(results.processEffectiveness, 0)}
                            </p>
                          </div>
                          <Gauge className="size-7 text-[color:var(--brand-blue)]" />
                        </div>
                        <MeterBar
                          label="Composite process effectiveness"
                          value={results.processEffectiveness}
                          tone="blue"
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <MetricTile
                          label="Yield Stability"
                          value={formatPercent(results.yieldStability, 0)}
                          hint="Directional stability of process output under the current operating design."
                        />
                        <MetricTile
                          label="Transfer Readiness"
                          value={formatPercent(results.transferReadiness, 0)}
                          hint="How reusable and transfer-ready the evidence package is likely to be."
                        />
                        <MetricTile
                          label="Quality Readiness"
                          value={formatPercent(results.qualityReadiness, 0)}
                          hint="How prepared the operation is for batch review, QA review, and release."
                        />
                        <MetricTile
                          label="Scale Bias"
                          value={scaleProfile.label}
                          hint="The simulator is currently biased toward the chosen development or manufacturing context."
                          tone="accent"
                        />
                      </div>

                      <Alert className="border-[color:var(--border)] bg-[color:var(--panel)]">
                        <CircleAlert className="size-4 text-[color:var(--brand-blue)]" />
                        <AlertTitle>Important modeling note</AlertTitle>
                        <AlertDescription>
                          This simulator is intentionally directional. It is designed to structure
                          discovery conversations, compare operating states, and identify where more
                          precise plant or development data is required.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </Panel>
                </div>
              </TabsContent>

              <TabsContent value="instrument-stack">
                <div className="grid gap-4 xl:grid-cols-3">
                  {Object.entries(instrumentGroups).map(([category, instruments]) => (
                    <Panel
                      key={category}
                      title={category}
                      description={`Instrument classes typically used in the ${template.name} workflow.`}
                      className="h-full"
                    >
                      <div className="space-y-3">
                        {instruments.map((instrument) => (
                          <div key={instrument.name} className={cn(INSET_CARD, "p-4")}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-[color:var(--foreground)]">
                                  {instrument.name}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                                  {instrument.role}
                                </p>
                              </div>
                              {category === "PAT" ? (
                                <Microscope className="mt-1 size-4 text-[color:var(--brand-blue)]" />
                              ) : category === "Digital Systems" ? (
                                <Database className="mt-1 size-4 text-[color:var(--brand-blue)]" />
                              ) : (
                                <Activity className="mt-1 size-4 text-[color:var(--brand-blue)]" />
                              )}
                            </div>
                            <Separator className="my-3 bg-[color:var(--border)]" />
                            <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
                              {instrument.impact}
                            </p>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="bottlenecks">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
                  <Panel
                    title="Top Bottleneck Signals"
                    description="The simulator ranks the largest likely shortfalls based on the current operating assumptions."
                  >
                    <div className="space-y-4">
                      {results.bottlenecks.map((bottleneck) => (
                        <div key={bottleneck.id} className={cn(PANEL_CARD, "p-4")}>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-heading text-[1.15rem] tracking-tight text-[color:var(--foreground)]">
                                {bottleneck.title}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                                {bottleneck.summary}
                              </p>
                            </div>
                            <Badge
                              className={cn(
                                "rounded-full px-3 py-1",
                                bottleneck.severity === "High"
                                  ? "bg-[color:var(--brand-indigo)] text-white"
                                  : bottleneck.severity === "Material"
                                    ? "bg-[color:var(--brand-blue)] text-white"
                                    : "bg-[color:rgba(255,238,0,0.75)] text-[color:var(--brand-indigo)]",
                              )}
                            >
                              {bottleneck.severity}
                            </Badge>
                          </div>
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className={cn(INSET_CARD, "p-4")}>
                              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                                Current indicators
                              </p>
                              <div className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                                {bottleneck.indicators.map((indicator) => (
                                  <p key={indicator}>{indicator}</p>
                                ))}
                              </div>
                            </div>
                            <div className={cn(INSET_CARD, "p-4")}>
                              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                                Improvement levers
                              </p>
                              <div className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                                {bottleneck.levers.map((lever) => (
                                  <p key={lever}>{lever}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  <Panel
                    title="Recommended Focus"
                    description="The best first move is the lever that improves both process performance and the evidence thread."
                  >
                    <div className="space-y-4">
                      <div className={cn(INSET_CARD, "space-y-4 p-4")}>
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="size-5 text-[color:var(--brand-blue)]" />
                          <p className="font-medium text-[color:var(--foreground)]">
                            First recommendation
                          </p>
                        </div>
                        <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
                          If the process still relies on manual transcription and weak historian
                          coverage, fix that first. It improves batch review, transfer, exception
                          handling, and the credibility of every later optimization.
                        </p>
                      </div>
                      <div className={cn(INSET_CARD, "space-y-4 p-4")}>
                        <div className="flex items-center gap-3">
                          <SlidersHorizontal className="size-5 text-[color:var(--brand-blue)]" />
                          <p className="font-medium text-[color:var(--foreground)]">
                            What to simulate next
                          </p>
                        </div>
                        <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
                          Increase PAT, analyzer integration, and historian coverage together, then
                          lower manual transcription and batch review hours. That combination shows
                          whether the real value story is labor, failure avoidance, acceleration, or
                          transfer.
                        </p>
                      </div>
                    </div>
                  </Panel>
                </div>
              </TabsContent>

              <TabsContent value="value-model">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.8fr)]">
                  <Panel
                    title="Value Bridge"
                    description="Each lever is shown separately so clients can see what part of the value story is operationally credible."
                  >
                    <div className="space-y-4">
                      {results.valueLevers.map((lever, index) => {
                        const relativeShare =
                          results.annualValuePotential === 0
                            ? 0
                            : (lever.annualValue / results.annualValuePotential) * 100;

                        return (
                          <div key={lever.id} className={cn(PANEL_CARD, "p-4")}>
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-medium text-[color:var(--foreground)]">
                                  {index + 1}. {lever.label}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                                  {lever.explanation}
                                </p>
                              </div>
                              <p className="font-heading text-[1.6rem] tracking-tight text-[color:var(--brand-indigo)]">
                                {formatCurrency(lever.annualValue, "USD", 0)}
                              </p>
                            </div>
                            <div className="mt-4">
                              <MeterBar
                                label="Share of annual value potential"
                                value={relativeShare}
                                tone="green"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Panel>

                  <Panel
                    title="Model Inputs Driving Value"
                    description="This view explains what the simulator is actually doing so the client understands the tradeoff, not just the output."
                  >
                    <div className="space-y-4">
                      <div className={cn(INSET_CARD, "p-4")}>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                          How value is built
                        </p>
                        <div className="mt-3 space-y-2 text-sm leading-7 text-[color:var(--muted-foreground)]">
                          <p>
                            1. Instrumentation and digital coverage improve process visibility,
                            review readiness, and unit-operation effectiveness.
                          </p>
                          <p>
                            2. Manual transcription, sample burden, batch review, and transfer
                            assembly drag the system back down.
                          </p>
                          <p>
                            3. The model converts the resulting changes in run success, review
                            effort, decision lag, and transfer readiness into directional value
                            levers.
                          </p>
                        </div>
                      </div>
                      <div className={cn(INSET_CARD, "p-4")}>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                          Why this is useful in client conversations
                        </p>
                        <p className="mt-3 text-sm leading-7 text-[color:var(--muted-foreground)]">
                          It keeps the conversation grounded in the operating model. Instead of
                          debating a software line item, the client can test whether better sensors,
                          better PAT, more analyzer integration, lower manual transcription, or a
                          stronger digital evidence thread actually move the process in a meaningful
                          way.
                        </p>
                      </div>
                    </div>
                  </Panel>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BioprocessSimulatorApp() {
  const { hasHydrated, leadCapture, completeLeadCapture, clearLeadCapture } = useCalculatorStore(
    useShallow((state) => ({
      hasHydrated: state.hasHydrated,
      leadCapture: state.leadCapture,
      completeLeadCapture: state.completeLeadCapture,
      clearLeadCapture: state.clearLeadCapture,
    })),
  );

  const handleLoadDemo = (demoId: string) => {
    completeLeadCapture({
      ...SAMPLE_LEAD,
      submittedAt: new Date().toISOString(),
      storageMode: "local_only",
      storageMessage: "Demo contact saved for this browser session.",
    });
    if (typeof window !== "undefined") {
      const demo = DEMO_CONFIGS.find((item) => item.id === demoId) ?? DEMO_CONFIGS[0];
      if (demo) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demo.inputs));
      }
    }
  };

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading simulator...
      </div>
    );
  }

  if (!leadCapture) {
    return <LeadGate onComplete={completeLeadCapture} onLoadDemo={handleLoadDemo} />;
  }

  return (
    <SimulatorWorkspace
      leadCapture={leadCapture}
      onClearLeadCapture={clearLeadCapture}
    />
  );
}
