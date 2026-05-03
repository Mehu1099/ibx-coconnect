"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  MessageCircle,
  MessageSquareDashed,
  Shield,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Contribution, ContributionType } from "@/lib/use-engage-data";

interface VoicesFeedProps {
  contributions: Contribution[];
  allContributions: Contribution[];
  isLoading: boolean;
  selectedLocationId: string | null;
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  onClearFilters: () => void;
  hasFilter: boolean;
  recentlyArrivedIds: Set<string>;
  onContributionClick: (contribution: Contribution) => void;
}

const TYPE_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sticky", label: "Notes" },
  { key: "concern", label: "Concerns" },
  { key: "question_response", label: "Responses" },
  { key: "ai_proposal", label: "Proposals" },
];

const TYPE_ICONS = {
  sticky: StickyNote,
  concern: AlertTriangle,
  question_response: MessageCircle,
  ai_proposal: Sparkles,
} as const;

const TYPE_ACCENT: Record<ContributionType, string> = {
  sticky: "#F47560",
  concern: "#D85A45",
  question_response: "#0F8A7E",
  ai_proposal: "#1ABFAD",
};

const TYPE_TEXT_COLOR: Record<ContributionType, string> = {
  sticky: "#F47560",
  concern: "#D85A45",
  question_response: "#0F8A7E",
  ai_proposal: "#0F8A7E",
};

const RAIL_WIDTH = 360;

// Right rail wrapped in a single solid surface so the header, chip row,
// filter status bar, and voice cards all sit on the same opaque white
// background. Voice cards no longer carry their own glass treatment —
// the rail is the surface; each card just gets a coral/teal/navy
// border-left to identify type, plus a hover lift.

