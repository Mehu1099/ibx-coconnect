"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ImageProjection } from "@/lib/use-image-projection";

type Coord = { x: number; y: number };

type Props = {
  imageContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Used to reverse-project a click in container pixels back to
   *  natural-image %, which is the coordinate system stored in
   *  lib/explore-locations.ts. */
  projection: ImageProjection | null;
  onAdminModeChange?: (adminMode: boolean) => void;
};

export default function PinAdminTool({
  imageContainerRef,
  projection,
  onAdminModeChange,
}: Props) {
  const [adminMode, setAdminMode] = useState(false);
  const [coords, setCoords] = useState<Coord[]>([]);
  const [lastClick, setLastClick] = useState<Coord | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onAdminModeChange?.(adminMode);
  }, [adminMode, onAdminModeChange]);

  // Secret keyboard chord: hold Shift, then A, then D (within 1s) to
  // reveal/toggle admin mode. Nothing is visible until this fires.
  useEffect(() => {
    let lastAAt = 0;
    const handler = (e: KeyboardEvent) => {
      if (!e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      const now = Date.now();
      if (key === "a") {
        lastAAt = now;
      } else if (key === "d" && now - lastAAt < 1000) {
        lastAAt = 0;
        setAdminMode((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!adminMode) return;
    const el = imageContainerRef.current;
    if (!el || !projection) return;

    // Reverse the projection: container click → natural-image %.
    // (xPercent / 100) * imageScreenWidth + imageScreenX = clickX
    // ⇒ xPercent = ((clickX - imageScreenX) / imageScreenWidth) * 100
    const handleClick = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const xPercent =
        ((clickX - projection.imageScreenX) / projection.imageScreenWidth) * 100;
      const yPercent =
        ((clickY - projection.imageScreenY) / projection.imageScreenHeight) * 100;
      const clamped: Coord = {
        x: Math.max(0, Math.min(100, Number(xPercent.toFixed(1)))),
        y: Math.max(0, Math.min(100, Number(yPercent.toFixed(1)))),
      };
      setLastClick(clamped);
      setCoords((prev) => [...prev, clamped]);
    };

    el.addEventListener("click", handleClick);
    return () => el.removeEventListener("click", handleClick);
  }, [adminMode, imageContainerRef, projection]);

  const handleCopyAll = useCallback(async () => {
    const text = coords
      .map((c) => `  { x: ${c.x}, y: ${c.y} },`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [coords]);

  const handleClear = useCallback(() => {
    setCoords([]);
    setLastClick(null);
  }, []);

  return (
    <>
      {/* Transient teal marker at each clicked coord. Coords are stored
          in natural-image %, so we project to container px before rendering
          (otherwise the markers drift on resize). */}
      {adminMode && projection &&
        coords.map((c, i) => {
          const p = projection.projectPin(c.x, c.y);
          return (
            <div
              key={i}
              className="absolute z-20 pointer-events-none rounded-full"
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                transform: "translate(-50%, -50%)",
                width: 14,
                height: 14,
                background: "#1ABFAD",
                border: "2px solid #FFFFFF",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            />
          );
        })}

      {/* Floating coord card near most recent click */}
      {adminMode && projection && lastClick && (() => {
        const p = projection.projectPin(lastClick.x, lastClick.y);
        return (
          <div
            className="absolute z-30 pointer-events-none rounded-lg"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              transform: "translate(12px, 12px)",
              background: "#0B1D3A",
              color: "#F5F2EB",
              padding: "6px 10px",
              fontFamily: "var(--font-space-grotesk)",
              fontSize: 12,
              fontWeight: 500,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              whiteSpace: "nowrap",
            }}
          >
            x: {lastClick.x}%, y: {lastClick.y}%
          </div>
        );
      })()}

      {/* Bottom-left info panel */}
      {adminMode && (
        <div
          className="fixed z-50 rounded-xl"
          style={{
            left: 24,
            bottom: 24,
            width: 280,
            maxHeight: "60vh",
            background: "#FFFFFF",
            border: "1px solid #E0DCD4",
            boxShadow: "0 8px 24px rgba(11, 29, 58, 0.12)",
            fontFamily: "var(--font-space-grotesk)",
            color: "#0B1D3A",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid #E0DCD4",
              fontSize: 12,
              fontWeight: 500,
              color: "#8899AA",
            }}
          >
            Click anywhere on the image to get coordinates
          </div>

          <div
            style={{
              padding: "10px 14px",
              overflowY: "auto",
              flex: 1,
              fontSize: 12,
              lineHeight: 1.6,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            {coords.length === 0 ? (
              <div style={{ color: "#8899AA", fontStyle: "italic" }}>
                No pins placed yet.
              </div>
            ) : (
              coords.map((c, i) => (
                <div key={i} style={{ color: "#0B1D3A" }}>
                  Pin {i + 1}: x: {c.x}, y: {c.y}
                </div>
              ))
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 10,
              borderTop: "1px solid #E0DCD4",
            }}
          >
            <button
              type="button"
              onClick={handleCopyAll}
              disabled={coords.length === 0}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                background: coords.length === 0 ? "#E0DCD4" : "#1ABFAD",
                color: coords.length === 0 ? "#8899AA" : "#0B1D3A",
                fontSize: 12,
                fontWeight: 600,
                border: "none",
                cursor: coords.length === 0 ? "not-allowed" : "pointer",
                transition: "background 0.2s ease",
              }}
            >
              {copied ? "Copied!" : "Copy All"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={coords.length === 0}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                background: "transparent",
                color: coords.length === 0 ? "#8899AA" : "#0B1D3A",
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid #E0DCD4",
                cursor: coords.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Bottom-right toggle button — only rendered while admin mode is
          active. The keyboard chord Shift+A+D reveals it; clicking it
          turns admin mode off and hides everything again. */}
      {adminMode && (
        <button
          type="button"
          onClick={() => setAdminMode(false)}
          className="fixed z-50 rounded-full flex items-center gap-2"
          style={{
            right: 24,
            bottom: 24,
            padding: "12px 18px",
            background: "#F47560",
            color: "#FFFFFF",
            fontFamily: "var(--font-space-grotesk)",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 6px 18px rgba(244, 117, 96, 0.35)",
            transition: "transform 0.2s ease",
          }}
        >
          <span role="img" aria-label="target">🎯</span>
          <span>Admin Mode: ON</span>
          <span
            aria-hidden
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              background: "#22C55E",
              boxShadow: "0 0 8px rgba(34, 197, 94, 0.8)",
              marginLeft: 2,
            }}
          />
        </button>
      )}
    </>
  );
}
