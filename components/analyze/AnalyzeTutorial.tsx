"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// First-visit walkthrough for the Analyze page. Six steps, dismissable
// at any point, gated by a localStorage flag so returning planners skip
// it. The header's "?" button can re-open the tour by dispatching the
// `ANALYZE_TUTORIAL_OPEN_EVENT` custom event — that avoids prop-drilling
// open-state through the panel tree just to support a help button.
//
// Differs from EngageTutorial in that spotlight targets are real DOM
// elements (looked up by id) rather than viewport-relative regions —
// Analyze panels scroll with content, so we measure getBoundingClientRect
// per step and re-measure on resize/scroll so the spotlight tracks the
// panel as the user scrolls.

export const TUTORIAL_KEY = "ibx-analyze-tutorial-seen";
export const ANALYZE_TUTORIAL_OPEN_EVENT = "analyze-tutorial:open";

interface Step {
  title: string;
  body: string;
  // Element id to spotlight; undefined ⇒ centered modal (steps 1 and 6).
  targetId?: string;
}

const STEPS: Step[] = [
  {
    title: "Welcome to your briefing room",
    body: "This is where you triage themes, look for patterns across the community, and prepare materials for review. Let's walk through the four panels.",
  },
  {
    title: "Triage themes here",
    body: "Each theme from the latest generation appears as a card. Click the status pill to cycle through Unassigned → Priority → Investigating → Addressed. Use the status filter at the top to focus on what needs attention.",
    targetId: "tutorial-status-board",
  },
  {
    title: "Read who's saying what",
    body: "This heatmap shows which demographic groups raise which themes. Hot cells reveal cross-demographic patterns — and cold cells reveal blind spots.",
    targetId: "tutorial-demographic-matrix",
  },
  {
    title: "See where the conversation lives",
    body: "Pin size shows contribution density across the corridor. Toggle between 'all,' 'concerns,' and 'visions' to compare where the community sees problems vs possibilities.",
    targetId: "tutorial-spatial-density",
  },
  {
    title: "Drill into the raw data",
    body: "Every contribution is here. Sort by column, filter by type or location, search content. This is your evidence base when preparing briefings.",
    targetId: "tutorial-contributions-table",
  },
  {
    title: "A few shortcuts",
    body: "Clicking a theme card highlights its rows in the matrix and table — useful for cross-referencing. Filters at the top filter the whole page. Click the '?' anytime to revisit this tour.",
  },
];

const ACCENT = "#1ABFAD";
const ACCENT_DEEP = "#0F8A7E";
const ACCENT_SOFT = "rgba(26,191,173,0.15)";
const SPOTLIGHT_PAD = 12;
const BUBBLE_WIDTH = 440;
const SCROLL_SETTLE_MS = 420;

// Measurement is tagged with the stepIdx it was taken for so a stale
// rect from a prior step never gets treated as the current spotlight —
// avoids the early-exit setTargetRect(null) calls that would otherwise
// trip react-hooks/set-state-in-effect.
interface Measured {
  rect: DOMRect;
  forStep: number;
}

interface AnalyzeTutorialProps {
  loadingComplete?: boolean;
}

