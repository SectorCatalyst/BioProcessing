"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Search, Shield, Trash2 } from "lucide-react";

import {
  LIFECYCLE_STAGE_MAP,
  PROCESS_PROFILE_MAP,
  type BioPilotAssessmentResults,
  type ProcessProfileId,
  type LifecycleStageId,
} from "@/lib/biopilot-fit-assessment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LeadAdminEntry {
  id: string;
  sessionMode?: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  company: string;
  jobTitle: string;
  countryRegion: string;
  consentToContact: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface AssessmentAdminEntry {
  id: string;
  leadCaptureId: string | null;
  sessionMode: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  company: string;
  jobTitle: string;
  countryRegion: string;
  processProfileId: ProcessProfileId;
  lifecycleStageId: LifecycleStageId;
  fitBand: string;
  fitScore: number;
  annualValuePotential: number;
  threeYearRoi: number;
  paybackMonths: number;
  digitalCoverage: number;
  manualBurdenIndex: number;
  digitalPlantMaturityScore: number | null;
  digitalPlantMaturityLevel: number | null;
  evidenceConfidenceScore: number | null;
  evidenceConfidenceBand: string | null;
  topPriority: string;
  salesFollowUp: string;
  executiveSummary: string;
  createdAt: string;
  updatedAt: string;
}

interface AssessmentProgressAdminEntry {
  id: string;
  sessionId: string;
  sessionMode: string;
  leadCaptureId: string | null;
  firstName: string;
  lastName: string;
  workEmail: string;
  company: string;
  jobTitle: string;
  countryRegion: string;
  currentStep: string;
  status: string;
  completedSections: string[];
  processProfileId: ProcessProfileId;
  lifecycleStageId: LifecycleStageId;
  fitBand: string;
  fitScore: number;
  annualValuePotential: number;
  evidenceConfidenceScore: number | null;
  evidenceConfidenceBand: string | null;
  topPriority: string;
  generatedReport: BioPilotAssessmentResults;
  updatedAt: string;
  createdAt: string;
}

interface FeedbackAdminEntry {
  id: string;
  assessmentId: string | null;
  workEmail: string;
  company: string;
  rating: number;
  usefulness: number;
  clarity: number;
  comment: string;
  page: string;
  createdAt: string;
}

const PANEL_CARD =
  "glass-edge relative rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,249,252,0.98))] backdrop-blur-xl";
const SOFT_CARD =
  "relative rounded-[22px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(242,247,252,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_12px_26px_rgba(11,28,59,0.05)]";
const INPUT_CLASS =
  "h-[52px] rounded-[16px] border-[color:var(--input)] bg-[color:var(--surface-3)] px-4 text-base font-medium text-[color:var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] placeholder:text-[color:var(--muted-foreground)] focus-visible:border-[color:var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]";
const PRIMARY_BUTTON =
  "h-[44px] rounded-[14px] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(135deg,#004f9b,#0b7fff)] px-4 text-[0.95rem] font-semibold text-white shadow-[0_10px_24px_rgba(0,95,189,0.18)] hover:shadow-[0_14px_30px_rgba(0,95,189,0.22)]";
const SECONDARY_BUTTON =
  "h-[44px] rounded-[14px] border-[color:var(--border-strong)] bg-[color:var(--surface-3)] px-4 text-[0.95rem] font-semibold text-[color:var(--foreground)] hover:bg-[color:var(--surface-elevated)]";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const exportCsv = (filename: string, rows: string[][]) => {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
};

const exportLeadCsv = (entries: LeadAdminEntry[]) => {
  exportCsv("lead-captures", [
    [
      "id",
      "session_mode",
      "first_name",
      "last_name",
      "work_email",
      "company",
      "job_title",
      "country_region",
      "consent_to_contact",
      "source",
      "created_at",
      "updated_at",
    ],
    ...entries.map((entry) => [
      entry.id,
      entry.sessionMode ?? "actual",
      entry.firstName,
      entry.lastName,
      entry.workEmail,
      entry.company,
      entry.jobTitle,
      entry.countryRegion,
      entry.consentToContact ? "true" : "false",
      entry.source,
      entry.createdAt,
      entry.updatedAt,
    ]),
  ]);
};

