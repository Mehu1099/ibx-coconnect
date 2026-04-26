"use client";

import { useMemo } from "react";
import type { ImageProjection } from "@/lib/use-image-projection";

const CORAL_RGB = "244, 117, 96";
const TRAVEL_DURATION_S = 8;
// Gap between successive comets — controls trail spacing. Smaller =
// denser, larger = sparser. With 4 particles and 8s travel, 0.18s
// stagger spreads the trail over ~0.7s of the path.
const STAGGER_S = 0.18;
const PARTICLE_COUNT = 4;
const HEAD_SIZE = 14;

type IBXLineAnimationProps = {
  /** When true, comet starts immediately (used when returning to the
   *  page from a child route — the welcome sequence is skipped). */
  instant?: boolean;
  /** IBX route waypoints in natural-image % (0–100). */
  waypoints: { x: number; y: number }[];
  /** Image projection — converts %-coords to container pixels. The
   *  parent re-runs this on every resize, so the comet path tracks
   *  the rendered image regardless of cropping or mobile zoom. */
  projection: ImageProjection;
};

export default function IBXLineAnimation({
  instant = false,
  waypoints,
  projection,
}: IBXLineAnimationProps) {
  // Project every waypoint to container px and build an SVG path string.
  // CSS `offset-path` accepts an SVG path() value and animates an
  // element's position along it on the compositor thread — far cheaper
  // than per-frame JS keyframes, and the projection only changes when
  // the viewport resizes (rare).
  const pathString = useMemo(() => {
    return waypoints
      .map((wp, i) => {
        const p = projection.projectPin(wp.x, wp.y);
        return `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`;
      })
      .join(" ");
  }, [waypoints, projection]);

  // 7s lines the comet up with the welcome sequence; instant=true
  // short-circuits to 0 on returns from a child route.
  const startDelay = instant ? 0 : 7;

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
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        // Head (i=0) full size; tail tapers to 35% of head size.
        const sizeRatio = 1 - (i / PARTICLE_COUNT) * 0.65;
        const size = HEAD_SIZE * sizeRatio;
        const opacity = Math.pow(1 - i / PARTICLE_COUNT, 1.4);

        return (
          <div
            key={i}
            className="ibx-comet-particle"
            style={{
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              offsetPath: `path('${pathString}')`,
              animationDelay: `${startDelay + i * STAGGER_S}s`,
              ["--comet-opacity" as string]: opacity,
              boxShadow: `
                0 0 ${size * 1.5}px ${size * 0.3}px rgba(${CORAL_RGB}, ${0.5 * opacity}),
                0 0 ${size * 3}px ${size * 0.6}px rgba(${CORAL_RGB}, ${0.25 * opacity})
              `,
              filter: i > 1 ? `blur(${i * 0.4}px)` : "none",
              animationDuration: `${TRAVEL_DURATION_S}s`,
            }}
          />
        );
      })}
    </div>
  );
}
