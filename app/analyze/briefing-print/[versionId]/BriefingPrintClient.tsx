"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AIVisionsPage from "@/components/analyze/print/AIVisionsPage";
import {
  BriefingPrintStyles,
  PRINT_COLORS,
} from "@/components/analyze/print/BriefingChrome";
import ColophonPage from "@/components/analyze/print/ColophonPage";
import ContributionsAppendixPage from "@/components/analyze/print/ContributionsAppendixPage";
import CoverPage from "@/components/analyze/print/CoverPage";
import DemographicMatrixPrintPage from "@/components/analyze/print/DemographicMatrixPrintPage";
import ExecutiveSummaryPage from "@/components/analyze/print/ExecutiveSummaryPage";
import LocationSectionPage from "@/components/analyze/print/LocationSectionPage";
import SpatialDensityPrintPage from "@/components/analyze/print/SpatialDensityPrintPage";
import ThemeDeepDivePage from "@/components/analyze/print/ThemeDeepDivePage";
import ThemeIndexPage from "@/components/analyze/print/ThemeIndexPage";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase-client";
import type { ThemeStatus } from "@/lib/use-theme-statuses";
import type { Theme } from "@/lib/use-themes";

const APPENDIX_ROWS_PER_PAGE = 22;
const DEEP_DIVE_VOICES_PER_PAGE = 5;
const LOCATION_FIRST_PAGE_CARDS = 3;
const LOCATION_CONTINUATION_CARDS = 4;
const AI_VISIONS_PER_PAGE = 3;

// Display-only short names for each canonical location id. Duplicated
// here from the modal/CSV/API copies — promoting to a shared helper
// would touch more files than this prompt's scope.
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

interface BriefingRow {
  id: string;
  generated_at: string;
  generated_by: string | null;
  theme_generation_id: string | null;
  contribution_count: number;
  theme_count: number;
  filter_state: {
    status?: string;
    selectedThemeId?: string | null;
    search?: string;
    type?: string;
    location?: string;
  };
  snapshot_data: {
    themes: Theme[];
    contributions: AppendixContribution[];
    locations: SnapshotLocation[];
    generationTimestamp: string;
    statusByThemeId?: Record<string, ThemeStatus>;
  };
  executive_summary: string | null;
  briefing_label: string | null;
}

interface AppendixContribution {
  id: string;
  rawId: string;
  type: string;
  locationId: string;
  content: string;
  contributorRole: string;
  contributorAge: string;
  createdAt: string;
  // Optional AI-proposal fields. The snapshot's spread of the live
  // Contribution preserves these for ai_proposal rows; appendix and
  // location/deep-dive cards ignore them, but the AI Visions section
  // uses them to render the actual generated image + prompt.
  imageUrl?: string;
  prompt?: string;
  title?: string;
}

interface SnapshotLocation {
  id: string;
  label: string;
  description: string;
  image: string;
  category: string;
  x: number;
  y: number;
}

