"use client";

import Image from "next/image";
import { getThemeColor } from "@/lib/theme-colors";
import type { Theme } from "@/lib/use-themes";
import { BriefingPage, PRINT_COLORS } from "./BriefingChrome";

interface LocationContribution {
  id: string;
  rawId: string;
  type: string;
  locationId: string;
  content: string;
  contributorRole: string;
  contributorAge: string;
  createdAt: string;
}

interface SnapshotLocation {
  id: string;
  label: string;
  description: string;
  image: string;
  category: string;
}

interface Props {
  pageNumber: number;
  totalPages: number;
  generatedDateLabel: string;
  location: SnapshotLocation;
  longName: string; // e.g., "Hillel Place"
  contributions: LocationContribution[]; // chunk to render on this page
  themes: Theme[];
  chunkIndex: number; // 0-based; first chunk = 0
  chunkCount: number;
  totalContributionCount: number;
}

const TYPE_LABEL: Record<string, string> = {
  sticky: "Note",
  concern: "Concern",
  question_response: "Response",
  ai_proposal: "Proposal",
};

const TYPE_COLORS: Record<string, string> = {
  sticky: "#F0A933",
  concern: "#F47560",
  question_response: "#7AB2E5",
  ai_proposal: "#1ABFAD",
};

export default function LocationSectionPage({
  pageNumber,
  totalPages,
  generatedDateLabel,
  location,
  longName,
  contributions,
  themes,
  chunkIndex,
  chunkCount,
  totalContributionCount,
}: Props) {
  const isFirstChunk = chunkIndex === 0;
  const sectionLabel = `LOCATION · ${location.id}${
    chunkCount > 1 ? ` (${chunkIndex + 1} OF ${chunkCount})` : ""
  }`;

  // Build theme-by-cid lookup so each card can show inline theme dots.
  const themesByCid = new Map<string, Theme[]>();
  themes.forEach((t) => {
    t.contribution_ids?.forEach((cid) => {
      const arr = themesByCid.get(cid) ?? [];
      arr.push(t);
      themesByCid.set(cid, arr);
    });
  });

  return (
    <BriefingPage
      sectionLabel={sectionLabel}
      pageNumber={pageNumber}
      totalPages={totalPages}
      generatedDateLabel={generatedDateLabel}
    >
      {isFirstChunk ? (
        <>
          <h1 className="briefing-h1">{longName}</h1>
          <p className="briefing-subhead">
            {totalContributionCount}{" "}
            {totalContributionCount === 1 ? "contribution" : "contributions"} at
            this location
          </p>

          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "6.5in",
              height: "2.7in",
              border: `1px solid ${PRINT_COLORS.navyHairline}`,
              marginBottom: "8pt",
              overflow: "hidden",
              background: "#F2EDE0",
            }}
          >
            <Image
              src={location.image}
              alt={location.description}
              fill
              sizes="6.5in"
              style={{ objectFit: "cover" }}
              priority
            />
          </div>
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
              fontSize: "9pt",
              color: PRINT_COLORS.navyDim,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 500,
              marginBottom: "20pt",
              lineHeight: 1.5,
            }}
          >
            LOC · {location.id} · {location.description}
          </div>

          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
              fontSize: "9pt",
              color: PRINT_COLORS.navyDim,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: "10pt",
            }}
          >
            What we&apos;re hearing here
          </div>
        </>
      ) : (
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
            fontSize: "10pt",
            color: PRINT_COLORS.navyDim,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: "12pt",
          }}
        >
          {longName} (continued)
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "9pt" }}>
        {contributions.map((c) => {
          const cid = `${c.type}:${c.rawId}`;
          const themesForCid = themesByCid.get(cid) ?? [];
          const typeColor = TYPE_COLORS[c.type] ?? "#6B7A8C";
          return (
            <div
              key={c.id}
              style={{
                background: PRINT_COLORS.white,
                border: `1px solid ${PRINT_COLORS.navyHairline}`,
                padding: "10pt 12pt",
                pageBreakInside: "avoid",
                breakInside: "avoid",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8pt",
                  flexWrap: "wrap",
                  marginBottom: "5pt",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "1pt 7pt",
                    background: `${typeColor}26`,
                    color: typeColor,
                    fontFamily:
                      "var(--font-jetbrains-mono), ui-monospace, monospace",
                    fontSize: "8.5pt",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {TYPE_LABEL[c.type] ?? c.type}
                </span>
                <span
                  style={{
                    fontFamily:
                      "var(--font-jetbrains-mono), ui-monospace, monospace",
                    fontSize: "8.5pt",
                    color: PRINT_COLORS.navyDim,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  {c.contributorRole} · {c.contributorAge || "—"}
                </span>
              </div>
              <div
                style={{
                  fontSize: "10.5pt",
                  lineHeight: 1.55,
                  color: PRINT_COLORS.navy,
                }}
              >
                {c.content}
              </div>
              {themesForCid.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10pt",
                    flexWrap: "wrap",
                    marginTop: "8pt",
                  }}
                >
                  {themesForCid.map((t) => {
                    const themeColor = getThemeColor(t.name, t.kind);
                    return (
                      <span
                        key={t.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5pt",
                          fontSize: "9pt",
                          color: PRINT_COLORS.navyDim,
                        }}
                      >
                        <span
                          style={{
                            width: "6pt",
                            height: "6pt",
                            borderRadius: "50%",
                            background: themeColor.solid,
                            flexShrink: 0,
                          }}
                        />
                        {t.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </BriefingPage>
  );
}
