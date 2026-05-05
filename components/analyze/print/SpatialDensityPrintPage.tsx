"use client";

import Image from "next/image";
import { BriefingPage, PRINT_COLORS } from "./BriefingChrome";

interface SnapshotLocation {
  id: string;
  label: string;
  image: string;
  x: number;
  y: number;
}

interface MinimalContribution {
  locationId: string;
}

interface Props {
  pageNumber: number;
  totalPages: number;
  generatedDateLabel: string;
  locations: SnapshotLocation[];
  contributions: MinimalContribution[];
}

// Reuses the dashboard SpatialDensityPanel's pin-size formula, scaled
// up for the larger print canvas (6.5" wide vs ~3" on screen).

export default function SpatialDensityPrintPage({
  pageNumber,
  totalPages,
  generatedDateLabel,
  locations,
  contributions,
}: Props) {
  const densityByLoc: Record<string, number> = {};
  locations.forEach((l) => {
    densityByLoc[l.id] = 0;
  });
  contributions.forEach((c) => {
    if (c.locationId in densityByLoc) {
      densityByLoc[c.locationId] += 1;
    }
  });
  const maxDensity = Math.max(1, ...Object.values(densityByLoc));

  return (
    <BriefingPage
      sectionLabel="SPATIAL DENSITY"
      pageNumber={pageNumber}
      totalPages={totalPages}
      generatedDateLabel={generatedDateLabel}
    >
      <h1 className="briefing-h1">Where the conversation is happening</h1>
      <p className="briefing-subhead">
        Pin size scales with contribution count per location
      </p>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "6.5in",
          aspectRatio: "4 / 3",
          border: `1px solid ${PRINT_COLORS.navyHairline}`,
          background: "#F2EDE0",
          margin: "0 0 14pt",
          overflow: "hidden",
        }}
      >
        <Image
          src="/explore/axonometric-base.jpg"
          alt="Axonometric view of the Flatbush–Brooklyn College station area"
          fill
          sizes="6.5in"
          style={{ objectFit: "cover" }}
          priority
        />
        {locations.map((loc) => {
          const count = densityByLoc[loc.id] ?? 0;
          const intensity = count / maxDensity;
          const sizePt = count > 0 ? 18 + intensity * 14 : 12;
          const fillColor = count > 0 ? "#F47560" : "#F9A48F";
          return (
            <div
              key={loc.id}
              style={{
                position: "absolute",
                left: `${loc.x}%`,
                top: `${loc.y}%`,
                transform: "translate(-50%, -50%)",
                width: `${sizePt}pt`,
                height: `${sizePt}pt`,
                borderRadius: "50%",
                background: fillColor,
                border: "1.5pt solid #FFFFFF",
                boxShadow:
                  count > 0
                    ? "0 2pt 6pt -1pt rgba(244,117,96,0.45)"
                    : "0 1pt 3pt -1pt rgba(244,117,96,0.20)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontFamily:
                  "var(--font-jetbrains-mono), ui-monospace, monospace",
                fontSize: "9pt",
                fontWeight: 700,
              }}
            >
              {loc.id}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16pt",
          fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
          fontSize: "9pt",
          color: PRINT_COLORS.navyDim,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        <span>Pin size = density</span>
        <div style={{ display: "flex", alignItems: "center", gap: "6pt" }}>
          <span
            style={{
              width: "12pt",
              height: "12pt",
              borderRadius: "50%",
              background: "#F9A48F",
              border: "1pt solid #FFFFFF",
            }}
          />
          <span>Low</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6pt" }}>
          <span
            style={{
              width: "20pt",
              height: "20pt",
              borderRadius: "50%",
              background: "#F47560",
              border: "1.5pt solid #FFFFFF",
            }}
          />
          <span>High</span>
        </div>
      </div>
    </BriefingPage>
  );
}
