"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const INTRO = "This is Flatbush.";
const LINE_1 = "Welcome to your neighborhood.";
const LINE_2 = "Pick a location and build the future.";

const INTRO_TYPE_MS = 1200;
const INTRO_HOLD_MS = 1000;
const INTRO_FADE_MS = 600;
const LINE_DURATION_MS = 2000;
const CURSOR_HOLD_MS = 2000;

type Phase =
  | "intro-typing"
  | "intro-hold"
  | "intro-exit"
  | "line1"
  | "line2"
  | "hold"
  | "fade";

type Props = {
  /** Skip the typewriter sequence and render the final two-line state. */
  instant?: boolean;
  /** Mobile portrait — anchor text near the bottom (out of the way of
   *  cropped image edges) and use smaller type. */
  isMobilePortrait?: boolean;
};

export default function WelcomeText({
  instant = false,
  isMobilePortrait = false,
}: Props) {
  // instant=true skips the typewriter phase machine entirely: phase
  // starts at "fade" (each phase effect early-returns) and the line
  // text is pre-filled to its final value so the two-line block
  // renders complete on first paint.
  const [phase, setPhase] = useState<Phase>(instant ? "fade" : "intro-typing");
  const [introText, setIntroText] = useState("");
  const [line1, setLine1] = useState(instant ? LINE_1 : "");
  const [line2, setLine2] = useState(instant ? LINE_2 : "");
  const [cursorVisible, setCursorVisible] = useState(true);

  // Intro typewriter
  useEffect(() => {
    if (phase !== "intro-typing") return;
    const interval = INTRO_TYPE_MS / INTRO.length;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setIntroText(INTRO.slice(0, i));
      if (i >= INTRO.length) {
        clearInterval(id);
        setPhase("intro-hold");
      }
    }, interval);
    return () => clearInterval(id);
  }, [phase]);

  // Intro hold → exit trigger
  useEffect(() => {
    if (phase !== "intro-hold") return;
    const id = setTimeout(() => setPhase("intro-exit"), INTRO_HOLD_MS);
    return () => clearTimeout(id);
  }, [phase]);

  // Intro exit → line1 (wait for the AnimatePresence fade-out to finish
  // before the main block mounts, so the two don't visually overlap)
  useEffect(() => {
    if (phase !== "intro-exit") return;
    const id = setTimeout(() => setPhase("line1"), INTRO_FADE_MS);
    return () => clearTimeout(id);
  }, [phase]);

  // Line 1 typewriter
  useEffect(() => {
    if (phase !== "line1") return;
    const interval = LINE_DURATION_MS / LINE_1.length;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setLine1(LINE_1.slice(0, i));
      if (i >= LINE_1.length) {
        clearInterval(id);
        setPhase("line2");
      }
    }, interval);
    return () => clearInterval(id);
  }, [phase]);

  // Line 2 typewriter
  useEffect(() => {
    if (phase !== "line2") return;
    const interval = LINE_DURATION_MS / LINE_2.length;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setLine2(LINE_2.slice(0, i));
      if (i >= LINE_2.length) {
        clearInterval(id);
        setPhase("hold");
      }
    }, interval);
    return () => clearInterval(id);
  }, [phase]);

  // Hold → fade
  useEffect(() => {
    if (phase !== "hold") return;
    const id = setTimeout(() => setPhase("fade"), CURSOR_HOLD_MS);
    return () => clearTimeout(id);
  }, [phase]);

  // Cursor blink runs through every phase except the final fade-out
  useEffect(() => {
    if (phase === "fade") return;
    const id = setInterval(() => setCursorVisible((v) => !v), 500);
    return () => clearInterval(id);
  }, [phase]);

  const introMounted =
    phase === "intro-typing" || phase === "intro-hold";
  const mainMounted =
    phase === "line1" ||
    phase === "line2" ||
    phase === "hold" ||
    phase === "fade";

  const showCursorOnIntro = phase === "intro-typing";
  const showCursorOnLine1 = phase === "line1";
  const showCursorOnLine2 = phase === "line2" || phase === "hold";
  const cursorOpacity = phase === "fade" ? 0 : cursorVisible ? 1 : 0;

  const cursor = (show: boolean) =>
    show ? (
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: 2,
          height: "0.9em",
          marginLeft: 2,
          background: "#1ABFAD",
          verticalAlign: "-0.1em",
          opacity: cursorOpacity,
          transition: "opacity 0.4s ease",
        }}
      />
    ) : null;

  // Mobile portrait: anchor text to the bottom (away from the cropped
  // top of the axonometric) and shrink type so the two lines fit
  // comfortably above the toolbar/CTA stack.
  const containerStyle: React.CSSProperties = isMobilePortrait
    ? {
        left: 20,
        right: 20,
        bottom: 120,
        fontFamily: "var(--font-space-grotesk)",
        color: "#0B1D3A",
      }
    : {
        left: 48,
        top: 100,
        fontFamily: "var(--font-space-grotesk)",
        color: "#0B1D3A",
      };

  const headlineSize = isMobilePortrait ? 24 : 36;
  const subSize = isMobilePortrait ? 18 : 32;

  return (
    <div className="absolute z-30 select-none" style={containerStyle}>
      <AnimatePresence>
        {introMounted && (
          <motion.div
            key="intro"
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: INTRO_FADE_MS / 1000, ease: "easeOut" }}
            style={{
              fontSize: headlineSize,
              fontWeight: 600,
              lineHeight: 1.2,
              minHeight: "1.2em",
            }}
          >
            {introText}
            {cursor(showCursorOnIntro)}
          </motion.div>
        )}
      </AnimatePresence>

      {mainMounted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div
            style={{
              fontSize: headlineSize,
              fontWeight: 600,
              lineHeight: 1.2,
              minHeight: "1.2em",
            }}
          >
            {line1}
            {cursor(showCursorOnLine1)}
          </div>
          <div
            style={{
              fontSize: subSize,
              fontWeight: 400,
              lineHeight: 1.3,
              marginTop: 4,
              minHeight: "1.3em",
            }}
          >
            {line2}
            {cursor(showCursorOnLine2)}
          </div>
        </motion.div>
      )}
    </div>
  );
}
