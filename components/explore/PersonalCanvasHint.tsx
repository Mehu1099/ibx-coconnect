"use client";

import { motion } from "framer-motion";

type Props = {
  /** True when the user has zero submitted + zero drafted contributions
   *  on this location. The pill self-hides as soon as the first draft
   *  lands (which is also when the Submit Contributions button appears). */
  show: boolean;
};

export default function PersonalCanvasHint({ show }: Props) {
  if (!show) return null;
  return (
    <motion.div
      // Centering via motion-style `x` so framer composes it with `y`.
      // Inline `transform: translateX(-50%)` would get clobbered by the
      // framer-driven y animation, leaving the pill visibly off-centre
      // (same pattern as SubmitContributionsButton + LocationToolbar).
      style={{
        position: "fixed",
        bottom: 110,
        left: "50%",
        x: "-50%",
        zIndex: 24,
        background: "rgba(245, 242, 235, 0.96)",
        border: "1px solid rgba(244, 117, 96, 0.3)",
        padding: "8px 16px",
        borderRadius: 9999,
        fontFamily: "var(--font-space-grotesk)",
        fontSize: 12,
        color: "#0B1D3A",
        pointerEvents: "none",
        whiteSpace: "nowrap",
        boxShadow: "0 4px 16px rgba(11, 29, 58, 0.08)",
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.5, delay: 1, ease: "easeOut" }}
    >
      <span style={{ color: "#F47560", fontWeight: 600 }}>✦ </span>
      This is your personal canvas — add your thoughts and submit when ready
    </motion.div>
  );
}
