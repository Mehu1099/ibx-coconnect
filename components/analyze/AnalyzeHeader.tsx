"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ANALYZE_TUTORIAL_OPEN_EVENT } from "./AnalyzeTutorial";

export type StatusFilter =
  | "all"
  | "unassigned"
  | "priority"
  | "investigating"
  | "addressed";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

interface Props {
  themesCount: number;
  contributionsCount: number;
  latestGeneratedAt: string | null;
  newContributionsCount: number;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
}

const FILTERS: StatusFilter[] = [
  "all",
  "unassigned",
  "priority",
  "investigating",
  "addressed",
];

export default function AnalyzeHeader({
  themesCount,
  contributionsCount,
  latestGeneratedAt,
  newContributionsCount,
  statusFilter,
  onStatusFilterChange,
}: Props) {
  const router = useRouter();
  const [engageHover, setEngageHover] = useState(false);
  const [pulseActive, setPulseActive] = useState(true);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  // Pulse for 10 loops (1.5s × 10 = 15s), then settle into the static
  // resting state. The pulse fires on mount; when the count changes
  // mid-session (rare), the timer is rescheduled but the pulse does not
  // restart visually — that matches the spec ("fires again on remount").
  useEffect(() => {
    if (newContributionsCount === 0) return;
    const timer = setTimeout(() => setPulseActive(false), 15000);
    return () => clearTimeout(timer);
  }, [newContributionsCount]);

  const hasNew = newContributionsCount > 0;
  const engageAnimState = !hasNew
    ? "off"
    : reducedMotion || engageHover || !pulseActive
      ? "resting"
      : "pulsing";

  const engagePulseVariants = {
    off: {
      boxShadow: "0 0 0 0 rgba(244,117,96,0)",
      transition: { duration: 0.3 },
    },
    resting: {
      boxShadow: "0 0 0 6px rgba(244,117,96,0.18)",
      transition: { duration: 0.4, ease: "easeOut" as const },
    },
    pulsing: {
      boxShadow: [
        "0 0 0 0 rgba(244,117,96,0)",
        "0 0 0 14px rgba(244,117,96,0.35)",
        "0 0 0 0 rgba(244,117,96,0)",
      ],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "#FFFFFF",
        borderBottom: "1px solid rgba(11,29,58,0.1)",
        padding: "14px 32px",
        display: "flex",
        alignItems: "center",
        gap: 24,
      }}
    >
      <button
        onClick={() => router.push("/explore")}
        type="button"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          background: "transparent",
          color: "#0B1D3A",
          border: "1px solid rgba(11,29,58,0.15)",
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        <ArrowLeft size={14} strokeWidth={2.5} />
        Back to neighborhood
      </button>

      <div
        style={{
          position: "relative",
          display: "inline-flex",
          marginLeft: -12,
        }}
      >
        <motion.button
          onClick={() => router.push("/engage")}
          type="button"
          onMouseEnter={() => setEngageHover(true)}
          onMouseLeave={() => setEngageHover(false)}
          onFocus={() => setEngageHover(true)}
          onBlur={() => setEngageHover(false)}
          variants={engagePulseVariants}
          initial={engageAnimState}
          animate={engageAnimState}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            background: hasNew
              ? engageHover
                ? "#E5654F"
                : "#F47560"
              : engageHover
                ? "rgba(11,29,58,0.06)"
                : "transparent",
            color: hasNew ? "#FFFFFF" : "#0B1D3A",
            border: `1px solid ${hasNew ? "#F47560" : "rgba(11,29,58,0.15)"}`,
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "background 150ms",
          }}
        >
          Engage
          <ArrowRight size={14} strokeWidth={2.5} />
        </motion.button>

        {newContributionsCount > 0 && engageHover && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#0B1D3A",
              color: "#F2EDE0",
              padding: "5px 9px",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              zIndex: 5,
            }}
          >
            {newContributionsCount} new contribution
            {newContributionsCount === 1 ? "" : "s"} since last generation
          </motion.div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "#0B1D3A",
            letterSpacing: "-0.015em",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Analyze
        </h1>
        <p
          style={{
            fontSize: 11,
            color: "#6B7A8C",
            margin: 0,
            letterSpacing: "0.01em",
          }}
        >
          Planner&apos;s briefing room · {themesCount} themes ·{" "}
          {contributionsCount} contributions
          {newContributionsCount > 0 && (
            <>
              {" "}
              <span style={{ color: "#F47560", fontWeight: 600 }}>
                (+{newContributionsCount} new)
              </span>
            </>
          )}
          {latestGeneratedAt && (
            <>
              {" · last generation "}
              {new Date(latestGeneratedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </>
          )}
        </p>
      </div>

      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <button
          onClick={() =>
            document
              .getElementById("panel-export")
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          type="button"
          className="analyze-export-link"
          style={{
            padding: "6px 10px",
            background: "transparent",
            color: "rgba(11,29,58,0.7)",
            border: "none",
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "color 150ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#0B1D3A";
            e.currentTarget.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(11,29,58,0.7)";
            e.currentTarget.style.textDecoration = "none";
          }}
        >
          ↓ Export
        </button>

        <button
          onClick={() =>
            window.dispatchEvent(new Event(ANALYZE_TUTORIAL_OPEN_EVENT))
          }
          type="button"
          title="Open tutorial"
          aria-label="Open tutorial"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            background: "transparent",
            color: "#6B7A8C",
            border: "1px solid rgba(11,29,58,0.15)",
            borderRadius: "50%",
            cursor: "pointer",
            transition: "all 150ms",
            marginRight: 8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(26,191,173,0.08)";
            e.currentTarget.style.borderColor = "rgba(26,191,173,0.4)";
            e.currentTarget.style.color = "#0F8A7E";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(11,29,58,0.15)";
            e.currentTarget.style.color = "#6B7A8C";
          }}
        >
          <HelpCircle size={14} strokeWidth={2} />
        </button>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            color: "#8899AA",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Status
        </span>
        {FILTERS.map((f) => {
          const active = statusFilter === f;
          return (
            <button
              key={f}
              onClick={() => onStatusFilterChange(f)}
              type="button"
              style={{
                padding: "5px 11px",
                background: active ? "#0B1D3A" : "transparent",
                color: active ? "#fff" : "#6B7A8C",
                border: `1px solid ${active ? "#0B1D3A" : "rgba(11,29,58,0.15)"}`,
                fontSize: 11,
                fontWeight: 500,
                textTransform: "capitalize",
                cursor: "pointer",
                transition: "all 150ms",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>
    </header>
  );
}