export default function BriefingPrintClient({
  versionId,
}: {
  versionId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading: authLoading, isAuthenticated, isStakeholder } = useAuth();

  const [briefing, setBriefing] = useState<BriefingRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wantPrint = searchParams.get("print") === "1";

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !isStakeholder) {
      const redirect = encodeURIComponent(
        `/analyze/briefing-print/${versionId}${wantPrint ? "?print=1" : ""}`,
      );
      router.replace(`/stakeholder?redirect=${redirect}`);
    }
  }, [authLoading, isAuthenticated, isStakeholder, router, versionId, wantPrint]);

  useEffect(() => {
    if (authLoading || !isStakeholder) return;
    let cancelled = false;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        const res = await fetch(`/api/briefings/${versionId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = (await res.json()) as
          | { briefing: BriefingRow }
          | { error: string };
        if (cancelled) return;
        if (!res.ok || "error" in data) {
          throw new Error(
            "error" in data ? data.error : `Failed (${res.status})`,
          );
        }
        setBriefing(data.briefing);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isStakeholder, versionId]);

  useEffect(() => {
    if (!wantPrint || !briefing) return;
    let cancelled = false;
    (async () => {
      try {
        if (typeof document !== "undefined" && document.fonts?.ready) {
          await document.fonts.ready;
        }
        const imgs = Array.from(document.images);
        await Promise.all(
          imgs.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  const done = () => resolve();
                  img.addEventListener("load", done, { once: true });
                  img.addEventListener("error", done, { once: true });
                }),
          ),
        );
        if (cancelled) return;
        window.setTimeout(() => {
          if (!cancelled) window.print();
        }, 350);
      } catch {
        /* swallow — user can still print manually */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wantPrint, briefing]);

  // Build the full page model from the snapshot. Total page count is
  // computed from the actual page array length (not arithmetic), so
  // chunked sections don't drift the count.
  const model = useMemo(() => {
    if (!briefing) return null;
    const themes = briefing.snapshot_data.themes ?? [];
    const contributions = (briefing.snapshot_data.contributions ?? []).slice();
    contributions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const locations = briefing.snapshot_data.locations ?? [];
    const statusByThemeId = briefing.snapshot_data.statusByThemeId ?? {};

    const locationsEngaged = new Set(contributions.map((c) => c.locationId))
      .size;

    // Group contributions by location, recency-sorted.
    const byLoc = new Map<string, AppendixContribution[]>();
    contributions.forEach((c) => {
      const arr = byLoc.get(c.locationId) ?? [];
      arr.push(c);
      byLoc.set(c.locationId, arr);
    });

    const locationSections = locations
      .filter((loc) => (byLoc.get(loc.id)?.length ?? 0) > 0)
      .map((loc) => {
        const all = byLoc.get(loc.id) ?? [];
        const chunks: AppendixContribution[][] = [];
        chunks.push(all.slice(0, LOCATION_FIRST_PAGE_CARDS));
        for (
          let i = LOCATION_FIRST_PAGE_CARDS;
          i < all.length;
          i += LOCATION_CONTINUATION_CARDS
        ) {
          chunks.push(all.slice(i, i + LOCATION_CONTINUATION_CARDS));
        }
        return {
          location: loc,
          chunks,
          totalCount: all.length,
        };
      });

    // Theme deep-dive: resolve contribution_ids to actual contribution
    // objects, sorted recency-desc, capped to the visible-cards limit.
    const contribById = new Map<string, AppendixContribution>();
    contributions.forEach((c) => {
      contribById.set(`${c.type}:${c.rawId}`, c);
    });
    const themeDeepDives = themes.map((t) => {
      const matched: AppendixContribution[] = [];
      (t.contribution_ids ?? []).forEach((cid) => {
        const c = contribById.get(cid);
        if (c) matched.push(c);
      });
      matched.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return {
        theme: t,
        voiceCards: matched.slice(0, DEEP_DIVE_VOICES_PER_PAGE),
        totalVoiceCount: matched.length,
      };
    });

    const appendixChunks: AppendixContribution[][] = [];
    for (let i = 0; i < contributions.length; i += APPENDIX_ROWS_PER_PAGE) {
      appendixChunks.push(contributions.slice(i, i + APPENDIX_ROWS_PER_PAGE));
    }
    if (appendixChunks.length === 0) appendixChunks.push([]);

    // AI proposals — recency-sorted, paginated. Skipped entirely if the
    // snapshot has none.
    const aiProposals = contributions.filter((c) => c.type === "ai_proposal");
    const aiProposalChunks: AppendixContribution[][] = [];
    for (let i = 0; i < aiProposals.length; i += AI_VISIONS_PER_PAGE) {
      aiProposalChunks.push(aiProposals.slice(i, i + AI_VISIONS_PER_PAGE));
    }
    const aiProposalLocationsRepresented = new Set(
      aiProposals.map((c) => c.locationId),
    ).size;

    // Page count = cover (1) + exec (1) + theme index (1) + deep dives (T)
    // + location pages (sum of chunks) + spatial (1) + demo matrix (1)
    // + ai-vision chunks + appendix chunks + colophon (1).
    const totalPages =
      1 +
      1 +
      1 +
      themeDeepDives.length +
      locationSections.reduce((sum, s) => sum + s.chunks.length, 0) +
      1 +
      1 +
      aiProposalChunks.length +
      appendixChunks.length +
      1;

    return {
      themes,
      contributions,
      locations,
      statusByThemeId,
      locationsEngaged,
      locationSections,
      themeDeepDives,
      aiProposals,
      aiProposalChunks,
      aiProposalLocationsRepresented,
      appendixChunks,
      totalPages,
    };
  }, [briefing]);

  if (error) {
    return (
      <ErrorScreen message={error} onRetry={() => window.location.reload()} />
    );
  }

  if (authLoading || !isStakeholder || !briefing || !model) {
    return <LoadingScreen />;
  }

  const generatedDateLabel = new Date(briefing.generated_at)
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();

  const filterStateLabel = humanFilterState(briefing.filter_state);

  let pageCursor = 2; // cover is page 1; sections start at 2

  return (
    <>
      <BriefingPrintStyles />
      <main className="briefing-root" aria-label="Briefing document">
        <CoverPage
          briefingId={briefing.id}
          generatedAt={briefing.generated_at}
          generatedDateLabel={generatedDateLabel}
          contributionCount={briefing.contribution_count}
          themeCount={briefing.theme_count}
        />

        <ExecutiveSummaryPage
          pageNumber={pageCursor++}
          totalPages={model.totalPages}
          generatedDateLabel={generatedDateLabel}
          executiveSummary={
            briefing.executive_summary ??
            "Executive summary unavailable for this briefing."
          }
          contributionCount={briefing.contribution_count}
          themeCount={briefing.theme_count}
          locationsEngaged={model.locationsEngaged}
        />

        <ThemeIndexPage
          pageNumber={pageCursor++}
          totalPages={model.totalPages}
          generatedDateLabel={generatedDateLabel}
          themes={model.themes}
          statusByThemeId={model.statusByThemeId}
        />

        {model.themeDeepDives.map((dd, idx) => (
          <ThemeDeepDivePage
            key={`deepDive-${dd.theme.id}`}
            pageNumber={pageCursor++}
            totalPages={model.totalPages}
            generatedDateLabel={generatedDateLabel}
            theme={dd.theme}
            themeIndex={idx + 1}
            themeTotal={model.themeDeepDives.length}
            status={model.statusByThemeId[dd.theme.id] ?? "unassigned"}
            voiceCards={dd.voiceCards}
            totalVoiceCount={dd.totalVoiceCount}
            locationShortNames={LOCATION_SHORT_NAMES}
          />
        ))}

        {model.locationSections.flatMap((section) =>
          section.chunks.map((chunk, ci) => (
            <LocationSectionPage
              key={`loc-${section.location.id}-${ci}`}
              pageNumber={pageCursor++}
              totalPages={model.totalPages}
              generatedDateLabel={generatedDateLabel}
              location={section.location}
              longName={
                LOCATION_SHORT_NAMES[section.location.id] ??
                section.location.label
              }
              contributions={chunk}
              themes={model.themes}
              chunkIndex={ci}
              chunkCount={section.chunks.length}
              totalContributionCount={section.totalCount}
            />
          )),
        )}

        <SpatialDensityPrintPage
          pageNumber={pageCursor++}
          totalPages={model.totalPages}
          generatedDateLabel={generatedDateLabel}
          locations={model.locations}
          contributions={model.contributions}
        />

        <DemographicMatrixPrintPage
          pageNumber={pageCursor++}
          totalPages={model.totalPages}
          generatedDateLabel={generatedDateLabel}
          themes={model.themes}
        />

        {model.aiProposalChunks.map((chunk, i) => (
          <AIVisionsPage
            key={`ai-visions-${i}`}
            pageNumber={pageCursor++}
            totalPages={model.totalPages}
            generatedDateLabel={generatedDateLabel}
            proposals={chunk}
            totalProposalCount={model.aiProposals.length}
            totalLocationsRepresented={model.aiProposalLocationsRepresented}
            chunkIndex={i}
            chunkCount={model.aiProposalChunks.length}
            locationShortNames={LOCATION_SHORT_NAMES}
          />
        ))}

        {model.appendixChunks.map((chunk, i) => (
          <ContributionsAppendixPage
            key={`appendix-${i}`}
            pageNumber={pageCursor++}
            totalPages={model.totalPages}
            generatedDateLabel={generatedDateLabel}
            asOfIso={briefing.generated_at}
            rows={chunk}
            totalRowCount={model.contributions.length}
            themes={model.themes}
            chunkIndex={i}
            chunkCount={model.appendixChunks.length}
          />
        ))}

        <ColophonPage
          pageNumber={pageCursor++}
          totalPages={model.totalPages}
          generatedDateLabel={generatedDateLabel}
          briefingId={briefing.id}
          generatedAt={briefing.generated_at}
          generatedByLabel="Planning Team"
          filterStateLabel={filterStateLabel}
        />
      </main>
    </>
  );
}

function humanFilterState(fs: BriefingRow["filter_state"]): string {
  const parts: string[] = [];
  parts.push(
    fs.status && fs.status !== "all"
      ? `Status: ${capitalize(fs.status)}`
      : "All statuses",
  );
  parts.push(fs.selectedThemeId ? "Single theme" : "All themes");
  if (fs.type && fs.type !== "all") parts.push(`Type: ${fs.type}`);
  if (fs.location && fs.location !== "all")
    parts.push(`Location: ${fs.location}`);
  if (fs.search) parts.push(`Search: "${fs.search}"`);
  return parts.join(" · ");
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

function LoadingScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: PRINT_COLORS.cream,
        color: PRINT_COLORS.navy,
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: 12,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
      }}
    >
      Preparing briefing…
    </div>
  );
}

function ErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: PRINT_COLORS.cream,
        color: PRINT_COLORS.navy,
        padding: 32,
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
        Couldn&apos;t load briefing
      </h2>
      <p style={{ color: PRINT_COLORS.navyDim, margin: 0 }}>{message}</p>
      <button
        onClick={onRetry}
        type="button"
        style={{
          padding: "10px 18px",
          background: PRINT_COLORS.navy,
          color: "#fff",
          border: "none",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Retry
      </button>
    </div>
  );
}

export type { AppendixContribution };
