"use client";

import { getThemeColor } from "@/lib/theme-colors";
import type { ThemeStatus } from "@/lib/use-theme-statuses";
import type { Theme } from "@/lib/use-themes";
import { BriefingPage, PRINT_COLORS } from "./BriefingChrome";

interface Props {
  pageNumber: number;
  totalPages: number;
  generatedDateLabel: string;
  themes: Theme[];
  // Status snapshot at generation time. The print page must NOT call
  // live data — pass the resolved label per theme instead of getStatus.
  statusByThemeId: Record<string, ThemeStatus>;
}

const STATUS_LABEL: Record<ThemeStatus, string> = {
  unassigned: "Unassigned",
  priority: "Priority",
  investigating: "Investigating",
  addressed: "Addressed",
};

const STATUS_BG: Record<ThemeStatus, string> = {
  unassigned: "rgba(11,29,58,0.08)",
  priority: "rgba(244,117,96,0.16)",
  investigating: "rgba(240,169,51,0.16)",
  addressed: "rgba(26,191,173,0.16)",
};

const STATUS_FG: Record<ThemeStatus, string> = {
  unassigned: "#3a4a5c",
  priority: "#A8412F",
  investigating: "#9C7A14",
  addressed: "#0F8A7E",
};

export default function ThemeIndexPage({
  pageNumber,
  totalPages,
  generatedDateLabel,
  themes,
  statusByThemeId,
}: Props) {
  return (
    <BriefingPage
      sectionLabel="THEMES AT A GLANCE"
      pageNumber={pageNumber}
      totalPages={totalPages}
      generatedDateLabel={generatedDateLabel}
    >
      <h1 className="briefing-h1">Themes at a Glance</h1>
      <p className="briefing-subhead">
        {themes.length} {themes.length === 1 ? "theme" : "themes"} captured in
        this snapshot
      </p>

      {themes.length === 0 ? (
        <p className="briefing-prose" style={{ color: PRINT_COLORS.navyDim }}>
          No themes match the current filter.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14pt",
          }}
        >
          {themes.map((t) => {
            const color = getThemeColor(t.name, t.kind);
            const status = statusByThemeId[t.id] ?? "unassigned";
            const accent = t.kind === "vision" ? PRINT_COLORS.teal : PRINT_COLORS.coral;
            const voices = t.contribution_ids?.length ?? 0;
            return (
              <div
                key={t.id}
                style={{
                  position: "relative",
                  background: PRINT_COLORS.white,
                  border: `1px solid ${PRINT_COLORS.navyHairline}`,
                  padding: "12pt 12pt 11pt 16pt",
                  pageBreakInside: "avoid",
                  breakInside: "avoid",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: "3pt",
                    background: accent,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "10pt",
                    right: "12pt",
                    width: "8pt",
                    height: "8pt",
                    borderRadius: "50%",
                    background: color.solid,
                    boxShadow: `0 0 0 1.5pt ${color.soft}`,
                  }}
                />
                <div
                  style={{
                    fontSize: "13pt",
                    fontWeight: 600,
                    color: PRINT_COLORS.navy,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.25,
                    paddingRight: "20pt",
                    margin: "0 0 6pt",
                  }}
                >
                  {t.name}
                </div>
                <div
                  style={{
                    fontFamily:
                      "var(--font-jetbrains-mono), ui-monospace, monospace",
                    fontSize: "9pt",
                    color: PRINT_COLORS.navyDim,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    marginBottom: "8pt",
                  }}
                >
                  {voices} {voices === 1 ? "voice" : "voices"} ·{" "}
                  {t.kind === "vision" ? "Vision" : "Concern"}
                </div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2pt 8pt",
                    background: STATUS_BG[status],
                    color: STATUS_FG[status],
                    fontFamily:
                      "var(--font-jetbrains-mono), ui-monospace, monospace",
                    fontSize: "8.5pt",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {STATUS_LABEL[status]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </BriefingPage>
  );
}
