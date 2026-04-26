"use client";

import { motion, type Variants } from "framer-motion";
import { useState } from "react";
import {
  makeDraftId,
  type DraftQuestionResponse,
} from "@/lib/draft-state";
import type { PlannerQuestion } from "@/lib/planner-questions";

const NAVY = "#0B1D3A";
const TEAL = "#1ABFAD";
const CORAL = "#F47560";
const SLATE = "#8899AA";
const SOFT_BORDER = "#E0DCD4";
const CREAM = "#FAF5EB";

// Display-only response shape so the parent can pass either a
// DatabaseQuestionResponse or a DraftQuestionResponse with one
// `isDraft` flag controlling presentation.
export type DisplayResponse = {
  id: string;
  text: string;
  createdAt: string;
  isDraft: boolean;
};

type Props = {
  question: PlannerQuestion;
  questionIndex: number;
  responses: DisplayResponse[];
  /** Called with a fresh draft so the parent can append + persist. */
  onSubmitDraft: (draft: DraftQuestionResponse) => void;
  onClose: () => void;
};

// Stagger the inner content so the textarea, button, and responses
// flow in one after another rather than all at once. delayChildren
// holds the stagger off until the card has finished its scale-in.
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.12 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function QuestionCardExpanded({
  question,
  questionIndex,
  responses,
  onSubmitDraft,
  onClose,
}: Props) {
  const [draft, setDraft] = useState("");
  const [justAdded, setJustAdded] = useState(false);

  const handleSubmit = () => {
    const text = draft.trim();
    if (!text) return;
    onSubmitDraft({
      tempId: makeDraftId(),
      questionIndex,
      response: text,
      createdAt: new Date().toISOString(),
    });
    setDraft("");
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2200);
  };

  return (
    <motion.div
      layout
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        background: "#FFFFFF",
        borderRadius: 14,
        padding: "14px 16px 16px",
        boxShadow: "0 14px 36px rgba(11, 29, 58, 0.16)",
        border: `1px solid ${TEAL}`,
        fontFamily: "var(--font-space-grotesk)",
        color: NAVY,
      }}
    >
      {/* Header row: badge + close */}
      <motion.div
        variants={itemVariants}
        className="flex items-start justify-between"
        style={{ gap: 10 }}
      >
        <div
          className="flex items-center gap-1.5 rounded-full"
          style={{
            background: "rgba(26, 191, 173, 0.12)",
            color: TEAL,
            padding: "3px 8px",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="11" />
            <text
              x="12"
              y="17"
              textAnchor="middle"
              fontSize="14"
              fontWeight="700"
              fill="#FFFFFF"
              fontFamily="system-ui"
            >
              ?
            </text>
          </svg>
          Planner question
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="cursor-pointer"
          style={{
            background: "transparent",
            border: "none",
            color: SLATE,
            padding: 2,
            margin: -2,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </motion.div>

      {/* Question + source */}
      <motion.div variants={itemVariants}>
        <div
          style={{
            marginTop: 10,
            fontSize: 13.5,
            fontWeight: 500,
            lineHeight: 1.45,
            color: NAVY,
          }}
        >
          {question.question}
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 10.5,
            fontWeight: 600,
            color: TEAL,
            letterSpacing: "0.02em",
          }}
        >
          {question.source}
        </div>
      </motion.div>

      {/* Composer */}
      <motion.textarea
        variants={itemVariants}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        placeholder="Share your perspective..."
        style={{
          width: "100%",
          marginTop: 12,
          background: CREAM,
          border: `1px solid ${SOFT_BORDER}`,
          borderRadius: 10,
          padding: 10,
          fontFamily: "inherit",
          fontSize: 12.5,
          color: NAVY,
          resize: "vertical",
          outline: "none",
          minHeight: 70,
        }}
      />
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
        style={{ marginTop: 8, gap: 8 }}
      >
        {justAdded ? (
          <span style={{ color: CORAL, fontSize: 11, fontWeight: 600 }}>
            Added to your drafts
          </span>
        ) : (
          <span style={{ color: SLATE, fontSize: 10.5 }}>
            Stays a draft until you submit
          </span>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!draft.trim()}
          className="cursor-pointer"
          style={{
            background: draft.trim() ? TEAL : "#D8E5E3",
            color: draft.trim() ? "#FFFFFF" : SLATE,
            border: "none",
            borderRadius: 9999,
            padding: "7px 16px",
            fontFamily: "inherit",
            fontSize: 11.5,
            fontWeight: 600,
            cursor: draft.trim() ? "pointer" : "not-allowed",
            transition: "background 0.2s ease, color 0.2s ease",
            flexShrink: 0,
          }}
        >
          Add response
        </button>
      </motion.div>

      {/* Existing + draft responses */}
      {responses.length > 0 && (
        <motion.div
          variants={itemVariants}
          style={{ marginTop: 14, display: "grid", gap: 6 }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: SLATE,
            }}
          >
            Your responses ({responses.length})
          </div>
          {responses.map((r) => (
            <div
              key={r.id}
              style={{
                background: CREAM,
                border: r.isDraft
                  ? `1px dashed ${CORAL}`
                  : `1px solid ${SOFT_BORDER}`,
                borderRadius: 10,
                padding: "8px 10px",
                fontSize: 12,
                lineHeight: 1.4,
                color: NAVY,
              }}
            >
              <div
                style={{
                  wordBreak: "break-word",
                  fontStyle: r.isDraft ? "italic" : "normal",
                }}
              >
                {r.isDraft && (
                  <span
                    style={{
                      color: CORAL,
                      fontWeight: 600,
                      marginRight: 4,
                      fontStyle: "normal",
                    }}
                  >
                    (Draft)
                  </span>
                )}
                {r.text}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: SLATE,
                  marginTop: 4,
                }}
              >
                {formatTimestamp(r.createdAt)}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
