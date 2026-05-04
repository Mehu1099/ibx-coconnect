"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import type { Contribution } from "@/lib/use-engage-data";
import type { Theme } from "@/lib/use-themes";
import ContributionEvidenceModal, {
  type EvidenceContribution,
} from "./ContributionEvidenceModal";
import PanelHeader from "./PanelHeader";

interface Props {
  contributions: Contribution[];
  themes: Theme[];
  isLoading: boolean;
}

type SortKey = "location" | "type" | "role" | "age" | "when";
type SortOrder = "asc" | "desc";

const TYPE_LABELS: Record<string, string> = {
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

export default function ContributionsTable({
  contributions,
  themes,
  isLoading,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("when");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<EvidenceContribution | null>(null);

  // Themes carry contribution_ids in `${type}:${rawId}` format; building
  // an index once instead of `themes.filter(...)` per row keeps this table
  // O(N+M) rather than O(N·M) as the dataset grows.
  const themesByContributionId = useMemo(() => {
    const map = new Map<string, Theme[]>();
    themes.forEach((t) => {
      t.contribution_ids.forEach((cid) => {
        const arr = map.get(cid) ?? [];
        arr.push(t);
        map.set(cid, arr);
      });
    });
    return map;
  }, [themes]);

  const contributionsWithThemes = useMemo(() => {
    return contributions.map((c) => {
      const cid = `${c.type}:${c.rawId}`;
      const matchingThemes = themesByContributionId.get(cid) ?? [];
      return { ...c, themes: matchingThemes };
    });
  }, [contributions, themesByContributionId]);

  const filtered = useMemo(() => {
    let list = contributionsWithThemes;
    if (filterType !== "all") list = list.filter((c) => c.type === filterType);
    if (filterLocation !== "all")
      list = list.filter((c) => c.locationId === filterLocation);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.content.toLowerCase().includes(q) ||
          c.contributorRole.toLowerCase().includes(q),
      );
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "location":
          cmp = a.locationId.localeCompare(b.locationId);
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
        case "role":
          cmp = a.contributorRole.localeCompare(b.contributorRole);
          break;
        case "age":
          cmp = (a.contributorAge || "").localeCompare(b.contributorAge || "");
          break;
        case "when":
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return list;
  }, [contributionsWithThemes, filterType, filterLocation, search, sortKey, sortOrder]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null;
    return sortOrder === "asc" ? (
      <ChevronUp size={11} />
    ) : (
      <ChevronDown size={11} />
    );
  }

  const headerCells: { key: SortKey | null; label: string; width?: number }[] = [
    { key: "location", label: "LOC", width: 60 },
    { key: "type", label: "Type", width: 90 },
    { key: "role", label: "Role", width: 120 },
    { key: "age", label: "Age", width: 70 },
    { key: null, label: "Excerpt" },
    { key: null, label: "Themes", width: 220 },
    { key: "when", label: "When", width: 90 },
  ];

  return (
    <section
      id="tutorial-contributions-table"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(11,29,58,0.10)",
        boxShadow: "0 2px 8px -2px rgba(11,29,58,0.06)",
      }}
    >
      <PanelHeader
        title="All Contributions"
        subtitle="Raw data — sortable, filterable"
        fileLabel="PANEL · 04"
        count={filtered.length}
      />

      <div
        style={{
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          borderBottom: "1px solid rgba(11,29,58,0.05)",
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search content or role…"
          style={{
            padding: "6px 10px",
            background: "rgba(11,29,58,0.04)",
            border: "1px solid rgba(11,29,58,0.1)",
            fontSize: 12,
            color: "#0B1D3A",
            minWidth: 220,
            outline: "none",
          }}
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: "6px 10px",
            background: "rgba(11,29,58,0.04)",
            border: "1px solid rgba(11,29,58,0.1)",
            fontSize: 12,
            color: "#0B1D3A",
            cursor: "pointer",
          }}
        >
          <option value="all">All types</option>
          <option value="sticky">Notes</option>
          <option value="concern">Concerns</option>
          <option value="question_response">Responses</option>
          <option value="ai_proposal">Proposals</option>
        </select>

        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          style={{
            padding: "6px 10px",
            background: "rgba(11,29,58,0.04)",
            border: "1px solid rgba(11,29,58,0.1)",
            fontSize: 12,
            color: "#0B1D3A",
            cursor: "pointer",
          }}
        >
          <option value="all">All locations</option>
          {["01", "02", "03", "04", "05", "06", "07", "08"].map((l) => (
            <option key={l} value={l}>
              Location {l}
            </option>
          ))}
        </select>
      </div>

      <style>{`
        .analyze-excerpt-cell { outline: none; transition: background 150ms; }
        .analyze-excerpt-cell:hover .analyze-excerpt-text {
          text-decoration: underline;
          text-decoration-color: rgba(11,29,58,0.35);
          text-underline-offset: 3px;
        }
        .analyze-excerpt-cell:focus-visible {
          box-shadow: inset 0 0 0 2px rgba(26,191,173,0.5);
        }
      `}</style>

      <div style={{ overflowX: "auto", maxHeight: 480, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead
            style={{
              position: "sticky",
              top: 0,
              background: "#F8F5EE",
              zIndex: 1,
            }}
          >
            <tr>
              {headerCells.map(({ key, label, width }) => (
                <th
                  key={label}
                  onClick={key ? () => toggleSort(key) : undefined}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: 9,
                    color: "#8899AA",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    width,
                    borderBottom: "1px solid rgba(11,29,58,0.1)",
                    cursor: key ? "pointer" : "default",
                    userSelect: "none",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {label}
                    {key && <SortIcon k={key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={headerCells.length}
                  style={{
                    padding: 32,
                    textAlign: "center",
                    color: "#8899AA",
                  }}
                >
                  Loading contributions…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={headerCells.length}
                  style={{
                    padding: 32,
                    textAlign: "center",
                    color: "#8899AA",
                  }}
                >
                  No contributions match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((c, i) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: "1px solid rgba(11,29,58,0.04)",
                    background:
                      i % 2 === 0 ? "transparent" : "rgba(11,29,58,0.012)",
                  }}
                >
                  <td style={{ padding: "8px 12px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#0B1D3A",
                      }}
                    >
                      {c.locationId}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 7px",
                        background: `${TYPE_COLORS[c.type]}20`,
                        color: TYPE_COLORS[c.type],
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      {TYPE_LABELS[c.type] ?? c.type}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", color: "#0B1D3A" }}>
                    {c.contributorRole}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: 11,
                      color: "#6B7A8C",
                    }}
                  >
                    {c.contributorAge || "—"}
                  </td>
                  <td
                    className="analyze-excerpt-cell"
                    tabIndex={0}
                    role="button"
                    aria-label={`Open evidence card for ${c.contributorRole}: ${c.content.slice(0, 60)}`}
                    onClick={() => setSelected(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(c);
                      }
                    }}
                    style={{
                      padding: "8px 12px",
                      color: "#3a4a5c",
                      lineHeight: 1.4,
                      cursor: "pointer",
                    }}
                  >
                    <span className="analyze-excerpt-text">
                      {c.content.length > 120
                        ? c.content.slice(0, 120) + "…"
                        : c.content}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    {c.themes.length === 0 ? (
                      <span
                        style={{
                          color: "#8899AA",
                          fontSize: 11,
                          fontStyle: "italic",
                        }}
                      >
                        —
                      </span>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 3,
                        }}
                      >
                        {c.themes.map((t) => (
                          <span
                            key={t.id}
                            style={{
                              fontSize: 10,
                              padding: "1px 6px",
                              background:
                                t.kind === "concern"
                                  ? "rgba(244,117,96,0.12)"
                                  : "rgba(26,191,173,0.12)",
                              color:
                                t.kind === "concern"
                                  ? "#D85A45"
                                  : "#0F8A7E",
                              border: `1px solid ${
                                t.kind === "concern"
                                  ? "rgba(244,117,96,0.3)"
                                  : "rgba(26,191,173,0.3)"
                              }`,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {t.name.length > 30
                              ? t.name.slice(0, 30) + "…"
                              : t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: 10,
                      color: "#6B7A8C",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.timeAgo}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ContributionEvidenceModal
        contribution={selected}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
