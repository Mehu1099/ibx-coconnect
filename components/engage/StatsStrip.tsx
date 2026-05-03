"use client";

import { useMemo } from "react";
import type { Contribution } from "@/lib/use-engage-data";

interface StatsStripProps {
  totalVoices: number;
  hotZones: number;
  activeLocations: number;
  contributions: Contribution[];
}

// Bottom-center floating glass strip on a SOLID white surface (the
// previous translucent treatment let the map text-bleed through).
// Three numeric stats + a 7-day sparkline of contribution arrivals,
// separated by vertical dividers. Strip auto-sizes to its content so
// "Active sites" never gets clipped on smaller viewports.

export function StatsStrip({
  totalVoices,
  hotZones,
  activeLocations,
  contributions,
}: StatsStripProps) {
  // Bucket the last 7 calendar days. Day 0 = today, day 6 = six days
  // back. Oldest → newest, left-to-right, so the rightmost bar is now.
  const sparklineData = useMemo(() => {
    const buckets = new Array<number>(7).fill(0);
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    contributions.forEach((c) => {
      const t = new Date(c.createdAt).getTime();
      const ageDays = Math.floor((startOfToday - t) / (24 * 60 * 60 * 1000));
      if (ageDays >= 0 && ageDays < 7) {
        buckets[6 - ageDays] += 1;
      } else if (ageDays < 0) {
        buckets[6] += 1;
      }
    });
    return buckets;
  }, [contributions]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 30,
        display: "flex",
        alignItems: "stretch",
        gap: 24,
        padding: "14px 24px",
        background: "rgba(255, 255, 255, 0.78)",
        backdropFilter: "blur(28px) saturate(1.4)",
        WebkitBackdropFilter: "blur(28px) saturate(1.4)",
        borderRadius: 12,
        border: "1px solid rgba(255, 255, 255, 0.65)",
        boxShadow:
          "0 8px 24px -6px rgba(11, 29, 58, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.2)",
        fontFamily: "var(--font-space-grotesk), sans-serif",
        color: "#0B1D3A",
        whiteSpace: "nowrap",
      }}
    >
      <Stat label="VOICES" value={totalVoices.toString()} />
      <Divider />
      <Stat label="HOT ZONES" value={`${hotZones}`} suffix="/ 8" />
      <Divider />
      <Stat label="ACTIVE SITES" value={`${activeLocations}`} suffix="/ 8" />
      <Divider />
      <Sparkline data={sparklineData} />
    </div>
  );
}

function Divider() {
  return (
    <div
      aria-hidden
      style={{
        width: 1,
        margin: "2px 0",
        background: "rgba(11,29,58,0.12)",
        flexShrink: 0,
      }}
    />
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 3,
        minWidth: 70,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 9,
          fontWeight: 600,
          color: "#6B7A8C",
          letterSpacing: "0.18em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontWeight: 700,
          color: "#0B1D3A",
          letterSpacing: "-0.01em",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: 22 }}>{value}</span>
        {suffix && (
          <span
            style={{
              fontSize: 11,
              color: "#8899AA",
              fontWeight: 500,
              letterSpacing: "0.08em",
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 5,
        justifyContent: "center",
        minWidth: 132,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 9,
          fontWeight: 600,
          color: "#6B7A8C",
          letterSpacing: "0.18em",
        }}
      >
        7-DAY ARRIVALS
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 3,
          height: 24,
          paddingTop: 2,
          // Belt-and-suspenders: clip any bar that somehow exceeds 100%.
          overflow: "hidden",
        }}
      >
        {data.map((value, i) => {
          const heightPct = (value / max) * 100;
          const isToday = i === data.length - 1;
          return (
            <div
              key={i}
              title={`${value} on day ${i - 6}`}
              style={{
                flex: 1,
                height: `${Math.max(heightPct, 8)}%`,
                background: isToday ? "#F47560" : "rgba(244,117,96,0.55)",
                border: isToday
                  ? "1px solid #D85A45"
                  : "1px solid rgba(216,90,69,0.25)",
                borderRadius: 1,
                minWidth: 6,
                boxSizing: "border-box",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