const exportAssessmentCsv = (entries: AssessmentAdminEntry[]) => {
  exportCsv("assessment-submissions", [
    [
      "id",
      "lead_capture_id",
      "session_mode",
      "first_name",
      "last_name",
      "work_email",
      "company",
      "job_title",
      "country_region",
      "process_profile",
      "lifecycle_stage",
      "fit_band",
      "fit_score",
      "annual_value",
      "three_year_roi",
      "payback_months",
      "digital_coverage",
      "manual_burden_index",
      "dpmm_score",
      "dpmm_level",
      "evidence_confidence_score",
      "evidence_confidence_band",
      "top_priority",
      "sales_follow_up",
      "executive_summary",
      "created_at",
      "updated_at",
    ],
    ...entries.map((entry) => [
      entry.id,
      entry.leadCaptureId ?? "",
      entry.sessionMode,
      entry.firstName,
      entry.lastName,
      entry.workEmail,
      entry.company,
      entry.jobTitle,
      entry.countryRegion,
      PROCESS_PROFILE_MAP[entry.processProfileId]?.label ?? entry.processProfileId,
      LIFECYCLE_STAGE_MAP[entry.lifecycleStageId]?.label ?? entry.lifecycleStageId,
      entry.fitBand,
      String(entry.fitScore),
      String(entry.annualValuePotential),
      String(entry.threeYearRoi),
      String(entry.paybackMonths),
      String(entry.digitalCoverage),
      String(entry.manualBurdenIndex),
      entry.digitalPlantMaturityScore === null ? "" : String(entry.digitalPlantMaturityScore),
      entry.digitalPlantMaturityLevel === null ? "" : String(entry.digitalPlantMaturityLevel),
      entry.evidenceConfidenceScore === null ? "" : String(entry.evidenceConfidenceScore),
      entry.evidenceConfidenceBand ?? "",
      entry.topPriority,
      entry.salesFollowUp,
      entry.executiveSummary,
      entry.createdAt,
      entry.updatedAt,
    ]),
  ]);
};

const exportProgressCsv = (entries: AssessmentProgressAdminEntry[]) => {
  exportCsv("assessment-progress", [
    [
      "id",
      "session_id",
      "session_mode",
      "lead_capture_id",
      "first_name",
      "last_name",
      "work_email",
      "company",
      "job_title",
      "country_region",
      "current_step",
      "status",
      "completed_sections",
      "process_profile",
      "lifecycle_stage",
      "fit_band",
      "fit_score",
      "annual_value",
      "evidence_confidence_score",
      "evidence_confidence_band",
      "top_priority",
      "generated_report_json",
      "created_at",
      "updated_at",
    ],
    ...entries.map((entry) => [
      entry.id,
      entry.sessionId,
      entry.sessionMode,
      entry.leadCaptureId ?? "",
      entry.firstName,
      entry.lastName,
      entry.workEmail,
      entry.company,
      entry.jobTitle,
      entry.countryRegion,
      entry.currentStep,
      entry.status,
      entry.completedSections.join("; "),
      PROCESS_PROFILE_MAP[entry.processProfileId]?.label ?? entry.processProfileId,
      LIFECYCLE_STAGE_MAP[entry.lifecycleStageId]?.label ?? entry.lifecycleStageId,
      entry.fitBand,
      String(entry.fitScore),
      String(entry.annualValuePotential),
      entry.evidenceConfidenceScore === null ? "" : String(entry.evidenceConfidenceScore),
      entry.evidenceConfidenceBand ?? "",
      entry.topPriority,
      JSON.stringify(entry.generatedReport),
      entry.createdAt,
      entry.updatedAt,
    ]),
  ]);
};

const exportFeedbackCsv = (entries: FeedbackAdminEntry[]) => {
  exportCsv("assessment-feedback", [
    [
      "id",
      "assessment_id",
      "work_email",
      "company",
      "rating",
      "usefulness",
      "clarity",
      "comment",
      "page",
      "created_at",
    ],
    ...entries.map((entry) => [
      entry.id,
      entry.assessmentId ?? "",
      entry.workEmail,
      entry.company,
      String(entry.rating),
      String(entry.usefulness),
      String(entry.clarity),
      entry.comment,
      entry.page,
      entry.createdAt,
    ]),
  ]);
};

