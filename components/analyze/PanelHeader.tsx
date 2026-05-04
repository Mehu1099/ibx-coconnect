"use client";

interface Props {
  title: string;
  subtitle?: string;
  fileLabel: string;
  count?: number;
}

export default function PanelHeader({
  title,
  subtitle,
  fileLabel,
  count,
}: Props) {
  return (
    <div
      style={{
        padding: "16px 20px 14px",
        borderBottom: "1px solid rgba(11,29,58,0.08)",
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
      }}
    >
      <div style={{ flex: 1 }}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#0B1D3A",
            letterSpacing: "-0.015em",
            margin: "0 0 2px",
            lineHeight: 1.2,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              fontSize: 12,
              color: "#6B7A8C",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {count !== undefined && (
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 10,
              color: "#6B7A8C",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "2px 8px",
              background: "rgba(11,29,58,0.04)",
            }}
          >
            {count} items
          </span>
        )}
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9.5,
            color: "#8899AA",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {fileLabel}
        </span>
      </div>
    </div>
  );
}
