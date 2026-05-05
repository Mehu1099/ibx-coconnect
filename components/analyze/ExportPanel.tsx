"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildContributionsCsv,
  buildThemesCsv,
  type EnrichedContribution,
  todayDateString,
  triggerCsvDownload,
} from "@/lib/analyze/exportCsv";
import type { ExploreLocation } from "@/lib/explore-locations";
import { supabase } from "@/lib/supabase-client";
import type { ThemeStatus } from "@/lib/use-theme-statuses";
import type { Theme } from "@/lib/use-themes";
import PanelHeader from "./PanelHeader";

interface Props {
  exportContributions: EnrichedContribution[];
  exportThemes: Theme[];
  getStatus: (themeId: string) => ThemeStatus;
  // Briefing-generation extras
  statusFilter: string;
  selectedThemeId: string | null;
  tableSearch: string;
  tableFilterType: string;
  tableFilterLocation: string;
  latestGenerationId: string | null;
  locations: ExploreLocation[];
}

interface PastBriefing {
  id: string;
  generated_at: string;
  contribution_count: number;
  theme_count: number;
  briefing_label: string | null;
}

export default function ExportPanel({
  exportContributions,
  exportThemes,
  getStatus,
  statusFilter,
  selectedThemeId,
  tableSearch,
  tableFilterType,
  tableFilterLocation,
  latestGenerationId,
  locations,
}: Props) {
  const contributionsCount = exportContributions.length;
  const themesCount = exportThemes.length;

  const [briefings, setBriefings] = useState<PastBriefing[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(true);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [showAllBriefings, setShowAllBriefings] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const fetchBriefings = useCallback(async () => {
    setArchiveLoading(true);
    setArchiveError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const res = await fetch("/api/briefings/list", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = (await res.json()) as
        | { briefings: PastBriefing[] }
        | { error: string };
      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : `Failed (${res.status})`);
      }
      setBriefings(data.briefings);
    } catch (err) {
      setArchiveError(err instanceof Error ? err.message : String(err));
    } finally {
      setArchiveLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBriefings();
  }, [fetchBriefings]);

  async function handleGenerate() {
    if (contributionsCount === 0 || generating) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Snapshot a stable status map at generation time so the print
      // route doesn't depend on live data.
      const statusByThemeId: Record<string, ThemeStatus> = {};
      exportThemes.forEach((t) => {
        statusByThemeId[t.id] = getStatus(t.id);
      });

      const body = {
        filter_state: {
          status: statusFilter,
          selectedThemeId,
          search: tableSearch,
          type: tableFilterType,
          location: tableFilterLocation,
        },
        snapshot_data: {
          themes: exportThemes,
          contributions: exportContributions.map((c) => {
            // Drop the attached themes — themes are stored separately in
            // the snapshot, joined back via theme.contribution_ids in the
            // print layout.
            const stripped: Record<string, unknown> = { ...c };
            delete stripped.themes;
            return stripped;
          }),
          locations,
          generationTimestamp: new Date().toISOString(),
          statusByThemeId,
        },
        contribution_count: contributionsCount,
        theme_count: themesCount,
        theme_generation_id: latestGenerationId,
      };

      const res = await fetch("/api/briefings/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as
        | { id: string; briefing_label: string }
        | { error: string };
      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : `Failed (${res.status})`);
      }

      window.open(`/analyze/briefing-print/${data.id}?print=1`, "_blank");
      void fetchBriefings();
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  const visibleBriefings = useMemo(
    () => (showAllBriefings ? briefings : briefings.slice(0, 10)),
    [briefings, showAllBriefings],
  );

  return (
    <section
      id="panel-export"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(11,29,58,0.10)",
        boxShadow: "0 2px 8px -2px rgba(11,29,58,0.06)",
      }}
    >
      <PanelHeader
        title="Export & Briefing Archive"
        subtitle="Download the current view as data, or as a printable briefing"
        fileLabel="PANEL · 05"
      />

      <div className="export-panel-grid">
        <div>
          <SectionLabel>Data exports</SectionLabel>

          <button
            onClick={() =>
              triggerCsvDownload(
                buildContributionsCsv(exportContributions, getStatus),
                `ibx-contributions-${todayDateString()}.csv`,
              )
            }
            type="button"
            disabled={contributionsCount === 0}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 18px",
              background: contributionsCount === 0 ? "#6B7A8C" : "#0B1D3A",
              color: "#FFFFFF",
              border: "none",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: contributionsCount === 0 ? "not-allowed" : "pointer",
              width: "100%",
              justifyContent: "center",
              transition: "background 150ms",
            }}
            onMouseEnter={(e) => {
              if (contributionsCount > 0)
                e.currentTarget.style.background = "#162d51";
            }}
            onMouseLeave={(e) => {
              if (contributionsCount > 0)
                e.currentTarget.style.background = "#0B1D3A";
            }}
          >
            <Download size={14} strokeWidth={2.5} />
            Download contributions (CSV)
          </button>
          <p style={subtitleStyle}>
            Raw rows · respects current filters · {contributionsCount} item
            {contributionsCount === 1 ? "" : "s"}
          </p>

          <button
            onClick={() =>
              triggerCsvDownload(
                buildThemesCsv(exportThemes, getStatus),
                `ibx-themes-${todayDateString()}.csv`,
              )
            }
            type="button"
            disabled={themesCount === 0}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 18px",
              background: "transparent",
              color: themesCount === 0 ? "#8899AA" : "#0B1D3A",
              border: `1px solid ${
                themesCount === 0
                  ? "rgba(11,29,58,0.12)"
                  : "rgba(11,29,58,0.25)"
              }`,
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: themesCount === 0 ? "not-allowed" : "pointer",
              width: "100%",
              justifyContent: "center",
              transition: "all 150ms",
              marginTop: 16,
            }}
            onMouseEnter={(e) => {
              if (themesCount > 0)
                e.currentTarget.style.background = "rgba(11,29,58,0.04)";
            }}
            onMouseLeave={(e) => {
              if (themesCount > 0)
                e.currentTarget.style.background = "transparent";
            }}
          >
            <Download size={14} strokeWidth={2.5} />
            Download themes summary (CSV)
          </button>
          <p style={subtitleStyle}>
            Themes with voice counts and demographic breakdown · {themesCount}{" "}
            theme{themesCount === 1 ? "" : "s"}
          </p>
        </div>

        <div>
          <SectionLabel>Briefing document</SectionLabel>

          <button
            onClick={handleGenerate}
            type="button"
            disabled={contributionsCount === 0 || generating}
            title={
              contributionsCount === 0
                ? "No contributions match the current filter."
                : undefined
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 18px",
              background:
                contributionsCount === 0
                  ? "rgba(244,117,96,0.45)"
                  : generating
                    ? "#E5654F"
                    : "#F47560",
              color: "#FFFFFF",
              border: "none",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor:
                contributionsCount === 0 || generating
                  ? "not-allowed"
                  : "pointer",
              width: "100%",
              justifyContent: "center",
              transition: "background 150ms",
            }}
            onMouseEnter={(e) => {
              if (contributionsCount > 0 && !generating)
                e.currentTarget.style.background = "#E5654F";
            }}
            onMouseLeave={(e) => {
              if (contributionsCount > 0 && !generating)
                e.currentTarget.style.background = "#F47560";
            }}
          >
            {generating ? (
              <>
                <Loader2
                  size={14}
                  strokeWidth={2.5}
                  style={{
                    animation: "export-panel-spin 1s linear infinite",
                  }}
                />
                Generating…
              </>
            ) : (
              <>
                <FileText size={14} strokeWidth={2.5} />
                Generate new briefing
              </>
            )}
          </button>
          <p style={subtitleStyle}>
            Captures the current filtered state. ~5 seconds to generate.
          </p>
          {generateError && (
            <p
              style={{
                ...subtitleStyle,
                color: "#A8412F",
                marginTop: 4,
              }}
            >
              Couldn&apos;t generate briefing. {generateError}
            </p>
          )}

          <div style={{ marginTop: 22 }}>
            <SectionLabel>Past briefings</SectionLabel>
            {archiveLoading ? (
              <p
                style={{
                  ...subtitleStyle,
                  color: "#8899AA",
                  margin: 0,
                }}
              >
                Loading archive…
              </p>
            ) : archiveError ? (
              <p
                style={{
                  ...subtitleStyle,
                  color: "#A8412F",
                  margin: 0,
                }}
              >
                Couldn&apos;t load archive. {archiveError}
              </p>
            ) : briefings.length === 0 ? (
              <p
                style={{
                  ...subtitleStyle,
                  color: "#8899AA",
                  margin: 0,
                }}
              >
                No past briefings yet. Generate one to start the archive.
              </p>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid rgba(11,29,58,0.08)",
                  }}
                >
                  {visibleBriefings.map((b, i) => (
                    <BriefingArchiveRow
                      key={b.id}
                      briefing={b}
                      isFirst={i === 0}
                    />
                  ))}
                </div>
                {!showAllBriefings && briefings.length > 10 && (
                  <button
                    onClick={() => setShowAllBriefings(true)}
                    type="button"
                    style={{
                      marginTop: 8,
                      padding: "4px 0",
                      background: "transparent",
                      border: "none",
                      color: "#0B1D3A",
                      fontFamily:
                        "var(--font-jetbrains-mono), monospace",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    View all {briefings.length} briefings →
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .export-panel-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 28px;
          padding: 24px;
        }
        @media (max-width: 840px) {
          .export-panel-grid {
            grid-template-columns: 1fr;
          }
        }
        @keyframes export-panel-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}

function BriefingArchiveRow({
  briefing,
  isFirst,
}: {
  briefing: PastBriefing;
  isFirst: boolean;
}) {
  const date = new Date(briefing.generated_at);
  const dateLabel = date
    .toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
  const timeLabel = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderTop: isFirst ? "none" : "1px solid rgba(11,29,58,0.06)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 10.5,
            color: "#0B1D3A",
            letterSpacing: "0.1em",
            fontWeight: 600,
          }}
        >
          {dateLabel} · {timeLabel}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#6B7A8C",
            marginTop: 2,
          }}
        >
          {briefing.contribution_count} contribution
          {briefing.contribution_count === 1 ? "" : "s"} ·{" "}
          {briefing.theme_count} theme
          {briefing.theme_count === 1 ? "" : "s"}
        </div>
      </div>
      <a
        href={`/analyze/briefing-print/${briefing.id}?print=1`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 10.5,
          color: "#0F8A7E",
          textDecoration: "none",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        Download
      </a>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: 9,
        color: "#8899AA",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        fontWeight: 600,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

const subtitleStyle: React.CSSProperties = {
  fontSize: 11.5,
  color: "#6B7A8C",
  margin: "8px 0 0",
  lineHeight: 1.5,
  fontFamily: "var(--font-jetbrains-mono), monospace",
  letterSpacing: "0.04em",
};
