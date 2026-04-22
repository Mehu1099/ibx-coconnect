"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import * as d3 from "d3";
import type { FeatureCollection } from "geojson";

// ═══════════════════════════════════ Palette ═══════════════════════════════════

const C = {
  navy: "#0B1D3A",
  teal: "#1ABFAD",
  coral: "#F47560",
  cream: "#FDF6EC",
  slate: "#8899AA",
  muted: "#C8AA99",
  stroke: "#1A2A4A",
  fill: "#0F1E37",
} as const;

// ═══════════════════════════════════ Stations ═════════════════════════════════

type Side = "left" | "right";

interface Station {
  name: string;
  coords: [number, number];
  focus: boolean;
}

const STATIONS: Station[] = [
  { name: "Roosevelt Avenue",          coords: [-73.8786, 40.7496], focus: true  },
  { name: "Grand Avenue",              coords: [-73.8890, 40.7370], focus: false },
  { name: "Eliot Avenue",              coords: [-73.8860, 40.7260], focus: false },
  { name: "Metropolitan Avenue",       coords: [-73.8964, 40.7113], focus: true  },
  { name: "Myrtle Avenue",             coords: [-73.9105, 40.6985], focus: false },
  { name: "Wilson Avenue",             coords: [-73.9130, 40.6910], focus: false },
  { name: "Atlantic Avenue",           coords: [-73.9020, 40.6780], focus: true  },
  { name: "Livonia Avenue",            coords: [-73.9000, 40.6620], focus: false },
  { name: "Linden Boulevard",          coords: [-73.9030, 40.6565], focus: false },
  { name: "Remsen Avenue",             coords: [-73.9110, 40.6500], focus: false },
  { name: "Utica Avenue",              coords: [-73.9290, 40.6430], focus: false },
  { name: "Flatbush Ave\u2013Nostrand Ave", coords: [-73.9478, 40.6328], focus: true  },
  { name: "East 16th Street",          coords: [-73.9620, 40.6280], focus: false },
  { name: "McDonald Avenue",           coords: [-73.9750, 40.6340], focus: false },
  { name: "New Utrecht Avenue",        coords: [-73.9870, 40.6370], focus: false },
  { name: "Eighth Avenue",             coords: [-73.9960, 40.6390], focus: false },
  { name: "Fourth Avenue",             coords: [-74.0030, 40.6420], focus: false },
  { name: "Brooklyn Army Terminal",    coords: [-74.0190, 40.6400], focus: false },
];

const FLATBUSH_IDX = 11;

// ═══════════════════════════════════ GeoJSON ═════════════════════════════════

const GEO_URL =
  "https://data.cityofnewyork.us/api/geospatial/7t3b-ywvw?method=export&type=GeoJSON";

const FALLBACK: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { boro_name: "Brooklyn" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-73.9712,40.7075],[-73.9615,40.7112],[-73.9505,40.7154],
          [-73.9420,40.7274],[-73.9353,40.7296],[-73.9124,40.7005],
          [-73.8945,40.6870],[-73.8845,40.6798],[-73.8680,40.6610],
          [-73.8552,40.6480],[-73.8580,40.6350],[-73.8636,40.6217],
          [-73.8810,40.5930],[-73.9130,40.5810],[-73.9440,40.5772],
          [-73.9700,40.5750],[-73.9905,40.5733],[-74.0064,40.5960],
          [-74.0170,40.6080],[-74.0280,40.6133],[-74.0380,40.6250],
          [-74.0420,40.6388],[-74.0350,40.6540],[-74.0158,40.6686],
          [-73.9976,40.6780],[-73.9868,40.6912],[-73.9760,40.7000],
          [-73.9712,40.7075],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { boro_name: "Queens" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-73.9353,40.7296],[-73.9230,40.7575],[-73.9180,40.7720],
          [-73.9030,40.7800],[-73.8800,40.7880],[-73.8590,40.7910],
          [-73.8350,40.7960],[-73.8100,40.7940],[-73.7850,40.7830],
          [-73.7650,40.7700],[-73.7380,40.7520],[-73.7300,40.7350],
          [-73.7300,40.7200],[-73.7350,40.7000],[-73.7450,40.6800],
          [-73.7560,40.6650],[-73.7640,40.6430],[-73.7900,40.6250],
          [-73.8200,40.5960],[-73.8500,40.5830],[-73.8800,40.5730],
          [-73.8910,40.5850],[-73.8750,40.6100],[-73.8636,40.6217],
          [-73.8552,40.6480],[-73.8680,40.6610],[-73.8845,40.6798],
          [-73.8945,40.6870],[-73.9124,40.7005],[-73.9353,40.7296],
        ]],
      },
    },
  ],
};

