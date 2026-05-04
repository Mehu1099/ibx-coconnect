"use client";

import { motion } from "framer-motion";
import { getThemeColor } from "@/lib/theme-colors";
import type { Contribution } from "@/lib/use-engage-data";
import type { ThemeStatus } from "@/lib/use-theme-statuses";
import type { Theme } from "@/lib/use-themes";
import PanelHeader from "./PanelHeader";
import StatusPill from "./StatusPill";
import type { StatusFilter } from "./AnalyzeHeader";

interface Props {
  themes: Theme[];
  contributions: Contribution[];
  getStatus: (themeId: string) => ThemeStatus;
  setStatus: (themeId: string, newStatus: ThemeStatus) => void;
  statusFilter: StatusFilter;
  selectedThemeId: string | null;
  onThemeClick: (id: string | null) => void;
}

export default function ThemeStatusBoard({
  themes,
  getStatus,
  setStatus,
  statusFilter,
  selectedThemeId,
  onThemeClick,
}: Props) {
  const filtered =
    statusFilter === "all"
      ? themes
      : themes.filter((t) => getStatus(t.id) === statusFilter);

  return (
    <section
      id="tutorial-status-board"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(11,29,58,0.10)",
        boxShadow: "0 2px 8px -2px rgba(11,29,58,0.06)",
      }}
    >
      <PanelHeader
        title="Theme Status Board"
        subtitle="Triage and prioritize themes from the latest generation"
        fileLabel="PANEL · 01"
        count={filtered.length}
      />

      {filtered.length === 0 ? (
        <div
          style={{
            padding: 32,
            textAlign: "center",
            color: "#8899AA",
            fontSize: 13,
          }}
        >
          No themes match this filter.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
            padding: 20,
          }}
        >
          {filtered.map((theme, i) => {
            const themeColor = getThemeColor(theme.name, theme.kind);
            const status = getStatus(theme.id);
            const isVision = theme.kind === "vision";
            const accentColor = isVision ? "#1ABFAD" : "#F47560";
            const isSelected = selectedThemeId === theme.id;

            return (
              <motion.div
                key={theme.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.04,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                onClick={() => onThemeClick(isSelected ? null : theme.id)}
                style={{
                  position: "relative",
                  background: "#FFFFFF",
                  border: `1px solid ${
                    isSelected ? themeColor.deep : "rgba(11,29,58,0.10)"
                  }`,
                  padding: "14px 14px 12px",
                  paddingLeft: 18,
                  cursor: "pointer",
                  boxShadow: isSelected
                    ? `0 4px 12px -2px ${themeColor.deep}30, 0 12px 28px -6px ${themeColor.solid}20`
                    : "0 1px 0 rgba(11,29,58,0.04), 0 2px 8px -2px rgba(11,29,58,0.06)",
                  transition: "all 200ms",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: 3,
                    background: accentColor,
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: themeColor.solid,
                    boxShadow: `0 0 0 2px ${themeColor.soft}`,
                  }}
                />

                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "#0B1D3A",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.3,
                    marginBottom: 6,
                    paddingRight: 20,
                  }}
                >
                  {theme.name}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: 10,
                      color: accentColor,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {theme.contribution_count}{" "}
                    {theme.contribution_count === 1 ? "voice" : "voices"}
                  </span>
                  <span style={{ color: "rgba(11,29,58,0.2)" }}>·</span>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: 9.5,
                      color: "#8899AA",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {theme.kind}
                  </span>
                </div>

                <StatusPill
                  status={status}
                  onChange={(newStatus) => setStatus(theme.id, newStatus)}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
