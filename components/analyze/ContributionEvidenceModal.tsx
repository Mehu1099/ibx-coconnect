"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { getExploreLocation } from "@/lib/explore-locations";
import type { Contribution } from "@/lib/use-engage-data";
import type { Theme } from "@/lib/use-themes";

const TYPE_LABELS: Record<string, string> = {
  sticky: "Note",
  concern: "Concern",
  question_response: "Response",
  ai_proposal: "Proposal",
};
const TYPE_COLORS: Record<string, string> = {
  sticky: "#F0A933",
  concern: "#F47560",
  question_response: "#7AB2E5",
  ai_proposal: "#1ABFAD",
};

// Header-strip short names — presentation-only, kept here so the
// canonical EXPLORE_LOCATIONS stays focused on map projection data.
const LOCATION_SHORT_NAMES: Record<string, string> = {
  "01": "Flatbush × Glenwood",
  "02": "Station Exit",
  "03": "The Junction",
  "04": "Hillel Place",
  "05": "Campus Rd Co-op",
  "06": "Brooklyn College",
  "07": "South of IBX",
  "08": "Avenue I",
};

export type EvidenceContribution = Contribution & { themes: Theme[] };

interface Props {
  contribution: EvidenceContribution | null;
  onClose: () => void;
}

export default function ContributionEvidenceModal({
  contribution,
  onClose,
}: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!contribution) return;
    triggerRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      triggerRef.current?.focus();
    };
  }, [contribution]);

  useEffect(() => {
    if (!contribution) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        // Single focusable child — trap by re-pinning to the close button.
        e.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [contribution, onClose]);

  return (
    <AnimatePresence>
      {contribution && (
        <motion.div
          key="evidence-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11, 29, 58, 0.5)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="evidence-modal-title"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(620px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#FFFFFF",
              borderRadius: 6,
              boxShadow: "0 24px 64px -16px rgba(11,29,58,0.4)",
            }}
          >
            <EvidenceBody
              contribution={contribution}
              onClose={onClose}
              closeButtonRef={closeButtonRef}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function EvidenceBody({
  contribution: c,
  onClose,
  closeButtonRef,
}: {
  contribution: EvidenceContribution;
  onClose: () => void;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const location = getExploreLocation(c.locationId);
  const shortName =
    LOCATION_SHORT_NAMES[c.locationId] ?? location?.label ?? "Unknown";
  const typeColor = TYPE_COLORS[c.type] ?? "#6B7A8C";
  const typeLabel = TYPE_LABELS[c.type] ?? c.type;
  const evidenceCode = `${c.locationId}-${(c.rawId || c.id).slice(-4).toUpperCase()}`;

  return (
    <>
      <div
        style={{
          background: "#0B1D3A",
          height: 48,
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          id="evidence-modal-title"
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 11,
            color: "#FFFFFF",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          LOC · {c.locationId} · {shortName}
        </span>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          type="button"
          aria-label="Close evidence card"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            background: "transparent",
            color: "#FFFFFF",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: "50%",
            cursor: "pointer",
            transition: "all 150ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
          }}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          height: 300,
          background: "#F2EDE0",
        }}
      >
        {location?.image ? (
          <Image
            src={location.image}
            alt={location.description ?? `Location ${c.locationId}`}
            fill
            sizes="640px"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: "#8899AA",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              LOC · {c.locationId} · {shortName}
            </span>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              No photo available
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          background: "#F5F2EB",
          padding: 24,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "3px 9px",
              background: `${typeColor}20`,
              color: typeColor,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {typeLabel}
          </span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 10,
              color: "#6B7A8C",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {c.contributorRole} · {c.contributorAge || "—"} · {c.timeAgo}
          </span>
        </div>

        {c.themes.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 14,
              marginTop: 4,
            }}
          >
            {c.themes.map((t) => (
              <span
                key={t.id}
                style={{
                  fontSize: 10,
                  padding: "2px 7px",
                  background:
                    t.kind === "concern"
                      ? "rgba(244,117,96,0.12)"
                      : "rgba(26,191,173,0.12)",
                  color: t.kind === "concern" ? "#D85A45" : "#0F8A7E",
                  border: `1px solid ${
                    t.kind === "concern"
                      ? "rgba(244,117,96,0.3)"
                      : "rgba(26,191,173,0.3)"
                  }`,
                }}
              >
                {t.name}
              </span>
            ))}
          </div>
        )}

        <p
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: "#0B1D3A",
            margin: c.themes.length > 0 ? "0 80px 0 0" : "12px 80px 0 0",
            whiteSpace: "pre-wrap",
          }}
        >
          {c.content}
        </p>

        <span
          style={{
            position: "absolute",
            bottom: 14,
            right: 16,
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            color: "#8899AA",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          EVIDENCE · {evidenceCode}
        </span>
      </div>
    </>
  );
}
