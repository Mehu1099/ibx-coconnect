"use client";

import { motion } from "framer-motion";
import AnimatedCounter from "./AnimatedCounter";

type Props = {
  concerns: number;
  questions: number;
};

// Solid (not translucent) so we can drop backdrop-filter — these small
// pills don't need real blur to read against the photo, and the filter
// is a major Safari paint cost.
const PILL_BG = "#FFFFFF";

function CounterPill({
  count,
  label,
  dotColor,
  delay,
  breathDelay,
}: {
  count: number;
  label: string;
  dotColor: string;
  delay: number;
  breathDelay: number;
}) {
  return (
    <motion.div
      className="flex items-center gap-2 rounded-full"
      style={{
        background: PILL_BG,
        padding: "8px 14px",
        border: "1px solid #E0DCD4",
        boxShadow: "0 4px 16px rgba(11, 29, 58, 0.10)",
        fontFamily: "var(--font-space-grotesk)",
        fontSize: 12,
        color: "#0B1D3A",
        whiteSpace: "nowrap",
      }}
      whileHover={{
        scale: 1.05,
        boxShadow: "0 10px 24px rgba(11, 29, 58, 0.16)",
        transition: { duration: 0.18 },
      }}
    >
      <motion.span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dotColor,
        }}
        animate={{ opacity: [1, 0.7, 1] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: breathDelay,
        }}
      />
      <span style={{ fontWeight: 600 }}>
        <AnimatedCounter value={count} duration={1} delay={delay} />
      </span>
      <span style={{ color: "#5F6E80", fontWeight: 500 }}>{label}</span>
    </motion.div>
  );
}

export default function ActivityCounters({ concerns, questions }: Props) {
  return (
    <motion.div
      className="fixed flex items-center"
      style={{
        bottom: 32,
        right: 32,
        gap: 8,
        zIndex: 40,
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
    >
      <CounterPill
        count={concerns}
        label="concerns"
        dotColor="#F47560"
        delay={0.4}
        breathDelay={0}
      />
      <CounterPill
        count={questions}
        label="questions"
        dotColor="#1ABFAD"
        delay={0.5}
        breathDelay={0.6}
      />
    </motion.div>
  );
}
