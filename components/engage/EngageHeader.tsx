"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ENGAGE_TUTORIAL_OPEN_EVENT } from "./EngageTutorial";

interface EngageHeaderProps {
  totalVoices: number;
}

// Re-opens the first-visit tour. EngageTutorial listens on the window
// for this event and resets to step 1 when fired — avoids prop-drilling
// open-state through the EngageView tree just to wire up a help icon.
function reopenTutorial() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ENGAGE_TUTORIAL_OPEN_EVENT));
}

// Solid white nav strip pinned to the top edge — opaque enough that the
// map underneath never bleeds through the title or back pill. Visually
// continuous with the Explore page (white pill back, Space Grotesk
// semibold title, soft slate subtitle); the Engage-only flourish is the
// LIVE pill on the right with its pulsing coral dot and a small mono
// REV tag tucked in beside it.

export function EngageHeader({ totalVoices }: EngageHeaderProps) {
  return (
    <header
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: "14px 28px",
        background: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(11, 29, 58, 0.08)",
        boxShadow:
          "0 1px 0 rgba(11,29,58,0.04), 0 4px 16px -8px rgba(11,29,58,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Link
          href="/explore"
          className="engage-back-pill"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#FFFFFF",
            border: "1px solid #E0DCD4",
            borderRadius: 9999,
            padding: "9px 16px",
            color: "#0B1D3A",
            textDecoration: "none",
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1,
            boxShadow: "0 4px 12px -4px rgba(11, 29, 58, 0.12)",
            transition:
              "transform 200ms ease, box-shadow 200ms ease, background 200ms ease",
          }}
        >
          <ArrowLeft size={14} strokeWidth={2.2} />
          <span>Back to neighborhood</span>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
        style={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: 22,
            fontWeight: 600,
            color: "#0B1D3A",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Engage
        </h1>
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: 12,
            fontWeight: 400,
            color: "#6B7A8C",
            lineHeight: 1.3,
          }}
        >
          Community insights for the Flatbush–Brooklyn College station area
        </span>
      </motion.div>

      <div
        style={{
          marginLeft: "auto",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <motion.button
          type="button"
          onClick={reopenTutorial}
          title="Show tour again"
          aria-label="Show tour again"
          className="engage-help-btn"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "1px solid #E0DCD4",
            background: "#FFFFFF",
            color: "#6B7A8C",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--font-space-grotesk), sans-serif",
            lineHeight: 1,
            padding: 0,
            transition: "color 160ms, border-color 160ms",
          }}
        >
          ?
        </motion.button>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          background: "#FFFFFF",
          border: "1px solid #E0DCD4",
          borderRadius: 9999,
          padding: "8px 14px 8px 12px",
          boxShadow: "0 4px 12px -4px rgba(11, 29, 58, 0.12)",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#F47560",
            animation: "engagePulseDot 1.6s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: "#0B1D3A",
            letterSpacing: "0.02em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          Live · {totalVoices}
        </span>
        <span
          aria-hidden
          style={{ width: 1, height: 12, background: "#E0DCD4" }}
        />
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 10,
            fontWeight: 500,
            color: "#8899AA",
            letterSpacing: "0.12em",
          }}
        >
          REV · 2026.05
        </span>
      </motion.div>
      </div>

      <style jsx>{`
        :global(.engage-back-pill:hover) {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px -4px rgba(11, 29, 58, 0.18);
          background: #ffffff !important;
        }
        :global(.engage-back-pill:focus-visible),
        :global(.engage-help-btn:focus-visible) {
          outline: 2px solid #0b1d3a;
          outline-offset: 3px;
        }
        :global(.engage-help-btn:hover) {
          color: #0b1d3a !important;
          border-color: #0b1d3a !important;
        }
        @keyframes engagePulseDot {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.45;
            transform: scale(0.85);
          }
        }
      `}</style>
    </header>
  );
}
