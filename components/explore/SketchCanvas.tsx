"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SketchPoint, SketchStroke } from "@/lib/database-types";
import { Z_INDEX } from "@/lib/z-index";

type Props = {
  isActive: boolean;
  isErasing: boolean;
  currentColor: string;
  currentWidth: number;
  /** Strokes already persisted to Supabase. Always rendered, never erasable. */
  existingStrokes: SketchStroke[];
  /** Strokes the current user has drawn but not yet submitted. Erasable. */
  draftStrokes: SketchStroke[];
  onStrokeComplete: (stroke: SketchStroke) => void;
  /** Replaces the entire draft-stroke set (the eraser splits / removes
   *  strokes mid-scrub, so we always pass the new full list rather than
   *  a single index to remove). */
  onDraftStrokesChange: (strokes: SketchStroke[]) => void;
};

// Coordinates are stored as percentages of the SVG (which fills the
// photo container). preserveAspectRatio="none" lets the viewBox stretch
// linearly, and vector-effect="non-scaling-stroke" keeps line widths
// stable across viewport sizes.
const VIEWBOX = 100;

// Stroke widths are set in pixels by the toolbar; the SVG viewBox is
// 0–100, so a raw 6-px line would render as 6% of the viewBox (huge).
// We scale by 1/STROKE_VIEWBOX_DIVISOR for the visual size and rely on
// non-scaling-stroke to keep the rendered px width consistent.
const STROKE_VIEWBOX_DIVISOR = 5;

// Eraser footprint, in viewBox units (≈ 3% of the photo's smaller axis).
// Tuned so a single scrub erases a noticeable chunk without obliterating
// nearby strokes the user wanted to keep.
const ERASER_RADIUS = 3;

