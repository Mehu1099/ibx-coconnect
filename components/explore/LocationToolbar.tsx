"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export type ToolId = "sticky" | "sketch" | "concern" | "ai";

type Props = {
  activeTool: ToolId | null;
  onSelectTool: (tool: ToolId | null) => void;
  showAnnotations: boolean;
  onToggleVisibility: () => void;
  /** Tutorial step 2 — surrounds the toolbar with a coral glow + lift. */
  tutorialHighlight?: boolean;
};

type ToolDef = {
  id: ToolId;
  label: string;
  icon: React.ReactNode;
};

const ICON_SIZE = 18;

const StickyIcon = (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="6" fill="currentColor" />
  </svg>
);

const SketchIcon = (
  <svg
    width={ICON_SIZE}
    height={ICON_SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>
);

const ConcernIcon = (
  <svg
    width={ICON_SIZE}
    height={ICON_SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const AIIcon = (
  <svg
    width={ICON_SIZE}
    height={ICON_SIZE}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
    <path
      d="M19 14l.9 2.6L22.5 17.5l-2.6.9L19 21l-.9-2.6L15.5 17.5l2.6-.9L19 14z"
      opacity="0.7"
    />
  </svg>
);

const EyeOpenIcon = (
  <svg
    width={ICON_SIZE}
    height={ICON_SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = (
  <svg
    width={ICON_SIZE}
    height={ICON_SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const TOOLS: ToolDef[] = [
  { id: "sticky", label: "Sticky Note", icon: StickyIcon },
  { id: "sketch", label: "Sketch", icon: SketchIcon },
  { id: "concern", label: "Raise Concern", icon: ConcernIcon },
  { id: "ai", label: "AI Generate", icon: AIIcon },
];

type ButtonVariant = "tool" | "view-on" | "view-off";

function ToolButton({
  tool,
  active,
  onClick,
  hovered,
  onHover,
  onLeave,
  variant = "tool",
}: {
  tool: { id: string; label: string; icon: React.ReactNode };
  active: boolean;
  onClick: () => void;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  variant?: ButtonVariant;
}) {
  let buttonBg: string;
  let iconColor: string;
  let buttonOpacity: number;

  if (variant === "view-off") {
    buttonBg = hovered ? "#E0DCD4" : "#EDE5D5";
    iconColor = "#8899AA";
    buttonOpacity = 1;
  } else if (active) {
    buttonBg = "linear-gradient(180deg, #1ABFAD 0%, #00C4A7 100%)";
    iconColor = "#FFFFFF";
    buttonOpacity = 1;
  } else if (hovered) {
    buttonBg = "#FAF5EB";
    iconColor = "#0B1D3A";
    buttonOpacity = 1;
  } else {
    buttonBg = "transparent";
    iconColor = "#0B1D3A";
    buttonOpacity = 0.78;
  }

  // Smooth, slow scale pulse on the active tool. easeInOut + small range
  // (1 → 1.06) so it reads as "alive" rather than jittery.
  const isPulsing = active && variant !== "view-on";

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={onClick}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        onFocus={onHover}
        onBlur={onLeave}
        aria-label={tool.label}
        aria-pressed={active}
        className={`flex items-center justify-center cursor-pointer${
          isPulsing ? " tool-active-pulse" : ""
        }`}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: "none",
          background: buttonBg,
          color: iconColor,
          opacity: buttonOpacity,
          padding: 0,
        }}
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {tool.icon}
      </motion.button>

      {hovered && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            bottom: "calc(100% + 10px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0B1D3A",
            color: "#F5F2EB",
            padding: "5px 10px",
            borderRadius: 6,
            fontFamily: "var(--font-space-grotesk)",
            fontSize: 11,
            fontWeight: 500,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(11, 29, 58, 0.20)",
          }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {tool.label}
        </motion.div>
      )}
    </div>
  );
}

export default function LocationToolbar({
  activeTool,
  onSelectTool,
  showAnnotations,
  onToggleVisibility,
  tutorialHighlight = false,
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    // Outermost: plain centering div. translateX(-50%) is set here, away
    // from any motion.div whose internal transform would clobber it.
    // During the tutorial spotlight, lift z-index above the backdrop
    // (z 90) so the toolbar reads crisp through the blur.
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: tutorialHighlight ? 110 : 40,
      }}
    >
      {/* Tutorial step 2 — separate aura sibling behind the toolbar.
          Animating scale + opacity is GPU-composited; the previous
          box-shadow keyframes were forcing a paint every frame at 60fps
          for the entire viewport-wide shadow. */}
      {tutorialHighlight && (
        <motion.div
          aria-hidden
          style={{
            position: "absolute",
            inset: -8,
            borderRadius: 22,
            background: "rgba(244, 117, 96, 0.5)",
            pointerEvents: "none",
            willChange: "transform, opacity",
          }}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.12, opacity: 0 }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      )}

      {/* Conic-gradient border ring. The .toolbar-conic-border class
          wires up @property --border-angle + the rotate animation in
          globals.css so the gradient appears to spin slowly. */}
      <motion.div
        className="toolbar-conic-border relative"
        style={{
          padding: 2,
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 -8px 32px rgba(0,0,0,0.06)",
        }}
        initial={{ opacity: 0, y: 24 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: tutorialHighlight ? 1.02 : 1,
        }}
        transition={{
          opacity: { duration: 0.4, ease: "easeOut", delay: 0.1 },
          y: { duration: 0.4, ease: "easeOut", delay: 0.1 },
          scale: { duration: 0.3, ease: "easeOut" },
        }}
      >
        <div
          className="flex items-center"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 100%)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            padding: 8,
            borderRadius: 14,
            gap: 4,
          }}
        >
          {TOOLS.map((tool) => (
            <ToolButton
              key={tool.id}
              tool={tool}
              active={activeTool === tool.id}
              onClick={() =>
                onSelectTool(activeTool === tool.id ? null : tool.id)
              }
              hovered={hovered === tool.id}
              onHover={() => setHovered(tool.id)}
              onLeave={() => setHovered((h) => (h === tool.id ? null : h))}
            />
          ))}

          <div
            aria-hidden
            style={{
              width: 1,
              alignSelf: "stretch",
              background: "#E0DCD4",
              margin: "0 4px",
            }}
          />

          <ToolButton
            tool={{
              id: "view",
              label: showAnnotations ? "Hide annotations" : "Show annotations",
              icon: showAnnotations ? EyeOpenIcon : EyeClosedIcon,
            }}
            active={showAnnotations}
            onClick={onToggleVisibility}
            hovered={hovered === "view"}
            onHover={() => setHovered("view")}
            onLeave={() => setHovered((h) => (h === "view" ? null : h))}
            variant={showAnnotations ? "view-on" : "view-off"}
          />
        </div>
      </motion.div>
    </div>
  );
}
