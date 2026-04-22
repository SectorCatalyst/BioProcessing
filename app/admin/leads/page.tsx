"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Search, Shield, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LeadAdminEntry {
  id: string;
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

const PANEL_CARD =
  "glass-edge relative rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,249,252,0.98))] backdrop-blur-xl";
const SOFT_CARD =
  "relative rounded-[22px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(242,247,252,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_12px_26px_rgba(11,28,59,0.05)]";
const INPUT_CLASS =
  "h-[52px] rounded-[16px] border-[color:var(--input)] bg-[color:var(--surface-3)] px-4 text-base font-medium text-[color:var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] placeholder:text-[color:var(--muted-foreground)] focus-visible:border-[color:var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]";
const PRIMARY_BUTTON =
  "h-[52px] rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(135deg,#004f9b,#0b7fff)] px-5 text-base font-semibold text-white shadow-[0_16px_34px_rgba(0,95,189,0.22)] hover:shadow-[0_22px_42px_rgba(0,95,189,0.28)]";
const SECONDARY_BUTTON =
  "h-[52px] rounded-[16px] border-[color:var(--border-strong)] bg-[color:var(--surface-3)] px-5 text-base font-semibold text-[color:var(--foreground)] hover:bg-[color:var(--surface-elevated)]";

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const exportCsv = (entries: LeadAdminEntry[]) => {
  const rows = [
    [
      "id",
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
  ];

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
  anchor.download = `lead-captures-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export default function LeadAdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [entries, setEntries] = useState<LeadAdminEntry[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const loadEntries = useCallback(async (key = adminKey) => {
    if (!key.trim()) {
      setErrorMessage("Enter the admin key to load leads.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch("/api/lead-capture", {
        headers: {
          "x-admin-key": key.trim(),
        },
      });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string; entries?: LeadAdminEntry[] }
        | null;

      if (!response.ok) {
        setEntries([]);
        setErrorMessage(payload?.message ?? "Lead records could not be loaded.");
        return;
      }

      sessionStorage.setItem("lead-capture-admin-key", key.trim());
      setEntries(payload?.entries ?? []);
      setStatusMessage(`Loaded ${payload?.entries?.length ?? 0} lead records.`);
    } catch {
      setErrorMessage("Lead records could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [adminKey]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this lead record?")) {
      return;
    }

    setIsDeletingId(id);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch(`/api/lead-capture?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-key": adminKey.trim(),
        },
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setErrorMessage(payload?.message ?? "Lead record could not be deleted.");
        return;
      }

      setEntries((current) => current.filter((entry) => entry.id !== id));
      setStatusMessage("Lead record deleted.");
    } catch {
      setErrorMessage("Lead record could not be deleted.");
    } finally {
      setIsDeletingId(null);
    }
  };

  useEffect(() => {
    const savedKey = sessionStorage.getItem("lead-capture-admin-key");
    if (savedKey) {
      setAdminKey(savedKey);
      void loadEntries(savedKey);
    }
  }, [loadEntries]);

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return entries;
    }

    return entries.filter((entry) =>
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
        .includes(normalized),
    );
  }, [entries, query]);

  const consentedCount = entries.filter((entry) => entry.consentToContact).length;
  const uniqueCompanies = new Set(entries.map((entry) => entry.company.toLowerCase())).size;

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1520px] gap-4">
        <Card className={cn(PANEL_CARD, "p-6")}>
          <CardHeader className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                  Lead management
                </p>
                <CardTitle className="mt-2 font-heading text-[2.2rem] tracking-[-0.04em]">
                  Review captured BioPilot entries
                </CardTitle>
                <CardDescription className="mt-2 max-w-4xl text-lg leading-7 text-[color:var(--muted-foreground)]">
                  Load, search, export, and remove lead records stored in Render Postgres.
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
                Use the admin key to connect this page to stored lead records.
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
                  {isLoading ? "Loading..." : "Load entries"}
                </Button>
                <Button
                  variant="outline"
                  className={SECONDARY_BUTTON}
                  onClick={() => exportCsv(filteredEntries)}
                  disabled={!filteredEntries.length}
                >
                  <Download className="size-4" />
                  Export CSV
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

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Stored entries", value: String(entries.length) },
              { label: "Consented", value: String(consentedCount) },
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
                  Lead records
                </CardTitle>
                <CardDescription className="text-base leading-7 text-[color:var(--muted-foreground)]">
                  Search by name, email, company, title, or region.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[280px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
                  <Input
                    className={cn(INPUT_CLASS, "pl-11")}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search leads"
                  />
                </div>
                <Button variant="outline" className={SECONDARY_BUTTON} onClick={() => void loadEntries()}>
                  <RefreshCw className="size-4" />
                  Refresh
                </Button>
              </div>
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
                    {filteredEntries.length ? (
                      filteredEntries.map((entry) => (
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
                              className={cn(SECONDARY_BUTTON, "h-[42px] px-3 text-sm")}
                              onClick={() => void handleDelete(entry.id)}
                              disabled={isDeletingId === entry.id}
                            >
                              <Trash2 className="size-4" />
                              {isDeletingId === entry.id ? "Deleting..." : "Delete"}
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
                          {entries.length
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
      </div>
    </div>
  );
}
