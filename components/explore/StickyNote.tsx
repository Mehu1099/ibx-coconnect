"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo, useEffect, useRef, useState } from "react";
import {
  getPopoverArrowStyle,
  getPopoverContainerStyle,
  pickPopoverPlacement,
} from "@/lib/popover-position";
import { Z_INDEX } from "@/lib/z-index";

const CORAL = "#F47560";
const TEAL = "#1ABFAD";
const NAVY = "#0B1D3A";
const SLATE = "#8899AA";
const SOFT_BORDER = "#E0DCD4";

// Slim shape so both DatabaseAnnotation rows and locally-held draft
// annotations satisfy this component. The parent passes either kind
// after a small adapter for drafts.
export type StickyDisplay = {
  id: string;
  x_position: number;
  y_position: number;
  content: string | null;
};

// ─── Existing dot (rendered for each saved note) ────────────────────────────

type DotProps = {
  annotation: StickyDisplay;
  index: number;
  selected: boolean;
  /** Drafts get a dashed outer border + slight transparency so users
   *  can tell at a glance which notes haven't been submitted yet. */
  isDraft?: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (content: string) => void;
};

// Marker geometry. Outer white ring 30px, inner coral 24px, centered
// white dot 8px (submitted only — drafts use a dashed inner border to
// signal "not yet saved" without an extra glyph).
const MARKER_OUTER = 30;
const MARKER_INNER = 24;
const MARKER_DOT = 8;
const SHADOW =
  "0 0 0 1px rgba(255,255,255,0.5), 0 3px 12px rgba(11, 29, 58, 0.3)";
const SHADOW_HOVER =
  "0 0 0 1px rgba(255,255,255,0.6), 0 6px 20px rgba(11, 29, 58, 0.4)";