export function VoicesFeed({
  contributions,
  allContributions,
  isLoading,
  selectedLocationId,
  selectedTypes,
  onTypesChange,
  onClearFilters,
  hasFilter,
  recentlyArrivedIds,
  onContributionClick,
}: VoicesFeedProps) {
  function toggleType(key: string) {
    if (key === "all") {
      onTypesChange(["all"]);
      return;
    }
    const next = selectedTypes.filter((t) => t !== "all");
    if (next.includes(key)) {
      const filtered = next.filter((t) => t !== key);
      onTypesChange(filtered.length === 0 ? ["all"] : filtered);
    } else {
      onTypesChange([...next, key]);
    }
  }

  return (
    <aside
      style={{
        position: "absolute",
        top: 90,
        right: 20,
        bottom: 110,
        width: RAIL_WIDTH,
        zIndex: 30,
        // Same frosted-glass treatment as ThemesRail — keeps the two
        // side panels visually paired.
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
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(11, 29, 58, 0.06)",
          flexShrink: 0,
        }}
      >
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
            Voices · Live Feed
          </h2>
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 9.5,
              color: "#8899AA",
              letterSpacing: "0.14em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            FILE · 02
          </span>
        </div>
        <p
          style={{
            margin: "4px 0 0",
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: 12,
            color: "#6B7A8C",
            lineHeight: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <AnimatedCount value={contributions.length} /> of{" "}
          <span
            style={{ color: "#6B7A8C", fontVariantNumeric: "tabular-nums" }}
          >
            {allContributions.length}
          </span>{" "}
          {allContributions.length === 1 ? "voice" : "voices"}
          {selectedLocationId && (
            <span style={{ color: "#D85A45", fontWeight: 500 }}>
              · LOC-{selectedLocationId}
            </span>
          )}
        </p>
      </div>

      {/* Filter chip row. Tight padding + nowrap + horizontal-scroll
          fallback on the off-chance the row ever exceeds the rail width. */}
      <div
        className="engage-chip-row"
        style={{
          padding: "10px 14px",
          display: "flex",
          flexWrap: "nowrap",
          gap: 5,
          overflowX: "auto",
          flexShrink: 0,
          borderBottom: "1px solid rgba(11, 29, 58, 0.04)",
        }}
      >
        {TYPE_FILTERS.map((f) => {
          const active = selectedTypes.includes(f.key);
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => toggleType(f.key)}
              className="engage-filter-chip"
              style={{
                padding: "5px 10px",
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: 11.5,
                fontWeight: 500,
                borderRadius: 9999,
                border: "1px solid",
                borderColor: active ? "#0B1D3A" : "#E0DCD4",
                background: active ? "#0B1D3A" : "#FFFFFF",
                color: active ? "#FBF6EE" : "#0B1D3A",
                cursor: "pointer",
                transition: "all 160ms",
                lineHeight: 1,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {hasFilter && (
          <motion.div
            key="filter-status"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              flexShrink: 0,
              overflow: "hidden",
              background: "rgba(244, 117, 96, 0.08)",
              borderBottom: "1px solid rgba(11, 29, 58, 0.06)",
            }}
          >
            <div
              style={{
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 11,
                color: "#3a4a5c",
                fontFamily: "var(--font-space-grotesk), sans-serif",
              }}
            >
              <span>
                Showing{" "}
                <strong
                  style={{
                    color: "#0B1D3A",
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {contributions.length}
                </strong>{" "}
                of {allContributions.length} voices
              </span>
              <button
                type="button"
                onClick={onClearFilters}
                className="engage-clear-filters"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#D85A45",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                Clear ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="engage-feed-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          padding: "0",
        }}
      >
        {isLoading ? (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: 12.5,
              color: "#8899AA",
            }}
          >
            Loading…
          </div>
        ) : contributions.length === 0 ? (
          <FeedEmptyState
            hasFilter={hasFilter}
            onClearFilters={onClearFilters}
          />
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {contributions.map((c) => (
              <FeedItem
                key={c.id}
                contribution={c}
                isRecent={recentlyArrivedIds.has(c.id)}
                onClick={() => onContributionClick(c)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      <style jsx>{`
        .engage-feed-scroll {
          scrollbar-width: thin;
          scrollbar-color: #e0dcd4 transparent;
        }
        .engage-feed-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .engage-feed-scroll::-webkit-scrollbar-thumb {
          background: #e0dcd4;
          border-radius: 3px;
        }
        .engage-chip-row {
          scrollbar-width: none;
        }
        .engage-chip-row::-webkit-scrollbar {
          display: none;
        }
        :global(.engage-filter-chip:hover) {
          border-color: #0b1d3a !important;
        }
        :global(.engage-filter-chip:focus-visible),
        :global(.engage-clear-filters:focus-visible) {
          outline: 2px solid #0b1d3a;
          outline-offset: 2px;
        }
        :global(.engage-clear-filters:hover) {
          color: #b94a37 !important;
        }
      `}</style>
    </aside>
  );
}

// Counter that smoothly tweens between values rather than snapping.
function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const startRef = useRef(performance.now());

  useEffect(() => {
    startRef.current = performance.now();
    const duration = 280;
    const from = display;
    const to = value;
    if (from === to) return;
    let raf = 0;
    const step = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      const next = Math.round(from + (to - from) * eased);
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally treats `value` as the only trigger; reading current `display` would re-fire the tween mid-flight
  }, [value]);

  return (
    <strong
      style={{
        color: "#0B1D3A",
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {display}
    </strong>
  );
}

function FeedEmptyState({
  hasFilter,
  onClearFilters,
}: {
  hasFilter: boolean;
  onClearFilters: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        margin: 16,
        padding: "32px 20px 28px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 12,
        background: "#FBF6EE",
        borderRadius: 12,
        border: "1px dashed rgba(11,29,58,0.10)",
      }}
    >
      <div
        aria-hidden
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(11,29,58,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#8899AA",
        }}
      >
        <MessageSquareDashed size={20} strokeWidth={1.8} />
      </div>
      <div
        style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: 14,
          fontWeight: 600,
          color: "#0B1D3A",
        }}
      >
        No voices match this filter
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: 12.5,
          color: "#6B7A8C",
          lineHeight: 1.5,
          maxWidth: 240,
        }}
      >
        Try adjusting filters or clearing them to see all the voices in
        the corridor.
      </p>
      {hasFilter && (
        <button
          type="button"
          onClick={onClearFilters}
          style={{
            marginTop: 4,
            padding: "8px 14px",
            background: "#0B1D3A",
            color: "#FBF6EE",
            border: "none",
            borderRadius: 9999,
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Clear all filters
        </button>
      )}
    </motion.div>
  );
}

// Voice card — no per-card glass any more (the rail is the surface).
// Just a coral/teal/navy border-left + dividers between cards.
function FeedItem({
  contribution,
  isRecent,
  onClick,
}: {
  contribution: Contribution;
  isRecent: boolean;
  onClick: () => void;
}) {
  const Icon = TYPE_ICONS[contribution.type];
  const accentBorder = TYPE_ACCENT[contribution.type];
  const typeColor = TYPE_TEXT_COLOR[contribution.type];

  const typeLabel =
    contribution.type === "sticky"
      ? "STICKY"
      : contribution.type === "concern"
        ? contribution.category
          ? `${contribution.category.toUpperCase()} · CONCERN`
          : "CONCERN"
        : contribution.type === "question_response"
          ? "PLANNER RESPONSE"
          : "AI PROPOSAL";

  return (
    <motion.button
      layout
      type="button"
      onClick={onClick}
      initial={
        isRecent
          ? { opacity: 0, y: -10, scale: 0.98 }
          : { opacity: 0, y: -4 }
      }
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        background: isRecent
          ? ["rgba(244,117,96,0.16)", "rgba(255,255,255,0)"]
          : "rgba(255,255,255,0)",
      }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{
        duration: isRecent ? 0.5 : 0.25,
        background: { duration: 1.6 },
      }}
      whileHover={{ x: -2 }}
      className="engage-voice-card"
      style={{
        position: "relative",
        textAlign: "left",
        cursor: "pointer",
        background: "transparent",
        border: "none",
        borderLeft: `3px solid ${accentBorder}`,
        borderBottom: "1px solid rgba(11, 29, 58, 0.06)",
        padding: "14px 16px 14px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        color: "#0B1D3A",
        fontFamily: "var(--font-space-grotesk), sans-serif",
        transition: "background 160ms ease",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 12,
          right: 14,
          background: "#0B1D3A",
          color: "#FBF6EE",
          padding: "3px 8px",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.14em",
          borderRadius: 3,
        }}
      >
        LOC · {contribution.locationId}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingRight: 70,
        }}
      >
        <div
          aria-hidden
          style={{
            width: 22,
            height: 22,
            background: `${accentBorder}1F`,
            color: typeColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 4,
          }}
        >
          <Icon size={12} strokeWidth={2.2} />
        </div>
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 10,
            fontWeight: 600,
            color: "#0B1D3A",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {typeLabel}
        </div>
        {contribution.echoCount && contribution.echoCount > 0 ? (
          <div
            style={{
              padding: "2px 7px",
              background: "rgba(244,117,96,0.18)",
              color: "#D85A45",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.06em",
              borderRadius: 3,
            }}
          >
            +{contribution.echoCount} ECHOED
          </div>
        ) : null}
        <div
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9.5,
            color: "#8899AA",
            letterSpacing: "0.06em",
          }}
        >
          {contribution.timeAgo}
        </div>
      </div>

      {contribution.type === "question_response" && contribution.question && (
        <div
          style={{
            border: "1px solid rgba(15,138,126,0.35)",
            borderLeft: "2px solid #0F8A7E",
            borderRadius: 4,
            padding: "8px 10px",
            background: "rgba(216,239,235,0.55)",
            fontSize: 11.5,
            color: "#0B1D3A",
            lineHeight: 1.45,
            fontStyle: "italic",
          }}
        >
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 9,
              fontWeight: 600,
              color: "#0F8A7E",
              letterSpacing: "0.12em",
              fontStyle: "normal",
              marginBottom: 3,
            }}
          >
            QUESTION
          </span>
          {contribution.question}
        </div>
      )}

      {contribution.type === "ai_proposal" && contribution.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={contribution.imageUrl}
          alt={contribution.prompt ?? contribution.content}
          style={{
            width: "100%",
            aspectRatio: "16 / 10",
            objectFit: "cover",
            display: "block",
            background: "#EDE5D5",
            borderRadius: 4,
          }}
        />
      )}

      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: 13,
          color: "#0B1D3A",
          lineHeight: 1.55,
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {contribution.content}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 9.5,
          color: "#6B7A8C",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          flexWrap: "wrap",
        }}
      >
        {contribution.isStakeholder && (
          <Shield
            size={10}
            strokeWidth={2.2}
            style={{ color: "#0F8A7E", flexShrink: 0 }}
          />
        )}
        <span>BY · {contribution.contributorRole}</span>
        {contribution.contributorAge && (
          <>
            <span style={{ color: "#C9C2B3" }}>·</span>
            <span>{contribution.contributorAge}</span>
          </>
        )}
      </div>

      <style jsx>{`
        :global(.engage-voice-card:hover) {
          background: rgba(11, 29, 58, 0.025) !important;
        }
        :global(.engage-voice-card:focus-visible) {
          outline: 2px solid #0b1d3a;
          outline-offset: -2px;
        }
      `}</style>
    </motion.button>
  );
}
