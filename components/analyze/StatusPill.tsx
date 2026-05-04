"use client";

import { CheckCircle2, Circle, Flag, Search } from "lucide-react";
import type { ThemeStatus } from "@/lib/use-theme-statuses";

const STATUS_ORDER: ThemeStatus[] = [
  "unassigned",
  "priority",
  "investigating",
  "addressed",
];

const STATUS_CONFIG: Record<
  ThemeStatus,
  {
    label: string;
    icon: typeof Circle;
    bg: string;
    color: string;
    border: string;
  }
> = {
  unassigned: {
    label: "Unassigned",
    icon: Circle,
    bg: "rgba(11,29,58,0.04)",
    color: "#8899AA",
    border: "rgba(11,29,58,0.15)",
  },
  priority: {
    label: "Priority",
    icon: Flag,
    bg: "rgba(244,117,96,0.12)",
    color: "#D85A45",
    border: "rgba(244,117,96,0.4)",
  },
  investigating: {
    label: "Investigating",
    icon: Search,
    bg: "rgba(232,164,28,0.12)",
    color: "#B7800F",
    border: "rgba(232,164,28,0.4)",
  },
  addressed: {
    label: "Addressed",
    icon: CheckCircle2,
    bg: "rgba(26,191,173,0.12)",
    color: "#0F8A7E",
    border: "rgba(26,191,173,0.4)",
  },
};

interface Props {
  status: ThemeStatus;
  onChange: (newStatus: ThemeStatus) => void;
}

export default function StatusPill({ status, onChange }: Props) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  function cycle(e: React.MouseEvent) {
    e.stopPropagation();
    const idx = STATUS_ORDER.indexOf(status);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    onChange(next);
  }

  return (
    <button
      onClick={cycle}
      type="button"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px 5px 8px",
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "all 150ms",
      }}
      title="Click to cycle status"
    >
      <Icon size={11} strokeWidth={2.5} />
      {config.label}
    </button>
  );
}
