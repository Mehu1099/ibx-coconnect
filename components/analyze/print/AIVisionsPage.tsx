"use client";

import { BriefingPage, PRINT_COLORS } from "./BriefingChrome";

interface AIProposal {
  id: string;
  rawId: string;
  type: string;
  locationId: string;
  content: string;
  contributorRole: string;
  contributorAge: string;
  createdAt: string;
  imageUrl?: string;
  prompt?: string;
  title?: string;
}

interface Props {
  pageNumber: number;
  totalPages: number;
  generatedDateLabel: string;
  proposals: AIProposal[]; // chunk for this page
  totalProposalCount: number;
  totalLocationsRepresented: number;
  chunkIndex: number; // 0-based
  chunkCount: number;
  locationShortNames: Record<string, string>;
}

export default function AIVisionsPage({
  pageNumber,
  totalPages,
  generatedDateLabel,
  proposals,
  totalProposalCount,
  totalLocationsRepresented,
  chunkIndex,
  chunkCount,
  locationShortNames,
}: Props) {
  const isFirstChunk = chunkIndex === 0;
  const sectionLabel = `AI VISIONS${
    chunkCount > 1 ? ` (${chunkIndex + 1} OF ${chunkCount})` : ""
  }`;

  return (
    <BriefingPage
      sectionLabel={sectionLabel}
      pageNumber={pageNumber}
      totalPages={totalPages}
      generatedDateLabel={generatedDateLabel}
    >
      {isFirstChunk ? (
        <>
          <h1 className="briefing-h1">Community visions</h1>
          <p className="briefing-subhead">
            {totalProposalCount} AI-generated{" "}
            {totalProposalCount === 1 ? "vision" : "visions"} across{" "}
            {totalLocationsRepresented}{" "}
            {totalLocationsRepresented === 1 ? "location" : "locations"}
          </p>
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
          Community visions (continued)
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "14pt" }}>
        {proposals.map((p) => {
          const locName =
            locationShortNames[p.locationId] ?? `Location ${p.locationId}`;
          return (
            <div
              key={p.id}
              style={{
                display: "flex",
                gap: "14pt",
                pageBreakInside: "avoid",
                breakInside: "avoid",
                background: PRINT_COLORS.white,
                border: `1px solid ${PRINT_COLORS.navyHairline}`,
                padding: "10pt 12pt",
              }}
            >
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageUrl}
                  alt={p.title ?? p.prompt ?? "AI-generated vision"}
                  style={{
                    width: "2.9in",
                    height: "2.05in",
                    objectFit: "cover",
                    flexShrink: 0,
                    background: "#EDE5D5",
                    border: `1px solid ${PRINT_COLORS.navyHairline}`,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "2.9in",
                    height: "2.05in",
                    flexShrink: 0,
                    background: "#EDE5D5",
                    border: `1px dashed ${PRINT_COLORS.navyHairline}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily:
                      "var(--font-jetbrains-mono), ui-monospace, monospace",
                    fontSize: "9pt",
                    color: PRINT_COLORS.navyDim,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  No vision image
                </div>
              )}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    fontFamily:
                      "var(--font-jetbrains-mono), ui-monospace, monospace",
                    fontSize: "8.5pt",
                    color: PRINT_COLORS.navyDim,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    marginBottom: "6pt",
                  }}
                >
                  LOC · {p.locationId} · {locName}
                </div>
                {p.title && (
                  <div
                    style={{
                      fontSize: "13pt",
                      fontWeight: 600,
                      color: PRINT_COLORS.navy,
                      lineHeight: 1.25,
                      letterSpacing: "-0.005em",
                      marginBottom: "6pt",
                    }}
                  >
                    {p.title}
                  </div>
                )}
                {p.prompt && (
                  <div
                    style={{
                      fontSize: "10pt",
                      lineHeight: 1.5,
                      color: PRINT_COLORS.navy,
                      marginBottom: "8pt",
                    }}
                  >
                    {p.prompt}
                  </div>
                )}
                <div
                  style={{
                    marginTop: "auto",
                    fontFamily:
                      "var(--font-jetbrains-mono), ui-monospace, monospace",
                    fontSize: "8.5pt",
                    color: PRINT_COLORS.navyDim,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  {p.contributorRole} · {p.contributorAge || "—"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </BriefingPage>
  );
}
