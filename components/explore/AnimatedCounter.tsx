"use client";

import { animate } from "framer-motion";
import { memo, useEffect, useState } from "react";

type Props = {
  value: number;
  duration?: number;
  delay?: number;
};

// easeOutExpo as a cubic-bezier
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

function AnimatedCounter({ value, duration = 1, delay = 0 }: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      delay,
      ease: EASE_OUT_EXPO,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration, delay]);

  return <span>{display}</span>;
}

export default memo(AnimatedCounter);
