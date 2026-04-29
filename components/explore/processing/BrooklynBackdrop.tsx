"use client";

import { IBXTrainMini } from "./IBXTrainMini";

// Decorative backdrop behind the easel: pulsing sun, distant skyline,
// brownstone rows, scattered trees, and an elevated track with a
// looping IBX train. Pointer-events disabled so it never intercepts
// clicks meant for the figures or cancel button.
export function BrooklynBackdrop() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
      aria-hidden
    >
      {/* Pulsing sun */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 60,
          width: 50,
          height: 50,
          borderRadius: "50%",
          background: "radial-gradient(circle, #f7b6aa, #F47560)",
          opacity: 0.7,
          animation: "ibxBackdropSunPulse 4s ease-in-out infinite",
        }}
      />

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1080 360"
        preserveAspectRatio="xMidYMax meet"
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Far skyline */}
        <g opacity="0.3">
          <rect x="40" y="180" width="50" height="140" fill="#1A6B73" />
          <rect x="100" y="140" width="36" height="180" fill="#0e3a3f" />
          <rect x="146" y="160" width="44" height="160" fill="#1A6B73" />
          <rect x="900" y="170" width="48" height="150" fill="#0e3a3f" />
          <rect x="958" y="150" width="38" height="170" fill="#1A6B73" />
        </g>

        {/* Brownstones LEFT */}
        <g>
          <rect x="200" y="180" width="80" height="120" fill="#e87764" />
          <rect x="280" y="170" width="80" height="130" fill="#b54a3d" />
          <rect x="360" y="190" width="80" height="110" fill="#F47560" />
          <polygon points="200,300 220,300 220,320 200,320" fill="#3a2820" />
          <polygon points="290,300 310,300 310,320 290,320" fill="#3a2820" />
          {[210, 240, 290, 320, 370, 400].map((x, i) => (
            <rect
              key={i}
              x={x}
              y={200 + (i % 2) * 30}
              width="14"
              height="18"
              fill="#fbf6ee"
              opacity="0.85"
            />
          ))}
          <rect x="198" y="178" width="84" height="4" fill="#3a2820" />
          <rect x="278" y="168" width="84" height="4" fill="#3a2820" />
          <rect x="358" y="188" width="84" height="4" fill="#3a2820" />
        </g>

        {/* Brownstones RIGHT */}
        <g>
          <rect x="640" y="190" width="80" height="110" fill="#F47560" />
          <rect x="720" y="170" width="80" height="130" fill="#e87764" />
          <rect x="800" y="180" width="80" height="120" fill="#b54a3d" />
          {[650, 680, 730, 760, 810, 840].map((x, i) => (
            <rect
              key={i}
              x={x}
              y={210 + (i % 2) * 30}
              width="14"
              height="18"
              fill="#fbf6ee"
              opacity="0.85"
            />
          ))}
          <rect x="638" y="188" width="84" height="4" fill="#3a2820" />
          <rect x="718" y="168" width="84" height="4" fill="#3a2820" />
          <rect x="798" y="178" width="84" height="4" fill="#3a2820" />
        </g>

        {/* Trees */}
        <g>
          <circle cx="180" cy="290" r="22" fill="#1ABFAD" opacity="0.8" />
          <rect x="178" y="290" width="4" height="16" fill="#3a2820" />
          <circle cx="610" cy="285" r="20" fill="#1A6B73" opacity="0.8" />
          <rect x="608" y="285" width="4" height="16" fill="#3a2820" />
          <circle cx="900" cy="295" r="24" fill="#1ABFAD" opacity="0.8" />
          <rect x="898" y="295" width="4" height="14" fill="#3a2820" />
        </g>

        {/* Elevated track */}
        <rect x="0" y="100" width="1080" height="6" fill="#0e3a3f" />
        {[80, 240, 480, 720, 960].map((p, i) => (
          <rect
            key={i}
            x={p}
            y="106"
            width="6"
            height="80"
            fill="#0e3a3f"
            opacity="0.7"
          />
        ))}
      </svg>

      {/* Sliding train (positioned via CSS for animation). The
          translate uses a fixed pixel offset so it works inside the
          modal even when its parent isn't viewport-wide. */}
      <div
        style={{
          position: "absolute",
          top: "23%",
          left: 0,
          animation: "ibxBackdropTrainSlide 16s linear infinite",
        }}
      >
        <IBXTrainMini width={100} />
      </div>

      <style jsx>{`
        @keyframes ibxBackdropSunPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.85;
          }
        }
        @keyframes ibxBackdropTrainSlide {
          0% {
            transform: translateX(-120px);
          }
          100% {
            transform: translateX(1100px);
          }
        }
      `}</style>
    </div>
  );
}
