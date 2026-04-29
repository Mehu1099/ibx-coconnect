"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { getBubblePhrases } from "@/lib/processing-bubbles";
import { BrooklynBackdrop } from "./BrooklynBackdrop";
import { PersonBike, PersonElder, PersonIdea } from "./PeopleFigures";

const NAVY = "#0B1D3A";
const CORAL = "#F47560";
const TEAL = "#1ABFAD";
const SLATE = "#6B7A8C";
const STEEL = "#3a4a5c";

interface AIProcessingScreenProps {
  basePhotoUrl: string;
  locationId: string;
  // The user's actual prompt isn't displayed in v1, but we accept it
  // so callers can pass it through and we can surface it later in a
  // "you asked for…" panel without changing the contract.
  prompt: string;
  /** True once the real generation completes. Drives 95% → 100%. */
  isCompleted: boolean;
  onCancel: () => void;
}

const STEPS = [
  { key: "collect", label: "Listening", hint: "Reading voices from Flatbush" },
  { key: "analyze", label: "Connecting", hint: "Finding shared themes" },
  { key: "compose", label: "Sketching", hint: "Drafting the scene" },
  { key: "render", label: "Painting", hint: "Bringing it to life" },
];

export function AIProcessingScreen({
  basePhotoUrl,
  locationId,
  // Currently unused on screen (see prop comment); kept for forward-
  // compat so callers don't break when we surface it.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prompt: _prompt,
  isCompleted,
  onCancel,
}: AIProcessingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  // Latched on mount inside an effect so the impure `Date.now()` call
  // doesn't run during render (react-hooks/purity).
  const startTimeRef = useRef<number | null>(null);

  // Step is derived from progress — no state needed.
  const step = Math.min(
    STEPS.length - 1,
    Math.floor((progress / 100) * STEPS.length),
  );

  // Synthetic progress: ~14s to climb 0 → 95%, then waits for the
  // real generation. When isCompleted flips, we fast-forward to 100%
  // (~1s) so the indicator can land cleanly before the modal swaps
  // to the result view.
  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (isCompleted) return Math.min(100, p + 5);
        if (p >= 95) return 95;
        return p + 0.55;
      });
    }, 80);
    return () => window.clearInterval(id);
  }, [isCompleted]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const id = window.setInterval(() => {
      const start = startTimeRef.current ?? Date.now();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  // Emit a bubble every ~1.1s. Pruning + auto-removal happen inside
  // the same setInterval callback so we never call setState in an
  // effect body (react-hooks/set-state-in-effect).
  useEffect(() => {
    const phrases = getBubblePhrases(locationId);
    const COLORS = [CORAL, TEAL, "#e87764", "#1A6B73"];
    const id = window.setInterval(() => {
      const bubbleId = Math.random().toString(36).slice(2);
      const newBubble: Bubble = {
        id: bubbleId,
        text: phrases[Math.floor(Math.random() * phrases.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        startX: 8 + Math.random() * 84,
        drift: -30 + Math.random() * 60,
      };
      setBubbles((b) => [...b.slice(-5), newBubble]);
      window.setTimeout(() => {
        setBubbles((b) => b.filter((x) => x.id !== bubbleId));
      }, 2600);
    }, 1100);
    return () => window.clearInterval(id);
  }, [locationId]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: 16,
        background:
          "linear-gradient(180deg, #e9f3f4 0%, #f5ede2 50%, #fbe6dc 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopBar elapsed={elapsed} onCancel={onCancel} />

      <div style={{ position: "relative", flex: 1, padding: "0 20px" }}>
        {/* Backdrop scenery; reserved area at the bottom for the
            step indicator + people row. */}
        <div
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 140 }}
        >
          <BrooklynBackdrop />
        </div>

        {/* Title overlay */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 24,
            maxWidth: 280,
            zIndex: 8,
          }}
        >
          <h2
            style={{
              fontSize: 22,
              margin: 0,
              fontWeight: 600,
              color: NAVY,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              fontFamily: "var(--font-space-grotesk), sans-serif",
            }}
          >
            Co-creating with the Junction
            <span style={{ color: CORAL }}>.</span>
          </h2>
          <p
            style={{
              margin: "4px 0 0",
              color: STEEL,
              fontSize: 11,
              lineHeight: 1.4,
            }}
          >
            Turning your neighbors&rsquo; ideas into a shared image
          </p>
        </div>

        <Easel basePhotoUrl={basePhotoUrl} progress={progress} />
        <PeopleRow />
        <BubbleStream bubbles={bubbles} />
      </div>

      <StepIndicator step={step} progress={progress} />

      {/* Animations shared across the processing scene. Names are
          prefixed `ibxProc` so they don't collide with the page-level
          keyframes elsewhere in the app. */}
      <style jsx global>{`
        @keyframes ibxProcDotBlink {
          0%,
          70%,
          100% {
            opacity: 1;
          }
          85% {
            opacity: 0.25;
          }
        }
        @keyframes ibxProcFigureFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        @keyframes ibxProcBubbleRise {
          0% {
            transform: translate(0, 0) scale(0.5);
            opacity: 0;
          }
          12% {
            opacity: 1;
            transform: translate(0, -16px) scale(1);
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--drift), -200px) scale(0.4);
            opacity: 0;
          }
        }
        @keyframes ibxProcSpinRing {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// ── Top bar: status pill + elapsed seconds + cancel ────────────────────────

function TopBar({
  elapsed,
  onCancel,
}: {
  elapsed: number;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: CORAL,
            animation: "ibxProcDotBlink 1.4s infinite",
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: NAVY,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "var(--font-space-grotesk), sans-serif",
          }}
        >
          Generating · Flatbush Ave / Brooklyn College
        </span>
        <span
          style={{
            fontSize: 10,
            color: SLATE,
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontVariantNumeric: "tabular-nums",
            marginLeft: 4,
          }}
        >
          {String(elapsed).padStart(2, "0")}s
        </span>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          border: "1px solid rgba(11,29,58,0.12)",
          background: "rgba(255,255,255,0.7)",
          color: NAVY,
          padding: "6px 12px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "inherit",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#FFFFFF";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.7)";
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Cancel
      </button>
    </div>
  );
}

// ── Easel: location photo being uncovered by a brush ───────────────────────

function Easel({
  basePhotoUrl,
  progress,
}: {
  basePhotoUrl: string;
  progress: number;
}) {
  const reveal = Math.min(100, progress * 1.05);

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: 56,
        transform: "translateX(-50%)",
        width: 320,
        height: 200,
        zIndex: 4,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 320 200"
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
        aria-hidden
      >
        <line
          x1="50"
          y1="0"
          x2="32"
          y2="240"
          stroke="#8b6f47"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <line
          x1="270"
          y1="0"
          x2="288"
          y2="240"
          stroke="#8b6f47"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <line
          x1="160"
          y1="180"
          x2="160"
          y2="250"
          stroke="#6f5536"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="32"
          y1="240"
          x2="288"
          y2="240"
          stroke="#6f5536"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: 24,
          right: 24,
          top: 8,
          bottom: 24,
          background: "#fbf6ee",
          borderRadius: 4,
          boxShadow:
            "0 2px 4px rgba(11,29,58,0.1), 0 18px 40px rgba(11,29,58,0.18)",
          overflow: "hidden",
          border: "5px solid #fbf6ee",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${basePhotoUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {reveal < 99 && (
          <>
            {/* Cream wash covering the un-painted portion of the canvas. */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${reveal}%`,
                right: 0,
                background: "rgba(251,246,238,0.92)",
                backdropFilter: "blur(4px)",
                transition: "left 0.2s linear",
              }}
            />
            {/* Glowing coral seam where the brush is currently. */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `calc(${reveal}% - 1px)`,
                width: 2,
                background: CORAL,
                boxShadow: `0 0 12px ${CORAL}`,
                transition: "left 0.2s linear",
              }}
            />
            {/* Brush head */}
            <div
              style={{
                position: "absolute",
                top: -4,
                left: `calc(${reveal}% - 8px)`,
                width: 16,
                height: 20,
                transition: "left 0.2s linear",
              }}
            >
              <svg width="16" height="20" viewBox="0 0 16 20" aria-hidden>
                <rect x="6" y="0" width="4" height="10" fill="#8b6f47" />
                <path d="M 4 10 L 12 10 L 10 20 L 6 20 Z" fill={CORAL} />
              </svg>
            </div>
          </>
        )}

        <div
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            padding: "2px 7px",
            borderRadius: 3,
            background: "rgba(11,29,58,0.85)",
            color: "white",
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "var(--font-space-grotesk), sans-serif",
          }}
        >
          ✨ AI · {Math.floor(progress)}%
        </div>
      </div>
    </div>
  );
}

