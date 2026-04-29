"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { DatabaseAIProposal } from "@/lib/database-types";
import type { DraftAIProposal } from "@/lib/draft-state";

const NAVY = "#0B1D3A";
const CORAL = "#F47560";
const CREAM = "#F5F2EB";
const SLATE = "#6B7A8C";
const FAINT_BORDER = "#E0DCD4";

type Item = {
  id: string;
  imageUrl: string;
  prompt: string;
  isDraft: boolean;
  createdAt: string;
};

type Props = {
  proposals: DatabaseAIProposal[];
  draftProposals: DraftAIProposal[];
  onDeleteDraft: (tempId: string) => void;
};

export default function AIProposalsPanel({
  proposals,
  draftProposals,
  onDeleteDraft,
}: Props) {
  const [expanded, setExpanded] = useState<Item | null>(null);

  const handleDeleteDraft = (tempId: string) => {
    onDeleteDraft(tempId);
    setExpanded((curr) => (curr && curr.id === tempId ? null : curr));
  };

  const items: Item[] = [
    ...draftProposals.map((d) => ({
      id: d.tempId,
      imageUrl: d.imageUrl,
      prompt: d.prompt,
      isDraft: true,
      createdAt: d.createdAt,
    })),
    ...proposals
      .filter((p) => !!p.generated_image_url)
      .map((p) => ({
        id: p.id,
        imageUrl: p.generated_image_url as string,
        prompt: p.prompt,
        isDraft: false,
        createdAt: p.created_at,
      })),
  ];

  if (items.length === 0) return null;

  return (
    <>
      <div
        className="fixed"
        style={{
          left: 24,
          top: "25%",
          width: 200,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          zIndex: 30,
          maxHeight: "60vh",
          overflowY: "auto",
          fontFamily: "var(--font-space-grotesk)",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            color: SLATE,
            paddingLeft: 4,
          }}
        >
          AI Proposals · {items.length}
        </div>

        {items.map((item, i) => (
          // motion.div (not button) so we can nest the delete <button>
          // for drafts without invalid HTML. Keyboard support via
          // role + tabIndex + onKeyDown.
          <motion.div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => setExpanded(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setExpanded(item);
              }
            }}
            className="cursor-pointer"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" }}
            style={{
              background: CREAM,
              border: item.isDraft
                ? `1px dashed ${CORAL}`
                : `1px solid ${FAINT_BORDER}`,
              borderRadius: 12,
              padding: 6,
              boxShadow: "0 4px 14px rgba(11, 29, 58, 0.10)",
              textAlign: "left",
              fontFamily: "inherit",
              color: NAVY,
              opacity: item.isDraft ? 0.96 : 1,
              position: "relative",
              outline: "none",
            }}
            whileHover={{
              scale: 1.03,
              boxShadow: "0 8px 22px rgba(11, 29, 58, 0.18)",
              transition: { duration: 0.18 },
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "16 / 9",
                borderRadius: 8,
                overflow: "hidden",
                background: "#000",
                position: "relative",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.prompt}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              {item.isDraft && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    left: 6,
                    background: CORAL,
                    color: "#FFFFFF",
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  Draft
                </span>
              )}
              {item.isDraft && (
                <button
                  type="button"
                  aria-label="Delete draft"
                  title="Delete draft"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDraft(item.id);
                  }}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "rgba(11, 29, 58, 0.7)",
                    border: "1.5px solid white",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: 0,
                    transition:
                      "background 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
                    zIndex: 2,
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => {
                    const t = e.currentTarget;
                    t.style.background = "#E63946";
                    t.style.borderColor = "#E63946";
                    t.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    const t = e.currentTarget;
                    t.style.background = "rgba(11, 29, 58, 0.7)";
                    t.style.borderColor = "white";
                    t.style.transform = "scale(1)";
                  }}
                >
                  ×
                </button>
              )}
            </div>
            <div
              style={{
                marginTop: 6,
                padding: "0 4px 2px",
                fontSize: 11,
                lineHeight: 1.4,
                color: NAVY,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.prompt}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {expanded && (
          <Lightbox
            item={expanded}
            onClose={() => setExpanded(null)}
            onDiscard={
              expanded.isDraft
                ? () => handleDeleteDraft(expanded.id)
                : undefined
            }
          />
        )}
      </AnimatePresence>
    </>
  );
}

function Lightbox({
  item,
  onClose,
  onDiscard,
}: {
  item: Item;
  onClose: () => void;
  // Only set for drafts. Submitted proposals are part of the public
  // record and shouldn't expose a discard affordance here.
  onDiscard?: () => void;
}) {
  return (
    <>
      <motion.div
        className="fixed inset-0"
        style={{
          zIndex: 140,
          background: "rgba(11, 29, 58, 0.7)",
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
        style={{ inset: 0, zIndex: 145, padding: 24, pointerEvents: "none" }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          style={{
            pointerEvents: "auto",
            width: "min(900px, 100%)",
            maxHeight: "calc(100vh - 48px)",
            background: CREAM,
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.30)",
            fontFamily: "var(--font-space-grotesk)",
            color: NAVY,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer absolute"
            style={{
              top: 14,
              right: 14,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#FFFFFF",
              border: `1px solid ${FAINT_BORDER}`,
              color: NAVY,
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
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

          <div
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              borderRadius: 12,
              overflow: "hidden",
              background: "#000",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.prompt}
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
              padding: "8px 4px 4px",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                  color: CORAL,
                  marginBottom: 4,
                }}
              >
                {item.isDraft ? "Draft proposal" : "Proposal"}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontStyle: "italic",
                  lineHeight: 1.5,
                  color: NAVY,
                }}
              >
                “{item.prompt}”
              </div>
            </div>
            {onDiscard && (
              <button
                type="button"
                onClick={onDiscard}
                className="cursor-pointer rounded-full"
                style={{
                  flexShrink: 0,
                  background: "transparent",
                  color: "#E63946",
                  border: "1px solid rgba(230, 57, 70, 0.4)",
                  padding: "8px 14px",
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 500,
                  alignSelf: "center",
                  transition:
                    "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  const t = e.currentTarget;
                  t.style.background = "#E63946";
                  t.style.borderColor = "#E63946";
                  t.style.color = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  const t = e.currentTarget;
                  t.style.background = "transparent";
                  t.style.borderColor = "rgba(230, 57, 70, 0.4)";
                  t.style.color = "#E63946";
                }}
              >
                Discard
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
