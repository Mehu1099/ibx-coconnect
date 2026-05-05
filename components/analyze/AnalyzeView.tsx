"use client";

import { motion } from "framer-motion";
import { ArrowRight, Compass, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { EXPLORE_LOCATIONS } from "@/lib/explore-locations";
import { useEngageData } from "@/lib/use-engage-data";
import { useThemeStatuses } from "@/lib/use-theme-statuses";
import { type Theme, useThemes } from "@/lib/use-themes";
import AnalyzeHeader, { type StatusFilter } from "./AnalyzeHeader";
import AnalyzeLoadingScreen from "./AnalyzeLoadingScreen";
import AnalyzeTutorial from "./AnalyzeTutorial";
import ContributionsTable from "./ContributionsTable";
import DemographicMatrix from "./DemographicMatrix";
import ExportPanel from "./ExportPanel";
import SpatialDensityPanel from "./SpatialDensityPanel";
import SplashAnimation from "./SplashAnimation";
import ThemeStatusBoard from "./ThemeStatusBoard";

export default function AnalyzeView() {
  const router = useRouter();
  const { isLoading: authLoading, isStakeholder } = useAuth();

  const { themes, latestGeneratedAt, latestGenerationId } = useThemes();
  const { getStatus, setStatus } = useThemeStatuses();
  const { allContributions, isLoading: contributionsLoading } = useEngageData();

  // "New" = contributions whose created_at is strictly after the most
  // recent theme generation. Reuses already-fetched client data — no
  // new Supabase round-trip.
  const newContributionsCount = useMemo(() => {
    if (!latestGeneratedAt) return 0;
    const cutoff = new Date(latestGeneratedAt).getTime();
    return allContributions.filter(
      (c) => new Date(c.createdAt).getTime() > cutoff,
    ).length;
  }, [allContributions, latestGeneratedAt]);

  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tableSearch, setTableSearch] = useState("");
  const [tableFilterType, setTableFilterType] = useState("all");
  const [tableFilterLocation, setTableFilterLocation] = useState("all");

  // Enrich each contribution with its themes via the canonical
  // ${type}:${rawId} key. Computed once here so ContributionsTable, the
  // export, and any future consumer share the same enriched list.
  const enrichedContributions = useMemo(() => {
    const themesByCid = new Map<string, Theme[]>();
    themes.forEach((t) => {
      t.contribution_ids.forEach((cid) => {
        const arr = themesByCid.get(cid) ?? [];
        arr.push(t);
        themesByCid.set(cid, arr);
      });
    });
    return allContributions.map((c) => ({
      ...c,
      themes: themesByCid.get(`${c.type}:${c.rawId}`) ?? [],
    }));
  }, [allContributions, themes]);

  // What gets exported — applies all five filters (table search/type/
  // location plus page-level status chip and selected theme). The CSV
  // is intentionally narrower than the visible table when status or a
  // theme is active.
  const exportContributions = useMemo(() => {
    let list = enrichedContributions;
    if (tableFilterType !== "all")
      list = list.filter((c) => c.type === tableFilterType);
    if (tableFilterLocation !== "all")
      list = list.filter((c) => c.locationId === tableFilterLocation);
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.content.toLowerCase().includes(q) ||
          c.contributorRole.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((c) =>
        c.themes.some((t) => getStatus(t.id) === statusFilter),
      );
    }
    if (selectedThemeId) {
      list = list.filter((c) =>
        c.themes.some((t) => t.id === selectedThemeId),
      );
    }
    return list;
  }, [
    enrichedContributions,
    tableSearch,
    tableFilterType,
    tableFilterLocation,
    statusFilter,
    selectedThemeId,
    getStatus,
  ]);

  const exportThemes = useMemo(() => {
    if (statusFilter === "all") return themes;
    return themes.filter((t) => getStatus(t.id) === statusFilter);
  }, [themes, statusFilter, getStatus]);

  const [loadingComplete, setLoadingComplete] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return (
        window.localStorage.getItem("ibx-analyze-first-visit-seen") === "true"
      );
    } catch {
      return true;
    }
  });

  const handleLoadingComplete = useCallback(() => {
    try {
      window.localStorage.setItem("ibx-analyze-first-visit-seen", "true");
    } catch {
      /* private browsing — accept it'll show again next visit */
    }
    setLoadingComplete(true);
  }, []);

  if (authLoading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#F2EDE0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 11,
            color: "#6B7A8C",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Verifying access…
        </div>
      </div>
    );
  }

  // Stakeholder-only — both unauthenticated and authenticated-but-not-
  // stakeholder land on the splash. The auth gate also runs at the row
  // level via RLS on theme_statuses; this is the UX-side guard so a non-
  // stakeholder never sees the panels at all.
  if (!isStakeholder) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#F2EDE0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          overflow: "hidden",
        }}
      >
        <SplashAnimation />

        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(0deg, rgba(11,29,58,0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(11,29,58,0.035) 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: "fixed",
            top: 32,
            left: 24,
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            color: "#8899AA",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.4,
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          IBX-FBC · A-200 · BRIEFING ROOM
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
          style={{
            position: "relative",
            maxWidth: 540,
            width: "100%",
            background: "#FFFFFF",
            border: "1px solid rgba(11,29,58,0.10)",
            padding: "44px 40px",
            boxShadow:
              "0 4px 16px -4px rgba(11,29,58,0.10), 0 24px 48px -12px rgba(11,29,58,0.12), 0 32px 64px -16px rgba(244,117,96,0.06)",
            zIndex: 2,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 12px",
              background: "rgba(26,191,173,0.10)",
              border: "1px solid rgba(26,191,173,0.3)",
              marginBottom: 24,
            }}
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.6, delay: 0.6, ease: "easeInOut" }}
              style={{ display: "flex" }}
            >
              <Compass size={12} strokeWidth={2.5} color="#0F8A7E" />
            </motion.div>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 9.5,
                color: "#0F8A7E",
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              Planner&apos;s Workspace
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
            style={{
              fontSize: 30,
              fontWeight: 600,
              color: "#0B1D3A",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              margin: "0 0 14px",
            }}
          >
            A quiet room for working with what the community has shared.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            style={{
              fontSize: 14.5,
              color: "#3a4a5c",
              lineHeight: 1.65,
              margin: "0 0 12px",
            }}
          >
            This is where planners and stakeholders sort through themes, look
            for spatial patterns, and prepare briefings for the community.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
            style={{
              fontSize: 14,
              color: "#6B7A8C",
              lineHeight: 1.65,
              margin: "0 0 32px",
            }}
          >
            If you&apos;re here to share your voice or see what others have
            said, the{" "}
            <strong style={{ color: "#0B1D3A" }}>Explore</strong> and{" "}
            <strong style={{ color: "#0B1D3A" }}>Engage</strong> pages are
            open to everyone.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
            style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
          >
            <button
              onClick={() => router.push("/explore")}
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 20px",
                background: "#0B1D3A",
                color: "#fff",
                border: "none",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "transform 150ms, background 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Explore the neighborhood
              <ArrowRight size={14} strokeWidth={2.5} />
            </button>

            <button
              onClick={() => router.push("/stakeholder?redirect=/analyze")}
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 18px",
                background: "transparent",
                color: "#3a4a5c",
                border: "1px solid rgba(11,29,58,0.18)",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(11,29,58,0.04)";
                e.currentTarget.style.borderColor = "rgba(11,29,58,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(11,29,58,0.18)";
              }}
            >
              <KeyRound size={12} strokeWidth={2.5} />
              I&apos;m a stakeholder
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#F2EDE0",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `
            linear-gradient(0deg, rgba(11,29,58,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(11,29,58,0.04) 1px, transparent 1px),
            linear-gradient(0deg, rgba(11,29,58,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(11,29,58,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "128px 128px, 128px 128px, 32px 32px, 32px 32px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 80,
          left: 16,
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 9,
          color: "#8899AA",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          opacity: 0.5,
          zIndex: 1,
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          pointerEvents: "none",
        }}
      >
        BRIEFING · IBX-FBC · A-200
      </div>

      <AnalyzeHeader
        themesCount={themes.length}
        contributionsCount={allContributions.length}
        latestGeneratedAt={latestGeneratedAt}
        newContributionsCount={newContributionsCount}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <main
        style={{
          position: "relative",
          zIndex: 2,
          padding: "24px 32px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <ThemeStatusBoard
          themes={themes}
          contributions={allContributions}
          getStatus={getStatus}
          setStatus={setStatus}
          statusFilter={statusFilter}
          selectedThemeId={selectedThemeId}
          onThemeClick={setSelectedThemeId}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          <DemographicMatrix
            themes={themes}
            selectedThemeId={selectedThemeId}
          />

          <SpatialDensityPanel
            themes={themes}
            contributions={allContributions}
            locations={EXPLORE_LOCATIONS}
            selectedThemeId={selectedThemeId}
          />
        </div>

        <ContributionsTable
          contributions={allContributions}
          themes={themes}
          isLoading={contributionsLoading}
          search={tableSearch}
          onSearchChange={setTableSearch}
          filterType={tableFilterType}
          onFilterTypeChange={setTableFilterType}
          filterLocation={tableFilterLocation}
          onFilterLocationChange={setTableFilterLocation}
        />

        <ExportPanel
          exportContributions={exportContributions}
          exportThemes={exportThemes}
          getStatus={getStatus}
          statusFilter={statusFilter}
          selectedThemeId={selectedThemeId}
          tableSearch={tableSearch}
          tableFilterType={tableFilterType}
          tableFilterLocation={tableFilterLocation}
          latestGenerationId={latestGenerationId}
          locations={EXPLORE_LOCATIONS}
        />
      </main>

      <AnalyzeTutorial loadingComplete={loadingComplete} />

      {!loadingComplete && (
        <AnalyzeLoadingScreen onComplete={handleLoadingComplete} />
      )}
    </div>
  );
}