export default function LeadAdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [leads, setLeads] = useState<LeadAdminEntry[]>([]);
  const [assessments, setAssessments] = useState<AssessmentAdminEntry[]>([]);
  const [progressEntries, setProgressEntries] = useState<AssessmentProgressAdminEntry[]>([]);
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackAdminEntry[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingLeadId, setIsDeletingLeadId] = useState<string | null>(null);
  const [isDeletingAssessmentId, setIsDeletingAssessmentId] = useState<string | null>(null);
  const [isDeletingProgressId, setIsDeletingProgressId] = useState<string | null>(null);
  const [isDeletingFeedbackId, setIsDeletingFeedbackId] = useState<string | null>(null);
  const [selectedProgressId, setSelectedProgressId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const loadEntries = useCallback(async (key = adminKey) => {
    if (!key.trim()) {
      setErrorMessage("Enter the admin key to load records.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const [leadResponse, assessmentResponse, progressResponse, feedbackResponse] = await Promise.all([
        fetch("/api/lead-capture", {
          headers: { "x-admin-key": key.trim() },
        }),
        fetch("/api/assessment-submissions", {
          headers: { "x-admin-key": key.trim() },
        }),
        fetch("/api/assessment-progress", {
          headers: { "x-admin-key": key.trim() },
        }),
        fetch("/api/feedback", {
          headers: { "x-admin-key": key.trim() },
        }),
      ]);

      const leadPayload = (await leadResponse.json().catch(() => null)) as
        | { message?: string; entries?: LeadAdminEntry[] }
        | null;
      const assessmentPayload = (await assessmentResponse.json().catch(() => null)) as
        | { message?: string; entries?: AssessmentAdminEntry[] }
        | null;
      const progressPayload = (await progressResponse.json().catch(() => null)) as
        | { message?: string; entries?: AssessmentProgressAdminEntry[] }
        | null;
      const feedbackPayload = (await feedbackResponse.json().catch(() => null)) as
        | { message?: string; entries?: FeedbackAdminEntry[] }
        | null;

      if (!leadResponse.ok) {
        setLeads([]);
        setAssessments([]);
        setProgressEntries([]);
        setFeedbackEntries([]);
        setErrorMessage(leadPayload?.message ?? "Lead records could not be loaded.");
        return;
      }

      if (!assessmentResponse.ok) {
        setLeads([]);
        setAssessments([]);
        setProgressEntries([]);
        setFeedbackEntries([]);
        setErrorMessage(assessmentPayload?.message ?? "Assessment records could not be loaded.");
        return;
      }

      if (!progressResponse.ok) {
        setLeads([]);
        setAssessments([]);
        setProgressEntries([]);
        setFeedbackEntries([]);
        setErrorMessage(progressPayload?.message ?? "Assessment progress records could not be loaded.");
        return;
      }

      if (!feedbackResponse.ok) {
        setLeads([]);
        setAssessments([]);
        setProgressEntries([]);
        setFeedbackEntries([]);
        setErrorMessage(feedbackPayload?.message ?? "Feedback records could not be loaded.");
        return;
      }

      sessionStorage.setItem("lead-capture-admin-key", key.trim());
      setLeads(leadPayload?.entries ?? []);
      setAssessments(assessmentPayload?.entries ?? []);
      setProgressEntries(progressPayload?.entries ?? []);
      setFeedbackEntries(feedbackPayload?.entries ?? []);
      setSelectedProgressId(null);
      setStatusMessage(
        `Loaded ${leadPayload?.entries?.length ?? 0} leads, ${assessmentPayload?.entries?.length ?? 0} assessments, ${progressPayload?.entries?.length ?? 0} progress records, and ${feedbackPayload?.entries?.length ?? 0} feedback records.`,
      );
    } catch {
      setErrorMessage("Records could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [adminKey]);

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm("Delete this lead record?")) {
      return;
    }

    setIsDeletingLeadId(id);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch(`/api/lead-capture?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey.trim() },
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setErrorMessage(payload?.message ?? "Lead record could not be deleted.");
        return;
      }

      setLeads((current) => current.filter((entry) => entry.id !== id));
      setStatusMessage("Lead record deleted.");
    } catch {
      setErrorMessage("Lead record could not be deleted.");
    } finally {
      setIsDeletingLeadId(null);
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!window.confirm("Delete this assessment record?")) {
      return;
    }

    setIsDeletingAssessmentId(id);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch(`/api/assessment-submissions?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey.trim() },
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setErrorMessage(payload?.message ?? "Assessment record could not be deleted.");
        return;
      }

      setAssessments((current) => current.filter((entry) => entry.id !== id));
      setStatusMessage("Assessment record deleted.");
    } catch {
      setErrorMessage("Assessment record could not be deleted.");
    } finally {
      setIsDeletingAssessmentId(null);
    }
  };

  const handleDeleteProgress = async (id: string) => {
    if (!window.confirm("Delete this saved progress record?")) {
      return;
    }

    setIsDeletingProgressId(id);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch(`/api/assessment-progress?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey.trim() },
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setErrorMessage(payload?.message ?? "Progress record could not be deleted.");
        return;
      }

      setProgressEntries((current) => current.filter((entry) => entry.id !== id));
      setSelectedProgressId((current) => (current === id ? null : current));
      setStatusMessage("Progress record deleted.");
    } catch {
      setErrorMessage("Progress record could not be deleted.");
    } finally {
      setIsDeletingProgressId(null);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm("Delete this feedback record?")) {
      return;
    }

    setIsDeletingFeedbackId(id);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch(`/api/feedback?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey.trim() },
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setErrorMessage(payload?.message ?? "Feedback record could not be deleted.");
        return;
      }

      setFeedbackEntries((current) => current.filter((entry) => entry.id !== id));
      setStatusMessage("Feedback record deleted.");
    } catch {
      setErrorMessage("Feedback record could not be deleted.");
    } finally {
      setIsDeletingFeedbackId(null);
    }
  };

  useEffect(() => {
    const savedKey = sessionStorage.getItem("lead-capture-admin-key");
    if (savedKey) {
      setAdminKey(savedKey);
      void loadEntries(savedKey);
    }
  }, [loadEntries]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredLeads = useMemo(() => {
    if (!normalizedQuery) {
      return leads;
    }

    return leads.filter((entry) =>
      [
        entry.firstName,
        entry.lastName,
        entry.workEmail,
        entry.company,
        entry.jobTitle,
        entry.countryRegion,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [leads, normalizedQuery]);

  const filteredAssessments = useMemo(() => {
    if (!normalizedQuery) {
      return assessments;
    }

    return assessments.filter((entry) =>
      [
        entry.firstName,
        entry.lastName,
        entry.workEmail,
        entry.company,
        entry.jobTitle,
        entry.countryRegion,
        entry.sessionMode,
        PROCESS_PROFILE_MAP[entry.processProfileId]?.label ?? entry.processProfileId,
        LIFECYCLE_STAGE_MAP[entry.lifecycleStageId]?.label ?? entry.lifecycleStageId,
        entry.fitBand,
        entry.evidenceConfidenceBand ?? "",
        entry.topPriority,
        entry.salesFollowUp,
        entry.executiveSummary,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [assessments, normalizedQuery]);

  const filteredProgress = useMemo(() => {
    if (!normalizedQuery) {
      return progressEntries;
    }

    return progressEntries.filter((entry) =>
      [
        entry.firstName,
        entry.lastName,
        entry.workEmail,
        entry.company,
        entry.jobTitle,
        entry.countryRegion,
        entry.sessionMode,
        entry.currentStep,
        entry.status,
        PROCESS_PROFILE_MAP[entry.processProfileId]?.label ?? entry.processProfileId,
        LIFECYCLE_STAGE_MAP[entry.lifecycleStageId]?.label ?? entry.lifecycleStageId,
        entry.fitBand,
        entry.evidenceConfidenceBand ?? "",
        entry.topPriority,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [normalizedQuery, progressEntries]);

  const filteredFeedback = useMemo(() => {
    if (!normalizedQuery) {
      return feedbackEntries;
    }

    return feedbackEntries.filter((entry) =>
      [
        entry.workEmail,
        entry.company,
        entry.comment,
        entry.page,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [feedbackEntries, normalizedQuery]);

  const actualLeads = leads.filter((entry) => entry.sessionMode !== "example");
  const actualAssessments = assessments.filter((entry) => entry.sessionMode !== "example");
  const exampleSessions =
    progressEntries.filter((entry) => entry.sessionMode === "example").length +
    assessments.filter((entry) => entry.sessionMode === "example").length;
  const uniqueCompanies = new Set(actualLeads.map((entry) => entry.company.toLowerCase())).size;
  const selectedProgress = selectedProgressId
    ? progressEntries.find((entry) => entry.id === selectedProgressId) ?? null
    : null;

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1520px] gap-4">
        <Card className={cn(PANEL_CARD, "p-6")}>
          <CardHeader className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                  Capture management
                </p>
                <CardTitle className="mt-2 font-heading text-[2.2rem] tracking-[-0.04em]">
                  Review BioPilot leads and submitted assessments
                </CardTitle>
                <CardDescription className="mt-2 max-w-4xl text-lg leading-7 text-[color:var(--muted-foreground)]">
                  Load, search, export, and remove contact records, saved reports, in-progress sessions, and feedback stored in Render Postgres.
                </CardDescription>
              </div>
              <div className={cn(SOFT_CARD, "flex items-center gap-3 px-4 py-3")}>
                <Shield className="size-5 text-[color:var(--brand-blue)]" />
                <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
                  Access requires the admin key configured in `LEAD_CAPTURE_ADMIN_KEY`.
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <Card className={cn(PANEL_CARD, "p-5")}>
            <CardHeader className="p-0">
              <CardTitle className="font-heading text-[1.5rem] tracking-[-0.03em]">
                Admin access
              </CardTitle>
              <CardDescription className="text-base leading-7 text-[color:var(--muted-foreground)]">
                Use the admin key to connect this page to stored lead and assessment records.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-4 grid gap-3 p-0">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[color:var(--foreground)]">
                  Admin key
                </label>
                <Input
                  className={INPUT_CLASS}
                  type="password"
                  value={adminKey}
                  onChange={(event) => setAdminKey(event.target.value)}
                  placeholder="Enter admin key"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button className={PRIMARY_BUTTON} onClick={() => void loadEntries()}>
                  {isLoading ? "Loading..." : "Load records"}
                </Button>
                <Button variant="outline" className={SECONDARY_BUTTON} onClick={() => void loadEntries()}>
                  <RefreshCw className="size-4" />
                  Refresh
                </Button>
              </div>
              {errorMessage ? (
                <p className="text-sm text-[color:var(--destructive)]">{errorMessage}</p>
              ) : null}
              {statusMessage ? (
                <p className="text-sm text-[color:var(--muted-foreground)]">{statusMessage}</p>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3 2xl:grid-cols-6">
            {[
              { label: "Actual leads", value: String(actualLeads.length) },
              { label: "Actual reports", value: String(actualAssessments.length) },
              { label: "In progress", value: String(progressEntries.length) },
              { label: "Feedback", value: String(feedbackEntries.length) },
              { label: "Examples", value: String(exampleSessions) },
              { label: "Companies", value: String(uniqueCompanies) },
            ].map((item) => (
              <Card key={item.label} className={cn(PANEL_CARD, "p-5")}>
                <CardContent className="p-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                    {item.label}
                  </p>
                  <p className="mt-3 font-heading text-[2.25rem] tracking-[-0.05em] text-[color:var(--foreground)]">
                    {item.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className={cn(PANEL_CARD, "p-5")}>
          <CardHeader className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="font-heading text-[1.5rem] tracking-[-0.03em]">
                  Search records
                </CardTitle>
                <CardDescription className="text-base leading-7 text-[color:var(--muted-foreground)]">
                  Search lead captures, submitted assessments, in-progress sessions, and internal feedback by contact, company, process, or comment.
                </CardDescription>
              </div>
              <div className="relative min-w-[280px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
                <Input
                  className={cn(INPUT_CLASS, "pl-11")}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search records"
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className={cn(PANEL_CARD, "p-5")}>
          <CardHeader className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="font-heading text-[1.5rem] tracking-[-0.03em]">
                  Lead records
                </CardTitle>
                <CardDescription className="text-base leading-7 text-[color:var(--muted-foreground)]">
                  Stored contact records captured from the assessment gate.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                className={SECONDARY_BUTTON}
                onClick={() => exportLeadCsv(filteredLeads)}
                disabled={!filteredLeads.length}
              >
                <Download className="size-4" />
                Export leads
              </Button>
            </div>
          </CardHeader>
          <CardContent className="mt-4 p-0">
            <div className={cn(SOFT_CARD, "overflow-hidden")}>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-[color:var(--surface-elevated)]">
                    <tr className="text-left">
                      {["Contact", "Company", "Title", "Region", "Captured", "Updated", "Actions"].map((label) => (
                        <th
                          key={label}
                          className="border-b border-[color:var(--border)] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length ? (
                      filteredLeads.map((entry) => (
                        <tr key={entry.id} className="border-b border-[color:var(--border)] last:border-b-0">
                          <td className="px-4 py-4 align-top">
                            <p className="text-base font-semibold text-[color:var(--foreground)]">
                              {entry.firstName} {entry.lastName}
                            </p>
                            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                              {entry.workEmail}
                            </p>
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {entry.company}
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {entry.jobTitle}
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {entry.countryRegion}
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--muted-foreground)]">
                            {formatDateTime(entry.createdAt)}
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--muted-foreground)]">
                            {formatDateTime(entry.updatedAt)}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <Button
                              variant="outline"
                              className={cn(SECONDARY_BUTTON, "h-10 px-3 text-sm")}
                              onClick={() => void handleDeleteLead(entry.id)}
                              disabled={isDeletingLeadId === entry.id}
                            >
                              <Trash2 className="size-4" />
                              {isDeletingLeadId === entry.id ? "Deleting..." : "Delete"}
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-10 text-center text-base text-[color:var(--muted-foreground)]"
                        >
                          {leads.length
                            ? "No lead records match the current search."
                            : "No lead records loaded yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(PANEL_CARD, "p-5")}>
          <CardHeader className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="font-heading text-[1.5rem] tracking-[-0.03em]">
                  In-progress and abandoned sessions
                </CardTitle>
                <CardDescription className="text-base leading-7 text-[color:var(--muted-foreground)]">
                  Latest saved checkpoints, including where a user stopped before generating the final report.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                className={SECONDARY_BUTTON}
                onClick={() => exportProgressCsv(filteredProgress)}
                disabled={!filteredProgress.length}
              >
                <Download className="size-4" />
                Export progress
              </Button>
            </div>
          </CardHeader>
          <CardContent className="mt-4 p-0">
            {selectedProgress ? (
              <div className={cn(SOFT_CARD, "mb-4 grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.62fr)]")}>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                    Session detail
                  </p>
                  <h3 className="mt-2 font-heading text-2xl tracking-[-0.03em] text-[color:var(--foreground)]">
                    {selectedProgress.firstName} {selectedProgress.lastName} at {selectedProgress.company}
                  </h3>
                  <p className="mt-2 text-base leading-7 text-[color:var(--muted-foreground)]">
                    {selectedProgress.sessionMode === "example" ? "Example session" : "Actual session"} stopped at{" "}
                    {selectedProgress.currentStep.replace(/_/g, " ")} with{" "}
                    {selectedProgress.completedSections.length}/3 input sections confirmed.
                  </p>
                  <p className="mt-3 text-base leading-7 text-[color:var(--foreground)]">
                    {selectedProgress.generatedReport?.executiveSummary ??
                      "A draft report was generated from the latest saved checkpoint."}
                  </p>
                </div>
                <div className="grid gap-3">
                  {[
                    ["Status", selectedProgress.status.replace(/_/g, " ")],
                    [
                      "Process",
                      PROCESS_PROFILE_MAP[selectedProgress.processProfileId]?.label ??
                        selectedProgress.processProfileId,
                    ],
                    ["Fit", `${selectedProgress.fitBand} (${percentFormatter.format(selectedProgress.fitScore)}%)`],
                    ["Annual value", currencyFormatter.format(selectedProgress.annualValuePotential)],
                    ["Top priority", selectedProgress.topPriority || "Not available"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-3)] px-4 py-3"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted-foreground)]">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className={cn(SOFT_CARD, "overflow-hidden")}>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-[color:var(--surface-elevated)]">
                    <tr className="text-left">
                      {[
                        "Contact",
                        "Path",
                        "Stopped At",
                        "Status",
                        "Confirmed",
                        "Process",
                        "Fit",
                        "Annual Value",
                        "Last Activity",
                        "Actions",
                      ].map((label) => (
                        <th
                          key={label}
                          className="border-b border-[color:var(--border)] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProgress.length ? (
                      filteredProgress.map((entry) => (
                        <tr key={entry.id} className="border-b border-[color:var(--border)] last:border-b-0">
                          <td className="px-4 py-4 align-top">
                            <p className="text-base font-semibold text-[color:var(--foreground)]">
                              {entry.firstName} {entry.lastName}
                            </p>
                            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                              {entry.workEmail}
                            </p>
                            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                              {entry.company}
                            </p>
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {entry.sessionMode === "example" ? "Example session" : "Actual session"}
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {entry.currentStep}
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {entry.status.replace(/_/g, " ")}
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {entry.completedSections.length}/3
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {PROCESS_PROFILE_MAP[entry.processProfileId]?.label ?? entry.processProfileId}
                            <div className="text-[color:var(--muted-foreground)]">
                              {LIFECYCLE_STAGE_MAP[entry.lifecycleStageId]?.label ?? entry.lifecycleStageId}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {entry.fitBand}
                            <div className="text-[color:var(--muted-foreground)]">
                              {percentFormatter.format(entry.fitScore)}%
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {currencyFormatter.format(entry.annualValuePotential)}
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--muted-foreground)]">
                            {formatDateTime(entry.updatedAt)}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                className={cn(SECONDARY_BUTTON, "h-9 px-3 text-xs")}
                                onClick={() => setSelectedProgressId(entry.id)}
                              >
                                View
                              </Button>
                              <Button
                                variant="outline"
                                className={cn(SECONDARY_BUTTON, "h-9 px-3 text-xs")}
                                onClick={() => void handleDeleteProgress(entry.id)}
                                disabled={isDeletingProgressId === entry.id}
                              >
                                <Trash2 className="size-3.5" />
                                {isDeletingProgressId === entry.id ? "Deleting..." : "Delete"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-4 py-10 text-center text-base text-[color:var(--muted-foreground)]"
                        >
                          {progressEntries.length
                            ? "No progress records match the current search."
                            : "No progress records loaded yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(PANEL_CARD, "p-5")}>
          <CardHeader className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="font-heading text-[1.5rem] tracking-[-0.03em]">
                  Assessment submissions
                </CardTitle>
                <CardDescription className="text-base leading-7 text-[color:var(--muted-foreground)]">
                  Full saved BioPilot reports tied to the submitted contact and operating inputs.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                className={SECONDARY_BUTTON}
                onClick={() => exportAssessmentCsv(filteredAssessments)}
                disabled={!filteredAssessments.length}
              >
                <Download className="size-4" />
                Export assessments
              </Button>
            </div>
          </CardHeader>
          <CardContent className="mt-4 p-0">
            <div className={cn(SOFT_CARD, "overflow-hidden")}>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-[color:var(--surface-elevated)]">
                    <tr className="text-left">
                      {["Contact", "Process", "Stage", "Fit", "DPMM", "Evidence", "Annual Value", "ROI", "Priority", "Captured", "Actions"].map((label) => (
                        <th
                          key={label}
                          className="border-b border-[color:var(--border)] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssessments.length ? (
                      filteredAssessments.map((entry) => (
                        <tr key={entry.id} className="border-b border-[color:var(--border)] last:border-b-0">
                          <td className="px-4 py-4 align-top">
                            <p className="text-base font-semibold text-[color:var(--foreground)]">
                              {entry.firstName} {entry.lastName}
                            </p>
                            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                              {entry.workEmail}
                            </p>
                            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                              {entry.company}
                            </p>
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {PROCESS_PROFILE_MAP[entry.processProfileId]?.label ?? entry.processProfileId}
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {LIFECYCLE_STAGE_MAP[entry.lifecycleStageId]?.label ?? entry.lifecycleStageId}
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {entry.fitBand}
                            <div className="text-[color:var(--muted-foreground)]">
                              {percentFormatter.format(entry.fitScore)}%
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {entry.digitalPlantMaturityLevel ? `Level ${entry.digitalPlantMaturityLevel}` : "Not captured"}
                            <div className="text-[color:var(--muted-foreground)]">
                              {entry.digitalPlantMaturityScore === null
                                ? ""
                                : `${percentFormatter.format(entry.digitalPlantMaturityScore)}%`}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {entry.evidenceConfidenceBand ?? "Not captured"}
                            <div className="text-[color:var(--muted-foreground)]">
                              {entry.evidenceConfidenceScore === null
                                ? ""
                                : `${percentFormatter.format(entry.evidenceConfidenceScore)}%`}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {currencyFormatter.format(entry.annualValuePotential)}
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {percentFormatter.format(entry.threeYearRoi)}%
                            <div className="text-[color:var(--muted-foreground)]">
                              {entry.paybackMonths.toFixed(1)} mo payback
                            </div>
                          </td>
                          <td className="max-w-[260px] px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {entry.topPriority || "Not captured"}
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--muted-foreground)]">
                            {formatDateTime(entry.createdAt)}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <Button
                              variant="outline"
                              className={cn(SECONDARY_BUTTON, "h-10 px-3 text-sm")}
                              onClick={() => void handleDeleteAssessment(entry.id)}
                              disabled={isDeletingAssessmentId === entry.id}
                            >
                              <Trash2 className="size-4" />
                              {isDeletingAssessmentId === entry.id ? "Deleting..." : "Delete"}
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={11}
                          className="px-4 py-10 text-center text-base text-[color:var(--muted-foreground)]"
                        >
                          {assessments.length
                            ? "No assessment records match the current search."
                            : "No assessment records loaded yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(PANEL_CARD, "p-5")}>
          <CardHeader className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="font-heading text-[1.5rem] tracking-[-0.03em]">
                  Internal feedback
                </CardTitle>
                <CardDescription className="text-base leading-7 text-[color:var(--muted-foreground)]">
                  Functionality feedback submitted from final report screens.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                className={SECONDARY_BUTTON}
                onClick={() => exportFeedbackCsv(filteredFeedback)}
                disabled={!filteredFeedback.length}
              >
                <Download className="size-4" />
                Export feedback
              </Button>
            </div>
          </CardHeader>
          <CardContent className="mt-4 p-0">
            <div className={cn(SOFT_CARD, "overflow-hidden")}>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-[color:var(--surface-elevated)]">
                    <tr className="text-left">
                      {["Contact", "Scores", "Comment", "Page", "Captured", "Actions"].map((label) => (
                        <th
                          key={label}
                          className="border-b border-[color:var(--border)] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeedback.length ? (
                      filteredFeedback.map((entry) => (
                        <tr key={entry.id} className="border-b border-[color:var(--border)] last:border-b-0">
                          <td className="px-4 py-4 align-top">
                            <p className="text-base font-semibold text-[color:var(--foreground)]">
                              {entry.workEmail || "No email captured"}
                            </p>
                            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                              {entry.company || "No company captured"}
                            </p>
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            Overall {entry.rating}/5
                            <div className="text-[color:var(--muted-foreground)]">
                              Useful {entry.usefulness}/5, clear {entry.clarity}/5
                            </div>
                          </td>
                          <td className="max-w-[420px] px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {entry.comment || "No comment"}
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--foreground)]">
                            {entry.page}
                          </td>
                          <td className="px-4 py-4 align-top text-sm leading-6 text-[color:var(--muted-foreground)]">
                            {formatDateTime(entry.createdAt)}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <Button
                              variant="outline"
                              className={cn(SECONDARY_BUTTON, "h-10 px-3 text-sm")}
                              onClick={() => void handleDeleteFeedback(entry.id)}
                              disabled={isDeletingFeedbackId === entry.id}
                            >
                              <Trash2 className="size-4" />
                              {isDeletingFeedbackId === entry.id ? "Deleting..." : "Delete"}
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-10 text-center text-base text-[color:var(--muted-foreground)]"
                        >
                          {feedbackEntries.length
                            ? "No feedback records match the current search."
                            : "No feedback records loaded yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
