"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { Contribution } from "@/lib/use-engage-data";
import { formatTimeAgo } from "@/lib/use-engage-data";
import type { Theme } from "@/lib/use-themes";
import { RefreshThemesButton } from "./RefreshThemesButton";
import { ThemeCard } from "./ThemeCard";

interface ThemesRailProps {
  contributionCount: number;
  selectedLocationId: string | null;
  // Theme data + selection — wired in 10B. When `concernThemes` /
  // `visionThemes` are empty the rail falls back to the 10A empty
  // state + preview card.
  concernThemes: Theme[];
  visionThemes: Theme[];
  hasThemes: boolean;
  latestGeneratedAt: string | null;
  selectedThemeId: string | null;
  onSelectTheme: (id: string | null) => void;
  // Used by ThemeCard to render quotes when a card is expanded.
  allContributions: Contribution[];
}

const RAIL_WIDTH = 340;

export function ThemesRail({
  contributionCount,
  selectedLocationId,
  concernThemes,
  visionThemes,
  hasThemes,
  latestGeneratedAt,
  selectedThemeId,
  onSelectTheme,
  allContributions,
}: ThemesRailProps) {
  return (
    <aside
      style={{
        position: "absolute",
        top: 90,
        left: 20,
        bottom: 110,
        width: RAIL_WIDTH,
        zIndex: 30,
        // Frosted glass: 78% white over a full-bleed Brooklyn grid so
        // the panel actually has texture to diffuse. The double inset
        // shadow (top highlight + 1px inner edge) reads as a real
        // glass-plate bevel.
        background: "rgba(255, 255, 255, 0.78)",
        backdropFilter: "blur(28px) saturate(1.4)",
        WebkitBackdropFilter: "blur(28px) saturate(1.4)",
        borderRadius: 14,
        border: "1px solid rgba(255, 255, 255, 0.65)",
        boxShadow:
          "0 8px 32px -8px rgba(11, 29, 58, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 18px 14px",
          borderBottom: "1px solid rgba(11, 29, 58, 0.06)",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: 15,
                fontWeight: 600,
                color: "#0B1D3A",
                letterSpacing: "-0.01em",
              }}
            >
              Themes &amp; Patterns
            </h2>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 9.5,
                color: "#8899AA",
                letterSpacing: "0.14em",
              }}
            >
              FILE · 01
            </span>
          </div>
          <p
            style={{
              margin: "4px 0 0",
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: 12,
              color: "#6B7A8C",
              lineHeight: 1.5,
            }}
          >
            {hasThemes
              ? `${concernThemes.length + visionThemes.length} themes across ${contributionCount} contribution${contributionCount === 1 ? "" : "s"}${selectedLocationId ? ` at LOC-${selectedLocationId}` : ""}`
              : `AI-clustered patterns across ${contributionCount} contribution${contributionCount === 1 ? "" : "s"}${selectedLocationId ? ` at LOC-${selectedLocationId}` : ""}`}
          </p>
          {hasThemes && latestGeneratedAt && (
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 9.5,
                color: "#8899AA",
                letterSpacing: "0.1em",
                marginTop: 4,
              }}
            >
              GENERATED · {formatTimeAgo(latestGeneratedAt).toUpperCase()}
            </div>
          )}
        </div>

        <RefreshThemesButton />
      </div>

      <div
        className="engage-themes-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: "16px 14px 18px",
        }}
      >
        {hasThemes ? (
          <>
            <ThemeGroupReal
              kind="concerns"
              label="Concerns & Ideas"
              themes={concernThemes}
              numPrefix="C"
              selectedThemeId={selectedThemeId}
              onSelectTheme={onSelectTheme}
              allContributions={allContributions}
            />
            <ThemeGroupReal
              kind="visions"
              label="Visions for the Future"
              themes={visionThemes}
              numPrefix="V"
              selectedThemeId={selectedThemeId}
              onSelectTheme={onSelectTheme}
              allContributions={allContributions}
            />
          </>
        ) : (
          <>
            <ThemesEmptyState contributionCount={contributionCount} />
            <ThemeGroupEmpty
              kind="concerns"
              label="Concerns & Ideas"
            />
            <ThemeGroupEmpty
              kind="visions"
              label="Visions for the Future"
            />
            <ThemePreview />
          </>
        )}
      </div>

      <style jsx>{`
        .engage-themes-scroll {
          scrollbar-width: thin;
          scrollbar-color: #e0dcd4 transparent;
        }
        .engage-themes-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .engage-themes-scroll::-webkit-scrollbar-thumb {
          background: #e0dcd4;
          border-radius: 3px;
        }
      `}</style>
    </aside>
  );
}

