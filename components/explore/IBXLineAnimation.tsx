"use client";

import { motion } from "framer-motion";
import { memo } from "react";

const IBX_PATH: { x: number; y: number }[] = [
  { x: 79.6, y: 45 },
  { x: 74.7, y: 51.4 },
  { x: 67.7, y: 59.8 },
  { x: 62.1, y: 67 },
  { x: 54.5, y: 76.1 },
  { x: 49.8, y: 81.9 },
  { x: 45.2, y: 87.4 },
  { x: 36.6, y: 97.6 },
];

const REPEAT_DELAY_S = 0.8;
const STAGGER_S = 0.08;
const CORAL_RGB = "244, 117, 96";
const CORAL = "#F47560";
const WAYPOINT_TIMES = [0, 0.14, 0.28, 0.42, 0.57, 0.71, 0.85, 1];

const leftKeyframes = IBX_PATH.map((p) => `${p.x}%`);
const topKeyframes = IBX_PATH.map((p) => `${p.y}%`);

interface CometProps {
  headSize: number;
  trailLength: number;
  duration: number;
  startDelay: number;
  brightness: number;
}

const Comet = memo(function Comet({
  headSize,
  trailLength,
  duration,
  startDelay,
  brightness,
}: CometProps) {
  return (
    <>
      {Array.from({ length: trailLength }).map((_, i) => {
        // Head (i=0) full size; tail tapers to 25% of head size.
        const sizeRatio = 1 - (i / trailLength) * 0.75;
        const size = headSize * sizeRatio;
        // Exponential fade, scaled by this comet's overall brightness.
        const opacity =
          Math.pow(1 - i / trailLength, 1.5) * brightness;
        const glowIntensity = opacity;

        return (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: "50%",
              background: CORAL,
              opacity,
              boxShadow: [
                `0 0 ${size * 1.5}px ${size * 0.3}px rgba(${CORAL_RGB}, ${
                  0.5 * glowIntensity
                })`,
                `0 0 ${size * 3}px ${size * 0.6}px rgba(${CORAL_RGB}, ${
                  0.25 * glowIntensity
                })`,
              ].join(", "),
              // Extra blur on trail particles — crisp head, soft tail.
              filter: i > 2 ? `blur(${i * 0.3}px)` : "none",
              transform: "translate(-50%, -50%)",
              willChange: "left, top",
              pointerEvents: "none",
            }}
            initial={{ left: leftKeyframes[0], top: topKeyframes[0] }}
            animate={{ left: leftKeyframes, top: topKeyframes }}
            transition={{
              duration,
              ease: "linear",
              repeat: Infinity,
              repeatDelay: REPEAT_DELAY_S,
              times: WAYPOINT_TIMES,
              delay: startDelay + i * STAGGER_S,
            }}
          />
        );
      })}
    </>
  );
});

export default function IBXLineAnimation() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <Comet
        headSize={14}
        trailLength={12}
        duration={8}
        // 7.0s lines the comet up with the welcome sequence: starts
        // right as line 2 finishes typing, a hair before the pins
        // appear at 7.3s.
        startDelay={7}
        brightness={1.0}
      />
    </div>
  );
}
