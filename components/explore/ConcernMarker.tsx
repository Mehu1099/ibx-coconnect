"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo, useEffect, useState } from "react";
import { getConcernCategory } from "@/lib/concern-categories";

const CORAL = "#F47560";
const TEAL = "#1ABFAD";
const NAVY = "#0B1D3A";
const SLATE = "#8899AA";

// localStorage key for the "concerns this browser has echoed" set.
// Stored as a JSON array; we read on first render and append on echo.
// Cleared localStorage means the user can echo again — that's accepted
// for now. Server-side enforcement would need a `concern_echoes` table
// keyed on (concern_id, user_id|session_id).
const ECHOED_KEY = "ibx-echoed-concerns";

function readEchoedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(ECHOED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function markConcernEchoed(concernId: string) {
  if (typeof window === "undefined") return;
  try {
    const set = readEchoedSet();
    if (set.has(concernId)) return;
    set.add(concernId);
    window.localStorage.setItem(
      ECHOED_KEY,
      JSON.stringify(Array.from(set)),
    );
  } catch {
    /* quota / private mode — best effort */
  }
}

// Same slim shape used by StickyNoteDot — accepts both DatabaseConcern
// rows and adapted draft concerns. Keeps the component dumb / display-only.
export type ConcernDisplay = {
  id: string;
  x_position: number;
  y_position: number;
  description: string;
  category: string | null;
  echo_count: number;
};

type Props = {
  concern: ConcernDisplay;
  index: number;
  /** Drafts skip the echo button (you can't echo your own draft) and
   *  render a dashed inner ring to mirror the sticky-note draft style. */
  isDraft?: boolean;
  /** True when the row was authored by the current viewer (matched on
   *  user_id for stakeholders or anon session id otherwise). Disables
   *  the echo affordance and shows a muted "Your concern · N echoes". */
  isMyConcern?: boolean;
  /** True when the viewer is an authenticated stakeholder. Echoes are
   *  a community-only mechanic — stakeholders observe rather than vote.
   *  Replaces the echo button with a read-only "Stakeholder view" line. */
  isStakeholder?: boolean;
  onEcho?: () => void;
};

const MARKER_OUTER = 32;
const MARKER_INNER = 26;

function ConcernMarkerInner({
  concern,
  index,
  isDraft = false,
  isMyConcern = false,
  isStakeholder = false,
  onEcho,
}: Props) {
  const [hovered, setHovered] = useState(false);
  // Hydrate from localStorage on mount so a refresh doesn't re-enable
  // the button. SSR-safe: starts false, then flips client-side.
  const [echoed, setEchoed] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- canonical localStorage hydration on mount; SSR can't see the set
    if (readEchoedSet().has(concern.id)) setEchoed(true);
  }, [concern.id]);

  // Echo_count at click time — used to pin a minimum optimistic value
  // until the realtime UPDATE arrives and bumps `concern.echo_count`
  // past it. Once realtime has caught up, optimisticFloor naturally
  // becomes a no-op (realtime value wins). null means "not clicked".
  const [optimisticFloor, setOptimisticFloor] = useState<number | null>(null);

  const category = getConcernCategory(concern.category);

  const handleEcho = () => {
    if (echoed || !onEcho) return;
    setOptimisticFloor((concern.echo_count ?? 0) + 1);
    markConcernEchoed(concern.id);
    setEchoed(true);
    onEcho();
  };

  // "Voices" = creator + echoers. Realtime UPDATE refreshes
  // concern.echo_count so the displayed number stays current; the
  // optimisticFloor keeps the displayed count from regressing during
  // the brief gap between click and realtime arrival.
  const realtimeEchoes = concern.echo_count ?? 0;
  const effectiveEchoes =
    optimisticFloor !== null
      ? Math.max(realtimeEchoes, optimisticFloor)
      : realtimeEchoes;
  const voices = 1 + effectiveEchoes;

  return (
    <div
      className="absolute concern-marker"
      style={{
        left: `${concern.x_position}%`,
        top: `${concern.y_position}%`,
        transform: "translate(-50%, -50%)",
        zIndex: hovered ? 35 : 32,
        ["--shimmer-delay" as string]: `${(index % 8) * 0.5}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.button
        type="button"
        aria-label={isDraft ? "Concern (draft)" : "Concern"}
        className="block cursor-pointer relative flex items-center justify-center rounded-full"
        style={{
          width: MARKER_OUTER,
          height: MARKER_OUTER,
          background: "#FFFFFF",
          border: "none",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.5), 0 3px 12px rgba(11, 29, 58, 0.3)",
          padding: 0,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 22,
          delay: index * 0.05,
        }}
        whileHover={{ scale: 1.15 }}
      >
        <span
          aria-hidden
          className="flex items-center justify-center rounded-full"
          style={{
            width: MARKER_INNER,
            height: MARKER_INNER,
            background: isDraft ? "rgba(244, 117, 96, 0.75)" : CORAL,
            border: isDraft ? "2px dashed #FFFFFF" : "none",
            boxSizing: "border-box",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M7 1.5 L13 12 L1 12 Z"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              fill="none"
              strokeLinejoin="round"
            />
            <line
              x1="7"
              y1="5.5"
              x2="7"
              y2="8.5"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="7" cy="10.2" r="0.7" fill="#FFFFFF" />
          </svg>
        </span>
      </motion.button>

      <AnimatePresence>
        {hovered && (
          <motion.div
            key="concern-popover"
            className="absolute"
            style={{
              left: "50%",
              bottom: "calc(100% + 12px)",
              transform: "translateX(-50%)",
              background: "#FFFFFF",
              padding: "12px 14px",
              borderRadius: 12,
              minWidth: 220,
              maxWidth: 280,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              zIndex: 50,
              fontFamily: "var(--font-space-grotesk)",
              color: NAVY,
            }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "inline-block",
                padding: "2px 8px",
                background: "rgba(244, 117, 96, 0.15)",
                borderRadius: 9999,
                fontSize: 10,
                color: CORAL,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 6,
              }}
            >
              {category?.label ?? "Concern"}
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: NAVY,
                lineHeight: 1.5,
                wordBreak: "break-word",
              }}
            >
              {concern.description}
            </p>

            {/* Stakeholder view — echoes are a community-only mechanic, so
                authenticated viewers get a read-only label instead of the
                button. The server RPC also rejects auth.uid() != null. */}
            {isStakeholder && !isDraft && (
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 11,
                  color: "#6B7A8C",
                  fontStyle: "italic",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Stakeholder view · {voices}{" "}
                {voices === 1 ? "voice" : "voices"}
              </p>
            )}

            {!isStakeholder && !isMyConcern && !isDraft && !echoed && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEcho();
                }}
                className="cursor-pointer"
                style={{
                  marginTop: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: "1px solid rgba(244, 117, 96, 0.3)",
                  padding: "4px 10px",
                  borderRadius: 9999,
                  color: CORAL,
                  fontFamily: "inherit",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition:
                    "background 0.18s ease, border-color 0.18s ease",
                }}
              >
                <span aria-hidden>↑</span>
                I&apos;m concerned too
                <span style={{ marginLeft: 4, fontWeight: 700 }}>{voices}</span>
              </button>
            )}

            {!isStakeholder && !isMyConcern && !isDraft && echoed && (
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 11,
                  color: TEAL,
                  fontStyle: "italic",
                }}
              >
                ✓ You echoed this · {voices}{" "}
                {voices === 1 ? "voice" : "voices"}
              </p>
            )}

            {isMyConcern && !isDraft && (
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 10,
                  color: SLATE,
                  fontStyle: "italic",
                }}
              >
                Your concern · {voices} {voices === 1 ? "voice" : "voices"}
              </p>
            )}

            {isDraft && (
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 10,
                  color: SLATE,
                  fontStyle: "italic",
                }}
              >
                Draft · submit to share
              </p>
            )}

            <span
              aria-hidden
              style={{
                position: "absolute",
                bottom: -5,
                left: "50%",
                transform: "translateX(-50%) rotate(45deg)",
                width: 10,
                height: 10,
                background: "#FFFFFF",
                boxShadow: "2px 2px 4px rgba(0,0,0,0.04)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .concern-marker::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: ${MARKER_OUTER}px;
          height: ${MARKER_OUTER}px;
          margin-left: -${MARKER_OUTER / 2}px;
          margin-top: -${MARKER_OUTER / 2}px;
          border-radius: 50%;
          border: 2px solid ${CORAL};
          opacity: 0;
          animation: concern-pulse 3s ease-out infinite;
          animation-delay: var(--shimmer-delay);
          pointer-events: none;
        }

        @keyframes concern-pulse {
          0% {
            transform: scale(1);
            opacity: 0.7;
          }
          70% {
            opacity: 0;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export const ConcernMarker = memo(ConcernMarkerInner);
export default ConcernMarker;