function ThemesEmptyState({
  contributionCount,
}: {
  contributionCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: "#FBF6EE",
        border: "1px solid rgba(11,29,58,0.08)",
        borderRadius: 12,
        padding: "16px 16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, rgba(244,117,96,0.18) 0%, rgba(26,191,173,0.18) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#F47560",
            flexShrink: 0,
          }}
        >
          <Sparkles size={18} strokeWidth={2} />
        </motion.div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: "#0B1D3A",
              letterSpacing: "-0.01em",
            }}
          >
            AI clustering arriving
          </div>
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 9.5,
              color: "#8899AA",
              letterSpacing: "0.14em",
              marginTop: 3,
            }}
          >
            ANALYSIS · PENDING
          </div>
        </div>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: 12.5,
          color: "#3a4a5c",
          lineHeight: 1.55,
        }}
      >
        {contributionCount === 0
          ? "Once community members share their thoughts, AI will cluster them into themes that emerge across the corridor."
          : `Stakeholders will be able to generate AI-clustered themes from these ${contributionCount} contributions to surface patterns across the corridor.`}
      </p>
    </motion.div>
  );
}

function ThemeGroupHeader({
  kind,
  label,
  count,
}: {
  kind: "concerns" | "visions";
  label: string;
  count: string;
}) {
  const fill = kind === "concerns" ? "#F47560" : "#1ABFAD";
  const stroke = kind === "concerns" ? "#D85A45" : "#0F8A7E";
  const halo =
    kind === "concerns" ? "rgba(244,117,96,0.18)" : "rgba(26,191,173,0.18)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 4px 10px",
        marginTop: 12,
        borderTop: "1px solid rgba(11,29,58,0.08)",
      }}
    >
      {/* Halo swatch — wrapper holds the glow square, inner div is the
          solid swatch. Building it as two layered absolutes (instead of
          a box-shadow halo) gives the glow a sharp square edge that
          matches the swatch shape. */}
      <div
        aria-hidden
        style={{
          position: "relative",
          width: 14,
          height: 14,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -4,
            background: halo,
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: fill,
            border: `1px solid ${stroke}`,
          }}
        />
      </div>

      <span
        style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: "#0B1D3A",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </span>

      {/* Count tag with its own subtle background — anchors the right
          edge of the group header. */}
      <span
        style={{
          marginLeft: "auto",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 9.5,
          color: "#6B7A8C",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "3px 8px",
          background: "rgba(11,29,58,0.04)",
          borderRadius: 2,
        }}
      >
        {count}
      </span>
    </div>
  );
}

function ThemeGroupEmpty({
  kind,
  label,
}: {
  kind: "concerns" | "visions";
  label: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <ThemeGroupHeader kind={kind} label={label} count="0 cards" />
      <div
        style={{
          padding: "10px 12px",
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: 12,
          fontStyle: "italic",
          color: "#8899AA",
          textAlign: "center",
          background: "#FBF6EE",
          border: "1px dashed rgba(11,29,58,0.10)",
          borderRadius: 8,
        }}
      >
        — No themes yet —
      </div>
    </div>
  );
}

