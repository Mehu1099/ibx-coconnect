"use client";

// Three flat-geometric SVG community figures used in the AI processing
// screen. Coral / teal / navy track the project's brand tokens
// (#F47560, #1ABFAD, #0B1D3A). Hex values for skin tones, accents,
// and the bicycle frame are kept as inline literals — they're scene-
// dressing only, not part of the design system.

interface FigureProps {
  width?: number;
}

export function PersonElder({ width = 64 }: FigureProps) {
  const h = (width / 80) * 120;
  return (
    <svg
      width={width}
      height={h}
      viewBox="0 0 80 120"
      style={{ overflow: "visible" }}
      aria-hidden
    >
      <ellipse cx="40" cy="116" rx="18" ry="2.5" fill="rgba(11,29,58,0.18)" />
      <rect x="32" y="80" width="7" height="32" rx="2" fill="#3a4a5c" />
      <rect x="41" y="80" width="7" height="32" rx="2" fill="#3a4a5c" />
      <rect x="30" y="110" width="11" height="5" rx="1.5" fill="#0B1D3A" />
      <rect x="39" y="110" width="11" height="5" rx="1.5" fill="#0B1D3A" />
      <path
        d="M 27 48 Q 27 44 31 44 L 49 44 Q 53 44 53 48 L 55 82 Q 55 86 51 86 L 29 86 Q 25 86 25 82 Z"
        fill="#1A6B73"
      />
      <path
        d="M 60 48 L 64 110"
        stroke="#8b6f47"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 58 48 Q 60 44 64 46"
        stroke="#8b6f47"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 27 48 Q 22 60 26 76 L 30 74 Q 28 60 32 52 Z"
        fill="#1A6B73"
      />
      <circle cx="28" cy="76" r="3" fill="#e2c4a3" />
      <path d="M 53 48 Q 60 50 60 56 L 56 56 Q 54 52 50 52 Z" fill="#1A6B73" />
      <circle cx="60" cy="50" r="3" fill="#e2c4a3" />
      <rect x="36" y="40" width="8" height="6" fill="#e2c4a3" />
      <circle cx="40" cy="30" r="11" fill="#e2c4a3" />
      <path
        d="M 29 28 Q 29 16 40 16 Q 51 16 51 28 Q 51 23 45 22 L 35 22 Q 29 23 29 28 Z"
        fill="#b8b4ad"
      />
    </svg>
  );
}

export function PersonBike({ width = 90 }: FigureProps) {
  const h = (width / 100) * 80;
  return (
    <svg
      width={width}
      height={h}
      viewBox="0 0 100 80"
      style={{ overflow: "visible" }}
      aria-hidden
    >
      <ellipse cx="50" cy="76" rx="38" ry="2" fill="rgba(11,29,58,0.18)" />
      <circle cx="22" cy="62" r="12" fill="none" stroke="#0B1D3A" strokeWidth="2" />
      <circle cx="22" cy="62" r="2" fill="#0B1D3A" />
      <circle cx="78" cy="62" r="12" fill="none" stroke="#0B1D3A" strokeWidth="2" />
      <circle cx="78" cy="62" r="2" fill="#0B1D3A" />
      <path
        d="M 22 62 L 50 40 L 78 62 M 50 40 L 56 62 M 50 40 L 44 26"
        stroke="#0B1D3A"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="48" y="38" width="10" height="3" rx="1" fill="#0B1D3A" />
      <path
        d="M 40 24 L 50 24"
        stroke="#0B1D3A"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 38 26 Q 36 22 40 18 L 56 14 Q 60 14 60 18 L 58 36 Q 58 40 54 40 L 42 40 Q 38 40 38 36 Z"
        fill="#F47560"
      />
      <rect
        x="48"
        y="38"
        width="5"
        height="20"
        rx="1.5"
        fill="#1A6B73"
        transform="rotate(20 50 38)"
      />
      <rect
        x="55"
        y="38"
        width="5"
        height="22"
        rx="1.5"
        fill="#1A6B73"
        transform="rotate(-15 56 38)"
      />
      <path d="M 38 26 Q 32 22 38 18 Q 42 18 42 22 Z" fill="#F47560" />
      <circle cx="38" cy="22" r="2.5" fill="#a06a3f" />
      <circle cx="56" cy="10" r="7" fill="#a06a3f" />
      <path
        d="M 49 10 Q 49 3 56 3 Q 63 3 63 10 L 63 8 Q 56 5 49 8 Z"
        fill="#b54a3d"
      />
    </svg>
  );
}

export function PersonIdea({ width = 64 }: FigureProps) {
  const h = (width / 80) * 120;
  return (
    <svg
      width={width}
      height={h}
      viewBox="0 0 80 120"
      style={{ overflow: "visible" }}
      aria-hidden
    >
      <ellipse cx="40" cy="116" rx="18" ry="2.5" fill="rgba(11,29,58,0.18)" />
      <rect x="32" y="78" width="7" height="34" rx="2" fill="#1A6B73" />
      <rect x="41" y="78" width="7" height="34" rx="2" fill="#1A6B73" />
      <rect x="30" y="110" width="11" height="5" rx="1.5" fill="#0B1D3A" />
      <rect x="39" y="110" width="11" height="5" rx="1.5" fill="#0B1D3A" />
      <path
        d="M 26 46 Q 26 42 30 42 L 50 42 Q 54 42 54 46 L 56 80 Q 56 84 52 84 L 28 84 Q 24 84 24 80 Z"
        fill="#e87764"
      />
      <path
        d="M 54 46 Q 62 36 56 24 L 50 26 Q 52 36 50 46 Z"
        fill="#e87764"
      />
      <rect x="50" y="18" width="8" height="12" rx="1.5" fill="#0B1D3A" />
      <rect x="51" y="19" width="6" height="9" rx=".5" fill="#8fd6d8" />
      <path
        d="M 26 46 Q 22 62 28 78 L 32 76 Q 30 60 32 50 Z"
        fill="#e87764"
      />
      <circle cx="28" cy="78" r="3" fill="#d9a878" />
      <rect x="36" y="40" width="8" height="4" fill="#d9a878" />
      <path
        d="M 26 30 Q 26 14 40 14 Q 54 14 54 30 L 54 44 L 52 44 Q 52 38 46 36 L 34 36 Q 28 38 28 44 L 26 44 Z"
        fill="#0B1D3A"
      />
      <ellipse cx="40" cy="32" rx="7" ry="8" fill="#d9a878" />
    </svg>
  );
}
