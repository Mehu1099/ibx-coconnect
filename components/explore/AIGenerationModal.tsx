"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  type GenerationProgress,
  useAIGeneration,
} from "@/lib/use-ai-generation";

const NAVY = "#0B1D3A";
const CORAL = "#F47560";
const CREAM = "#F5F2EB";
const SLATE = "#6B7A8C";
const SOFT_BORDER = "#D8D2C5";
const FAINT_BORDER = "#E0DCD4";

const MAX_PROMPT_LEN = 500;
const MIN_PROMPT_LEN = 10;

// Edit-instruction style prompts. FLUX.2 Pro is built to preserve the
// source photo and only change what the prompt asks for, so chips read
// as imperative single-action edits rather than vague themes.
const SUGGESTION_CHIPS = [
  "Add green street trees along the sidewalks",
  "Add a protected bike lane along the right curb",
  "Replace street parking with outdoor seating",
  "Add wider pedestrian crosswalks with planters",
  "Add modern street lighting and benches",
  "Convert one lane into a dedicated bus lane",
];

// Cycled through during the generating stage. Nano Banana 2 is
// Flash-tier — typically 8–15s, with the occasional cold start
// pushing closer to 20s. Four messages × 4.5s covers the warm path
// and gracefully repeats once if it runs longer.
const LOADING_MESSAGES = [
  "Reading the location photo...",
  "Reasoning about your vision...",
  "Reimagining this corner of Flatbush...",
  "Adding the finishing touches...",
];
const LOADING_MESSAGE_INTERVAL_MS = 4500;

type Stage = "input" | "generating" | "result";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  basePhotoUrl: string;
  onSave: (proposal: {
    prompt: string;
    imageUrl: string;
    storagePath: string;
    predictionId: string;
  }) => void;
};

