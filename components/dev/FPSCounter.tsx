"use client";

import { useEffect, useState } from "react";

// Dev-only frame-rate readout. NODE_ENV is statically replaced at build
// time, so the production bundle tree-shakes this whole component
// (including the rAF loop) — there's no runtime cost in prod.
export default function FPSCounter() {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    let frames = 0;
    let lastTime = performance.now();
    let rafId = 0;
    const tick = () => {
      frames += 1;
      const now = performance.now();
      if (now >= lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (now - lastTime)));
        frames = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  if (process.env.NODE_ENV !== "development") return null;

  const color = fps >= 55 ? "#1ABFAD" : fps >= 40 ? "#F47560" : "#FF3333";

  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        background: "rgba(11, 29, 58, 0.85)",
        color,
        padding: "4px 10px",
        fontSize: 11,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        borderRadius: 6,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      {fps} FPS
    </div>
  );
}
