"use client";

import { AnimatePresence, motion } from "framer-motion";

type Props = {
  count: number;
  onClick: () => void;
};

// Coral CTA pill, fixed centered ~80px above the toolbar. Slides in
// from below when drafts exist; pulsing coral aura draws attention
// without being noisy. Same centering pattern as LocationToolbar so
// the two stay vertically aligned.
export default function SubmitContributionsButton({ count, onClick }: Props) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          key="submit-contributions"
          className="fixed"
          // Centering via motion's `x` motion-style so framer composes
          // it into the same transform pipeline as `y`. Using inline
          // `transform: translateX(-50%)` here would get clobbered
          // every time motion writes its own transform for `y`,
          // leaving the button visibly off-centre.
          style={{
            bottom: 110,
            left: "50%",
            x: "-50%",
            zIndex: 25,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Aura sibling — GPU-composited scale + opacity. The old
              box-shadow keyframes painted a viewport-wide shadow region
              every frame, which showed up in the perf profile. */}
          <motion.div
            aria-hidden
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: 9999,
              background: "rgba(244, 117, 96, 0.45)",
              pointerEvents: "none",
              willChange: "transform, opacity",
            }}
            initial={{ scale: 1, opacity: 0.45 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.3,
            }}
          />

          <motion.button
            type="button"
            onClick={onClick}
            className="relative flex items-center gap-2 cursor-pointer rounded-full"
            style={{
              background: "#F47560",
              color: "#FFFFFF",
              border: "none",
              padding: "12px 22px",
              fontFamily: "var(--font-space-grotesk)",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.2px",
              lineHeight: 1,
              boxShadow: "0 4px 20px rgba(244, 117, 96, 0.40)",
            }}
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.18 },
            }}
          >
          <span
            aria-hidden
            className="rounded-full flex items-center justify-center"
            style={{
              minWidth: 22,
              height: 22,
              padding: "0 6px",
              background: "#FFFFFF",
              color: "#F47560",
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {count > 99 ? "99+" : count}
          </span>
          <span>Submit contributions</span>
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
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