export default function AIGenerationModal({
  isOpen,
  onClose,
  locationId,
  basePhotoUrl,
  onSave,
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <ModalShell key="ai-modal" onClose={onClose}>
          <ModalBody
            locationId={locationId}
            basePhotoUrl={basePhotoUrl}
            onSave={onSave}
            onClose={onClose}
          />
        </ModalShell>
      )}
    </AnimatePresence>
  );
}

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  // Lock body scroll while open. Mirrors SubmissionModal.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <>
      <motion.div
        className="fixed inset-0"
        style={{
          zIndex: 130,
          background: "rgba(11, 29, 58, 0.5)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={onClose}
      />
      <motion.div
        className="fixed flex items-center justify-center"
        style={{ inset: 0, zIndex: 135, padding: 16, pointerEvents: "none" }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          style={{
            pointerEvents: "auto",
            width: "min(580px, 100%)",
            background: CREAM,
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.20)",
            fontFamily: "var(--font-space-grotesk)",
            color: NAVY,
            position: "relative",
            maxHeight: "calc(100vh - 32px)",
            overflowY: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </motion.div>
    </>
  );
}

function ModalBody({
  locationId,
  basePhotoUrl,
  onSave,
  onClose,
}: {
  locationId: string;
  basePhotoUrl: string;
  onSave: Props["onSave"];
  onClose: () => void;
}) {
  const [stage, setStage] = useState<Stage>("input");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<{
    imageUrl: string;
    storagePath: string;
    predictionId: string;
    prompt: string;
  } | null>(null);
  const { generate, progress, error, clearError } = useAIGeneration();

  const trimmedLen = prompt.trim().length;
  const canGenerate =
    trimmedLen >= MIN_PROMPT_LEN && trimmedLen <= MAX_PROMPT_LEN;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    clearError();
    setStage("generating");
    const out = await generate(locationId, prompt.trim(), basePhotoUrl);
    if (out) {
      setResult({ ...out, prompt: prompt.trim() });
      setStage("result");
    } else {
      // generate() set the error; revert to input so the user can retry.
      setStage("input");
    }
  };

  // Chips REPLACE the textarea contents rather than appending — repeated
  // clicks would otherwise pile up into garbage prompts. The InputView
  // owns the textarea ref and focuses (with cursor at end) right after
  // so the user can immediately tweak the suggested wording.
  const handlePickSuggestion = (text: string) => {
    setPrompt(text.length > MAX_PROMPT_LEN ? text.slice(0, MAX_PROMPT_LEN) : text);
  };

  const handleRegenerate = () => {
    setResult(null);
    clearError();
    setStage("input");
  };

  const handleDiscard = () => {
    setResult(null);
    setPrompt("");
    clearError();
    onClose();
  };

  const handleKeep = () => {
    if (!result) return;
    onSave({
      prompt: result.prompt,
      imageUrl: result.imageUrl,
      storagePath: result.storagePath,
      predictionId: result.predictionId,
    });
    setResult(null);
    setPrompt("");
  };

  return (
    <>
      <CloseButton onClick={onClose} />

      <div className="flex items-center" style={{ gap: 8 }}>
        <SparkleDot />
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            color: CORAL,
          }}
        >
          AI Proposal
        </span>
      </div>

      <h2
        style={{
          marginTop: 8,
          fontSize: 22,
          fontWeight: 500,
          lineHeight: 1.2,
          color: NAVY,
        }}
      >
        Reimagine this place
      </h2>
      <p
        style={{
          marginTop: 6,
          fontSize: 13,
          lineHeight: 1.5,
          color: SLATE,
        }}
      >
        Describe a change you&apos;d like to see. The AI will edit this photo
        to show your vision.
      </p>

      <AnimatePresence mode="wait">
        {stage === "input" && (
          <InputView
            key="input"
            prompt={prompt}
            onPromptChange={setPrompt}
            onPickSuggestion={handlePickSuggestion}
            onGenerate={handleGenerate}
            canGenerate={canGenerate}
            error={error}
          />
        )}
        {stage === "generating" && (
          <GeneratingView key="generating" progress={progress} />
        )}
        {stage === "result" && result && (
          <ResultView
            key="result"
            imageUrl={result.imageUrl}
            prompt={result.prompt}
            onKeep={handleKeep}
            onRegenerate={handleRegenerate}
            onDiscard={handleDiscard}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────

function InputView({
  prompt,
  onPromptChange,
  onPickSuggestion,
  onGenerate,
  canGenerate,
  error,
}: {
  prompt: string;
  onPromptChange: (v: string) => void;
  onPickSuggestion: (v: string) => void;
  onGenerate: () => void;
  canGenerate: boolean;
  error: string | null;
}) {
  const length = prompt.length;
  const overLimit = length > MAX_PROMPT_LEN;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // Drives a brief coral border + scale pulse on the textarea after a
  // chip is clicked, so the user can see where the inserted text went
  // before they start typing.
  const [pulseKey, setPulseKey] = useState(0);

  const handleChipClick = (text: string) => {
    onPickSuggestion(text);
    setPulseKey((k) => k + 1);
    // Defer focus to next tick so the parent state has flushed and the
    // selection lands at the (now-updated) end of the value.
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <motion.textarea
        ref={textareaRef}
        key={`textarea-${pulseKey}`}
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="Describe a change you'd like to see. For example: Add green street trees lining the sidewalks. Replace the parking with a wide pedestrian plaza. Add a protected bike lane along the right side of the street."
        rows={3}
        maxLength={MAX_PROMPT_LEN + 50}
        initial={pulseKey === 0 ? false : { scale: 1 }}
        animate={pulseKey === 0 ? undefined : { scale: [1, 1.01, 1] }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{
          marginTop: 18,
          width: "100%",
          background: "#FFFFFF",
          border: `1px solid ${SOFT_BORDER}`,
          borderRadius: 12,
          padding: "12px 14px",
          fontFamily: "inherit",
          fontSize: 14,
          lineHeight: 1.5,
          color: NAVY,
          resize: "vertical",
          minHeight: 84,
          outline: "none",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = CORAL;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = SOFT_BORDER;
        }}
      />

      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          color: overLimit ? CORAL : SLATE,
          textAlign: "right",
        }}
      >
        {length} / {MAX_PROMPT_LEN}
      </div>

      <div
        style={{
          marginTop: 10,
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        {SUGGESTION_CHIPS.map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => handleChipClick(s)}
            className="cursor-pointer rounded-full"
            style={{
              background: "#FFFFFF",
              border: `1px solid ${FAINT_BORDER}`,
              color: NAVY,
              fontFamily: "inherit",
              fontSize: 11,
              fontWeight: 500,
              padding: "6px 11px",
              transition: "border-color 0.15s ease, background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(244, 117, 96, 0.5)";
              e.currentTarget.style.background = "#FAF5EB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = FAINT_BORDER;
              e.currentTarget.style.background = "#FFFFFF";
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 14,
            padding: "10px 12px",
            background: "rgba(244, 117, 96, 0.12)",
            color: CORAL,
            border: `1px solid rgba(244, 117, 96, 0.35)`,
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.4,
          }}
        >
          {error}
        </div>
      )}

      <motion.button
        type="button"
        onClick={onGenerate}
        disabled={!canGenerate}
        className="cursor-pointer"
        style={{
          marginTop: 16,
          width: "100%",
          background: canGenerate ? CORAL : "#D8C7BD",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 12,
          padding: "12px 16px",
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 600,
          cursor: canGenerate ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: canGenerate
            ? "0 8px 22px rgba(244, 117, 96, 0.32)"
            : "none",
          transition: "background 0.18s ease, box-shadow 0.18s ease",
        }}
        whileHover={
          canGenerate
            ? {
                scale: 1.01,
                boxShadow: "0 12px 28px rgba(244, 117, 96, 0.40)",
                transition: { duration: 0.18 },
              }
            : undefined
        }
      >
        <SparkleIcon size={14} />
        Generate proposal
      </motion.button>
    </motion.div>
  );
}

// ── Generating ─────────────────────────────────────────────────────────────

function GeneratingView({ progress }: { progress: GenerationProgress }) {
  // Cycle through LOADING_MESSAGES every ~4.5s during the long
  // "processing" phase. Keep the dedicated copy for the short
  // bookends so the bar's intent stays legible.
  const [messageIndex, setMessageIndex] = useState(0);
  useEffect(() => {
    if (progress !== "processing") return;
    const t = window.setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, LOADING_MESSAGE_INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [progress]);

  const message =
    progress === "starting"
      ? "Starting up the AI..."
      : progress === "finalizing"
        ? "Adding the finishing touches..."
        : LOADING_MESSAGES[messageIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{
        marginTop: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        padding: "24px 0",
      }}
    >
      <motion.div
        style={{
          color: CORAL,
          willChange: "transform",
        }}
        animate={{
          rotate: 360,
          scale: [1, 1.12, 1],
        }}
        transition={{
          rotate: {
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          },
          scale: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      >
        <SparkleIcon size={56} />
      </motion.div>

      <motion.div
        key={message}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: NAVY,
          textAlign: "center",
          minHeight: 22,
        }}
      >
        {message}
      </motion.div>

      <ShimmerBar />

      <div
        style={{
          fontSize: 11,
          color: SLATE,
          textAlign: "center",
        }}
      >
        This usually takes 10–20 seconds.
      </div>
    </motion.div>
  );
}

function ShimmerBar() {
  return (
    <div
      style={{
        width: "60%",
        height: 4,
        background: FAINT_BORDER,
        borderRadius: 9999,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, transparent 0%, ${CORAL} 50%, transparent 100%)`,
          willChange: "transform",
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// ── Result ─────────────────────────────────────────────────────────────────

function ResultView({
  imageUrl,
  prompt,
  onKeep,
  onRegenerate,
  onDiscard,
}: {
  imageUrl: string;
  prompt: string;
  onKeep: () => void;
  onRegenerate: () => void;
  onDiscard: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div
        style={{
          marginTop: 18,
          width: "100%",
          background: "#000",
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${SOFT_BORDER}`,
          aspectRatio: "16 / 9",
          position: "relative",
        }}
      >
        {/* Plain <img> rather than next/image — the source is a runtime
            Supabase Storage URL, not part of the build pipeline. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={prompt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>

      <div
        style={{
          marginTop: 12,
          padding: "10px 12px",
          background: "#FFFFFF",
          border: `1px solid ${FAINT_BORDER}`,
          borderRadius: 10,
          fontStyle: "italic",
          fontSize: 12,
          lineHeight: 1.5,
          color: NAVY,
        }}
      >
        “{prompt}”
      </div>

      <motion.button
        type="button"
        onClick={onKeep}
        className="cursor-pointer"
        style={{
          marginTop: 16,
          width: "100%",
          background: CORAL,
          color: "#FFFFFF",
          border: "none",
          borderRadius: 12,
          padding: "12px 16px",
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 600,
          boxShadow: "0 8px 22px rgba(244, 117, 96, 0.32)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
        whileHover={{
          scale: 1.01,
          boxShadow: "0 12px 28px rgba(244, 117, 96, 0.40)",
          transition: { duration: 0.18 },
        }}
      >
        Add to contributions
      </motion.button>

      <div
        style={{
          marginTop: 8,
          display: "flex",
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={onRegenerate}
          className="cursor-pointer"
          style={{
            flex: 1,
            background: "transparent",
            color: NAVY,
            border: "none",
            padding: "10px 12px",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: 500,
            borderRadius: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#EDE5D5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          Try a different prompt
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="cursor-pointer"
          style={{
            flex: 1,
            background: "transparent",
            color: CORAL,
            border: "none",
            padding: "10px 12px",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: 500,
            borderRadius: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(244, 117, 96, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          Discard
        </button>
      </div>
    </motion.div>
  );
}

// ── Bits ───────────────────────────────────────────────────────────────────

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="cursor-pointer absolute"
      style={{
        top: 16,
        right: 16,
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "transparent",
        border: `1px solid ${SOFT_BORDER}`,
        color: NAVY,
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#EDE5D5";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

function SparkleDot() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <motion.circle
        cx="7"
        cy="7"
        r="6"
        fill={CORAL}
        opacity={0.3}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <circle cx="7" cy="7" r="3" fill={CORAL} />
    </svg>
  );
}

function SparkleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
      <path
        d="M19 14l.9 2.6L22.5 17.5l-2.6.9L19 21l-.9-2.6L15.5 17.5l2.6-.9L19 14z"
        opacity="0.7"
      />
    </svg>
  );
}

