"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Engagement-loop nudge: surfaces on every qualifying visit, with a
// short cooldown after each close. After DISMISS_CAP active closes
// (× or auto-dismiss — click-throughs don't count) we switch to a
// 7-day cooldown. Once that window passes, the dismiss count is
// reset to 0 so the user re-enters the standard short-window loop —
// symmetric with click-through, which also resets the count. Copy
// alternates between two variants by appearance count so repeat
// surfaces feel alive instead of mechanical.
const DISMISSED_AT_KEY = "ibx-explore-engage-nudge-dismissed-at";
const DISMISS_COUNT_KEY = "ibx-explore-engage-nudge-dismiss-count";
const APPEARANCE_COUNT_KEY = "ibx-explore-engage-nudge-appearance-count";

const SHORT_SUPPRESS_MS = 3 * 60 * 60 * 1000;
const LONG_SUPPRESS_MS = 7 * 24 * 60 * 60 * 1000;
const DISMISS_CAP = 3;
const ARM_DELAY_MS = 6_000;
const AUTO_DISMISS_MS = 12_000;

type Variant = "A" | "B";

const COPY: Record<Variant, { title: string; body: string }> = {
  A: {
    title: "See your voice in the conversation",
    body: "Themes from your neighborhood are taking shape on Engage.",
  },
  B: {
    title: "Themes are shifting as new voices arrive",
    body: "See what's emerging on Engage.",
  },
};

interface Props {
  visitCount: number;
  hasContributionsPromise: Promise<boolean> | null;
}

function readNumber(key: string): number {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeNumber(key: string, value: number) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* private browsing — ignore */
  }
}

export default function EngageNudgeToast({
  visitCount,
  hasContributionsPromise,
}: Props) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const [armed, setArmed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<Variant>("A");
  const dismissedRef = useRef(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const dismiss = useCallback(
    (navigate: boolean) => {
      if (dismissedRef.current) return;
      dismissedRef.current = true;
      writeNumber(DISMISSED_AT_KEY, Date.now());
      if (navigate) {
        // Click-through is the desired outcome — reset the cap so
        // the user stays in the engagement loop.
        writeNumber(DISMISS_COUNT_KEY, 0);
      } else {
        // × or auto-dismiss — bumps toward the soft cap.
        writeNumber(
          DISMISS_COUNT_KEY,
          readNumber(DISMISS_COUNT_KEY) + 1,
        );
      }
      setVisible(false);
      if (navigate) router.push("/engage");
    },
    [router],
  );

  // Eligibility gate. Below the cap, suppress for 3 hours after
  // each close. At/above the cap, suppress for 7 days; once that
  // window passes we reset the count to 0 and re-enter the standard
  // short-window loop (symmetric with click-through reset).
  useEffect(() => {
    if (visitCount < 2) return;
    if (!hasContributionsPromise) return;

    const dismissedAt = readNumber(DISMISSED_AT_KEY);
    const dismissCount = readNumber(DISMISS_COUNT_KEY);

    if (dismissedAt > 0) {
      const elapsed = Date.now() - dismissedAt;
      if (dismissCount >= DISMISS_CAP) {
        if (elapsed < LONG_SUPPRESS_MS) return;
        writeNumber(DISMISS_COUNT_KEY, 0);
      } else if (elapsed < SHORT_SUPPRESS_MS) {
        return;
      }
    }

    let cancelled = false;
    void hasContributionsPromise.then((ok) => {
      if (cancelled) return;
      if (ok) setArmed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [visitCount, hasContributionsPromise]);

  // Once armed, wait 6 s of *uninterrupted* time on /explore. When
  // the timer fires, atomically increment the appearance counter,
  // pick the variant for this appearance, and flip visible.
  // Unmount (route change) clears the timer, so navigate-away-and-
  // back resets the countdown.
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => {
      const next = readNumber(APPEARANCE_COUNT_KEY) + 1;
      writeNumber(APPEARANCE_COUNT_KEY, next);
      setVariant(next % 2 === 1 ? "A" : "B");
      setVisible(true);
    }, ARM_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [armed]);

  // Once visible, an auto-dismiss timer takes over.
  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => dismiss(false), AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [visible, dismiss]);

  // Move keyboard focus to the toast on appearance and wire a
  // window-level Escape so it works regardless of the focused
  // descendant (body or close button).
  useEffect(() => {
    if (!visible) return;
    bodyRef.current?.focus({ preventScroll: true });
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, dismiss]);

  const onBodyKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        dismiss(true);
      }
    },
    [dismiss],
  );

  const initial = reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 };
  const animate = { opacity: 1, y: 0 };
  const exit = reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 };
  const transition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: "easeOut" as const };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={initial}
          animate={animate}
          exit={exit}
          transition={transition}
          whileHover={reducedMotion ? undefined : { y: -1 }}
          role="status"
          aria-live="polite"
          className="engage-nudge-toast"
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            zIndex: 50,
            background: "#FFFFFF",
            border: "1px solid #F47560",
            borderRadius: 16,
            padding: "18px 20px",
            boxShadow: "0 12px 32px -8px rgba(11, 29, 58, 0.18)",
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          }}
        >
          <span
            aria-hidden
            style={{
              flex: "0 0 auto",
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(244, 117, 96, 0.12)",
              color: "#F47560",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 1,
            }}
          >
            <Users size={16} strokeWidth={2.2} />
          </span>

          <div
            ref={bodyRef}
            role="button"
            tabIndex={0}
            onClick={() => dismiss(true)}
            onKeyDown={onBodyKey}
            className="engage-nudge-body"
            style={{
              flex: "1 1 auto",
              cursor: "pointer",
              outline: "none",
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#0B1D3A",
                letterSpacing: "-0.01em",
                lineHeight: 1.25,
              }}
            >
              {COPY[variant].title}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "rgba(11, 29, 58, 0.75)",
                lineHeight: 1.5,
              }}
            >
              {COPY[variant].body}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                fontWeight: 500,
                color: "#F47560",
              }}
            >
              Open Engage →
            </div>
          </div>

          <button
            type="button"
            aria-label="Dismiss"
            onClick={(e) => {
              e.stopPropagation();
              dismiss(false);
            }}
            className="engage-nudge-close"
            style={{
              flex: "0 0 auto",
              width: 18,
              height: 18,
              padding: 0,
              border: "none",
              background: "transparent",
              color: "rgba(11, 29, 58, 0.5)",
              cursor: "default",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 160ms",
            }}
          >
            <X size={16} strokeWidth={2.2} />
          </button>

          <style jsx>{`
            :global(.engage-nudge-toast) {
              transition: box-shadow 200ms ease;
            }
            :global(.engage-nudge-toast:hover) {
              box-shadow: 0 16px 36px -8px rgba(11, 29, 58, 0.24);
            }
            :global(.engage-nudge-body:focus-visible) {
              outline: 2px solid #0b1d3a;
              outline-offset: 4px;
              border-radius: 8px;
            }
            :global(.engage-nudge-close:hover) {
              color: rgba(11, 29, 58, 1) !important;
            }
            :global(.engage-nudge-close:focus-visible) {
              outline: 2px solid #0b1d3a;
              outline-offset: 2px;
              border-radius: 4px;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
