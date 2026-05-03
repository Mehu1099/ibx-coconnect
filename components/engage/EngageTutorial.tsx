"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

// First-visit walkthrough for the Engage page. Five steps, dismissable
// at any time, gated by a localStorage flag so returning visitors skip
// it. The header's "?" button can re-open the tour by dispatching the
// `ENGAGE_TUTORIAL_OPEN_EVENT` custom event — that avoids prop-drilling
// open-state through the full component tree just to support a help
// button.

export const TUTORIAL_KEY = "ibx-engage-tutorial-seen";
export const ENGAGE_TUTORIAL_OPEN_EVENT = "engage-tutorial:open";

type SpotlightTarget = "map" | "themes-rail" | "voices-rail";
type CardAnchor = "center" | "right-of-themes" | "left-of-voices";

interface Step {
  title: string;
  body: string | string[];
  spotlight?: SpotlightTarget;
  cardAnchor: CardAnchor;
}

const STEPS: Step[] = [
  {
    title: "Welcome to Engage",
    body: "This is where the community's voices come together. Aggregated contributions from all 8 locations, mapped, sorted, and analysed.",
    cardAnchor: "center",
  },
  {
    title: "Where it's happening",
    body: "Pins show how many voices each location has gathered. Click any pin to filter the entire page to that location.",
    spotlight: "map",
    cardAnchor: "center",
  },
  {
    title: "Themes & Patterns",
    body: "AI-clustered themes will appear here, surfacing what patterns emerge across community contributions. Stakeholders generate these on demand.",
    spotlight: "themes-rail",
    cardAnchor: "right-of-themes",
  },
  {
    title: "Every voice",
    body: "Each contribution is a real voice from a community member. Click any card to see exactly where on the map it was placed and what context it was responding to.",
    spotlight: "voices-rail",
    cardAnchor: "left-of-voices",
  },
  {
    title: "A few quick tips",
    body: [
      "Click anywhere on the map background to clear filters",
      "Filter chips at the top of the feed narrow by contribution type",
      "AI proposals show a before/after view when expanded",
    ],
    cardAnchor: "center",
  },
];

interface SpotRect {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
}

// Positions for the spotlight rectangles must mirror the absolute
// offsets used by the rails / map (top:90, bottom:110, left:20/380,
// right:20/400, widths 340/360). If the layout offsets ever change,
// update these in lockstep.
function spotlightRect(
  target: SpotlightTarget,
  vw: number,
  vh: number,
): SpotRect | null {
  const TOP = 90;
  const BOTTOM = 110;
  switch (target) {
    case "map":
      return {
        x: 380,
        y: TOP,
        width: Math.max(0, vw - 780),
        height: Math.max(0, vh - TOP - BOTTOM),
        rx: 16,
      };
    case "themes-rail":
      return {
        x: 20,
        y: TOP,
        width: 340,
        height: Math.max(0, vh - TOP - BOTTOM),
        rx: 14,
      };
    case "voices-rail":
      return {
        x: vw - 380,
        y: TOP,
        width: 360,
        height: Math.max(0, vh - TOP - BOTTOM),
        rx: 14,
      };
    default:
      return null;
  }
}

function cardStyle(anchor: CardAnchor): React.CSSProperties {
  switch (anchor) {
    case "right-of-themes":
      return { top: "50%", left: 380, transform: "translateY(-50%)" };
    case "left-of-voices":
      return { top: "50%", right: 400, transform: "translateY(-50%)" };
    case "center":
    default:
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }
}