export default function AnalyzeTutorial({
  loadingComplete = true,
}: AnalyzeTutorialProps = {}) {
  const [show, setShow] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [measured, setMeasured] = useState<Measured | null>(null);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);

  // Track viewport so bubble clamping uses live values; init in effect
  // to avoid an SSR hydration mismatch.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // First-visit auto-open, gated by localStorage. 800ms delay lets the
  // page chrome settle before the dim overlay drops. When the parent
  // passes loadingComplete=false (first-visit loading screen still up),
  // the timer is suspended until the loading screen finishes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!loadingComplete) return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(TUTORIAL_KEY) === "true";
    } catch {
      // private browsing → fall through and just show the tour
    }
    if (seen) return;
    const t = window.setTimeout(() => setShow(true), 800);
    return () => window.clearTimeout(t);
  }, [loadingComplete]);

  // Re-open from the "?" help button via custom event.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOpen = () => {
      setStepIdx(0);
      setShow(true);
    };
    window.addEventListener(ANALYZE_TUTORIAL_OPEN_EVENT, onOpen);
    return () =>
      window.removeEventListener(ANALYZE_TUTORIAL_OPEN_EVENT, onOpen);
  }, []);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(TUTORIAL_KEY, "true");
      } catch {
        /* private browsing — accept that the tour will replay next visit */
      }
    }
    setShow(false);
  }, []);

  const next = useCallback(() => {
    setStepIdx((idx) => {
      if (idx < STEPS.length - 1) return idx + 1;
      // Final step → dismiss after commit so we don't tear down state
      // mid-render of the last frame.
      window.setTimeout(dismiss, 0);
      return idx;
    });
  }, [dismiss]);

  // Esc to skip — small a11y win, mirrors EngageTutorial.
  useEffect(() => {
    if (!show) return;
    if (typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, dismiss]);

  // Measure the spotlight target each time the step changes. Scrolls
  // the panel into view first, then waits for the smooth-scroll to
  // settle before snapshotting the rect. Re-measures on subsequent
  // resize/scroll so the spotlight tracks the panel as the user
  // scrolls. All state updates here happen inside async callbacks
  // (setTimeout, resize/scroll listeners) — none synchronous in the
  // effect body, so no react-hooks/set-state-in-effect issue.
  useEffect(() => {
    if (!show) return;
    if (typeof window === "undefined") return;
    const step = STEPS[stepIdx];
    if (!step.targetId) return;
    const el = document.getElementById(step.targetId);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    const settle = window.setTimeout(() => {
      setMeasured({ rect: el.getBoundingClientRect(), forStep: stepIdx });
    }, SCROLL_SETTLE_MS);

    const remeasure = () => {
      setMeasured({ rect: el.getBoundingClientRect(), forStep: stepIdx });
    };
    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", remeasure, true);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure, true);
    };
  }, [stepIdx, show]);

  const step = STEPS[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === STEPS.length - 1;
  const stepHasTarget = !!step.targetId;
  // Only treat the cached measurement as live when it was taken for the
  // current step — protects against the stale-rect window during scroll.
  const targetRect =
    stepHasTarget && measured && measured.forStep === stepIdx
      ? measured.rect
      : null;
  const hasSpotlight = !!targetRect;

  // Bubble placement: centered when no spotlight (steps 1 and 6); below
  // the spotlight if there's room, otherwise above. Horizontally centered
  // on the target, then clamped to keep both edges at least 24px from the
  // viewport. On viewports narrower than the bubble + 48px gutter, pin
  // to the left edge — desktop-only page so this is rare.
  let bubbleStyle: React.CSSProperties = {};
  if (!hasSpotlight) {
    bubbleStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "min(480px, calc(100% - 64px))",
    };
  } else if (targetRect && vw > 0 && vh > 0) {
    const spaceBelow = vh - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const placeBelow = spaceBelow > 220 || spaceBelow >= spaceAbove;

    const desiredLeft =
      targetRect.left + targetRect.width / 2 - BUBBLE_WIDTH / 2;
    const minLeft = 24;
    const maxLeft = Math.max(minLeft, vw - BUBBLE_WIDTH - 24);
    const clampedLeft = Math.max(minLeft, Math.min(desiredLeft, maxLeft));

    if (placeBelow) {
      bubbleStyle = {
        position: "fixed",
        top: targetRect.bottom + SPOTLIGHT_PAD + 16,
        left: clampedLeft,
        width: BUBBLE_WIDTH,
        maxWidth: "calc(100vw - 48px)",
      };
    } else {
      bubbleStyle = {
        position: "fixed",
        bottom: vh - targetRect.top + SPOTLIGHT_PAD + 16,
        left: clampedLeft,
        width: BUBBLE_WIDTH,
        maxWidth: "calc(100vw - 48px)",
      };
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="analyze-tutorial"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            pointerEvents: "auto",
            fontFamily: "var(--font-space-grotesk), sans-serif",
          }}
        >
          {hasSpotlight && targetRect && vw > 0 && vh > 0 ? (
            <SpotlightBackdrop rect={targetRect} vw={vw} vh={vh} />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(11,29,58,0.55)",
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
              }}
            />
          )}

          <motion.div
            key={`card-${stepIdx}`}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
            role="dialog"
            aria-labelledby="analyze-tutorial-title"
            style={{
              ...bubbleStyle,
              zIndex: 1001,
              background: "#FFFFFF",
              border: `1px solid ${ACCENT}`,
              boxShadow: `0 4px 16px -4px rgba(11,29,58,0.20), 0 24px 48px -12px ${ACCENT}40`,
              padding: "24px 24px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 10px",
                  background: ACCENT_SOFT,
                  border: `1px solid ${ACCENT}40`,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: ACCENT,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: 9.5,
                    color: ACCENT_DEEP,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  {isFirst
                    ? "Welcome"
                    : `Step ${stepIdx + 1} of ${STEPS.length}`}
                </span>
              </div>
              <button
                onClick={dismiss}
                type="button"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#8899AA",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                }}
                aria-label="Close tutorial"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <h3
              id="analyze-tutorial-title"
              style={{
                fontSize: 19,
                fontWeight: 600,
                color: "#0B1D3A",
                letterSpacing: "-0.015em",
                lineHeight: 1.25,
                margin: "0 0 10px",
              }}
            >
              {step.title}
            </h3>

            <p
              style={{
                fontSize: 13.5,
                color: "#3a4a5c",
                lineHeight: 1.6,
                margin: "0 0 20px",
              }}
            >
              {step.body}
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              {!isLast ? (
                <button
                  onClick={dismiss}
                  type="button"
                  className="analyze-tutorial-skip"
                  style={{
                    padding: "8px 14px",
                    background: "transparent",
                    color: "#6B7A8C",
                    border: "none",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Skip tour
                </button>
              ) : (
                <span aria-hidden />
              )}

              <button
                onClick={next}
                type="button"
                className="analyze-tutorial-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 16px",
                  background: ACCENT_DEEP,
                  color: "#fff",
                  border: "none",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "background 150ms",
                }}
              >
                {isLast ? "Got it" : "Next"}
                {!isLast && <ArrowRight size={12} strokeWidth={2.5} />}
              </button>
            </div>
          </motion.div>

          <style jsx>{`
            :global(.analyze-tutorial-primary:hover) {
              background: ${ACCENT} !important;
            }
            :global(.analyze-tutorial-primary:focus-visible),
            :global(.analyze-tutorial-skip:focus-visible) {
              outline: 2px solid #0b1d3a;
              outline-offset: 2px;
            }
            :global(.analyze-tutorial-skip:hover) {
              color: #0b1d3a !important;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// SVG-mask cutout: a translucent navy rect with a rounded "hole" punched
// out around the spotlighted panel, plus a teal stroke around the cutout
// to read as the highlight indicator. Mask id includes rect dims so each
// step gets a fresh mask (avoids stale-id collisions in transitions).
function SpotlightBackdrop({
  rect,
  vw,
  vh,
}: {
  rect: DOMRect;
  vw: number;
  vh: number;
}) {
  const x = rect.left - SPOTLIGHT_PAD;
  const y = rect.top - SPOTLIGHT_PAD;
  const w = rect.width + SPOTLIGHT_PAD * 2;
  const h = rect.height + SPOTLIGHT_PAD * 2;
  const maskId = `analyze-tut-mask-${Math.round(x)}-${Math.round(y)}-${Math.round(w)}-${Math.round(h)}`;
  return (
    <svg
      width={vw}
      height={vh}
      viewBox={`0 0 ${vw} ${vh}`}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      aria-hidden
    >
      <defs>
        <mask id={maskId}>
          <rect width={vw} height={vh} fill="white" />
          <rect x={x} y={y} width={w} height={h} rx={6} ry={6} fill="black" />
        </mask>
      </defs>
      <rect
        width={vw}
        height={vh}
        fill="rgba(11,29,58,0.55)"
        mask={`url(#${maskId})`}
      />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        ry={6}
        fill="none"
        stroke={ACCENT}
        strokeWidth="2"
        opacity="0.85"
      />
    </svg>
  );
}
