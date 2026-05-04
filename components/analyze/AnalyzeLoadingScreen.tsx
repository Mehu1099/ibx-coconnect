"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/lib/auth-context";

const VISIBLE_MS_FULL = 2500;
const VISIBLE_MS_REDUCED = 1500;
const FADE_MS = 500;
const OVERLAY_Z = 200;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

interface Props {
  onComplete: () => void;
}

export default function AnalyzeLoadingScreen({ onComplete }: Props) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const { isStakeholder } = useAuth();
  const [visible, setVisible] = useState(true);

  // Defensive: should never render for a non-stakeholder (parent gates),
  // but if an accidental render path lands here, dismiss immediately.
  useEffect(() => {
    if (!isStakeholder) onComplete();
  }, [isStakeholder, onComplete]);

  useEffect(() => {
    const visibleMs = reducedMotion ? VISIBLE_MS_REDUCED : VISIBLE_MS_FULL;
    const timer = window.setTimeout(() => setVisible(false), visibleMs);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          key="analyze-loading-screen"
          role="status"
          aria-live="polite"
          aria-label="Preparing your workspace"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_MS / 1000, ease: "easeInOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: OVERLAY_Z,
            background:
              "radial-gradient(circle at 50% 25%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 55%), #F5F2EB",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 28,
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 11,
              color: "rgba(11,29,58,0.5)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            BRIEFING · IBX-FBC · A-200
          </div>

          <DeskScene reducedMotion={reducedMotion} />

          <h2
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: 34,
              fontWeight: 500,
              color: "#0B1D3A",
              letterSpacing: "-0.02em",
              margin: "32px 0 8px",
              textAlign: "center",
            }}
          >
            Preparing your desk
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "rgba(11,29,58,0.7)",
              margin: "0 0 32px",
              textAlign: "center",
            }}
          >
            Pulling the latest voices from the field
          </p>

          {reducedMotion ? (
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 11,
                color: "#0F8A7E",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Preparing…
            </span>
          ) : (
            <div style={{ display: "flex", gap: 8 }} aria-hidden>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#1ABFAD",
                    display: "inline-block",
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DeskScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <motion.svg
      width={280}
      height={220}
      viewBox="0 0 280 220"
      aria-hidden
      animate={reducedMotion ? undefined : { y: [0, -2, 0] }}
      transition={
        reducedMotion
          ? undefined
          : { duration: 4, repeat: Infinity, ease: "easeInOut" }
      }
    >
      <motion.g
        initial={reducedMotion ? false : { x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <g transform="rotate(-3 140 115)">
          <rect
            x="60"
            y="60"
            width="160"
            height="110"
            rx="3"
            fill="#FAF6EA"
            stroke="rgba(11,29,58,0.18)"
            strokeWidth="1"
          />
          <rect x="60" y="60" width="6" height="110" fill="#0B1D3A" />
          {[84, 100, 116, 132, 148].map((y, i) => (
            <line
              key={y}
              x1="78"
              y1={y}
              x2={i % 2 === 0 ? 208 : 190}
              y2={y}
              stroke="rgba(11,29,58,0.10)"
              strokeWidth="1"
            />
          ))}
        </g>
      </motion.g>

      <motion.g
        initial={
          reducedMotion ? false : { x: -40, y: -20, rotate: -45, opacity: 0 }
        }
        animate={{ x: 0, y: 0, rotate: -18, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      >
        <g transform="translate(82 134)">
          <polygon points="0,3 -10,5 0,7" fill="#0B1D3A" />
          <rect
            x="0"
            y="2"
            width="100"
            height="6"
            fill="#E8C547"
            stroke="rgba(11,29,58,0.15)"
            strokeWidth="0.5"
          />
          <rect x="100" y="2" width="6" height="6" fill="#E5654F" />
          <rect x="106" y="3" width="2" height="4" fill="#F2EDE0" />
        </g>
      </motion.g>

      {[
        { x: 30, color: "#F47560", delay: 1.0 },
        { x: 90, color: "#1ABFAD", delay: 1.2 },
        { x: 150, color: "#F0A933", delay: 1.4 },
      ].map((card) => (
        <motion.g
          key={card.x}
          initial={reducedMotion ? false : { y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.4,
            delay: card.delay,
            ease: [0.2, 0.7, 0.2, 1],
          }}
        >
          <rect
            x={card.x}
            y="185"
            width="50"
            height="22"
            rx="2"
            fill="#FFFFFF"
            stroke="rgba(11,29,58,0.12)"
            strokeWidth="1"
          />
          <rect x={card.x} y="185" width="2" height="22" fill={card.color} />
          <line
            x1={card.x + 8}
            y1="193"
            x2={card.x + 42}
            y2="193"
            stroke="rgba(11,29,58,0.18)"
            strokeWidth="1"
          />
          <line
            x1={card.x + 8}
            y1="200"
            x2={card.x + 36}
            y2="200"
            stroke="rgba(11,29,58,0.12)"
            strokeWidth="1"
          />
        </motion.g>
      ))}

      <motion.g
        initial={
          reducedMotion ? false : { y: -20, x: 10, rotate: 8, opacity: 0 }
        }
        animate={{ y: 0, x: 0, rotate: -3, opacity: 0.95 }}
        transition={{ duration: 0.4, delay: 1.6, ease: [0.2, 0.7, 0.2, 1] }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      >
        <g transform="translate(192 42)">
          <rect x="0" y="0" width="50" height="50" fill="#F5D547" />
          <line
            x1="6"
            y1="14"
            x2="42"
            y2="14"
            stroke="rgba(11,29,58,0.45)"
            strokeWidth="1"
          />
          <line
            x1="6"
            y1="22"
            x2="38"
            y2="22"
            stroke="rgba(11,29,58,0.30)"
            strokeWidth="1"
          />
          <line
            x1="6"
            y1="30"
            x2="40"
            y2="30"
            stroke="rgba(11,29,58,0.30)"
            strokeWidth="1"
          />
          <line
            x1="6"
            y1="38"
            x2="34"
            y2="38"
            stroke="rgba(11,29,58,0.30)"
            strokeWidth="1"
          />
        </g>
      </motion.g>
    </motion.svg>
  );
}