function StickyNoteDotInner({
  annotation,
  index,
  selected,
  isDraft = false,
  onSelect,
  onDelete,
  onUpdate,
}: DotProps) {
  const [hovered, setHovered] = useState(false);
  // Selected → full edit/delete card. Hover → small read-only preview
  // (only when not selected, so the two never stack).
  const showHoverPreview = hovered && !selected && !!annotation.content;

  // Flip the popover/edit card to the LEFT when the marker is in the
  // right ~30% of the photo so it doesn't overlap the planner rail,
  // and BELOW when near the top edge so it doesn't overflow up.
  const placement = pickPopoverPlacement(
    annotation.x_position,
    annotation.y_position,
  );

  return (
    <div
      className="absolute"
      style={{
        left: `${annotation.x_position}%`,
        top: `${annotation.y_position}%`,
        transform: "translate(-50%, -50%)",
        zIndex: selected
          ? Z_INDEX.markers.sticky_note_selected
          : Z_INDEX.markers.sticky_note,
      }}
    >
      {/* Shimmer ring — CSS-driven keyframes (compositor thread).
          --shimmer-delay staggers per index so multiple markers feel
          alive without beating in sync. */}
      <div
        aria-hidden
        className="sticky-shimmer absolute pointer-events-none rounded-full"
        style={{
          left: "50%",
          top: "50%",
          width: MARKER_OUTER,
          height: MARKER_OUTER,
          marginLeft: -MARKER_OUTER / 2,
          marginTop: -MARKER_OUTER / 2,
          border: `2px solid ${CORAL}`,
          ["--shimmer-delay" as string]: `${(index % 8) * 0.5}s`,
        }}
      />

      <motion.button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={isDraft ? "Sticky note (draft)" : "Sticky note"}
        className="block cursor-pointer relative flex items-center justify-center"
        style={{
          width: MARKER_OUTER,
          height: MARKER_OUTER,
          borderRadius: "50%",
          background: "#FFFFFF",
          border: "none",
          boxShadow: hovered ? SHADOW_HOVER : SHADOW,
          padding: 0,
          transition: "box-shadow 0.2s ease-out",
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
        {/* Inner coral disc. Drafts use 75% opacity + dashed white
            border so they read as "pending" at a glance. */}
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
          {/* Centered white dot — submitted notes only. Drafts skip
              this so the dashed border is the dominant feature. */}
          {!isDraft && (
            <span
              aria-hidden
              className="rounded-full"
              style={{
                width: MARKER_DOT,
                height: MARKER_DOT,
                background: "#FFFFFF",
              }}
            />
          )}
        </span>
      </motion.button>

      {/* Read-only hover preview — small content card with an arrow
          pointing back at the marker. Only appears when NOT selected;
          the fuller NoteCard with edit/delete takes over on click.
          Position flips based on `placement` so right-edge markers
          don't overlap the planner rail. */}
      <AnimatePresence>
        {showHoverPreview && (
          <motion.div
            key="hover-preview"
            className="pointer-events-none"
            style={{
              ...getPopoverContainerStyle(placement, 12),
              background: "#FFFFFF",
              padding: "10px 14px",
              borderRadius: 10,
              maxWidth: 240,
              minWidth: 120,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              fontFamily: "var(--font-space-grotesk)",
              fontSize: 13,
              lineHeight: 1.5,
              color: NAVY,
              whiteSpace: "normal",
              wordBreak: "break-word",
              zIndex: Z_INDEX.active_interaction.popover,
            }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {annotation.content}
            <span aria-hidden style={getPopoverArrowStyle(placement)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected → full card with edit/delete. */}
      <AnimatePresence>
        {selected && (
          <NoteCard
            key="selected-card"
            content={annotation.content ?? ""}
            selected
            isDraft={isDraft}
            placement={placement}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Memoized so unrelated parent state changes (active tool, toast, etc.)
// don't re-render every dot and re-fire its mount-spring animation.
export const StickyNoteDot = memo(StickyNoteDotInner);

// Inner card: editing state lives here so it resets every time the card
// mounts (i.e. when selected/hovered toggles or the dot is re-selected).
function NoteCard({
  content,
  selected,
  isDraft,
  placement,
  onDelete,
  onUpdate,
}: {
  content: string;
  selected: boolean;
  isDraft: boolean;
  placement: ReturnType<typeof pickPopoverPlacement>;
  onDelete: () => void;
  onUpdate: (content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  return (
    <motion.div
      style={{
        ...getPopoverContainerStyle(placement, 12),
        background: "#FFFFFF",
        borderRadius: 10,
        padding: 12,
        width: 240,
        maxWidth: "calc(100vw - 32px)",
        boxShadow: "0 12px 32px rgba(11, 29, 58, 0.18)",
        border: isDraft ? `1px dashed ${CORAL}` : `1px solid ${SOFT_BORDER}`,
        fontFamily: "var(--font-space-grotesk)",
        color: NAVY,
        zIndex: Z_INDEX.active_interaction.popover,
      }}
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={(e) => e.stopPropagation()}
    >
      {editing ? (
        <>
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
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
              justifyContent: "flex-end",
              gap: 6,
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDraft(content);
              }}
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
              onClick={() => {
                const v = draft.trim();
                if (!v) return;
                onUpdate(v);
                setEditing(false);
              }}
              style={{
                background: TEAL,
                color: "#FFFFFF",
                border: "none",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 12px",
                cursor: "pointer",
                borderRadius: 6,
              }}
            >
              Save
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.45,
              fontWeight: 500,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {content}
          </div>
          {selected && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 6,
                marginTop: 10,
                paddingTop: 8,
                borderTop: `1px solid ${SOFT_BORDER}`,
              }}
            >
              <button
                type="button"
                onClick={onDelete}
                style={{
                  background: "transparent",
                  border: "none",
                  color: CORAL,
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 8px",
                  cursor: "pointer",
                  borderRadius: 6,
                }}
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                style={{
                  background: NAVY,
                  color: "#FFFFFF",
                  border: "none",
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 12px",
                  cursor: "pointer",
                  borderRadius: 6,
                }}
              >
                Edit
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

// ─── New-note input popover (shown at the click point) ──────────────────────

type ComposerProps = {
  x: number;
  y: number;
  onSave: (content: string) => void;
  onCancel: () => void;
};

export function StickyNoteComposer({ x, y, onSave, onCancel }: ComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const submit = () => {
    const v = value.trim();
    if (!v) {
      onCancel();
      return;
    }
    onSave(v);
  };

  // Right-edge clicks open the dialog to the LEFT of the marker (so it
  // doesn't overlap the planner question rail). Top-edge clicks open
  // it BELOW (so it doesn't overflow off-screen).
  const placement = pickPopoverPlacement(x, y);

  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: Z_INDEX.active_interaction.composer,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Pin marker for the in-progress note. Same layered geometry
          as StickyNoteDot so the visual transitions seamlessly from
          composer → saved-draft. */}
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
          className="rounded-full"
          style={{
            width: MARKER_INNER,
            height: MARKER_INNER,
            background: "rgba(244, 117, 96, 0.75)",
            border: "2px dashed #FFFFFF",
            boxSizing: "border-box",
          }}
        />
      </div>

      <motion.div
        style={{
          ...getPopoverContainerStyle(placement, 14),
          background: "#FFFFFF",
          borderRadius: 10,
          padding: 12,
          width: 220,
          maxWidth: "calc(100vw - 32px)",
          boxShadow: "0 12px 32px rgba(11, 29, 58, 0.20)",
          border: `1px solid ${SOFT_BORDER}`,
          fontFamily: "var(--font-space-grotesk)",
        }}
        initial={{ opacity: 0, y: 6, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
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
          placeholder="Add your note..."
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
            justifyContent: "flex-end",
            gap: 6,
            marginTop: 8,
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
            style={{
              background: TEAL,
              color: "#FFFFFF",
              border: "none",
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 12px",
              cursor: "pointer",
              borderRadius: 6,
            }}
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}