// ═══════════════════════════════════ City Grid ════════════════════════════════
// Named streets around the Flatbush Ave–Nostrand Ave area. Each line is split
// at its closest point to the Flatbush station so both halves draw outward.

interface NamedStreet {
  name?: string;
  start: [number, number];
  end: [number, number];
  major: boolean;
}

function makeStreets(): NamedStreet[] {
  const streets: NamedStreet[] = [];
  const west = -73.972, east = -73.923, north = 40.648, south = 40.618;

  // E-W streets (north → south)
  const ew: { name?: string; lat: number; major: boolean }[] = [
    { name: "Foster Ave",  lat: 40.6450, major: true  },
    {                       lat: 40.6420, major: false },
    { name: "Glenwood Rd", lat: 40.6390, major: false },
    { name: "Avenue H",    lat: 40.6360, major: true  },
    { name: "Avenue I",    lat: 40.6330, major: true  },
    { name: "Avenue J",    lat: 40.6300, major: true  },
    { name: "Campus Rd",   lat: 40.6275, major: false },
    { name: "Avenue K",    lat: 40.6245, major: false },
    {                       lat: 40.6220, major: false },
  ];
  for (const s of ew) {
    streets.push({ name: s.name, start: [west, s.lat], end: [east, s.lat], major: s.major });
  }

  // N-S streets (west → east)
  const ns: { name?: string; lng: number; major: boolean }[] = [
    { name: "Ocean Ave",    lng: -73.9620, major: true  },
    {                        lng: -73.9590, major: false },
    { name: "E 21st St",    lng: -73.9560, major: false },
    { name: "Bedford Ave",  lng: -73.9530, major: true  },
    {                        lng: -73.9505, major: false },
    { name: "Nostrand Ave", lng: -73.9478, major: true  },
    {                        lng: -73.9450, major: false },
    {                        lng: -73.9420, major: false },
    { name: "New York Ave", lng: -73.9380, major: true  },
    {                        lng: -73.9350, major: false },
    { name: "E 34th St",    lng: -73.9320, major: false },
    {                        lng: -73.9290, major: false },
  ];
  for (const s of ns) {
    streets.push({ name: s.name, start: [s.lng, north], end: [s.lng, south], major: s.major });
  }

  // Flatbush Avenue (diagonal)
  streets.push({ name: "Flatbush Ave", start: [-73.934, 40.650], end: [-73.960, 40.616], major: true });

  return streets;
}

const STREETS = makeStreets();

// ═══════════════════════════════════ Ambient Grid ════════════════════════════
// Deterministic set of extra streets for the infinite draw/fade animation.

interface AmbientLine {
  start: [number, number];
  end: [number, number];
  dur: number;
  delay: number;
}

