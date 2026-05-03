"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { getRoleDisplay } from "@/lib/role-display";
import { getThemeColor } from "@/lib/theme-colors";
import type { Contribution } from "@/lib/use-engage-data";
import type { Theme } from "@/lib/use-themes";

interface ThemeCardProps {
  theme: Theme;
  fileNum: string; // e.g., "C-01" or "V-02"
  index: number; // position in its group, drives staggered entrance
  isActive: boolean;
  onSelect: () => void;
  contributions: Contribution[]; // full set; we filter to this theme's ids + derive age breakdown
}

// Clean white index card. The 4px solid coral/teal SIDE STRIP and the
// 5px punched TOP STRIP are the only kind-coloured surfaces — together
// they read as a file-folder tab on otherwise white paper. The card's
// signature THEME COLOUR (one of 12 warm jewel tones for concerns or
// 12 cool hues for visions) appears as a small dot in the top-right,
// and again as the selected-ring glow when the user filters by it.

export function ThemeCard({
  theme,
  fileNum,
  index,
  isActive,
  onSelect,
  contributions,
}: ThemeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isVision = theme.kind === "vision";
  const accentColor = isVision ? "#1ABFAD" : "#F47560";
  const accentDeep = isVision ? "#0F8A7E" : "#D85A45";

  // Per-theme jewel/pastel signature. Same theme name → same colour
  // across re-renders. Drives the dot, the selected ring, and the
  // matching pin halo on the map.
  const themeColor = getThemeColor(theme.name, theme.kind);

  const cardBorderColor = "rgba(11, 29, 58, 0.08)";

  // Filtered contributions for the expanded "See all voices" panel.
  const themeIdSet = useMemo(
    () => new Set(theme.contribution_ids),
    [theme.contribution_ids],
  );
  const themeContributions = useMemo(
    () => contributions.filter((c) => themeIdSet.has(`${c.type}:${c.rawId}`)),
    [contributions, themeIdSet],
  );

  // Roles come pre-aggregated from the API. Sort by count desc so the
  // dominant voice reads first.
  const roleEntries = useMemo(
    () =>
      Object.entries(theme.demographic_distribution).sort(
        ([, a], [, b]) => b - a,
      ),
    [theme.demographic_distribution],
  );

  // Age data isn't aggregated server-side; compute it client-side by
  // looking up the theme's contribution_ids in the full contributions
  // array. Each Contribution carries a pre-formatted contributorAge.
  const ageBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    theme.contribution_ids.forEach((cid) => {
      const c = contributions.find(
        (cc) => `${cc.type}:${cc.rawId}` === cid,
      );
      if (c?.contributorAge) {
        counts[c.contributorAge] = (counts[c.contributorAge] ?? 0) + 1;
      }
    });
    return counts;
  }, [theme.contribution_ids, contributions]);

  const ageEntries = useMemo(
    () =>
      Object.entries(ageBreakdown).sort(([a], [b]) => a.localeCompare(b)),
    [ageBreakdown],
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isActive ? 1.01 : 1,
      }}
      whileHover={{
        y: -2,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      transition={{
        duration: 0.5,
        ease: [0.2, 0.7, 0.2, 1],
        delay: index * 0.08,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: "#FFFFFF",
        // Border stays subtle navy in every state — the previous
        // active-border + outer-ring combo collided with the kind
        // strip and read as broken. Selection now lives INSIDE the
        // card (amplified strip + glowing dot + inset glow) plus a
        // deeper theme-tinted drop shadow.
        border: `1px solid ${cardBorderColor}`,
        borderRadius: 6,
        overflow: "hidden",
        cursor: "pointer",
        // Reserve space for the strips so children don't overlap them.
        paddingLeft: 4,
        paddingTop: 5,
        // Selected → three neutral navy layers (close, medium, far)
        // plus ONE distant theme-tinted layer at 15% alpha. The card
        // lifts dramatically but the shadow reads as neutral depth
        // with a hint of colour at the bottom of the throw — not a
        // coloured halo wrapping the card.
        boxShadow: isActive
          ? `0 2px 8px -2px rgba(11,29,58,0.08), 0 8px 24px -6px rgba(11,29,58,0.12), 0 20px 40px -12px rgba(11,29,58,0.10), 0 24px 48px -16px ${themeColor.solid}15`
          : hovered
            ? `0 1px 0 ${accentColor}25, 0 6px 20px -4px ${accentColor}30, 0 14px 32px -10px ${accentColor}15`
            : "0 1px 0 rgba(11,29,58,0.04), 0 4px 16px -4px rgba(11,29,58,0.10), 0 12px 28px -12px rgba(11,29,58,0.06)",
        transition:
          "box-shadow 280ms ease, transform 240ms ease, border-color 200ms ease",
      }}
    >
      {/* Side strip — kind-coloured tab on the left edge. Grows from
          4px to 6px when active and gains a vertical gradient + drop
          shadow so it reads as being pulled forward like a bookmark. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: isActive ? 6 : 4,
          background: isActive
            ? `linear-gradient(180deg, ${accentColor} 0%, ${accentDeep} 100%)`
            : accentColor,
          boxShadow: isActive
            ? `2px 0 8px -2px ${accentColor}50`
            : "none",
          zIndex: 2,
          transition:
            "width 240ms ease, background 240ms ease, box-shadow 240ms ease",
        }}
      />

      {/* Top strip — punched accent band, offset to clear the side
          strip (matches its width so the corner stays clean). */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: isActive ? 6 : 4,
          right: 0,
          height: 5,
          background: accentColor,
          backgroundImage:
            "radial-gradient(circle at 12px 2.5px, rgba(255,255,255,0.5) 1.5px, transparent 1.5px), radial-gradient(circle at 32px 2.5px, rgba(255,255,255,0.5) 1.5px, transparent 1.5px), radial-gradient(circle at 52px 2.5px, rgba(255,255,255,0.5) 1.5px, transparent 1.5px)",
          zIndex: 1,
          transition: "left 240ms ease",
        }}
      />

      {/* Inset glow inside the card when selected — only the faintest
          warmth biased slightly downward (matching natural light
          direction). The previous 1px inset ring + 16px spread was
          painting visible colour on the card edges; now it's an 8px
          downward-biased glow at 60% opacity. */}
      {isActive && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            boxShadow: `inset 0 1px 8px ${themeColor.soft}`,
            opacity: 0.6,
          }}
        />
      )}

      {/* Headline + big number + summary. Sections live directly in
          the card now (no wrapper) — the card's paddingLeft/Top above
          reserves space for the strips, so each section just needs its
          own internal padding. Backgrounds stay transparent so the
          card's white shows through. */}
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isActive}
        className="engage-theme-select"
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          padding: "16px 16px 14px",
          cursor: "pointer",
          color: "#0B1D3A",
          fontFamily: "var(--font-space-grotesk), sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            display: "flex",
            alignItems: "center",
            gap: 6,
            zIndex: 3,
          }}
        >
          {/* Signature dot — quiet at 8px when unselected, beacon at
              12px with layered ring shadows + a pulsing halo when the
              theme is the active filter. This is the primary
              "selected" signal now that the outer ring is gone. */}
          <span
            title={`${themeColor.name} signature`}
            aria-hidden
            style={{
              position: "relative",
              display: "inline-block",
              width: isActive ? 12 : 8,
              height: isActive ? 12 : 8,
              borderRadius: "50%",
              background: themeColor.solid,
              boxShadow: isActive
                ? `0 0 0 3px #fff, 0 0 0 6px ${themeColor.soft}, 0 0 0 9px ${themeColor.soft}, 0 2px 6px ${themeColor.deep}40`
                : `0 0 0 2px ${themeColor.soft}, 0 1px 2px rgba(11,29,58,0.1)`,
              transition:
                "width 240ms ease, height 240ms ease, box-shadow 280ms ease",
            }}
          >
            {isActive && (
              <motion.span
                aria-hidden
                animate={{
                  scale: [1, 1.6, 1],
                  opacity: [0.8, 0, 0.8],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  position: "absolute",
                  inset: -3,
                  borderRadius: "50%",
                  background: themeColor.soft,
                  pointerEvents: "none",
                  display: "block",
                }}
              />
            )}
          </span>
          <span
            aria-hidden
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 9,
              color: "#8899AA",
              letterSpacing: "0.14em",
            }}
          >
            {fileNum}
          </span>
        </div>

        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#0B1D3A",
            marginTop: 4,
            letterSpacing: "-0.015em",
            lineHeight: 1.3,
            marginBottom: 10,
            paddingRight: 36,
          }}
        >
          {theme.name}
        </div>

        {/* Big democratic-weight number. */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 26,
              fontWeight: 700,
              color: accentDeep,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {theme.contribution_count}
          </span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 10,
              color: accentDeep,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            {theme.contribution_count === 1 ? "contribution" : "contributions"}
          </span>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            color: "#3a4a5c",
            lineHeight: 1.55,
          }}
        >
          {theme.summary}
        </p>
      </button>

      {/* Demographic mini-chart — Role + Age side by side. */}
      <div style={{ padding: "4px 16px 14px" }}>
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            color: "#8899AA",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 10,
            paddingBottom: 6,
            borderBottom: "1px dashed rgba(11,29,58,0.1)",
          }}
        >
          Who said this
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          <DemoColumn
            label="Role"
            entries={roleEntries.map(([role, count]) => ({
              key: role,
              label: getRoleDisplay(role),
              count,
              isMono: false,
            }))}
            total={theme.contribution_count}
            accentColor={accentColor}
            accentDeep={accentDeep}
            barOpacity={1}
            cardIndex={index}
          />
          <DemoColumn
            label="Age"
            entries={ageEntries.map(([age, count]) => ({
              key: age,
              label: age,
              count,
              isMono: true,
            }))}
            total={theme.contribution_count}
            accentColor={accentColor}
            accentDeep={accentDeep}
            barOpacity={0.7}
            cardIndex={index}
          />
        </div>
      </div>

      {/* Station coverage strip. */}
      <div style={{ padding: "6px 16px 12px" }}>
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 8.5,
            color: "#8899AA",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Stations
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const locId = String(i + 1).padStart(2, "0");
            const count = theme.station_distribution[locId] ?? 0;
            const active = count > 0;
            return (
              <div
                key={i}
                title={`Location ${locId}: ${count} contribution${
                  count === 1 ? "" : "s"
                }`}
                style={{
                  flex: 1,
                  height: 18,
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active ? accentColor : "rgba(11,29,58,0.04)",
                  color: active ? "#fff" : "rgba(11,29,58,0.4)",
                  fontWeight: active ? 700 : 500,
                  border: active
                    ? `1px solid ${accentDeep}`
                    : "1px solid rgba(11,29,58,0.06)",
                }}
              >
                {locId}
              </div>
            );
          })}
        </div>
      </div>

      {/* Expand button — neutral grey background (no longer tinted by
          kind) so the only kind-coloured elements on the card are the
          two strips. The signature theme colour stays reserved for the
          dot + the selected ring. */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        className="engage-theme-expand"
        style={{
          width: "100%",
          padding: "10px 16px",
          background: "rgba(11,29,58,0.025)",
          border: "none",
          borderTop: `1px solid ${cardBorderColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 9.5,
          color: "#6B7A8C",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <span>{expanded ? "Hide voices" : "See all voices"}</span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: "flex" }}
        >
          <ChevronDown size={11} strokeWidth={2.5} />
        </motion.span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            style={{
              overflow: "hidden",
              background: "#FFFFFF",
            }}
          >
            <div
              style={{
                padding: "8px 14px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {themeContributions.length === 0 ? (
                <div
                  style={{
                    fontSize: 11,
                    color: "#8899AA",
                    fontStyle: "italic",
                    padding: "6px 0",
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                  }}
                >
                  Voices not currently visible (filters may be excluding
                  them).
                </div>
              ) : (
                themeContributions.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "8px 10px",
                      background: "rgba(11,29,58,0.025)",
                      borderLeft: `2px solid ${accentColor}`,
                      fontSize: 11.5,
                      color: "#3a4a5c",
                      lineHeight: 1.5,
                      borderRadius: 2,
                    }}
                  >
                    <div
                      style={{
                        fontFamily:
                          "var(--font-jetbrains-mono), monospace",
                        fontSize: 9,
                        color: "#8899AA",
                        letterSpacing: "0.08em",
                        marginBottom: 3,
                        textTransform: "uppercase",
                      }}
                    >
                      LOC · {c.locationId} · {c.contributorRole}
                    </div>
                    <div
                      style={{
                        fontStyle: "italic",
                        fontFamily:
                          "var(--font-space-grotesk), sans-serif",
                      }}
                    >
                      “
                      {c.content.length > 140
                        ? `${c.content.slice(0, 140)}…`
                        : c.content}
                      ”
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        :global(.engage-theme-select:focus-visible),
        :global(.engage-theme-expand:focus-visible) {
          outline: 2px solid #0b1d3a;
          outline-offset: -2px;
        }
        :global(.engage-theme-expand:hover) {
          filter: brightness(0.97);
        }
      `}</style>
    </motion.div>
  );
}

