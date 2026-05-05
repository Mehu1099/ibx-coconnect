"use client";

import type { Theme } from "@/lib/use-themes";
import { BriefingPage, PRINT_COLORS } from "./BriefingChrome";

interface AppendixContribution {
  id: string;
  rawId: string;
  type: string;
  locationId: string;
  content: string;
  contributorRole: string;
  contributorAge: string;
  createdAt: string;
}

interface Props {
  pageNumber: number;
  totalPages: number;
  generatedDateLabel: string;
  // ISO timestamp of when the briefing snapshot was taken; days-ago is
  // computed relative to this so re-downloads of historical briefings
  // show stable values rather than recomputing on every render.
  asOfIso: string;
  rows: AppendixContribution[];
  totalRowCount: number;
  themes: Theme[];
  // 1-of-N for multi-page appendix
  chunkIndex: number;
  chunkCount: number;
}

const TYPE_LABEL: Record<string, string> = {
  sticky: "Note",
  concern: "Concern",
  question_response: "Response",
  ai_proposal: "Proposal",
};

export default function ContributionsAppendixPage({
  pageNumber,
  totalPages,
  generatedDateLabel,
  asOfIso,
  rows,
  totalRowCount,
  themes,
  chunkIndex,
  chunkCount,
}: Props) {
  // Build a lookup of theme-titles per contribution composite id, so the
  // THEMES column can show which themes a row belongs to.
  const themesByCid = new Map<string, string[]>();
  themes.forEach((t) => {
    t.contribution_ids?.forEach((cid) => {
      const arr = themesByCid.get(cid) ?? [];
      arr.push(t.name);
      themesByCid.set(cid, arr);
    });
  });
  const asOfMs = new Date(asOfIso).getTime();

  const chunkLabel =
    chunkCount > 1 ? ` · Page ${chunkIndex + 1} of ${chunkCount}` : "";

  return (
    <BriefingPage
      sectionLabel={`CONTRIBUTIONS APPENDIX${chunkLabel.toUpperCase()}`}
      pageNumber={pageNumber}
      totalPages={totalPages}
      generatedDateLabel={generatedDateLabel}
    >
      <h1 className="briefing-h1">Contributions Appendix</h1>
      <p className="briefing-subhead">
        {totalRowCount} {totalRowCount === 1 ? "contribution" : "contributions"},
        ordered by recency{chunkLabel}
      </p>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "9pt",
          color: PRINT_COLORS.navy,
        }}
      >
        <thead>
          <tr>
            {[
              { label: "LOC", width: "0.4in" },
              { label: "TYPE", width: "0.65in" },
              { label: "ROLE", width: "0.85in" },
              { label: "AGE", width: "0.5in" },
              { label: "EXCERPT" },
              { label: "THEMES", width: "1.15in" },
              { label: "DAYS", width: "0.45in" },
            ].map((h) => (
              <th
                key={h.label}
                style={{
                  textAlign: "left",
                  padding: "6pt 6pt 6pt 0",
                  fontFamily:
                    "var(--font-jetbrains-mono), ui-monospace, monospace",
                  fontSize: "8.5pt",
                  color: PRINT_COLORS.navyDim,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  borderBottom: `1px solid ${PRINT_COLORS.navyHairline}`,
                  width: h.width ?? "auto",
                  verticalAlign: "bottom",
                }}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const cid = `${c.type}:${c.rawId}`;
            const themeNames = themesByCid.get(cid) ?? [];
            const days = Math.max(
              0,
              Math.floor(
                (asOfMs - new Date(c.createdAt).getTime()) / 86_400_000,
              ),
            );
            return (
              <tr
                key={c.id}
                style={{
                  pageBreakInside: "avoid",
                  breakInside: "avoid",
                }}
              >
                <td style={cellStyle()}>
                  <span
                    style={{
                      fontFamily:
                        "var(--font-jetbrains-mono), ui-monospace, monospace",
                      fontWeight: 600,
                    }}
                  >
                    {c.locationId}
                  </span>
                </td>
                <td style={cellStyle()}>{TYPE_LABEL[c.type] ?? c.type}</td>
                <td style={cellStyle()}>{c.contributorRole}</td>
                <td
                  style={{
                    ...cellStyle(),
                    fontFamily:
                      "var(--font-jetbrains-mono), ui-monospace, monospace",
                  }}
                >
                  {c.contributorAge || "—"}
                </td>
                <td style={{ ...cellStyle(), lineHeight: 1.4 }}>{c.content}</td>
                <td
                  style={{
                    ...cellStyle(),
                    fontSize: "8.5pt",
                    color: PRINT_COLORS.navyDim,
                  }}
                >
                  {themeNames.length === 0 ? "—" : themeNames.join("; ")}
                </td>
                <td
                  style={{
                    ...cellStyle(),
                    fontFamily:
                      "var(--font-jetbrains-mono), ui-monospace, monospace",
                    color: PRINT_COLORS.navyDim,
                  }}
                >
                  {days}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </BriefingPage>
  );
}

function cellStyle(): React.CSSProperties {
  return {
    padding: "6pt 6pt 6pt 0",
    verticalAlign: "top",
    borderBottom: `1px solid rgba(11,29,58,0.08)`,
  };
}
