"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { getRoleDisplay } from "@/lib/role-display";
import { getThemeColor, hexToRgba } from "@/lib/theme-colors";
import type { Theme } from "@/lib/use-themes";
import PanelHeader from "./PanelHeader";

interface Props {
  themes: Theme[];
  selectedThemeId: string | null;
}

const ROLES = [
  "resident",
  "student",
  "transit_rider",
  "retail_owner",
  "visitor",
  "planner_stakeholder",
];

export default function DemographicMatrix({ themes, selectedThemeId }: Props) {
  const matrix = useMemo(() => {
    return themes.map((theme) => {
      const counts: Record<string, number> = {};
      ROLES.forEach((role) => {
        counts[role] = theme.demographic_distribution?.[role] ?? 0;
      });
      return { theme, counts };
    });
  }, [themes]);

  // Single max across the whole matrix so a "hot" cell in one theme reads
  // as hot relative to every other theme — comparing within rows would
  // hide the macro story (which voices dominate which themes overall).
  const maxValue = useMemo(() => {
    let max = 0;
    matrix.forEach((row) => {
      Object.values(row.counts).forEach((v) => {
        if (v > max) max = v;
      });
    });
    return max || 1;
  }, [matrix]);

  function getCellColor(count: number, kind: "concern" | "vision"): string {
    if (count === 0) return "rgba(11,29,58,0.03)";
    const intensity = count / maxValue;
    if (kind === "concern") {
      return `rgba(244, 117, 96, ${0.15 + intensity * 0.65})`;
    }
    return `rgba(26, 191, 173, ${0.15 + intensity * 0.65})`;
  }

  return (
    <section
      id="tutorial-demographic-matrix"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(11,29,58,0.10)",
        boxShadow: "0 2px 8px -2px rgba(11,29,58,0.06)",
      }}
    >
      <PanelHeader
        title="Theme × Demographic"
        subtitle="Which voices raise which themes? Cross-tab heatmap of contributions per role."
        fileLabel="PANEL · 02"
      />

      <div style={{ padding: 20, overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 11,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 10px 8px 0",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: 9,
                  color: "#8899AA",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  width: "38%",
                  borderBottom: "1px solid rgba(11,29,58,0.1)",
                }}
              >
                Theme
              </th>
              {ROLES.map((role) => (
                <th
                  key={role}
                  title={getRoleDisplay(role)}
                  style={{
                    padding: "8px 4px",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: 9,
                    color: "#8899AA",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    textAlign: "center",
                    borderBottom: "1px solid rgba(11,29,58,0.1)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {getRoleDisplay(role).slice(0, 8)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.length === 0 ? (
              <tr>
                <td
                  colSpan={1 + ROLES.length}
                  style={{
                    padding: 24,
                    textAlign: "center",
                    color: "#8899AA",
                    fontSize: 12,
                  }}
                >
                  No themes yet — generate a batch from Engage to populate.
                </td>
              </tr>
            ) : (
              matrix.map(({ theme, counts }, i) => {
                const isSelected = selectedThemeId === theme.id;
                const rowColor = isSelected
                  ? getThemeColor(theme.name, theme.kind)
                  : null;
                return (
                  <motion.tr
                    key={theme.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    style={{
                      background: rowColor
                        ? hexToRgba(rowColor.solid, 0.13)
                        : "transparent",
                    }}
                  >
                    <td
                      style={{
                        padding: "10px 10px 10px 11px",
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#0B1D3A",
                        borderBottom: "1px solid rgba(11,29,58,0.05)",
                        lineHeight: 1.3,
                        boxShadow: rowColor
                          ? `inset 3px 0 0 ${rowColor.solid}`
                          : undefined,
                      }}
                    >
                      {theme.name}
                    </td>
                    {ROLES.map((role) => {
                      const count = counts[role];
                      return (
                        <td
                          key={role}
                          title={`${getRoleDisplay(role)}: ${count}`}
                          style={{
                            padding: 4,
                            textAlign: "center",
                            borderBottom: "1px solid rgba(11,29,58,0.05)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: 28,
                              background: getCellColor(count, theme.kind),
                              fontFamily:
                                "var(--font-jetbrains-mono), monospace",
                              fontSize: 11,
                              fontWeight: count > 0 ? 700 : 500,
                              color:
                                count > 0
                                  ? "#0B1D3A"
                                  : "rgba(11,29,58,0.3)",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {count > 0 ? count : "—"}
                          </div>
                        </td>
                      );
                    })}
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
