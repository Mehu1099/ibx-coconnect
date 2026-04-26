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
        <motion.button
          key="submit-contributions"
          type="button"
          onClick={onClick}
          className="fixed flex items-center gap-2 cursor-pointer rounded-full"
          style={{
            // Centering via motion's `x` motion-style so framer composes
            // it into the same transform pipeline as `y`. Using inline
            // `transform: translateX(-50%)` here would get clobbered
            // every time motion writes its own transform for `y` /
            // `scale`, leaving the button visibly off-centre.
            bottom: 110,
            left: "50%",
            x: "-50%",
            zIndex: 25,
            background: "#F47560",
            color: "#FFFFFF",
            border: "none",
            padding: "12px 22px",
            fontFamily: "var(--font-space-grotesk)",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.2px",
            lineHeight: 1,
            willChange: "transform, box-shadow",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            // Continuous outward coral aura on a 2s loop. Pure
            // box-shadow so it's GPU-friendly and doesn't reflow.
            boxShadow: [
              "0 4px 20px rgba(244, 117, 96, 0.40), 0 0 0 0 rgba(244, 117, 96, 0.60)",
              "0 4px 20px rgba(244, 117, 96, 0.40), 0 0 0 16px rgba(244, 117, 96, 0)",
            ],
          }}
          exit={{ opacity: 0, y: 20 }}
          transition={{
            opacity: { duration: 0.4, ease: "easeOut" },
            y: { duration: 0.4, ease: "easeOut" },
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.3,
            },
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
      )}
    </AnimatePresence>
  );
}
