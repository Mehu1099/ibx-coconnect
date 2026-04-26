"use client";

import { motion } from "framer-motion";

type Props = {
  count: number;
};

export default function ConcernsBanner({ count }: Props) {
  return (
    <div
      className="fixed"
      style={{
        top: 76, // sits below the 24px+pill back button
        left: 24,
        zIndex: 40,
      }}
    >
      {/* Aura sibling — animating scale + opacity is GPU-composited;
          the previous box-shadow pulse forced a paint every frame. */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          inset: -4,
          borderRadius: 9999,
          background: "rgba(244, 117, 96, 0.5)",
          pointerEvents: "none",
          willChange: "transform, opacity",
        }}
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 1.3, opacity: 0 }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeOut",
          delay: 0.5,
        }}
      />

      <motion.button
        type="button"
        className="relative flex items-center gap-2 cursor-pointer rounded-full"
        style={{
          background: "#F47560",
          padding: "8px 14px",
          border: "none",
          color: "#FFFFFF",
          fontFamily: "var(--font-space-grotesk)",
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: "0.3px",
          boxShadow:
            "0 4px 16px rgba(244, 117, 96, 0.40), inset 0 0 0 2px rgba(255,255,255,0.20)",
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          ease: "easeOut",
          delay: 0.15,
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
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <span>
          {count} active {count === 1 ? "concern" : "concerns"}
        </span>
      </motion.button>
    </div>
  );
}