export default function SketchCanvas({
  isActive,
  isErasing,
  currentColor,
  currentWidth,
  existingStrokes,
  draftStrokes,
  onStrokeComplete,
  onDraftStrokesChange,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [currentPoints, setCurrentPoints] = useState<SketchPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasingActive, setIsErasingActive] = useState(false);
  const [pointerPos, setPointerPos] = useState<SketchPoint | null>(null);

  // Pointer events can fire faster than React re-renders during a fast
  // scrub. Read draftStrokes through this ref so each erase pass works
  // off the most recent local state, not whatever was in the closure
  // when the handler was bound.
  const draftStrokesRef = useRef(draftStrokes);
  useEffect(() => {
    draftStrokesRef.current = draftStrokes;
  }, [draftStrokes]);

  const screenToPercent = useCallback(
    (clientX: number, clientY: number): SketchPoint | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const x = ((clientX - rect.left) / rect.width) * VIEWBOX;
      const y = ((clientY - rect.top) / rect.height) * VIEWBOX;
      return {
        x: Math.max(0, Math.min(VIEWBOX, x)),
        y: Math.max(0, Math.min(VIEWBOX, y)),
      };
    },
    [],
  );

  const applyEraserAt = useCallback(
    (x: number, y: number) => {
      const current = draftStrokesRef.current;
      if (current.length === 0) return;
      const updated = current
        .flatMap((s) => splitStrokeAroundEraser(s, x, y, ERASER_RADIUS))
        .filter((s) => s.points.length >= 2);

      // Cheap change-detection: count + per-stroke point count is enough
      // to skip no-op pointer moves over empty space.
      const changed =
        updated.length !== current.length ||
        updated.some((s, i) => s.points.length !== current[i]?.points.length);

      if (changed) {
        // Sync the ref synchronously so the next event in the same scrub
        // sees the post-split strokes even if React hasn't re-rendered.
        draftStrokesRef.current = updated;
        onDraftStrokesChange(updated);
      }
    },
    [onDraftStrokesChange],
  );

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (!isActive) return;
    const point = screenToPercent(e.clientX, e.clientY);
    if (!point) return;

    if (isErasing) {
      setIsErasingActive(true);
      setPointerPos(point);
      applyEraserAt(point.x, point.y);
    } else {
      setIsDrawing(true);
      setCurrentPoints([point]);
    }

    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      /* some browsers throw on capture from non-element targets */
    }
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const point = screenToPercent(e.clientX, e.clientY);
    if (!point) return;

    // Track pointer position whenever the SVG is interactive — drives
    // the visible eraser-footprint indicator regardless of button state.
    if (isActive && isErasing) {
      setPointerPos(point);
    }

    if (isDrawing) {
      setCurrentPoints((prev) => [...prev, point]);
    } else if (isErasing && isErasingActive) {
      applyEraserAt(point.x, point.y);
    }
  }

  function handlePointerUp() {
    if (isDrawing && currentPoints.length > 1) {
      onStrokeComplete({
        color: currentColor,
        width: currentWidth,
        points: currentPoints,
      });
    }
    setCurrentPoints([]);
    setIsDrawing(false);
    setIsErasingActive(false);
  }

  function handlePointerLeave() {
    setPointerPos(null);
    handlePointerUp();
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: isActive
          ? Z_INDEX.passive.sketch_active
          : Z_INDEX.passive.sketch_inactive,
        pointerEvents: isActive ? "auto" : "none",
        // Hide the system cursor in erase mode — the rendered indicator
        // becomes the cursor, so the user sees the exact footprint of
        // the next scrub.
        cursor: isActive ? (isErasing ? "none" : "crosshair") : "default",
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerUp}
    >
      {existingStrokes.map((stroke, i) => (
        <path
          key={`existing-${i}`}
          d={pointsToPath(stroke.points)}
          stroke={stroke.color}
          strokeWidth={stroke.width / STROKE_VIEWBOX_DIVISOR}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
          style={{ pointerEvents: "none" }}
        />
      ))}

      {draftStrokes.map((stroke, i) => (
        <path
          key={`draft-${i}`}
          d={pointsToPath(stroke.points)}
          stroke={stroke.color}
          strokeWidth={stroke.width / STROKE_VIEWBOX_DIVISOR}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
          style={{ pointerEvents: "none" }}
        />
      ))}

      {isDrawing && currentPoints.length > 0 && (
        <path
          d={pointsToPath(currentPoints)}
          stroke={currentColor}
          strokeWidth={currentWidth / STROKE_VIEWBOX_DIVISOR}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Custom eraser cursor — a small eraser icon follows the pointer
          while in erase mode (the native cursor is hidden via
          cursor: 'none'). The whole SVG group scales up slightly while
          actively scrubbing so it feels like it's pressing down. */}
      {isActive && isErasing && pointerPos && (
        <g
          transform={`translate(${pointerPos.x} ${pointerPos.y}) scale(${
            isErasingActive ? 0.198 : 0.18
          }) translate(-8 -8)`}
          style={{ pointerEvents: "none" }}
        >
          <path
            d="M 9.5 2 L 14 6.5 L 7 13.5 L 2.5 9 Z"
            fill="#FFB6A8"
            stroke="#0B1D3A"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
          <line
            x1="6"
            y1="5.5"
            x2="10.5"
            y2="10"
            stroke="#0B1D3A"
            strokeWidth="0.8"
          />
          <path
            d="M 7 13.5 L 4.5 13.5 L 2.5 11.5"
            stroke="#0B1D3A"
            strokeWidth="0.8"
            fill="none"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}

function pointsToPath(points: SketchPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    // Degenerate one-point stroke — render a tiny segment so the round
    // line cap shows up as a dot.
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

// Walks a stroke's point list and drops every point that falls inside
// the eraser radius. Each contiguous run of surviving points becomes
// its own output stroke — so a scrub through the middle of a line
// produces two pieces, not one zigzag. Single-point survivors are
// dropped by the caller (a stroke needs ≥ 2 points to be useful).
function splitStrokeAroundEraser(
  stroke: SketchStroke,
  eraserX: number,
  eraserY: number,
  radius: number,
): SketchStroke[] {
  const result: SketchStroke[] = [];
  let segment: SketchPoint[] = [];

  for (const point of stroke.points) {
    const dx = point.x - eraserX;
    const dy = point.y - eraserY;
    if (dx * dx + dy * dy > radius * radius) {
      segment.push(point);
    } else if (segment.length >= 2) {
      result.push({
        color: stroke.color,
        width: stroke.width,
        points: segment,
      });
      segment = [];
    } else {
      segment = [];
    }
  }

  if (segment.length >= 2) {
    result.push({
      color: stroke.color,
      width: stroke.width,
      points: segment,
    });
  }

  return result;
}
