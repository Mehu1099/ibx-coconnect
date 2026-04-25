"use client";

import { AnimatePresence, motion, type Transition } from "framer-motion";
import { useEffect, useState } from "react";
import {
  loadResponses,
  type QuestionResponse,
} from "@/lib/annotations-storage";
import type { PlannerQuestion } from "@/lib/planner-questions";
import QuestionCardExpanded from "./QuestionCardExpanded";

const NAVY = "#0B1D3A";
const TEAL = "#1ABFAD";
const SLATE = "#8899AA";

// Smooth, slightly-spring-like cubic-bezier for expansion. No bounce —
// just a confident swing-to-rest.
const EXPAND_TRANSITION: Transition = {
  duration: 0.4,
  ease: [0.32, 0.72, 0, 1],
};

type Props = {
  locationId: string;
  questions: PlannerQuestion[];
  /** Tutorial step 3 — surrounds every compact card with a coral pulse. */
  tutorialHighlight?: boolean;
};

export default function FloatingQuestionCards({
  locationId,
  questions,
  tutorialHighlight = false,
}: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setResponses(loadResponses(locationId));
  }, [locationId]);

  const responsesFor = (i: number) =>
    responses.filter((r) => r.questionIndex === i);

  // During the tutorial spotlight (step 3) lift z-index above the
  // backdrop (z 90) so the cards read crisp through the blur.
  const stackZ = tutorialHighlight ? 110 : 35;

  const stackStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        bottom: 96,
        left: 16,
        right: 16,
        zIndex: stackZ,
        display: "flex",
        gap: 10,
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        paddingBottom: 4,
      }
    : {
        position: "fixed",
        top: "25%",
        right: 24,
        zIndex: stackZ,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        width: 256,
        maxWidth: "calc(100vw - 48px)",
      };

  return (
    // `layout` on the container animates sibling reflow when one card
    // grows. Children are also `layout` so their position interpolates.
    <motion.div layout style={stackStyle} transition={EXPAND_TRANSITION}>
      {questions.map((q, i) => {
        const isExpanded = expandedIndex === i;
        const isDimmed = expandedIndex !== null && expandedIndex !== i;
        const respCount = responsesFor(i).length;

        return (
          <motion.div
            key={i}
            layout
            style={{
              flex: isMobile ? "0 0 240px" : "0 0 auto",
              scrollSnapAlign: isMobile ? "start" : undefined,
            }}
            animate={{
              opacity: isDimmed ? 0.5 : 1,
              filter: isDimmed ? "saturate(0.6)" : "saturate(1)",
            }}
            // Per-property timing: layout uses the smooth expand curve,
            // dim/saturate are shorter so off-focus cards fall back fast.
            transition={{
              layout: EXPAND_TRANSITION,
              opacity: { duration: 0.3, ease: "easeOut" },
              filter: { duration: 0.3, ease: "easeOut" },
            }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {isExpanded ? (
                <motion.div
                  key="expanded"
                  layout
                  initial={{ opacity: 0, scale: 0.97, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -4 }}
                  transition={EXPAND_TRANSITION}
                >
                  <QuestionCardExpanded
                    question={q}
                    questionIndex={i}
                    locationId={locationId}
                    responses={responsesFor(i)}
                    allResponses={responses}
                    onSubmit={(next) => setResponses(next)}
                    onClose={() => setExpandedIndex(null)}
                  />
                </motion.div>
              ) : (
                <FloatingCompactCard
                  key="compact"
                  question={q}
                  index={i}
                  isMobile={isMobile}
                  responseCount={respCount}
                  highlight={tutorialHighlight}
                  onClick={() => setExpandedIndex(i)}
                />
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// Wraps the compact card in a continuous gentle Y oscillation so the
// stack feels alive. Disabled on mobile (the bottom strip already
// scrolls horizontally — extra motion is distracting).
function FloatingCompactCard({
  question,
  index,
  isMobile,
  responseCount,
  highlight,
  onClick,
}: {
  question: PlannerQuestion;
  index: number;
  isMobile: boolean;
  responseCount: number;
  highlight: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      animate={isMobile ? { y: 0 } : { y: [-2, 2, -2] }}
      transition={
        isMobile
          ? { duration: 0.3 }
          : {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.5,
            }
      }
      style={{ willChange: "transform" }}
    >
      <CompactCard
        question={question}
        index={index}
        responseCount={responseCount}
        highlight={highlight}
        onClick={onClick}
      />
    </motion.div>
  );
}

function CompactCard({
  question,
  index,
  responseCount,
  highlight,
  onClick,
}: {
  question: PlannerQuestion;
  index: number;
  responseCount: number;
  highlight: boolean;
  onClick: () => void;
}) {
  // Tutorial step 3 — coral aura with a slight per-card phase offset
  // for elegance (each card lags the previous by 0.15s, creating a
  // gentle ripple instead of an in-sync flash).
  const idleShadow = "0 4px 20px rgba(0,0,0,0.08)";
  const highlightKeyframes = [
    "0 0 0 2px rgba(244, 117, 96, 0.7), 0 0 32px 12px rgba(244, 117, 96, 0.4)",
    "0 0 0 2px rgba(244, 117, 96, 0.7), 0 0 48px 20px rgba(244, 117, 96, 0)",
  ];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="cursor-pointer text-left"
      style={{
        width: "100%",
        background: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(26, 191, 173, 0.2)",
        borderRadius: 12,
        padding: "12px 14px",
        fontFamily: "var(--font-space-grotesk)",
        color: NAVY,
        display: "block",
        willChange: "transform, box-shadow",
      }}
      initial={{ opacity: 0, x: 12 }}
      animate={{
        opacity: 1,
        x: 0,
        boxShadow: highlight ? highlightKeyframes : idleShadow,
      }}
      transition={{
        opacity: { duration: 0.4, ease: "easeOut", delay: 0.4 + index * 0.06 },
        x: { duration: 0.4, ease: "easeOut", delay: 0.4 + index * 0.06 },
        boxShadow: highlight
          ? {
              duration: 1.8,
              repeat: Infinity,
              ease: "easeOut",
              delay: index * 0.15,
            }
          : { duration: 0.3, ease: "easeOut" },
      }}
      whileHover={{
        scale: 1.02,
        borderColor: TEAL,
        transition: { duration: 0.18 },
      }}
    >
      <div className="flex items-center gap-2">
        <div
          aria-hidden
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: TEAL,
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          ?
        </div>
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: SLATE,
          }}
        >
          Planner question
        </div>
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          fontWeight: 500,
          lineHeight: 1.4,
          color: NAVY,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {question.question}
      </div>

      <div
        className="flex items-center justify-between"
        style={{ marginTop: 10 }}
      >
        <span style={{ fontSize: 10.5, fontWeight: 500, color: SLATE }}>
          {responseCount === 0
            ? "No responses"
            : `${responseCount} response${responseCount === 1 ? "" : "s"}`}
        </span>
        <span style={{ color: TEAL, fontSize: 13, fontWeight: 600 }} aria-hidden>
          →
        </span>
      </div>
    </motion.button>
  );
}
