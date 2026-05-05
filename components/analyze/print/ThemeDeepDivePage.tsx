"use client";

import { getThemeColor } from "@/lib/theme-colors";
import type { ThemeStatus } from "@/lib/use-theme-statuses";
import type { Theme } from "@/lib/use-themes";
import { BriefingPage, PRINT_COLORS } from "./BriefingChrome";

interface DeepDiveContribution {
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
  theme: Theme;
  themeIndex: number; // 1-based
  themeTotal: number;
  status: ThemeStatus;
  // Pre-resolved contributions for this theme, sorted recency-desc and
  // capped to the visible-cards limit. The full count is in totalVoiceCount
  // so the "+ N more" note can be rendered when applicable.
  voiceCards: DeepDiveContribution[];
  totalVoiceCount: number;
  locationShortNames: Record<string, string>;
}

const STATUS_LABEL: Record<ThemeStatus, string> = {
  unassigned: "Unassigned",
  priority: "Priority",
  investigating: "Investigating",
  addressed: "Addressed",
};

export default function ThemeDeepDivePage({
  pageNumber,
  totalPages,
  generatedDateLabel,
  theme,
  themeIndex,
  themeTotal,
  status,
  voiceCards,
  totalVoiceCount,
  locationShortNames,
}: Props) {
  const color = getThemeColor(theme.name, theme.kind);
  const accent =
    theme.kind === "vision" ? PRINT_COLORS.teal : PRINT_COLORS.coral;
  const overflow = totalVoiceCount - voiceCards.length;

  return (
    <BriefingPage
      sectionLabel={`THEME · ${String(themeIndex).padStart(2, "0")} OF ${String(themeTotal).padStart(2, "0")}`}
      pageNumber={pageNumber}
      totalPages={totalPages}
      generatedDateLabel={generatedDateLabel}
    >
      <h1
        className="briefing-h1"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12pt",
          flexWrap: "wrap",
          margin: "0 0 8pt",
        }}
      >
        <span
          style={{
            width: "14pt",
            height: "14pt",
            borderRadius: "50%",
            background: color.solid,
            boxShadow: `0 0 0 2pt ${color.soft}`,
            flexShrink: 0,
          }}
        />
        <span>{theme.name}</span>
      </h1>
      <p className="briefing-subhead">
        {totalVoiceCount} {totalVoiceCount === 1 ? "voice" : "voices"} ·{" "}
        {theme.kind === "vision" ? "Vision" : "Concern"} ·{" "}
        {STATUS_LABEL[status]}
      </p>

      {theme.summary && (
        <p
          className="briefing-prose"
          style={{ marginBottom: "22pt", maxWidth: "6in" }}
        >
          {theme.summary}
        </p>
      )}

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
        Voices on this theme
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "9pt" }}>
        {voiceCards.map((c) => {
          const locName =
            locationShortNames[c.locationId] ?? `Location ${c.locationId}`;
          return (
            <div
              key={c.id}
              style={{
                position: "relative",
                background: PRINT_COLORS.white,
                border: `1px solid ${PRINT_COLORS.navyHairline}`,
                padding: "9pt 12pt 9pt 16pt",
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
                  fontFamily:
                    "var(--font-jetbrains-mono), ui-monospace, monospace",
                  fontSize: "8.5pt",
                  color: PRINT_COLORS.navyDim,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  marginBottom: "4pt",
                }}
              >
                LOC · {c.locationId} · {locName} &nbsp;·&nbsp;{" "}
                {c.contributorRole} · {c.contributorAge || "—"}
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
            </div>
          );
        })}
      </div>

      {overflow > 0 && (
        <p
          style={{
            marginTop: "12pt",
            fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
            fontSize: "9pt",
            color: PRINT_COLORS.navyDim,
            letterSpacing: "0.10em",
            fontWeight: 500,
          }}
        >
          + {overflow} more in the contributions appendix.
        </p>
      )}
    </BriefingPage>
  );
}