// ── People row: 3 floating figures along the bottom ────────────────────────

function PeopleRow() {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 8,
        height: 120,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-around",
        padding: "0 60px",
        pointerEvents: "none",
        zIndex: 6,
      }}
    >
      <div
        style={{
          animation: "ibxProcFigureFloat 3.4s ease-in-out infinite",
          animationDelay: "0.1s",
        }}
      >
        <PersonElder width={70} />
      </div>
      <div
        style={{
          marginBottom: 4,
          animation: "ibxProcFigureFloat 3.1s ease-in-out infinite",
          animationDelay: "0.5s",
        }}
      >
        <PersonBike width={100} />
      </div>
      <div
        style={{
          animation: "ibxProcFigureFloat 3.6s ease-in-out infinite",
          animationDelay: "0.8s",
        }}
      >
        <PersonIdea width={70} />
      </div>
    </div>
  );
}

// ── Bubble stream: phrases rise from the figures ───────────────────────────

type Bubble = {
  id: string;
  text: string;
  color: string;
  startX: number;
  drift: number;
};

// Pure presentational. The parent owns the `bubbles` array and
// emits new bubbles inside its setInterval callback (where setState
// is allowed by react-hooks/set-state-in-effect).
function BubbleStream({ bubbles }: { bubbles: Bubble[] }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 7,
        overflow: "hidden",
      }}
    >
      {bubbles.map((b) => {
        // CSS custom property for animation drift; cast since
        // React.CSSProperties doesn't know about ad-hoc vars.
        const bubbleStyle: CSSProperties & Record<string, string | number> = {
          position: "absolute",
          left: `${b.startX}%`,
          bottom: 100,
          padding: "5px 10px",
          background: "white",
          border: `1.5px solid ${b.color}`,
          borderRadius: 12,
          color: NAVY,
          fontSize: 10,
          fontWeight: 600,
          whiteSpace: "nowrap",
          boxShadow: "0 6px 14px rgba(11,29,58,0.14)",
          animation: "ibxProcBubbleRise 2.6s ease-out forwards",
          "--drift": `${b.drift}px`,
        };
        return (
          <div key={b.id} style={bubbleStyle}>
            <span style={{ color: b.color, marginRight: 4 }}>&ldquo;</span>
            {b.text}
            <span style={{ color: b.color, marginLeft: 4 }}>&rdquo;</span>
            <div
              style={{
                position: "absolute",
                bottom: -5,
                left: 12,
                width: 8,
                height: 5,
                background: "white",
                borderRight: `1.5px solid ${b.color}`,
                borderBottom: `1.5px solid ${b.color}`,
                transform: "rotate(45deg)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Step indicator + progress bar ──────────────────────────────────────────

function StepIndicator({
  step,
  progress,
}: {
  step: number;
  progress: number;
}) {
  return (
    <div
      style={{
        position: "relative",
        padding: "14px 20px 16px",
        borderTop: "1px solid rgba(11,29,58,0.08)",
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 5,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
          gap: 10,
        }}
      >
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div
              key={s.key}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                opacity: done || active ? 1 : 0.45,
                transition: "opacity 0.3s",
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: done ? TEAL : active ? "white" : "transparent",
                  border: `2px solid ${
                    done ? TEAL : active ? CORAL : "#b8c2cd"
                  }`,
                  color: done ? "white" : active ? CORAL : SLATE,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 800,
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  boxShadow: active
                    ? "0 0 0 3px rgba(244,117,96,0.2)"
                    : "none",
                  position: "relative",
                }}
              >
                {done ? "✓" : i + 1}
                {active && (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: -2,
                      border: `2px solid ${CORAL}`,
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "ibxProcSpinRing 1.2s linear infinite",
                    }}
                  />
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: done || active ? NAVY : STEEL,
                    lineHeight: 1.3,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: SLATE,
                    marginTop: 1,
                    lineHeight: 1.3,
                    height: 22,
                    overflow: "hidden",
                  }}
                >
                  {active ? s.hint : done ? "Complete" : "—"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 5,
            background: "rgba(11,29,58,0.08)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${TEAL}, ${CORAL})`,
              borderRadius: 3,
              transition: "width 0.3s",
              boxShadow: "0 0 12px rgba(244,117,96,0.4)",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: NAVY,
            minWidth: 38,
            textAlign: "right",
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.floor(progress)}
          <span style={{ color: SLATE, fontSize: 10, marginLeft: 1 }}>%</span>
        </div>
      </div>
    </div>
  );
}
