"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { ExploreLocation } from "@/lib/explore-locations";
import { getContrastTextColor, getThemeColor } from "@/lib/theme-colors";
import type { Contribution } from "@/lib/use-engage-data";
import type { Theme } from "@/lib/use-themes";
import PanelHeader from "./PanelHeader";

interface Props {
  themes: Theme[];
  contributions: Contribution[];
  locations: ExploreLocation[];
  selectedThemeId: string | null;
}

type ViewMode = "all" | "concerns" | "visions";

export default function SpatialDensityPanel({
  themes,
  contributions,
  locations,
  selectedThemeId,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  // When a theme is selected, restrict the density to JUST that theme's
  // contributions so the planner can ask "where on the corridor is this
  // specific concern coming from?" Falls back to the full set otherwise.
  const themeFilteredIds = useMemo(() => {
    if (!selectedThemeId) return null;
    const theme = themes.find((t) => t.id === selectedThemeId);
    if (!theme) return null;
    return new Set(theme.contribution_ids);
  }, [selectedThemeId, themes]);

  const densityByLocation = useMemo(() => {
    const map: Record<string, number> = {};
    locations.forEach((loc) => {
      map[loc.id] = 0;
    });

    contributions.forEach((c) => {
      if (themeFilteredIds && !themeFilteredIds.has(`${c.type}:${c.rawId}`)) {
        return;
      }

      const isConcern =
        c.type === "concern" ||
        c.type === "sticky" ||
        c.type === "question_response";
      const isVision = c.type === "ai_proposal";

      if (
        viewMode === "all" ||
        (viewMode === "concerns" && isConcern) ||
        (viewMode === "visions" && isVision)
      ) {
        map[c.locationId] = (map[c.locationId] ?? 0) + 1;
      }
    });
    return map;
  }, [contributions, locations, viewMode, themeFilteredIds]);

  const maxDensity = useMemo(
    () => Math.max(...Object.values(densityByLocation), 1),
    [densityByLocation],
  );

  const selectedThemeColor = useMemo(() => {
    if (!selectedThemeId) return null;
    const theme = themes.find((t) => t.id === selectedThemeId);
    if (!theme) return null;
    return getThemeColor(theme.name, theme.kind);
  }, [selectedThemeId, themes]);

  return (
    <section
      id="tutorial-spatial-density"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(11,29,58,0.10)",
        boxShadow: "0 2px 8px -2px rgba(11,29,58,0.06)",
      }}
    >
      <PanelHeader
        title="Spatial Density"
        subtitle="Where on the corridor is the conversation happening?"
        fileLabel="PANEL · 03"
      />

      <div
        style={{
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid rgba(11,29,58,0.05)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            color: "#8899AA",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Show
        </span>
        {(["all", "concerns", "visions"] as ViewMode[]).map((m) => {
          const active = viewMode === m;
          return (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              type="button"
              style={{
                padding: "4px 10px",
                background: active ? "#0B1D3A" : "transparent",
                color: active ? "#fff" : "#6B7A8C",
                border: `1px solid ${active ? "#0B1D3A" : "rgba(11,29,58,0.15)"}`,
                fontSize: 10.5,
                fontWeight: 500,
                textTransform: "capitalize",
                cursor: "pointer",
              }}
            >
              {m}
            </button>
          );
        })}
        {themeFilteredIds && (
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 9,
              color: "#D85A45",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Theme-filtered
          </span>
        )}
      </div>

      <div
        style={{
          position: "relative",
          aspectRatio: "4 / 3",
          background: "#F2EDE0",
          overflow: "hidden",
        }}
      >
        <Image
          src="/explore/axonometric-base.jpg"
          alt="Flatbush corridor axonometric"
          fill
          sizes="(max-width: 1280px) 50vw, 600px"
          style={{ objectFit: "cover" }}
        />

        {locations.map((loc) => {
          const count = densityByLocation[loc.id] ?? 0;
          const intensity = count / maxDensity;
          const size = count > 0 ? 24 + intensity * 20 : 18;
          const opacity = count > 0 ? 0.85 + intensity * 0.15 : 0.4;

          const pinColor = selectedThemeColor
            ? selectedThemeColor.solid
            : count > 0
              ? "#F47560"
              : "#F9A48F";
          const labelColor = selectedThemeColor
            ? getContrastTextColor(selectedThemeColor.solid)
            : "#fff";
          const glow = selectedThemeColor
            ? selectedThemeColor.deep
            : "#F47560";

          return (
            <motion.div
              key={loc.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity, scale: 1 }}
              transition={{ duration: 0.4 }}
              style={{
                position: "absolute",
                left: `${loc.x}%`,
                top: `${loc.y}%`,
                transform: "translate(-50%, -50%)",
                width: size,
                height: size,
                borderRadius: "50%",
                background: pinColor,
                border: "2px solid #fff",
                boxShadow:
                  count > 0
                    ? `0 4px 12px -2px ${glow}80`
                    : `0 2px 6px -1px ${glow}33`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: labelColor,
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 11,
                fontWeight: 700,
                pointerEvents: "auto",
              }}
              title={`Location ${loc.id}: ${count} contribution${count === 1 ? "" : "s"}`}
            >
              {loc.id}
            </motion.div>
          );
        })}
      </div>

      <div
        style={{
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          borderTop: "1px solid rgba(11,29,58,0.05)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            color: "#8899AA",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Pin size = density
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#F9A48F",
              border: "1.5px solid #fff",
            }}
          />
          <span style={{ fontSize: 11, color: "#6B7A8C" }}>Low</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#F47560",
              border: "2px solid #fff",
            }}
          />
          <span style={{ fontSize: 11, color: "#6B7A8C" }}>High</span>
        </div>
      </div>
    </section>
  );
}