export function EngageTutorial() {
  const [show, setShow] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);

  // Track viewport so the spotlight rectangles stay aligned with the
  // rails on resize. Initial values pulled in the same effect to avoid
  // an SSR hydration mismatch.
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

  // First-visit auto-open, gated by localStorage.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(TUTORIAL_KEY) === "true";
    } catch {
      // private browsing → fall through and just show
    }
    if (seen) return;
    const t = window.setTimeout(() => setShow(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  // Re-open from the "?" help button. The button dispatches a custom
  // event on `window`; we listen here so it works without prop-drilling.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOpen = () => {
      setStepIdx(0);
      setShow(true);
    };
    window.addEventListener(ENGAGE_TUTORIAL_OPEN_EVENT, onOpen);
    return () =>
      window.removeEventListener(ENGAGE_TUTORIAL_OPEN_EVENT, onOpen);
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
      // Final step → dismiss handled by side-effect after state updates;
      // schedule dismiss outside this updater so it runs after commit.
      window.setTimeout(dismiss, 0);
      return idx;
    });
  }, [dismiss]);

  // Esc to skip — small accessibility win.
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, dismiss]);

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;
  const isFirst = stepIdx === 0;
  const rect =
    show && step.spotlight && vw > 0 && vh > 0
      ? spotlightRect(step.spotlight, vw, vh)
      : null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="engage-tutorial"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            pointerEvents: "auto",
            fontFamily: "var(--font-space-grotesk), sans-serif",
          }}
        >
          {rect ? (
            <SpotlightBackdrop rect={rect} vw={vw} vh={vh} />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(11, 29, 58, 0.55)",
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
              }}
            />
          )}

          <motion.div
            key={`card-${stepIdx}`}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            role="dialog"
            aria-labelledby="engage-tutorial-title"
            style={{
              position: "absolute",
              ...cardStyle(step.cardAnchor),
              width: 340,
              maxWidth: "calc(100vw - 32px)",
              background: "#FFFFFF",
              borderRadius: 16,
              boxShadow: "0 20px 60px -10px rgba(11, 29, 58, 0.4)",
              padding: "22px 22px 18px",
              zIndex: 210,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#F47560",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#6B7A8C",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                {isFirst
                  ? "Welcome"
                  : `Step ${stepIdx + 1} of ${STEPS.length}`}
              </span>
            </div>

            <h3
              id="engage-tutorial-title"
              style={{
                margin: 0,
                fontSize: 19,
                fontWeight: 600,
                color: "#0B1D3A",
                letterSpacing: "-0.02em",
                marginBottom: 10,
              }}
            >
              {step.title}
            </h3>

            {Array.isArray(step.body) ? (
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {step.body.map((item, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      color: "#3a4a5c",
                      paddingLeft: 16,
                      position: "relative",
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 8,
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: "#F47560",
                      }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: "#3a4a5c",
                }}
              >
                {step.body}
              </p>
            )}

            <div
              style={{
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              {!isLast ? (
                <>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="engage-tutorial-skip"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#6B7A8C",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      padding: "6px 4px",
                      borderRadius: 4,
                    }}
                  >
                    Skip tour
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="engage-tutorial-primary"
                    style={{
                      background: "#F47560",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "background 150ms",
                    }}
                  >
                    {isFirst ? "Take tour →" : "Next →"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={next}
                  className="engage-tutorial-primary"
                  style={{
                    marginLeft: "auto",
                    background: "#F47560",
                    color: "white",
                    border: "none",
                    padding: "8px 18px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 150ms",
                  }}
                >
                  Got it →
                </button>
              )}
            </div>
          </motion.div>

          <style jsx>{`
            :global(.engage-tutorial-primary:hover) {
              background: #d85a45 !important;
            }
            :global(.engage-tutorial-primary:focus-visible),
            :global(.engage-tutorial-skip:focus-visible) {
              outline: 2px solid #0b1d3a;
              outline-offset: 2px;
            }
            :global(.engage-tutorial-skip:hover) {
              color: #0b1d3a !important;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// SVG mask cuts a rounded rectangle "hole" out of a translucent navy
// overlay, revealing the spotlighted element. We re-render the mask
// with a unique id per step so it animates fresh between steps.
function SpotlightBackdrop({
  rect,
  vw,
  vh,
}: {
  rect: SpotRect;
  vw: number;
  vh: number;
}) {
  const maskId = `engage-tut-mask-${rect.x}-${rect.y}-${rect.width}-${rect.height}`;
  return (
    <svg
      width={vw}
      height={vh}
      viewBox={`0 0 ${vw} ${vh}`}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      <defs>
        <mask id={maskId}>
          <rect width={vw} height={vh} fill="white" />
          <rect
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            rx={rect.rx}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        width={vw}
        height={vh}
        fill="rgba(11, 29, 58, 0.55)"
        mask={`url(#${maskId})`}
      />
      {/* Coral indicator stroke around the spotlight, drawn after the
          masked dim so it reads as the highlight itself. */}
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        rx={rect.rx}
        fill="none"
        stroke="#F47560"
        strokeWidth="2"
        opacity="0.6"
      />
    </svg>
  );
}
