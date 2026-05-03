"use client";

import { AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { EXPLORE_LOCATIONS } from "@/lib/explore-locations";
import { getThemeColor } from "@/lib/theme-colors";
import { useEngageData, type Contribution } from "@/lib/use-engage-data";
import { useThemes } from "@/lib/use-themes";
import { EngageHeader } from "./EngageHeader";
import { EngageMap } from "./EngageMap";
import { EngageTutorial } from "./EngageTutorial";
import { ExpandedView } from "./ExpandedView";
import { StatsStrip } from "./StatsStrip";
import { ThemesRail } from "./ThemesRail";
import { VoicesFeed } from "./VoicesFeed";

// Top-level Engage composition: full-bleed Living Desk surface with the
// glass header on top, two side rails, the bottom stats strip floating
// over the map, and an ExpandedView modal that opens when a feed card
// is clicked. All cross-zone state lives in useEngageData.

export function EngageView() {
  const {
    allContributions,
    filteredContributions: locationTypeFiltered,
    locationCounts,
    isLoading,
    selectedLocationId,
    setSelectedLocationId,
    selectedTypes,
    setSelectedTypes,
    recentlyArrivedIds,
  } = useEngageData();

  const {
    themes,
    concernThemes,
    visionThemes,
    latestGeneratedAt,
    hasThemes,
  } = useThemes();

  const [expandedContribution, setExpandedContribution] =
    useState<Contribution | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  // Layered filter: useEngageData already handled location + type. Then
  // we layer the theme filter here, since `themes` lives in EngageView
  // (not the hook). When a theme is selected we narrow to only its
  // contribution_ids; otherwise pass through the location-type list.
  const filteredContributions = useMemo(() => {
    if (!selectedThemeId) return locationTypeFiltered;
    const theme = themes.find((t) => t.id === selectedThemeId);
    if (!theme) return locationTypeFiltered;
    const ids = new Set(theme.contribution_ids);
    return locationTypeFiltered.filter((c) =>
      ids.has(`${c.type}:${c.rawId}`),
    );
  }, [locationTypeFiltered, selectedThemeId, themes]);

  // Resolved selected theme + the data the map needs to drive its
  // pastel signature highlight. Null/empty when no theme is selected,
  // which the map treats as the default coral-palette state.
  const selectedTheme = useMemo(
    () => themes.find((t) => t.id === selectedThemeId) ?? null,
    [themes, selectedThemeId],
  );

  const selectedThemeStations = useMemo(
    () =>
      selectedTheme
        ? Object.keys(selectedTheme.station_distribution)
        : [],
    [selectedTheme],
  );

  const selectedThemeColor = useMemo(
    () =>
      selectedTheme
        ? getThemeColor(selectedTheme.name, selectedTheme.kind)
        : null,
    [selectedTheme],
  );

  // Three call paths: pin click (passes the id, toggles), map background
  // click (passes "" to clear), or "Clear filters" button on the feed
  // (passes through onClearFilters → setSelectedLocationId(null) directly).
  const handleLocationClick = (id: string) => {
    if (id === "" || id === selectedLocationId) {
      setSelectedLocationId(null);
    } else {
      setSelectedLocationId(id);
    }
  };

  const handleClearFilters = () => {
    setSelectedLocationId(null);
    setSelectedTypes(["all"]);
    setSelectedThemeId(null);
  };

  const totalVoices = allContributions.length;
  const hotZones = locationCounts.filter((l) => l.hot && l.total > 0).length;
  const activeLocations = locationCounts.filter((l) => l.total > 0).length;
  const hasFilter =
    selectedLocationId !== null ||
    !selectedTypes.includes("all") ||
    selectedThemeId !== null;

  const expandedLocation = expandedContribution
    ? EXPLORE_LOCATIONS.find((l) => l.id === expandedContribution.locationId)
    : undefined;

  return (
    // The root MUST stay a plain block — no transform / filter / opacity /
    // will-change / isolation / contain. Any of those would create a new
    // stacking context and clip the rails' backdrop-filter to within
    // this element, neutralising the glass diffusion of the layers
    // below.
    <div
      className="engage-app"
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "var(--font-space-grotesk), sans-serif",
      }}
    >
      {/* Layer 1 — cream base. Plain solid fill, full viewport. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "#F5F2EB",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Layer 2 — orthogonal grid. FULL-BLEED so it extends under the
          side rails: that's the only way the rails' backdrop-filter
          has anything to diffuse. Two scales: 32px primary lattice
          (0.045 opacity) + 128px major lines (0.025) for emphasis at
          every 4th line. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          backgroundImage: `repeating-linear-gradient(0deg, rgba(11,29,58,0.045) 0 1px, transparent 1px 32px), repeating-linear-gradient(90deg, rgba(11,29,58,0.045) 0 1px, transparent 1px 32px), repeating-linear-gradient(0deg, rgba(11,29,58,0.025) 0 1px, transparent 1px 128px), repeating-linear-gradient(90deg, rgba(11,29,58,0.025) 0 1px, transparent 1px 128px)`,
        }}
      />

      {/* Layer 3 — drafting marginalia. Wrapped in a single layer so
          they share a z-index and don't escape into the rail stack. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 200,
            left: 8,
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            color: "rgba(11,29,58,0.25)",
            letterSpacing: "0.18em",
            transform: "rotate(-90deg)",
            transformOrigin: "top left",
            whiteSpace: "nowrap",
          }}
        >
          DRWG · IBX-FBC · A-100
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 160,
            right: 8,
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            color: "rgba(11,29,58,0.25)",
            letterSpacing: "0.18em",
            transform: "rotate(-90deg)",
            transformOrigin: "top right",
            whiteSpace: "nowrap",
          }}
        >
          SCALE · 1:2400 · NORTH ↑
        </div>
      </div>

      <EngageMap
        locations={EXPLORE_LOCATIONS}
        locationCounts={locationCounts}
        selectedLocationId={selectedLocationId}
        onLocationClick={handleLocationClick}
        selectedThemeStations={selectedThemeStations}
        selectedThemeColor={selectedThemeColor}
      />

      <EngageHeader totalVoices={totalVoices} />

      <ThemesRail
        contributionCount={filteredContributions.length}
        selectedLocationId={selectedLocationId}
        concernThemes={concernThemes}
        visionThemes={visionThemes}
        hasThemes={hasThemes}
        latestGeneratedAt={latestGeneratedAt}
        selectedThemeId={selectedThemeId}
        onSelectTheme={setSelectedThemeId}
        allContributions={allContributions}
      />

      <VoicesFeed
        contributions={filteredContributions}
        allContributions={allContributions}
        isLoading={isLoading}
        selectedLocationId={selectedLocationId}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        onClearFilters={handleClearFilters}
        hasFilter={hasFilter}
        recentlyArrivedIds={recentlyArrivedIds}
        onContributionClick={setExpandedContribution}
      />

      <StatsStrip
        totalVoices={totalVoices}
        hotZones={hotZones}
        activeLocations={activeLocations}
        contributions={allContributions}
      />

      <AnimatePresence>
        {expandedContribution && (
          <ExpandedView
            key={expandedContribution.id}
            contribution={expandedContribution}
            location={expandedLocation}
            onClose={() => setExpandedContribution(null)}
          />
        )}
      </AnimatePresence>

      {/* First-visit walkthrough; localStorage-gated. The header's
          "?" button can re-open it via a window custom event. */}
      <EngageTutorial />
    </div>
  );
}
