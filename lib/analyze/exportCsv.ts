// CSV utilities for the Analyze page exports. RFC-4180 formatting,
// UTF-8 with BOM (so Excel detects encoding cleanly). Pure functions —
// no DOM or network — except triggerCsvDownload which creates a Blob
// and synthesizes an anchor click.

import type { Contribution } from "@/lib/use-engage-data";
import type { ThemeStatus } from "@/lib/use-theme-statuses";
import type { Theme } from "@/lib/use-themes";

const LOCATION_SHORT_NAMES: Record<string, string> = {
  "01": "Flatbush × Glenwood",
  "02": "Station Exit",
  "03": "The Junction",
  "04": "Hillel Place",
  "05": "Campus Rd Co-op",
  "06": "Brooklyn College",
  "07": "South of IBX",
  "08": "Avenue I",
};

const STATUS_LABEL: Record<ThemeStatus, string> = {
  unassigned: "Unassigned",
  priority: "Priority",
  investigating: "Investigating",
  addressed: "Addressed",
};

const STATUS_PRIORITY: Record<ThemeStatus, number> = {
  priority: 3,
  investigating: 2,
  addressed: 1,
  unassigned: 0,
};

const TYPE_LABEL: Record<string, string> = {
  sticky: "Note",
  concern: "Concern",
  question_response: "Response",
  ai_proposal: "Proposal",
};

function escapeField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowToLine(cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeField).join(",");
}

export interface EnrichedContribution extends Contribution {
  themes: Theme[];
}

export function buildContributionsCsv(
  rows: EnrichedContribution[],
  getStatus: (themeId: string) => ThemeStatus,
): string {
  const headers = [
    "location_id",
    "location_name",
    "type",
    "role",
    "age_range",
    "excerpt",
    "themes",
    "status",
    "created_at_iso",
    "days_ago",
  ];

  const sorted = [...rows].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const lines = sorted.map((c) => {
    const themeTitles = c.themes.map((t) => t.name).join("; ");
    const statuses = c.themes.map((t) => getStatus(t.id));
    const status: ThemeStatus =
      statuses.length === 0
        ? "unassigned"
        : statuses.reduce((max, s) =>
            STATUS_PRIORITY[s] > STATUS_PRIORITY[max] ? s : max,
          );

    const days = Math.floor(
      (Date.now() - new Date(c.createdAt).getTime()) / 86_400_000,
    );

    return rowToLine([
      c.locationId,
      LOCATION_SHORT_NAMES[c.locationId] ?? `Location ${c.locationId}`,
      TYPE_LABEL[c.type] ?? c.type,
      c.contributorRole,
      c.contributorAge,
      c.content,
      themeTitles,
      STATUS_LABEL[status],
      c.createdAt,
      days,
    ]);
  });

  return [rowToLine(headers), ...lines].join("\n");
}

export function buildThemesCsv(
  themes: Theme[],
  getStatus: (themeId: string) => ThemeStatus,
): string {
  const headers = [
    "theme_title",
    "theme_type",
    "voice_count",
    "status",
    "resident_count",
    "student_count",
    "transit_count",
    "local_business_count",
    "visitor_count",
    "planner_count",
    "generated_at_iso",
  ];

  const lines = themes.map((t) => {
    const d = t.demographic_distribution ?? {};
    return rowToLine([
      t.name,
      t.kind,
      t.contribution_ids.length,
      STATUS_LABEL[getStatus(t.id)],
      d.resident ?? 0,
      d.student ?? 0,
      d.transit_rider ?? 0,
      d.retail_owner ?? 0,
      d.visitor ?? 0,
      d.planner_stakeholder ?? 0,
      t.generated_at ?? "",
    ]);
  });

  return [rowToLine(headers), ...lines].join("\n");
}

export function triggerCsvDownload(csv: string, filename: string): void {
  // BOM ensures Excel auto-detects UTF-8 (avoids mojibake on apostrophes,
  // em-dashes, and names with diacritics).
  const blob = new Blob(["﻿" + csv], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function todayDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