interface DemoEntry {
  key: string;
  label: string;
  count: number;
  isMono: boolean;
}

// Compact two-column-friendly chart — column eyebrow, then a row per
// entry: label (left) → tiny accent bar (28px) → numeric count (right).
function DemoColumn({
  label,
  entries,
  total,
  accentColor,
  accentDeep,
  barOpacity,
  cardIndex,
}: {
  label: string;
  entries: DemoEntry[];
  total: number;
  accentColor: string;
  accentDeep: string;
  barOpacity: number;
  cardIndex: number;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 8.5,
          color: "#8899AA",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {entries.length === 0 ? (
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 10,
            color: "#8899AA",
            fontStyle: "italic",
          }}
        >
          —
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {entries.map((entry) => {
            const pct = total > 0 ? (entry.count / total) * 100 : 0;
            return (
              <div
                key={entry.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  title={entry.label}
                  style={{
                    fontFamily: entry.isMono
                      ? "var(--font-jetbrains-mono), monospace"
                      : "var(--font-space-grotesk), sans-serif",
                    fontSize: 10.5,
                    fontWeight: 500,
                    color: "#0B1D3A",
                    flex: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontVariantNumeric: entry.isMono
                      ? "tabular-nums"
                      : "normal",
                  }}
                >
                  {entry.label}
                </span>
                <div
                  aria-hidden
                  style={{
                    width: 28,
                    height: 4,
                    background: "rgba(11,29,58,0.06)",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 1,
                    flexShrink: 0,
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.6,
                      ease: [0.2, 0.7, 0.2, 1],
                      delay: 0.1 + cardIndex * 0.08,
                    }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(90deg, ${accentColor}, ${accentDeep})`,
                      opacity: barOpacity,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: 9.5,
                    color: accentDeep,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    minWidth: 12,
                    textAlign: "right",
                  }}
                >
                  {entry.count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
