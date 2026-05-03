"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Z_INDEX } from "@/lib/z-index";

const NAVY = "#0B1D3A";
const CORAL = "#F47560";
const SOFT_BORDER = "#E0DCD4";

type Props = {
  isVisible: boolean;
  currentColor: string;
  currentWidth: number;
  isErasing: boolean;
  hasStrokes: boolean;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onToggleErase: () => void;
  onUndo: () => void;
  onClearAll: () => void;
};

const SKETCH_COLORS = [
  { name: "Coral", value: "#F47560" },
  { name: "Teal", value: "#1ABFAD" },
  { name: "Navy", value: "#0B1D3A" },
  { name: "White", value: "#FFFFFF" },
  { name: "Yellow", value: "#FFD93D" },
  { name: "Red", value: "#E63946" },
];

const SKETCH_WIDTHS = [
  { name: "Extra thin", value: 2 },
  { name: "Thin", value: 4 },
  { name: "Medium", value: 6 },
  { name: "Thick", value: 9 },
  { name: "Extra thick", value: 13 },
];

// Cap the visual dot inside each width button so the buttons keep a
// uniform footprint even at the thickest end of the scale.
const MAX_WIDTH_DOT_PX = 16;

export default function SketchToolbar({
  isVisible,
  currentColor,
  currentWidth,
  isErasing,
  hasStrokes,
  onColorChange,
  onWidthChange,
  onToggleErase,
  onUndo,
  onClearAll,
}: Props) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            position: "fixed",
            bottom: 110,
            left: "50%",
            translateX: "-50%",
            zIndex: Z_INDEX.passive.floating_toolbar,
            background: "rgba(255, 255, 255, 0.96)",
            borderRadius: 14,
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            border: "1px solid rgba(244, 117, 96, 0.2)",
            fontFamily: "var(--font-space-grotesk)",
          }}
        >
          {/* Color swatches */}
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {SKETCH_COLORS.map((c) => {
              const selected = currentColor === c.value && !isErasing;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onColorChange(c.value)}
                  className="cursor-pointer"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: c.value,
                    border: selected
                      ? `2px solid ${NAVY}`
                      : c.value === "#FFFFFF"
                        ? `1px solid ${SOFT_BORDER}`
                        : "none",
                    transform: selected ? "scale(1.15)" : "scale(1)",
                    transition: "transform 0.15s, border 0.15s",
                    padding: 0,
                  }}
                  title={c.name}
                  aria-label={`Color: ${c.name}`}
                />
              );
            })}
          </div>

          <div style={{ width: 1, height: 24, background: SOFT_BORDER }} />

          {/* Stroke widths */}
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            {SKETCH_WIDTHS.map((w) => {
              const selected = currentWidth === w.value;
              const dotSize = Math.min(w.value * 1.2, MAX_WIDTH_DOT_PX);
              return (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => onWidthChange(w.value)}
                  className="cursor-pointer"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: selected
                      ? "rgba(244, 117, 96, 0.15)"
                      : "transparent",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                  title={w.name}
                  aria-label={`Width: ${w.name}`}
                >
                  <div
                    style={{
                      width: dotSize,
                      height: dotSize,
                      borderRadius: "50%",
                      background: NAVY,
                    }}
                  />
                </button>
              );
            })}
          </div>

          <div style={{ width: 1, height: 24, background: SOFT_BORDER }} />

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              type="button"
              onClick={onToggleErase}
              disabled={!hasStrokes}
              className="cursor-pointer"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: isErasing
                  ? "rgba(244, 117, 96, 0.2)"
                  : "transparent",
                border: isErasing ? `1px solid ${CORAL}` : "none",
                cursor: hasStrokes ? "pointer" : "not-allowed",
                opacity: hasStrokes ? 1 : 0.4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                overflow: "visible",
              }}
              title="Eraser"
              aria-label="Toggle eraser"
              aria-pressed={isErasing}
            >
              {/* Lucide eraser icon — slanted body with the wiping line. */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={NAVY}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ display: "block", flexShrink: 0 }}
              >
                <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                <path d="M22 21H7" />
                <path d="m5 11 9 9" />
              </svg>
            </button>

            <button
              type="button"
              onClick={onUndo}
              disabled={!hasStrokes}
              className="cursor-pointer"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "transparent",
                border: "none",
                cursor: hasStrokes ? "pointer" : "not-allowed",
                opacity: hasStrokes ? 1 : 0.4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                overflow: "visible",
              }}
              title="Undo last stroke"
              aria-label="Undo last stroke"
            >
              {/* Lucide undo-2 icon — left-pointing arrow with a curl
                  that loops back to the right. */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={NAVY}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ display: "block", flexShrink: 0 }}
              >
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
              </svg>
            </button>

            <button
              type="button"
              onClick={onClearAll}
              disabled={!hasStrokes}
              className="cursor-pointer"
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                background: "transparent",
                border: "1px solid rgba(230, 57, 70, 0.4)",
                color: "#E63946",
                fontSize: 11,
                fontWeight: 500,
                cursor: hasStrokes ? "pointer" : "not-allowed",
                opacity: hasStrokes ? 1 : 0.4,
                fontFamily: "inherit",
              }}
              title="Clear all strokes"
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
