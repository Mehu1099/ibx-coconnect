"use client";

import { motion } from "framer-motion";

type Props = {
  count: number;
};

export default function ConcernsBanner({ count }: Props) {
  return (
    <motion.button
      type="button"
      className="fixed flex items-center gap-2 cursor-pointer rounded-full"
      style={{
        top: 76, // sits below the 24px+pill back button
        left: 24,
        zIndex: 40,
        background: "#F47560",
        padding: "8px 14px",
        border: "none",
        color: "#FFFFFF",
        fontFamily: "var(--font-space-grotesk)",
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: "0.3px",
        willChange: "transform, box-shadow",
      }}
      initial={{ opacity: 0, y: -8 }}
      animate={{
        opacity: 1,
        y: 0,
        // Expanding glow ring pulses outward from the banner edges
        // every 2s. Inset white ring stays as a steady highlight.
        boxShadow: [
          "0 4px 16px rgba(244, 117, 96, 0.40), inset 0 0 0 2px rgba(255,255,255,0.20), 0 0 0 0 rgba(244, 117, 96, 0.50)",
          "0 4px 16px rgba(244, 117, 96, 0.40), inset 0 0 0 2px rgba(255,255,255,0.20), 0 0 0 12px rgba(244, 117, 96, 0)",
        ],
      }}
      transition={{
        opacity: { duration: 0.4, ease: "easeOut", delay: 0.15 },
        y: { duration: 0.4, ease: "easeOut", delay: 0.15 },
        boxShadow: {
          duration: 2,
          repeat: Infinity,
          ease: "easeOut",
          delay: 0.5,
        },
      }}
      whileHover={{
        scale: 1.05,
        transition: { duration: 0.18 },
      }}
    >
      <motion.span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#FFFFFF",
          willChange: "transform, opacity",
        }}
        animate={{
          scale: [1, 1.35, 1],
          opacity: [1, 0.5, 1],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <span>
        {count} active {count === 1 ? "concern" : "concerns"}
      </span>
    </motion.button>
  );
}
