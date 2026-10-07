export const QUICK_ROI_MODEL_VERSION = "1.0.0";
export const FULL_ROI_URL = "https://bioprocessing-roi.onrender.com/";

export type QuickLaneId = "review" | "failure" | "transfer";
export type QuickFieldKey = "eventsPerYear" | "hoursPerEvent" | "hourlyRate" | "costPerEvent" | "addressableSharePercent";
export type QuickRawInputs = Partial<Record<QuickFieldKey, string>>;
export type QuickInputs = Record<QuickFieldKey, number>;
export type ReductionRange = { low: number; high: number };
export const DEFAULT_REDUCTION: ReductionRange = { low: 10, high: 25 };

export interface QuickField {
  key: QuickFieldKey;
  label: string;
  help: string;
  unit: string;
  example: number;
  max: number;
  integer?: boolean;
}

export const QUICK_LANES: { id: QuickLaneId; label: string; formTitle: string; resultTitle: string; fields: QuickField[] }[] = [
  {
    id: "review", label: "Batch review", formTitle: "Your batch review effort", resultTitle: "Batch review opportunity",
    fields: [
      { key: "eventsPerYear", label: "Runs per year", help: "Runs using this review workflow in a typical year.", unit: "runs / year", example: 100, max: 1000000, integer: true },
      { key: "hoursPerEvent", label: "Review hours per run", help: "Hands-on team time assembling, reconciling and reviewing run records.", unit: "hours / run", example: 20, max: 100000 },
      { key: "hourlyRate", label: "Loaded hourly cost", help: "Hourly labor cost including benefits and overhead. The example is editable.", unit: "USD / hour", example: 145, max: 10000 },
    ],
  },
  {
    id: "failure", label: "Failed runs", formTitle: "Your failed-run exposure", resultTitle: "Failed-run opportunity",
    fields: [
      { key: "eventsPerYear", label: "Failed or degraded runs per year", help: "Use your observed annual average. Zero is a valid answer.", unit: "runs / year", example: 5, max: 1000000 },
      { key: "costPerEvent", label: "Net avoidable impact per run", help: "Use avoidable materials, recovery and other loss costs, not total product selling value.", unit: "USD / run", example: 80000, max: 1000000000 },
      { key: "addressableSharePercent", label: "Share linked to data or workflow gaps", help: "Estimated share connected to information, coordination or review gaps. This is an assumption to validate.", unit: "%", example: 25, max: 100 },
    ],
  },
  {
    id: "transfer", label: "Tech transfer", formTitle: "Your transfer package effort", resultTitle: "Tech transfer opportunity",
    fields: [
      { key: "eventsPerYear", label: "Transfers per year", help: "Scale-up, site or partner handoffs using this workflow.", unit: "transfers / year", example: 3, max: 1000000, integer: true },
      { key: "hoursPerEvent", label: "Package hours per transfer", help: "Hands-on team time preparing and checking one transfer package.", unit: "hours / transfer", example: 78, max: 100000 },
      { key: "hourlyRate", label: "Loaded hourly cost", help: "Hourly labor cost including benefits and overhead. The example is editable.", unit: "USD / hour", example: 145, max: 10000 },
    ],
  },
];

export const getQuickLane = (id: QuickLaneId) => QUICK_LANES.find((lane) => lane.id === id)!;
export const exampleInputs = (id: QuickLaneId): QuickRawInputs => Object.fromEntries(getQuickLane(id).fields.map((field) => [field.key, String(field.example)]));

export function parseQuickInputs(id: QuickLaneId, raw: QuickRawInputs) {
  const inputs: QuickInputs = { eventsPerYear: 0, hoursPerEvent: 0, hourlyRate: 0, costPerEvent: 0, addressableSharePercent: 0 };
  const errors: Partial<Record<QuickFieldKey, string>> = {};
  for (const field of getQuickLane(id).fields) {
    const supplied = (raw[field.key] ?? "").trim().replace(/^\$\s*/, "");
    const groupedCorrectly = !supplied.includes(",") || /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(supplied);
    const text = supplied.replace(/,/g, "");
    const decimal = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE]\+?\d+)?$/.test(text);
    const value = groupedCorrectly && decimal ? Number(text) : NaN;
    if (!Number.isFinite(value) || value < 0 || value > field.max) {
      errors[field.key] = `Enter a number from 0 to ${field.max.toLocaleString("en-US")}.`;
    } else if (field.integer && !Number.isInteger(value)) {
      errors[field.key] = "Enter a whole number.";
    } else {
      inputs[field.key] = value;
    }
  }
  return { inputs, errors, valid: Object.keys(errors).length === 0 };
}

export function validReduction(range: ReductionRange) {
  return Number.isFinite(range.low) && Number.isFinite(range.high) && range.low >= 0 && range.high <= 100 && range.low <= range.high;
}

export function calculateQuickRoi(id: QuickLaneId, inputs: QuickInputs, reduction: ReductionRange = DEFAULT_REDUCTION) {
  const parsed = parseQuickInputs(id, Object.fromEntries(Object.entries(inputs).map(([key, value]) => [key, String(value)])));
  if (!parsed.valid || !validReduction(reduction)) throw new Error("Invalid quick-estimate inputs or reduction range.");
  const low = reduction.low / 100;
  const high = reduction.high / 100;
  const failure = id === "failure";
  const baselineEffort = failure ? 0 : inputs.eventsPerYear * inputs.hoursPerEvent;
  const baselineLoss = failure ? inputs.eventsPerYear * inputs.costPerEvent : 0;
  const addressableEvents = failure ? inputs.eventsPerYear * inputs.addressableSharePercent / 100 : 0;
  const addressableLoss = baselineLoss * inputs.addressableSharePercent / 100;
  return {
    modelVersion: QUICK_ROI_MODEL_VERSION,
    laneId: id,
    kind: failure ? "avoided_loss" as const : "capacity" as const,
    reduction,
    baselineEffort,
    baselineLoss,
    addressableLoss,
    recoveredHoursLow: baselineEffort * low,
    recoveredHoursHigh: baselineEffort * high,
    avoidedEventsLow: addressableEvents * low,
    avoidedEventsHigh: addressableEvents * high,
    annualValueLow: failure ? addressableLoss * low : baselineEffort * low * inputs.hourlyRate,
    annualValueHigh: failure ? addressableLoss * high : baselineEffort * high * inputs.hourlyRate,
    hoursAfterLow: inputs.hoursPerEvent * (1 - high),
    hoursAfterHigh: inputs.hoursPerEvent * (1 - low),
  };
}

export type QuickResult = ReturnType<typeof calculateQuickRoi>;
export const formatQuickNumber = (value: number, digits = 0) => new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
export const formatQuickCurrency = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value >= 1000 ? Math.round(value / 100) * 100 : Math.round(value));
