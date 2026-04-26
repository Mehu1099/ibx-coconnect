"use client";

import { motion } from "framer-motion";

type Props = {
  label: string;
  subtitle: string;
  onBack: () => void;
};

// Solid (not translucent) so we can drop backdrop-filter — these small
// pills don't need real blur to read against the photo, and the filter
// is a major Safari paint cost.
const PILL_BG = "#FFFFFF";
const PILL_BG_HOVER = "#FFFFFF";

export default function LocationTopNav({ label, subtitle, onBack }: Props) {
  return (
    <>
      {/* Left pill — back to neighborhood */}
      <motion.button
        type="button"
        onClick={onBack}
        className="fixed z-40 cursor-pointer flex items-center gap-2 rounded-full"
        style={{
          top: 24,
          left: 24,
          background: PILL_BG,
          padding: "10px 18px",
          border: "1px solid #E0DCD4",
          boxShadow: "0 4px 20px rgba(11, 29, 58, 0.10)",
          color: "#0B1D3A",
          fontFamily: "var(--font-space-grotesk)",
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1,
        }}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        whileHover={{
          scale: 1.02,
          background: PILL_BG_HOVER,
          transition: { duration: 0.2 },
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span>Back to neighborhood</span>
      </motion.button>

      {/* Right pill — location label */}
      <motion.div
        className="fixed z-40 rounded-full"
        style={{
          top: 24,
          right: 24,
          background: PILL_BG,
          padding: "10px 18px",
          border: "1px solid #E0DCD4",
          boxShadow: "0 4px 20px rgba(11, 29, 58, 0.10)",
          fontFamily: "var(--font-space-grotesk)",
          fontSize: 13,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <span style={{ color: "#0B1D3A", fontWeight: 700 }}>{label}</span>
        <span style={{ color: "#8899AA", fontWeight: 500 }}>
          {" · "}
          {subtitle}
        </span>
      </motion.div>
    </>
  );
}
