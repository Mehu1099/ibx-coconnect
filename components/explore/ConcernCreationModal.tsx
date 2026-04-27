"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  CONCERN_CATEGORIES,
  type ConcernCategory,
} from "@/lib/concern-categories";

const CORAL = "#F47560";
const NAVY = "#0B1D3A";
const SLATE = "#8899AA";
const CREAM = "#F5F2EB";
const SOFT_BORDER = "#E0DCD4";

const MAX_DESCRIPTION = 280;

const MARKER_OUTER = 32;
const MARKER_INNER = 26;

type Props = {
  /** Photo-relative percentages — used to position the popover anchor
   *  marker. The page passes the same x/y it would use for a saved row. */
  x: number;
  y: number;
  onSave: (description: string, category: ConcernCategory) => void;
  onCancel: () => void;
};

export default function ConcernCreationModal({
  x,
  y,
  onSave,
  onCancel,
}: Props) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ConcernCategory>("safety");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const trimmed = description.trim();
  const canSave = trimmed.length > 0 && trimmed.length <= MAX_DESCRIPTION;

  const submit = () => {
    if (!canSave) return;
    onSave(trimmed, category);
  };

  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 45,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Anchor marker — same geometry as ConcernMarker draft state so
          there's no visual jump between composer → saved draft. */}
      <div
        aria-hidden
        className="flex items-center justify-center rounded-full"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: MARKER_OUTER,
          height: MARKER_OUTER,
          background: "#FFFFFF",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.5), 0 3px 12px rgba(11, 29, 58, 0.3)",
        }}
      >
        <span
          aria-hidden
          className="flex items-center justify-center rounded-full"
          style={{
            width: MARKER_INNER,
            height: MARKER_INNER,
            background: "rgba(244, 117, 96, 0.75)",
            border: "2px dashed #FFFFFF",
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
      </div>

      <motion.div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "calc(100% + 14px)",
          transform: "translateX(-50%)",
          background: CREAM,
          borderRadius: 12,
          padding: 14,
          width: 280,
          maxWidth: "calc(100vw - 32px)",
          boxShadow: "0 14px 36px rgba(11, 29, 58, 0.22)",
          border: `1px solid ${SOFT_BORDER}`,
          fontFamily: "var(--font-space-grotesk)",
          color: NAVY,
        }}
        initial={{ opacity: 0, y: 6, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 10,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: CORAL,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              color: CORAL,
            }}
          >
            Raise a concern
          </span>
        </div>

        <label
          htmlFor="concern-category"
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 500,
            color: SLATE,
            marginBottom: 4,
            textTransform: "uppercase",
            letterSpacing: "0.4px",
          }}
        >
          Category
        </label>
        <select
          id="concern-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ConcernCategory)}
          style={{
            width: "100%",
            border: `1px solid ${SOFT_BORDER}`,
            borderRadius: 6,
            padding: "8px 10px",
            fontFamily: "inherit",
            fontSize: 13,
            color: NAVY,
            background: "#FFFFFF",
            outline: "none",
            marginBottom: 10,
          }}
        >
          {CONCERN_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>

        <label
          htmlFor="concern-description"
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 500,
            color: SLATE,
            marginBottom: 4,
            textTransform: "uppercase",
            letterSpacing: "0.4px",
          }}
        >
          What&apos;s wrong here?
        </label>
        <textarea
          id="concern-description"
          ref={textareaRef}
          value={description}
          onChange={(e) =>
            setDescription(e.target.value.slice(0, MAX_DESCRIPTION))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
          rows={3}
          placeholder="Briefly describe what others should know."
          style={{
            width: "100%",
            border: `1px solid ${SOFT_BORDER}`,
            borderRadius: 6,
            padding: 8,
            fontFamily: "inherit",
            fontSize: 13,
            color: NAVY,
            resize: "none",
            outline: "none",
            background: "#FFFFFF",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 4,
            fontSize: 10,
            color: SLATE,
          }}
        >
          <span style={{ fontStyle: "italic" }}>Visible to everyone</span>
          <span>
            {trimmed.length}/{MAX_DESCRIPTION}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 6,
            marginTop: 10,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "none",
              color: SLATE,
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 500,
              padding: "6px 10px",
              cursor: "pointer",
              borderRadius: 6,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSave}
            style={{
              background: canSave ? CORAL : "#D8C7BD",
              color: "#FFFFFF",
              border: "none",
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 14px",
              cursor: canSave ? "pointer" : "not-allowed",
              borderRadius: 6,
              opacity: canSave ? 1 : 0.7,
            }}
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}
