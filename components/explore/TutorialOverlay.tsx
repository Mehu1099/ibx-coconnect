"use client";

import { AnimatePresence, motion } from "framer-motion";

const NAVY = "#0B1D3A";
const TEAL = "#1ABFAD";

export type TutorialStep = 1 | 2 | 3 | 4;

type CardPosition = "center" | "upper";

type StepConfig = {
  title: string;
  description: string;
  primaryLabel: string;
  cardPosition: CardPosition;
};

const STEP_CONFIGS: Record<TutorialStep, StepConfig> = {
  1: {
    title: "Welcome to street-level engagement",
    description:
      "This is a real photo from this location. Use the tools below to share your thoughts and shape the future of this spot.",
    primaryLabel: "Show me how",
    cardPosition: "center",
  },
  2: {
    title: "Your engagement toolbar",
    description:
      "Use these tools to share thoughts, sketch ideas, raise concerns, or generate AI proposals. Click any tool to activate it, then interact with the photo.",
    primaryLabel: "Got it",
    cardPosition: "upper",
  },
  3: {
    title: "Share your perspective",
    description:
      "Urban planners have asked questions about this location. Look for the highlighted cards on the right and click any to share your thoughts.",
    primaryLabel: "Got it",
    cardPosition: "center",
  },
  4: {
    title: "You're ready",
    description:
      "Try the other tools when you're ready — sketch, raise concerns, or generate AI proposals. Your contributions help shape this neighborhood.",
    primaryLabel: "Start exploring",
    cardPosition: "center",
  },
};

type Props = {
  step: TutorialStep | null;
  onAdvance: () => void;
  onSkip: () => void;
};

// Tutorial z-index hierarchy:
//   90  → backdrop (blurs/darkens the page; pointerEvents: none)
//   110 → highlighted UI element (toolbar / question cards) — wired
//         via a `tutorialHighlight` prop on those components
//   120 → tutorial card itself
//
// Highlighted elements stay crisp above the blurred backdrop because
// they're at a higher z-index, and the backdrop doesn't block clicks.

const CARD_ANCHOR: Record<CardPosition, React.CSSProperties> = {
  center: {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  upper: {
    top: "22%",
    left: "50%",
    transform: "translateX(-50%)",
  },
};

export default function TutorialOverlay({ step, onAdvance, onSkip }: Props) {
  const cfg = step !== null ? STEP_CONFIGS[step] : null;
  const visible = cfg !== null;

  return (
    <>
      <TutorialBackdrop visible={visible} />

      <AnimatePresence mode="wait">
        {cfg && step !== null && (
          <TutorialCard
            key={`step-${step}`}
            step={step}
            cfg={cfg}
            onAdvance={onAdvance}
            onSkip={onSkip}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Single backdrop reused across all four steps. pointerEvents: none so
// users can still poke at highlighted UI (e.g. preview a tool during
// step 2) while the tutorial is open. Tutorial dismissal still requires
// clicking "Got it" / "Skip tour".
function TutorialBackdrop({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="tutorial-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11, 29, 58, 0.5)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 90,
            pointerEvents: "none",
          }}
        />
      )}
    </AnimatePresence>
  );
}

function TutorialCard({
  step,
  cfg,
  onAdvance,
  onSkip,
}: {
  step: TutorialStep;
  cfg: StepConfig;
  onAdvance: () => void;
  onSkip: () => void;
}) {
  return (
    <motion.div
      className="fixed"
      style={{
        ...CARD_ANCHOR[cfg.cardPosition],
        zIndex: 120,
        width: "min(320px, calc(100vw - 32px))",
        background: NAVY,
        border: "1px solid rgba(26, 191, 173, 0.3)",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 24px 48px rgba(0,0,0,0.45)",
        fontFamily: "var(--font-space-grotesk)",
        color: "#FFFFFF",
        pointerEvents: "auto",
      }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="rounded-full inline-flex items-center"
        style={{
          background: "rgba(26, 191, 173, 0.16)",
          color: TEAL,
          padding: "4px 10px",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
        }}
      >
        STEP {step} OF 4 · TUTORIAL
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1.3,
        }}
      >
        {cfg.title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 13,
          lineHeight: 1.5,
          color: "rgba(255, 255, 255, 0.7)",
          fontWeight: 400,
        }}
      >
        {cfg.description}
      </div>

      <div
        className="flex items-center justify-between"
        style={{ marginTop: 18 }}
      >
        <button
          type="button"
          onClick={onSkip}
          className="cursor-pointer"
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255, 255, 255, 0.55)",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: 500,
            padding: "8px 4px",
          }}
        >
          Skip tour
        </button>
        <button
          type="button"
          onClick={onAdvance}
          className="cursor-pointer"
          style={{
            background: TEAL,
            color: NAVY,
            border: "none",
            borderRadius: 8,
            padding: "9px 18px",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 4px 14px rgba(26, 191, 173, 0.35)",
          }}
        >
          {cfg.primaryLabel}
        </button>
      </div>
    </motion.div>
  );
}