function makeAmbientLines(): AmbientLine[] {
  const lines: AmbientLine[] = [];
  const west = -73.976, east = -73.918;
  const north = 40.654, south = 40.612;
  const lngSpan = east - west, latSpan = north - south;

  for (let i = 0; i < 50; i++) {
    const s1 = ((i * 7919 + 31547) % 10000) / 10000;
    const s2 = ((i * 6271 + 17389) % 10000) / 10000;
    const s3 = ((i * 3571 + 87547) % 10000) / 10000;
    const s4 = ((i * 2969 + 104729) % 10000) / 10000;

    const dir = i % 5; // 0,1=horiz 2,3=vert 4=diag

    let sx: number, sy: number, ex: number, ey: number;

    if (dir <= 1) {
      const lat = south + s1 * latSpan;
      const lng1 = west + s2 * lngSpan * 0.4;
      const lng2 = lng1 + 0.3 * lngSpan + s3 * lngSpan * 0.4;
      sx = lng1; sy = lat; ex = Math.min(lng2, east); ey = lat;
    } else if (dir <= 3) {
      const lng = west + s1 * lngSpan;
      const lat1 = south + s2 * latSpan * 0.4;
      const lat2 = lat1 + 0.3 * latSpan + s3 * latSpan * 0.4;
      sx = lng; sy = lat1; ex = lng; ey = Math.min(lat2, north);
    } else {
      const lng1 = west + s1 * lngSpan;
      const lat1 = south + s2 * latSpan;
      const dlng = (s3 - 0.5) * lngSpan * 0.5;
      const dlat = (s4 - 0.5) * latSpan * 0.5;
      sx = lng1; sy = lat1;
      ex = Math.max(west, Math.min(east, lng1 + dlng));
      ey = Math.max(south, Math.min(north, lat1 + dlat));
    }

    lines.push({
      start: [sx, sy],
      end: [ex, ey],
      dur: 5 + s3 * 7,
      delay: s4 * 14,
    });
  }
  return lines;
}

const AMBIENT_LINES = makeAmbientLines();

// ═══════════════════════════════════ Stars ════════════════════════════════════

function makeStars(n: number) {
  const out: { x: number; y: number; r: number; o: number }[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      x: ((i * 7919 + 104729) % 10000) / 100,
      y: ((i * 6271 + 87547) % 10000) / 100,
      r: 0.4 + ((i * 3571 + 17389) % 120) / 100,
      o: 0.04 + ((i * 2969 + 31547) % 200) / 1000,
    });
  }
  return out;
}

const STARS = makeStars(100);

// ═══════════════════════════════════ Component ════════════════════════════════