function ThemeGroupReal({
  kind,
  label,
  themes,
  numPrefix,
  selectedThemeId,
  onSelectTheme,
  allContributions,
}: {
  kind: "concerns" | "visions";
  label: string;
  themes: Theme[];
  numPrefix: "C" | "V";
  selectedThemeId: string | null;
  onSelectTheme: (id: string | null) => void;
  allContributions: Contribution[];
}) {
  if (themes.length === 0) {
    return <ThemeGroupEmpty kind={kind} label={label} />;
  }
  const countLabel = `${themes.length} card${themes.length === 1 ? "" : "s"}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <ThemeGroupHeader kind={kind} label={label} count={countLabel} />
      {themes.map((theme, i) => {
        const fileNum = `${numPrefix}-${String(i + 1).padStart(2, "0")}`;
        const isActive = selectedThemeId === theme.id;
        return (
          <ThemeCard
            key={theme.id}
            theme={theme}
            fileNum={fileNum}
            index={i}
            isActive={isActive}
            onSelect={() => onSelectTheme(isActive ? null : theme.id)}
            contributions={allContributions}
          />
        );
      })}
    </div>
  );
}

// Worked-example card sitting at the bottom of the rail in the empty
// state. Clearly labeled "PREVIEW" with C-EX so users don't mistake it
// for a real cluster.
function ThemePreview() {
  const SAMPLE_ACTIVE = new Set([0, 1, 2, 5]);

  return (
    <div style={{ padding: "8px 4px 4px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 4,
            height: 4,
            background: "rgba(11,29,58,0.4)",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            color: "rgba(11,29,58,0.5)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          PREVIEW · How themes will appear
        </span>
      </div>

      <div
        style={{
          position: "relative",
          background: "rgba(255, 255, 255, 0.6)",
          border: "1px dashed rgba(11,29,58,0.15)",
          padding: "14px 14px 12px",
          opacity: 0.85,
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: "#F47560",
            backgroundImage:
              "radial-gradient(circle at 12px 2.5px, rgba(255,255,255,0.5) 1.5px, transparent 1.5px), radial-gradient(circle at 32px 2.5px, rgba(255,255,255,0.5) 1.5px, transparent 1.5px), radial-gradient(circle at 52px 2.5px, rgba(255,255,255,0.5) 1.5px, transparent 1.5px)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 9,
            right: 10,
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            color: "rgba(11,29,58,0.5)",
            letterSpacing: "0.14em",
          }}
        >
          C-EX
        </div>

        <div
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: "#0B1D3A",
            marginTop: 4,
            marginRight: 30,
            letterSpacing: "-0.01em",
          }}
        >
          Pedestrian safety at intersections
        </div>
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 10,
            color: "#D85A45",
            fontWeight: 600,
            marginTop: 2,
            letterSpacing: "0.04em",
          }}
        >
          6 contributions
        </div>

        <p
          style={{
            margin: "8px 0 0",
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: 11.5,
            color: "#3a4a5c",
            lineHeight: 1.5,
          }}
        >
          Residents and parents flag dangerous crossings at major
          intersections, citing fast crosswalk timers and red-light
          running.
        </p>

        <div
          style={{
            display: "flex",
            gap: 2,
            marginTop: 10,
            paddingTop: 8,
            borderTop: "1px dashed rgba(11,29,58,0.1)",
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const active = SAMPLE_ACTIVE.has(i);
            return (
              <div
                key={i}
                aria-hidden
                style={{
                  flex: 1,
                  height: 18,
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active ? "#F47560" : "rgba(11,29,58,0.04)",
                  color: active ? "#fff" : "rgba(11,29,58,0.4)",
                  fontWeight: active ? 700 : 500,
                  border: active
                    ? "1px solid #D85A45"
                    : "1px solid rgba(11,29,58,0.06)",
                  letterSpacing: "0.02em",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
