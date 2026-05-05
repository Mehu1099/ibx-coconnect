"use client";

import { BriefingPage, PRINT_COLORS } from "./BriefingChrome";

interface Props {
  briefingId: string;
  generatedAt: string;
  generatedDateLabel: string;
  contributionCount: number;
  themeCount: number;
}

export default function CoverPage({
  briefingId,
  generatedAt,
  generatedDateLabel,
  contributionCount,
  themeCount,
}: Props) {
  const longDate = new Date(generatedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const idShort = briefingId.slice(0, 8).toUpperCase();

  return (
    <BriefingPage
      sectionLabel="COVER"
      pageNumber={1}
      totalPages={1}
      generatedDateLabel={generatedDateLabel}
      fullBleed
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: "11in",
          background: `url(/explore/axonometric-base.jpg) center/cover no-repeat`,
          color: PRINT_COLORS.white,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "0.6in",
          boxSizing: "border-box",
        }}
      >
        {/* Navy overlay so white text reads on any image region. Tuned
            light enough that the axonometric color and depth still come
            through; further drops would compromise text legibility on
            warm building roofs. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(11,29,58,0.40)",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
              fontSize: "11pt",
              color: PRINT_COLORS.white,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            BRIEFING · IBX-FBC · A-200
          </span>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              fontSize: "52pt",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              lineHeight: 1.0,
              margin: "0 0 10pt",
              color: PRINT_COLORS.white,
            }}
          >
            IBX Co-Connect
          </h1>
          <div
            style={{
              fontSize: "26pt",
              fontWeight: 400,
              letterSpacing: "-0.005em",
              lineHeight: 1.1,
              color: PRINT_COLORS.white,
            }}
          >
            Community Briefing
          </div>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "14pt",
                color: PRINT_COLORS.white,
                marginBottom: "16pt",
                fontWeight: 400,
              }}
            >
              Flatbush–Brooklyn College Station Area
            </div>
            <div
              style={{
                fontFamily:
                  "var(--font-jetbrains-mono), ui-monospace, monospace",
                fontSize: "10pt",
                color: PRINT_COLORS.white,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 500,
                lineHeight: 1.7,
              }}
            >
              <div>GENERATED · {longDate}</div>
              <div>
                {contributionCount} CONTRIBUTIONS · {themeCount} THEMES
              </div>
              <div>VERSION · {idShort}</div>
            </div>
          </div>

          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
              fontSize: "10pt",
              color: PRINT_COLORS.white,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            PAGE 01
          </div>
        </div>
      </div>
    </BriefingPage>
  );
}