export default function Home() {
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [phase, setPhase] = useState(0);
  const [skip, setSkip] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const router = useRouter();

  const handleExplore = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);
    // Fade-out window before route change. Warm cream is the DOM root
    // bg (globals.css), so there's no white flash during the swap.
    setTimeout(() => router.push("/explore"), 500);
  }, [transitioning, router]);

  // ── Measure viewport ──────────────────────────────────────────────────────
  useEffect(() => {
    const upd = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  // ── Session check (play animation only once per visit) ────────────────────
  useEffect(() => {
    try {
      if (sessionStorage.getItem("ibx-played")) {
        setPhase(4);
        setSkip(true);
      }
    } catch {
      /* SSR or private browsing */
    }
  }, []);

  // ── Fetch borough GeoJSON (with timeout + fallback) ───────────────────────
  useEffect(() => {
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 5000);

    fetch(GEO_URL, { signal: ac.signal })
      .then((r) => r.json())
      .then((data: FeatureCollection) => {
        clearTimeout(to);
        const keep: FeatureCollection = {
          type: "FeatureCollection",
          features: data.features.filter((f) => {
            const name =
              (f.properties as Record<string, unknown>)?.boro_name ??
              (f.properties as Record<string, unknown>)?.BoroName ??
              (f.properties as Record<string, unknown>)?.BORO_NAME ??
              "";
            return name === "Brooklyn" || name === "Queens";
          }),
        };
        setGeo(keep.features.length >= 2 ? keep : FALLBACK);
      })
      .catch(() => {
        clearTimeout(to);
        setGeo(FALLBACK);
      });

    return () => {
      ac.abort();
      clearTimeout(to);
    };
  }, []);

  // ── Animation timeline ────────────────────────────────────────────────────
  useEffect(() => {
    if (!geo || !dims.w || phase !== 0) return;

    setPhase(1);
    if (skip) return;

    const t2 = setTimeout(() => setPhase(2), 3000);
    const t3 = setTimeout(() => setPhase(3), 5500);
    const t4 = setTimeout(() => {
      setPhase(4);
      try {
        sessionStorage.setItem("ibx-played", "1");
      } catch {}
    }, 8000);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, dims.w]);

  // ── D3 projection ─────────────────────────────────────────────────────────
  const proj = useMemo(() => {
    if (!geo || !dims.w) return null;
    const pad = Math.min(dims.w, dims.h) * 0.06;
    return d3
      .geoMercator()
      .fitExtent([[pad, pad], [dims.w - pad, dims.h - pad]], geo);
  }, [geo, dims]);

  const pathGen = useMemo(
    () => (proj ? d3.geoPath().projection(proj) : null),
    [proj],
  );

  // ── Derived SVG data ──────────────────────────────────────────────────────
  const boroughPaths = useMemo(() => {
    if (!pathGen || !geo) return [];
    return geo.features.map((f) => pathGen(f) ?? "");
  }, [pathGen, geo]);

  const routeD = useMemo(() => {
    if (!proj) return "";
    const pts = STATIONS.map((s) => proj(s.coords)).filter(
      (p): p is [number, number] => p !== null,
    );
    return (
      d3
        .line<[number, number]>()
        .x((d) => d[0])
        .y((d) => d[1])
        .curve(d3.curveCatmullRom.alpha(0.5))(pts) ?? ""
    );
  }, [proj]);

  // ── Stations with computed side + label collision avoidance ────────────────
  const stns = useMemo(() => {
    if (!proj) return [];

    const raw = STATIONS.map((s, i) => {
      const p = proj(s.coords);
      if (!p) return null;
      return {
        ...s,
        x: p[0],
        y: p[1],
        side: (i % 2 === 0 ? "right" : "left") as Side,
        idx: i,
        labelY: 0,
      };
    }).filter((s): s is NonNullable<typeof s> => !!s);

    // Push apart labels on the same side that are < 16 px apart
    const MIN_GAP = 16;
    for (const side of ["left", "right"] as Side[]) {
      const group = raw.filter((s) => s.side === side).sort((a, b) => a.y - b.y);
      let lastY = -Infinity;
      for (const s of group) {
        const ey = Math.max(s.y, lastY + MIN_GAP);
        s.labelY = ey - s.y;
        lastY = ey;
      }
    }

    return raw;
  }, [proj]);

  // ── Grid halves (split each street at closest point to Flatbush) ──────────
  const gridData = useMemo(() => {
    const empty = {
      halves: [] as { d: string; major: boolean; dist: number }[],
      labels: [] as { name: string; x: number; y: number; angle: number; dist: number }[],
    };
    if (!proj || !dims.w) return empty;
    const fp = proj(STATIONS[FLATBUSH_IDX].coords);
    if (!fp) return empty;
    const [fx, fy] = fp;

    const halves: typeof empty.halves = [];
    const labels: typeof empty.labels = [];

    for (const street of STREETS) {
      const s = proj(street.start);
      const e = proj(street.end);
      if (!s || !e) continue;

      // Closest-point parameter on the line segment
      const dx = e[0] - s[0];
      const dy = e[1] - s[1];
      const lenSq = dx * dx + dy * dy;
      let t = lenSq === 0 ? 0 : ((fx - s[0]) * dx + (fy - s[1]) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));

      const cx = s[0] + t * dx;
      const cy = s[1] + t * dy;
      const dist = Math.sqrt((cx - fx) ** 2 + (cy - fy) ** 2);

      // Two halves that draw outward from the split point
      if (t > 0.02) {
        halves.push({ d: `M${cx} ${cy}L${s[0]} ${s[1]}`, major: street.major, dist });
      }
      if (t < 0.98) {
        halves.push({ d: `M${cx} ${cy}L${e[0]} ${e[1]}`, major: street.major, dist });
      }

      // Label at street midpoint (named streets only)
      if (street.name) {
        const mx = (s[0] + e[0]) / 2;
        const my = (s[1] + e[1]) / 2;
        let a = Math.atan2(dy, dx) * (180 / Math.PI);
        if (a > 90) a -= 180;
        else if (a < -90) a += 180;
        labels.push({ name: street.name, x: mx, y: my, angle: a, dist });
      }
    }

    halves.sort((a, b) => a.dist - b.dist);
    labels.sort((a, b) => a.dist - b.dist);
    return { halves, labels };
  }, [proj, dims]);

  // ── Ambient grid lines (infinite CSS animation) ──────────────────────────
  const ambientPaths = useMemo(() => {
    if (!proj) return [];
    return AMBIENT_LINES.map((line) => {
      const s = proj(line.start);
      const e = proj(line.end);
      if (!s || !e) return null;
      const dx = e[0] - s[0], dy = e[1] - s[1];
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 3) return null;
      return { d: `M${s[0]} ${s[1]}L${e[0]} ${e[1]}`, dur: line.dur, delay: line.delay };
    }).filter((p): p is NonNullable<typeof p> => p !== null);
  }, [proj]);

  // ── Zoom target (Flatbush Ave–Nostrand Ave) ───────────────────────────────
  const zoom = useMemo(() => {
    if (!proj || !dims.w) return { x: 0, y: 0, s: 1 };
    const fp = proj(STATIONS[FLATBUSH_IDX].coords);
    if (!fp) return { x: 0, y: 0, s: 1 };
    const s = 4.5;
    return { x: dims.w / 2 - fp[0] * s, y: dims.h / 2 - fp[1] * s, s };
  }, [proj, dims]);

  // ── Skip handler ──────────────────────────────────────────────────────────
  const doSkip = useCallback(() => {
    setSkip(true);
    setPhase(4);
    try {
      sessionStorage.setItem("ibx-played", "1");
    } catch {}
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const dur = (n: number) => (skip ? 0.4 : n);
  const mobile = dims.w > 0 && dims.w < 640;

  // ═══════════════════════════════════ Render ════════════════════════════════

  return (
    <motion.div
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: C.navy }}
      initial={false}
      animate={{
        backgroundColor: transitioning ? "#EDE5D5" : C.navy,
      }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* ── Star field ─────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {STARS.map((st, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${st.x}%`,
              top: `${st.y}%`,
              width: st.r,
              height: st.r,
              background: C.cream,
              opacity: st.o,
            }}
          />
        ))}
      </div>

      {/* ── SVG Map ────────────────────────────────────────────────────── */}
      {proj && (
        <motion.svg
          className="absolute inset-0"
          width={dims.w}
          height={dims.h}
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          animate={{ opacity: transitioning ? 0 : 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Zoom container — uses CSS transition for reliable SVG transforms */}
          <g
            style={{
              transform: phase >= 3
                ? `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.s})`
                : "translate(0px, 0px) scale(1)",
              transformOrigin: "0 0",
              transformBox: "view-box",
              transition: skip
                ? "transform 0.4s ease-out"
                : "transform 2.5s cubic-bezier(0.4, 0, 0.2, 1)",
            } as React.CSSProperties}
          >
            {/* Borough outlines */}
            {boroughPaths.map((d, i) => (
              <motion.path
                key={`boro-${i}`}
                d={d}
                fill={C.fill}
                stroke={C.stroke}
                strokeWidth={1}
                initial={{ opacity: 0 }}
                animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
                transition={{
                  delay: skip ? 0 : 0.3,
                  duration: dur(0.8),
                  ease: "easeOut",
                }}
              />
            ))}

            {/* City grid — each street split at its nearest point to Flatbush,
                both halves draw outward via pathLength animation */}
            {gridData.halves.map((half, i) => (
              <motion.path
                key={`grid-${i}`}
                d={half.d}
                fill="none"
                stroke={half.major ? "#1E2F4A" : "#162238"}
                strokeWidth={half.major ? 0.4 : 0.2}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={
                  phase >= 3
                    ? { pathLength: 1, opacity: half.major ? 0.7 : 0.35 }
                    : { pathLength: 0, opacity: 0 }
                }
                transition={{
                  pathLength: {
                    delay: skip ? 0 : i * 0.11,
                    duration: skip ? 0.3 : 1.5,
                    ease: "easeOut",
                  },
                  opacity: {
                    delay: skip ? 0 : i * 0.11,
                    duration: 0.3,
                  },
                }}
              />
            ))}

            {/* Grid street name labels (scaled by zoom — 2 SVG px ≈ 9 px on screen) */}
            {gridData.labels.map((lbl, i) => (
              <motion.text
                key={`grid-lbl-${i}`}
                x={lbl.x}
                y={lbl.y}
                fill={C.slate}
                fontSize={2}
                textAnchor="middle"
                fontFamily="system-ui, -apple-system, sans-serif"
                transform={`rotate(${lbl.angle}, ${lbl.x}, ${lbl.y})`}
                initial={{ opacity: 0 }}
                animate={phase >= 3 ? { opacity: 0.4 } : { opacity: 0 }}
                transition={{
                  delay: skip ? 0 : 0.5 + i * 0.25,
                  duration: 0.5,
                }}
              >
                {lbl.name}
              </motion.text>
            ))}

            {/* Ambient grid — infinite CSS draw/fade animation */}
            {phase >= 3 && ambientPaths.map((p, i) => (
              <path
                key={`amb-${i}`}
                d={p.d}
                fill="none"
                stroke={i % 3 === 0 ? "#1E3050" : "#1A2A4A"}
                strokeWidth={i % 4 === 0 ? 0.7 : 0.4}
                pathLength={1}
                className="ambient-grid-line"
                style={{
                  "--grid-dur": `${p.dur}s`,
                  "--grid-delay": `${p.delay}s`,
                } as React.CSSProperties}
              />
            ))}

            {/* Route glow (wider, semi-transparent teal behind main line) */}
            <motion.path
              d={routeD}
              fill="none"
              stroke={C.teal}
              strokeWidth={14}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={0.15}
              initial={{ pathLength: 0 }}
              animate={phase >= 1 ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{
                delay: skip ? 0 : 1,
                duration: dur(2),
                ease: "easeInOut",
              }}
            />

            {/* Route main line */}
            <motion.path
              d={routeD}
              fill="none"
              stroke={C.teal}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={phase >= 1 ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{
                delay: skip ? 0 : 1,
                duration: dur(2),
                ease: "easeInOut",
              }}
            />

            {/* Station dots, ripples, and labels */}
            {stns.map((st) => {
              const r = st.focus ? 8 : 5;
              const del = skip ? 0 : st.idx * 0.12;
              const dx = st.side === "right" ? r + 6 : -(r + 6);
              const anch = st.side === "right" ? "start" : "end";
              const isFlatbush = st.idx === FLATBUSH_IDX;
              const dotHidden = phase >= 4 || (phase >= 3 && !isFlatbush);
              const labelHidden = phase >= 3;
              const inDense = st.idx >= 11 && st.idx <= 17;
              const fs = st.focus
                ? (mobile ? 10 : 13)
                : inDense
                  ? 9
                  : (mobile ? 8 : 10);

              return (
                <g key={st.name} transform={`translate(${st.x},${st.y})`}>
                  {/* Expanding ripple ring */}
                  {phase >= 2 && phase < 3 && (
                    <motion.circle
                      r={r}
                      fill="none"
                      stroke={C.coral}
                      strokeWidth={2}
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 3, opacity: 0 }}
                      transition={{
                        delay: del,
                        duration: 0.8,
                        ease: "easeOut",
                      }}
                    />
                  )}

                  {/* Station dot */}
                  <motion.circle
                    r={r}
                    fill={C.coral}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={
                      phase >= 2
                        ? { scale: 1, opacity: dotHidden ? 0 : 1 }
                        : { scale: 0, opacity: 0 }
                    }
                    transition={{
                      delay: dotHidden ? 0 : del,
                      duration: dotHidden ? 0.3 : dur(0.3),
                      ease: "easeOut",
                    }}
                  />

                  {/* Station label */}
                  <motion.text
                    x={dx}
                    y={4 + st.labelY}
                    textAnchor={anch}
                    fill={st.focus ? C.cream : C.muted}
                    fontSize={fs}
                    fontWeight={st.focus ? 600 : 400}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    initial={{ opacity: 0 }}
                    animate={
                      phase >= 2
                        ? { opacity: labelHidden ? 0 : 1 }
                        : { opacity: 0 }
                    }
                    transition={{
                      delay: labelHidden ? 0 : del + 0.05,
                      duration: labelHidden ? 0.3 : dur(0.4),
                      ease: "easeOut",
                    }}
                  >
                    {st.name}
                  </motion.text>
                </g>
              );
            })}

            {/* "Interborough Express" route label */}
            {stns.length > 10 && (
              <motion.text
                x={(stns[9].x + stns[10].x) / 2 + 20}
                y={(stns[9].y + stns[10].y) / 2 - 8}
                fill={C.slate}
                fontSize={mobile ? 9 : 11}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontStyle="italic"
                initial={{ opacity: 0 }}
                animate={
                  phase >= 2
                    ? { opacity: phase >= 3 ? 0 : 0.6 }
                    : { opacity: 0 }
                }
                transition={{
                  delay: skip ? 0 : phase >= 3 ? 0 : 1.5,
                  duration: phase >= 3 ? 0.3 : dur(0.6),
                }}
              >
                Interborough Express
              </motion.text>
            )}
          </g>
        </motion.svg>
      )}

      {/* ── Phase 4: Dark overlay (map + grid visible through it) ──────── */}
      {phase >= 4 && (
        <motion.div
          className="absolute inset-0 z-10"
          style={{ background: "rgba(0,0,0,0.38)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: transitioning ? 0 : 1 }}
          transition={{
            duration: transitioning ? 0.5 : dur(1),
            ease: "easeOut",
          }}
        />
      )}

      {/* ── Phase 4: Welcome content ───────────────────────────────────── */}
      {phase >= 4 && (
        <motion.div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: dur(0.5), delay: 0.2 }}
        >
          {/* Centered title — only rendered while NOT transitioning.
              When the button is clicked, this unmounts and a matching
              layoutId element mounts at the top-left; framer-motion
              animates the bounding box between the two positions. */}
          {!transitioning && (
            <motion.h1
              layoutId="ibx-title"
              className="text-center"
              style={{
                color: C.cream,
                fontSize: mobile ? 40 : 56,
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                margin: 0,
                lineHeight: 1.2,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: dur(0.8),
                delay: skip ? 0.3 : 0.3,
                ease: "easeOut",
              }}
            >
              IBX Co-Connect
            </motion.h1>
          )}

          <motion.p
            className="mt-4 text-center max-w-lg"
            style={{
              color: "#B0BFCC",
              fontSize: mobile ? 16 : 20,
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 400,
              letterSpacing: "0",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: transitioning ? 0 : 1, y: 0 }}
            transition={
              transitioning
                ? { duration: 0.5, ease: "easeOut" }
                : {
                    duration: dur(0.8),
                    delay: skip ? 0.4 : 0.6,
                    ease: "easeOut",
                  }
            }
          >
            Community-driven planning for the Interborough Express
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: transitioning ? 0 : 1, y: 0 }}
            transition={
              transitioning
                ? { duration: 0.5, ease: "easeOut" }
                : {
                    duration: dur(0.8),
                    delay: skip ? 0.5 : 1.0,
                    ease: "easeOut",
                  }
            }
          >
            <button
              className="btn-explore cursor-pointer"
              onClick={handleExplore}
              disabled={transitioning}
            >
              Explore the Platform
            </button>
            <button className="btn-portal cursor-pointer">
              Stakeholder Portal
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* ── Transitioning title (top-left) — mounts when the button is
             clicked. Shares layoutId="ibx-title" with the centered h1,
             so framer-motion interpolates the bbox between the two
             positions. The wrapper mimics the explore nav layout (h-14,
             px-6, flex items-center) so the text lands at the exact
             same pixel position as the explore nav title. ───────────── */}
      {phase >= 4 && transitioning && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 56,
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            zIndex: 40,
            pointerEvents: "none",
          }}
        >
          <motion.div
            layoutId="ibx-title"
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 18,
              letterSpacing: "-0.03em",
              color: C.cream,
              margin: 0,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
            animate={{ color: "#0B1D3A" }}
            transition={{
              layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
              color: { duration: 0.5, ease: "easeInOut" },
            }}
          >
            IBX Co-Connect
          </motion.div>
        </div>
      )}

      {/* ── Skip button ────────────────────────────────────────────────── */}
      {phase > 0 && phase < 4 && (
        <motion.button
          className="absolute bottom-6 right-6 z-30 text-sm cursor-pointer"
          style={{ color: C.slate }}
          onClick={doSkip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Skip &rarr;
        </motion.button>
      )}
    </motion.div>
  );
}
