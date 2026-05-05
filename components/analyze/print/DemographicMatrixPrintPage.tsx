"use client";

import type { Theme } from "@/lib/use-themes";
import { BriefingPage, PRINT_COLORS } from "./BriefingChrome";

const ROLES: { key: string; label: string }[] = [
  { key: "resident", label: "Resident" },
  { key: "student", label: "Student" },
  { key: "transit_rider", label: "Transit" },
  { key: "retail_owner", label: "Local Biz" },
  { key: "visitor", label: "Visitor" },
  { key: "planner_stakeholder", label: "Planner" },
];

interface Props {
  pageNumber: number;
  totalPages: number;
  generatedDateLabel: string;
  themes: Theme[];
}

// Mirrors the dashboard DemographicMatrix cell-color formula so the
// print version reads as the same heatmap. Single global max across all
// cells so a hot cell in one row reads relative to every other row.
function cellColor(
  count: number,
  kind: "concern" | "vision",
  maxValue: number,
): string {
  if (count === 0) return "rgba(11,29,58,0.03)";
  const intensity = count / maxValue;
  if (kind === "concern") {
    return `rgba(244, 117, 96, ${0.15 + intensity * 0.65})`;
  }
  return `rgba(26, 191, 173, ${0.15 + intensity * 0.65})`;
}

export default function DemographicMatrixPrintPage({
  pageNumber,
  totalPages,
  generatedDateLabel,
  themes,
}: Props) {
  let maxValue = 0;
  themes.forEach((t) => {
    const d = t.demographic_distribution ?? {};
    ROLES.forEach((r) => {
      const v = d[r.key] ?? 0;
      if (v > maxValue) maxValue = v;
    });
  });
  if (maxValue === 0) maxValue = 1;

  return (
    <BriefingPage
      sectionLabel="DEMOGRAPHIC MATRIX"
      pageNumber={pageNumber}
      totalPages={totalPages}
      generatedDateLabel={generatedDateLabel}
    >
      <h1 className="briefing-h1">Which voices raise which themes</h1>
      <p className="briefing-subhead">
        Cross-tab of theme × role at generation time
      </p>

      {themes.length === 0 ? (
        <p className="briefing-prose" style={{ color: PRINT_COLORS.navyDim }}>
          No themes captured in this snapshot.
        </p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "10pt",
            color: PRINT_COLORS.navy,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "8pt 8pt 8pt 0",
                  borderBottom: `1px solid ${PRINT_COLORS.navyHairline}`,
                  fontFamily:
                    "var(--font-jetbrains-mono), ui-monospace, monospace",
                  fontSize: "8.5pt",
                  color: PRINT_COLORS.navyDim,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  width: "38%",
                }}
              >
                Theme
              </th>
              {ROLES.map((r) => (
                <th
                  key={r.key}
                  style={{
                    textAlign: "center",
                    padding: "8pt 4pt",
                    borderBottom: `1px solid ${PRINT_COLORS.navyHairline}`,
                    fontFamily:
                      "var(--font-jetbrains-mono), ui-monospace, monospace",
                    fontSize: "8.5pt",
                    color: PRINT_COLORS.navyDim,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {themes.map((t) => {
              const d = t.demographic_distribution ?? {};
              return (
                <tr
                  key={t.id}
                  style={{ pageBreakInside: "avoid", breakInside: "avoid" }}
                >
                  <td
                    style={{
                      padding: "8pt 8pt 8pt 0",
                      fontSize: "10.5pt",
                      fontWeight: 500,
                      color: PRINT_COLORS.navy,
                      borderBottom: "1px solid rgba(11,29,58,0.06)",
                      lineHeight: 1.3,
                      verticalAlign: "middle",
                    }}
                  >
                    {t.name}
                  </td>
                  {ROLES.map((r) => {
                    const count = d[r.key] ?? 0;
                    return (
                      <td
                        key={r.key}
                        style={{
                          padding: "4pt",
                          textAlign: "center",
                          borderBottom: "1px solid rgba(11,29,58,0.06)",
                        }}
                      >
                        <div
                          style={{
                            height: "26pt",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: cellColor(count, t.kind, maxValue),
                            fontFamily:
                              "var(--font-jetbrains-mono), ui-monospace, monospace",
                            fontSize: "10pt",
                            fontWeight: count > 0 ? 700 : 500,
                            color:
                              count > 0
                                ? PRINT_COLORS.navy
                                : "rgba(11,29,58,0.3)",
                          }}
                        >
                          {count > 0 ? count : "—"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <p
        style={{
          marginTop: "16pt",
          fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
          fontSize: "9pt",
          color: PRINT_COLORS.navyDim,
          letterSpacing: "0.10em",
          lineHeight: 1.6,
        }}
      >
        Counts reflect contributions matched to themes by role at generation
        time.
      </p>
    </BriefingPage>
  );
}
