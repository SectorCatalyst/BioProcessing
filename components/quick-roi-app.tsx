"use client";

import { useRef, useState } from "react";
import { ArrowRight, ChevronDown, Circle, CircleDot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { calculateQuickRoi, DEFAULT_REDUCTION, formatQuickCurrency, formatQuickNumber, FULL_ROI_URL, parseQuickInputs, QUICK_LANES, validReduction, type QuickFieldKey, type QuickLaneId, type QuickRawInputs } from "@/lib/quick-roi";

const INPUT_CLASS = "h-11 rounded-xl border-[color:var(--input)] bg-[color:var(--surface-3)] px-3 pr-[9.5rem] text-lg md:text-lg font-medium text-[color:var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] placeholder:font-normal placeholder:text-[color:var(--muted-foreground)] focus-visible:border-[color:var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]";
const PRIMARY_BUTTON = "min-h-11 rounded-xl border border-[rgba(255,255,255,0.1)] bg-primary px-5 text-base font-semibold text-white shadow-[0_10px_24px_rgba(0,95,189,0.12)] hover:bg-primary-strong hover:text-white";

export function QuickRoiApp() {
  const [laneId, setLaneId] = useState<QuickLaneId>("review");
  const [allInputs, setAllInputs] = useState<Record<QuickLaneId, QuickRawInputs>>({ review: {}, failure: {}, transfer: {} });
  const [readyLanes, setReadyLanes] = useState<QuickLaneId[]>([]);
  const [attempted, setAttempted] = useState<QuickLaneId[]>([]);
  const [lowText, setLowText] = useState(String(DEFAULT_REDUCTION.low));
  const [highText, setHighText] = useState(String(DEFAULT_REDUCTION.high));
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const resultRef = useRef<HTMLElement>(null);
  const parsed = parseQuickInputs(laneId, allInputs[laneId]);
  const reduction = { low: lowText.trim() === "" ? NaN : Number(lowText), high: highText.trim() === "" ? NaN : Number(highText) };
  const rangeValid = validReduction(reduction);
  const ready = readyLanes.includes(laneId);
  const result = ready && parsed.valid && rangeValid ? calculateQuickRoi(laneId, parsed.inputs, reduction) : null;
  const showErrors = attempted.includes(laneId) || ready;

  function changeField(key: QuickFieldKey, value: string) {
    setAllInputs((current) => ({ ...current, [laneId]: { ...current[laneId], [key]: value } }));
  }

  function showEstimate(event: React.FormEvent) {
    event.preventDefault();
    setAttempted((current) => current.includes(laneId) ? current : [...current, laneId]);
    if (!parsed.valid) {
      const first = Object.keys(parsed.errors)[0];
      document.getElementById(`${laneId}-${first}`)?.focus();
      return;
    }
    if (!rangeValid) { setAssumptionsOpen(true); return; }
    setReadyLanes((current) => current.includes(laneId) ? current : [...current, laneId]);
    if (window.matchMedia("(max-width: 767px)").matches) {
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-white/90">
        <div className="mx-auto flex max-w-[1487px] flex-wrap items-center gap-3 px-5 py-1.5 sm:px-8 lg:px-12">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- A document navigation resets all calculator state. */}
          <a href="/" aria-label="BioPilot Quick ROI home — reset all fields" title="Return home and reset all fields" className="flex min-h-11 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">
          {/* The unchanged source brand asset also appears in the larger assessment. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/yokogawa-logo.png" alt="Yokogawa" width={576} height={87} className="h-auto w-[172px] sm:w-[208px]" />
          </a>
          <span className="hidden h-7 w-px bg-border-strong sm:block" aria-hidden="true" />
          <span className="font-heading text-lg font-semibold tracking-[-0.035em] sm:text-2xl">BioPilot Quick ROI</span>
        </div>
      </header>

      <main className="mx-auto max-w-[1487px] px-5 py-4 sm:px-8 lg:px-12">
        <h1 className="font-heading text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.12] font-semibold tracking-[-0.045em]">Where is your bioprocess losing value?</h1>
        <p className="mt-2 max-w-4xl text-base font-semibold leading-6 text-foreground sm:text-lg">Choose one bottleneck. Get a quick estimate</p>

        <Tabs value={laneId} onValueChange={(value) => { if (QUICK_LANES.some((item) => item.id === value)) setLaneId(value as QuickLaneId); }} className="mt-4 gap-0 sm:mt-5">
          <TabsList aria-label="Choose a bioprocess bottleneck" className="grid h-auto! w-full grid-cols-3 gap-2 bg-transparent p-0 sm:gap-3">
            {QUICK_LANES.map((item) => {
              const Icon = item.id === laneId ? CircleDot : Circle;
              return <TabsTrigger key={item.id} value={item.id} className="min-h-[60px] flex-col gap-1 rounded-xl border border-border-strong bg-white/80 px-2 py-2 text-sm font-semibold whitespace-normal text-foreground transition-colors data-active:border-brand-blue data-active:bg-[#eaf4ff] data-active:text-brand-blue data-active:shadow-none sm:min-h-[52px] sm:flex-row sm:gap-2 sm:px-4 sm:text-lg"><Icon className="size-5 shrink-0 sm:size-6" aria-hidden="true" />{item.label}</TabsTrigger>;
            })}
          </TabsList>

          {QUICK_LANES.map((item) => <TabsContent key={item.id} value={item.id} className="mt-5">
            <div className="grid items-start gap-6 md:grid-cols-[0.86fr_1.14fr] md:gap-6 lg:gap-8">
              <section aria-labelledby={`${item.id}-form-heading`} className="min-w-0">
                <h2 id={`${item.id}-form-heading`} className="font-heading text-[clamp(1.35rem,2vw,1.75rem)] font-semibold leading-tight tracking-[-0.035em]">{item.formTitle}</h2>
                <form onSubmit={showEstimate} noValidate className="mt-3 space-y-3">
                  {item.fields.map((field) => <div key={field.key}>
                    <label htmlFor={`${item.id}-${field.key}`} className="block text-sm font-medium leading-5 sm:text-base">{field.label}</label>
                    <div className="relative mt-1">
                      <Input id={`${item.id}-${field.key}`} type="text" inputMode="decimal" placeholder={`e.g. ${field.example.toLocaleString("en-US")}`} value={allInputs[item.id][field.key] ?? ""} onChange={(event) => changeField(field.key, event.target.value)} aria-describedby={`${item.id}-${field.key}-help${showErrors && parsed.errors[field.key] ? ` ${item.id}-${field.key}-error` : ""}`} aria-invalid={showErrors && Boolean(parsed.errors[field.key])} className={INPUT_CLASS} />
                      <span className={cn("pointer-events-none absolute inset-y-0 flex items-center text-xs text-muted-foreground", allInputs[item.id][field.key] ? "right-12" : "right-3")}>{field.unit}</span>
                      {allInputs[item.id][field.key] && <button type="button" aria-label={`Clear ${field.label.toLowerCase()}`} title={`Clear ${field.label.toLowerCase()}`} onClick={() => { changeField(field.key, ""); document.getElementById(`${item.id}-${field.key}`)?.focus(); }} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"><X className="size-4" aria-hidden="true" /></button>}
                    </div>
                    <p id={`${item.id}-${field.key}-help`} className="mt-1 text-xs leading-4 text-muted-foreground">{field.help}</p>
                    {showErrors && parsed.errors[field.key] && <p id={`${item.id}-${field.key}-error`} role="alert" className="mt-1 text-sm font-medium text-destructive">{parsed.errors[field.key]}</p>}
                  </div>)}
                  <Button type="submit" variant={ready ? "outline" : "default"} className={cn("w-full min-h-11 rounded-xl text-base font-semibold", !ready && PRIMARY_BUTTON, ready && "border-brand-blue bg-white text-brand-blue hover:bg-surface-elevated hover:text-brand-blue")}><span>{ready ? "Update estimate" : "Calculate estimate"}</span><ArrowRight className="ml-2 size-5" aria-hidden="true" /></Button>
                </form>
              </section>

              <section ref={resultRef} aria-labelledby={`${item.id}-result-heading`} className="min-w-0 scroll-mt-5 border-t border-border pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-6 lg:pl-8">
                <h2 id={`${item.id}-result-heading`} className="font-heading text-[clamp(1.35rem,2vw,1.75rem)] font-semibold leading-tight tracking-[-0.035em]">{item.resultTitle}</h2>
                <div aria-live="polite" aria-atomic="true">
                  {!result ? <div className="mt-4 py-3"><p aria-hidden="true" className="font-heading text-5xl font-semibold text-brand-blue">—</p><p className="mt-2 text-sm leading-5 text-muted-foreground">{ready ? "Check the highlighted inputs or reduction range." : "Enter your process data, then calculate your estimate."}</p></div> : <>
                    <p className="mt-2 text-sm text-muted-foreground">{result.kind === "capacity" ? "Potential capacity value" : "Potential avoided-loss value"}</p>
                    <p className="mt-1 flex flex-wrap items-baseline gap-x-2 font-heading font-semibold leading-tight tracking-[-0.04em] text-brand-blue"><span className="min-w-0 max-w-full [overflow-wrap:anywhere] text-[clamp(1.7rem,3.1vw,2.8rem)]">{formatQuickCurrency(result.annualValueLow)}–{formatQuickCurrency(result.annualValueHigh)}</span><span className="text-lg sm:text-xl">/ year</span></p>
                    <p className="mt-3 font-heading text-[clamp(1.2rem,2vw,1.65rem)] leading-snug font-semibold tracking-[-0.025em] text-brand-blue">{result.kind === "capacity" ? `${formatQuickNumber(result.recoveredHoursLow)}–${formatQuickNumber(result.recoveredHoursHigh)} hours recovered / year` : `${formatQuickNumber(result.avoidedEventsLow, 2)}–${formatQuickNumber(result.avoidedEventsHigh, 2)} failed runs potentially avoided / year`}</p>
                    <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm">
                      <div><p className="text-muted-foreground">{result.kind === "capacity" ? "Today" : "Current annual loss"}</p><p className="mt-1 font-semibold">{result.kind === "capacity" ? `${formatQuickNumber(parsed.inputs.hoursPerEvent, 1)} hours / ${laneId === "review" ? "run" : "transfer"}` : formatQuickCurrency(result.baselineLoss)}</p></div>
                      <ArrowRight className="size-5 text-muted-foreground" aria-hidden="true" />
                      <div><p className="text-muted-foreground">{result.kind === "capacity" ? "Estimated effort" : "Addressable loss"}</p><p className="mt-1 font-semibold">{result.kind === "capacity" ? `${formatQuickNumber(result.hoursAfterLow, 1)}–${formatQuickNumber(result.hoursAfterHigh, 1)} hours / ${laneId === "review" ? "run" : "transfer"}` : `${formatQuickNumber(parsed.inputs.addressableSharePercent)}% · ${formatQuickCurrency(result.addressableLoss)}`}</p></div>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">Assumes a {formatQuickNumber(reduction.low)}–{formatQuickNumber(reduction.high)}% reduction{result.kind === "avoided_loss" ? " in the addressable losses." : ". Recovered-time value reflects team capacity."}</p>
                    {result.annualValueHigh === 0 && <p className="mt-2 text-sm leading-5 text-muted-foreground">These values give an estimated annual value of $0.</p>}
                  </>}
                </div>

                {result && <div className="mt-3">
                  <a href={FULL_ROI_URL} className={cn(PRIMARY_BUTTON, "flex w-full items-center justify-center gap-3 text-center whitespace-normal transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue")} target="_blank" rel="noopener noreferrer">Build your business case<ArrowRight className="size-5" aria-hidden="true" /><span className="sr-only"> (opens the detailed assessment in a new tab)</span></a>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">Evaluate the costs and benefits for your process.</p>
                </div>}

                <details open={assumptionsOpen} onToggle={(event) => setAssumptionsOpen(event.currentTarget.open)} className="group mt-2">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-base font-medium text-brand-blue underline underline-offset-4 focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue [&::-webkit-details-marker]:hidden">Review assumptions<ChevronDown className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" /></summary>
                  <div className="mt-2 rounded-2xl border border-border bg-white/80 p-4 text-sm leading-6 text-muted-foreground">
                    <p>The default reduction range is illustrative. Use a range supported by your operating data or pilot results.</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div><label htmlFor="reduction-low" className="font-medium text-foreground">Lower reduction (%)</label><div className="relative mt-1"><Input id="reduction-low" type="text" inputMode="decimal" value={lowText} onChange={(event) => setLowText(event.target.value)} aria-invalid={!rangeValid} aria-describedby={!rangeValid ? "reduction-error" : undefined} className="h-11 rounded-xl bg-white pl-3 pr-11 text-base" />{lowText && <button type="button" aria-label="Clear lower reduction (%)" onClick={() => { setLowText(""); document.getElementById("reduction-low")?.focus(); }} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground hover:bg-surface-elevated hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"><X className="size-4" aria-hidden="true" /></button>}</div></div>
                      <div><label htmlFor="reduction-high" className="font-medium text-foreground">Upper reduction (%)</label><div className="relative mt-1"><Input id="reduction-high" type="text" inputMode="decimal" value={highText} onChange={(event) => setHighText(event.target.value)} aria-invalid={!rangeValid} aria-describedby={!rangeValid ? "reduction-error" : undefined} className="h-11 rounded-xl bg-white pl-3 pr-11 text-base" />{highText && <button type="button" aria-label="Clear upper reduction (%)" onClick={() => { setHighText(""); document.getElementById("reduction-high")?.focus(); }} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground hover:bg-surface-elevated hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"><X className="size-4" aria-hidden="true" /></button>}</div></div>
                    </div>
                    {!rangeValid && <p id="reduction-error" role="alert" className="mt-2 font-medium text-destructive">Use values from 0 to 100, with the lower value no greater than the upper value.</p>}
                    <p className="mt-4">{laneId === "failure" ? "Avoided-loss value = failed runs × net avoidable impact × addressable share × reduction scenario. The reduction applies to losses linked to data or workflow gaps." : `Recovered hours = ${laneId === "review" ? "runs × review hours per run" : "transfers × package hours per transfer"} × reduction scenario. Capacity value = recovered hours × loaded hourly cost. Recovered hours represent team capacity. Cash savings depend on how you use that capacity.`}</p>
                    <p className="mt-3">Values are in USD; amounts of $1,000 or more are rounded to the nearest $100. Investment, implementation costs and the timing of benefits are excluded.</p>
                    <p className="mt-3">Your entries stay in this tab.</p>
                    <Button variant="link" className="mt-2 px-0 text-sm text-brand-blue" onClick={() => { setLowText(String(DEFAULT_REDUCTION.low)); setHighText(String(DEFAULT_REDUCTION.high)); }}>Reset reduction range</Button>
                  </div>
                </details>
              </section>
            </div>
          </TabsContent>)}
        </Tabs>
        <footer className="mt-4 border-t border-border pt-2 text-xs leading-5 text-muted-foreground">Yokogawa · BioPilot</footer>
      </main>
    </div>
  );
}
