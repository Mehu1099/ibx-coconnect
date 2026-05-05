"use client";

import { BriefingPage, PRINT_COLORS } from "./BriefingChrome";

interface Props {
  pageNumber: number;
  totalPages: number;
  generatedDateLabel: string;
  executiveSummary: string;
  contributionCount: number;
  themeCount: number;
  locationsEngaged: number;
}

export default function ExecutiveSummaryPage({
  pageNumber,
  totalPages,
  generatedDateLabel,
  executiveSummary,
  contributionCount,
  themeCount,
  locationsEngaged,
}: Props) {
  const paragraphs = executiveSummary
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <BriefingPage
      sectionLabel="EXECUTIVE SUMMARY"
      pageNumber={pageNumber}
      totalPages={totalPages}
      generatedDateLabel={generatedDateLabel}
    >
      <h1 className="briefing-h1">Executive Summary</h1>
      <p className="briefing-subhead">What the community is telling us</p>

      {paragraphs.map((p, i) => (
        <p key={i} className="briefing-prose">
          {p}
        </p>
      ))}

      <div
        style={{
          marginTop: "30pt",
          paddingTop: "14pt",
          borderTop: `1px solid ${PRINT_COLORS.coral}`,
          maxWidth: "6.5in",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
            fontSize: "9pt",
            color: PRINT_COLORS.navyDim,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: "8pt",
          }}
        >
          At a Glance
        </div>
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
            fontSize: "11pt",
            color: PRINT_COLORS.navy,
            letterSpacing: "0.06em",
            fontWeight: 600,
          }}
        >
          {contributionCount} CONTRIBUTIONS &nbsp;·&nbsp; {themeCount} THEMES
          &nbsp;·&nbsp; {locationsEngaged} LOCATIONS ENGAGED
        </div>
      </div>
    </BriefingPage>
  );
}
