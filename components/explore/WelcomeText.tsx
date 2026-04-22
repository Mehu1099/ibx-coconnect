"use client";

import { useEffect, useState } from "react";

const LINE_1 = "Welcome to your neighborhood.";
const LINE_2 = "Pick a location and build the future.";

const START_DELAY_MS = 500;
const LINE_DURATION_MS = 2000;
const CURSOR_HOLD_MS = 2000;

type Phase = "idle" | "line1" | "line2" | "hold" | "fade";

export default function WelcomeText() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => setPhase("line1"), START_DELAY_MS),
    );

    return () => timers.forEach(clearTimeout);
  }, []);

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

  useEffect(() => {
    if (phase !== "hold") return;
    const id = setTimeout(() => setPhase("fade"), CURSOR_HOLD_MS);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "idle" || phase === "fade") return;
    const id = setInterval(() => setCursorVisible((v) => !v), 500);
    return () => clearInterval(id);
  }, [phase]);

  const showCursorOnLine1 = phase === "line1";
  const showCursorOnLine2 = phase === "line2" || phase === "hold";
  const cursorOpacity = phase === "fade" ? 0 : cursorVisible ? 1 : 0;

  return (
    <div
      className="absolute z-30 select-none"
      style={{
        left: 48,
        top: 100,
        fontFamily: "var(--font-space-grotesk)",
        color: "#0B1D3A",
      }}
    >
      <div
        style={{
          fontSize: 36,
          fontWeight: 600,
          lineHeight: 1.2,
          minHeight: "1.2em",
        }}
      >
        {line1}
        {showCursorOnLine1 && (
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
        )}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 400,
          lineHeight: 1.3,
          marginTop: 4,
          minHeight: "1.3em",
        }}
      >
        {line2}
        {showCursorOnLine2 && (
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
        )}
      </div>
    </div>
  );
}
