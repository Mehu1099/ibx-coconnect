"use client";

interface IBXTrainMiniProps {
  width?: number;
}

// Tiny stylized IBX train used in the Brooklyn backdrop. Teal body
// + coral underline mirrors the brand line.
export function IBXTrainMini({ width = 100 }: IBXTrainMiniProps) {
  const h = (width / 100) * 22;
  return (
    <svg
      width={width}
      height={h}
      viewBox="0 0 100 22"
      style={{ overflow: "visible" }}
      aria-hidden
    >
      <rect x="0" y="0" width="100" height="22" rx="3" fill="#1ABFAD" />
      <rect x="0" y="16" width="100" height="2" fill="#F47560" />
      <rect x="6" y="4" width="16" height="10" rx="1" fill="#8fd6d8" />
      <rect x="28" y="4" width="16" height="10" rx="1" fill="#8fd6d8" />
      <rect x="50" y="4" width="16" height="10" rx="1" fill="#8fd6d8" />
      <rect x="72" y="4" width="22" height="10" rx="1" fill="#8fd6d8" />
    </svg>
  );
}
