"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import type { ExploreLocation } from "@/lib/explore-locations";
import type { Contribution } from "@/lib/use-engage-data";

interface ExpandedViewProps {
  contribution: Contribution;
  location: ExploreLocation | undefined;
  onClose: () => void;
}

// File-folder modal: a navy blurred backdrop, then a centered card split
// into two panes. Left pane shows the location photo with the marker
// "dropping" into place at the contribution's exact percentage coords;
// AI proposals get a 50/50 EXISTING / AI VISION split. Right pane is a
// paper-ruled detail sheet with a metadata grid + the full content.

export function ExpandedView({
  contribution,
  location,
  onClose,
}: ExpandedViewProps) {
  // Esc closes the modal — same convention as the existing
  // SubmissionModal / AIGenerationModal flows.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll while open so the page underneath doesn't move.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const filedDate = formatFiled(contribution.createdAt);
  const typeName = TYPE_NAME[contribution.type];

  return (
    <>
      <motion.div
        className="fixed inset-0"
        style={{
          zIndex: 200,
          background: "rgba(11, 29, 58, 0.55)",
          backdropFilter: "blur(10px) saturate(1.1)",
          WebkitBackdropFilter: "blur(10px) saturate(1.1)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={onClose}
      />

      <motion.div
        className="fixed flex items-center justify-center"
        style={{
          inset: 0,
          zIndex: 205,
          padding: 24,
          pointerEvents: "none",
        }}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="engage-expanded-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: "auto",
            width: "min(1100px, 100%)",
            maxHeight: "calc(100vh - 48px)",
            background: "#FBF6EE",
            border: "1px solid rgba(11,29,58,0.12)",
            boxShadow: "0 32px 80px -20px rgba(11,29,58,0.45)",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1fr)",
            overflow: "hidden",
            position: "relative",
            fontFamily: "var(--font-space-grotesk), sans-serif",
            color: "#0B1D3A",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              zIndex: 10,
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#FBF6EE",
              border: "1px solid #E0DCD4",
              color: "#0B1D3A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={14} strokeWidth={2.2} />
          </button>

          <PhotoPane contribution={contribution} location={location} />
          <DetailSheet
            contribution={contribution}
            filedDate={filedDate}
            typeName={typeName}
          />
        </div>
      </motion.div>

      <style jsx>{`
        @media (max-width: 800px) {
          :global(.engage-expanded-card) {
            grid-template-columns: 1fr !important;
            max-height: calc(100vh - 24px) !important;
          }
        }
      `}</style>
    </>
  );
}

const TYPE_NAME: Record<Contribution["type"], string> = {
  sticky: "Sticky note",
  concern: "Concern",
  question_response: "Planner response",
  ai_proposal: "AI proposal",
};

function PhotoPane({
  contribution,
  location,
}: {
  contribution: Contribution;
  location: ExploreLocation | undefined;
}) {
  const isAi = contribution.type === "ai_proposal";
  const photoSrc = location?.image;

  return (
    <div
      style={{
        position: "relative",
        background: "#0B1D3A",
        minHeight: 360,
        overflow: "hidden",
      }}
    >
      {/* Field stamp — pinned to the top-right of the photo pane so it
          doesn't collide with the EXISTING / AI VISION tags in AI-proposal
          mode (those sit in the top-left of each panel below). */}
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          zIndex: 6,
          background: "#FBF6EE",
          border: "1px solid #E0DCD4",
          padding: "5px 10px",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 10,
          fontWeight: 600,
          color: "#0B1D3A",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        FILE · LOC-{contribution.locationId}
        {location?.label && (
          <span
            style={{
              marginLeft: 8,
              color: "#6B7A8C",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "none",
            }}
          >
            {location.label}
          </span>
        )}
      </div>

      {isAi ? (
        <AiBeforeAfter
          existingSrc={photoSrc}
          aiSrc={contribution.imageUrl}
          alt={contribution.prompt ?? contribution.content}
        />
      ) : (
        <SinglePhoto
          src={photoSrc}
          alt={location?.description ?? contribution.content}
          marker={contribution.marker}
          contributionType={contribution.type}
        />
      )}
    </div>
  );
}

function SinglePhoto({
  src,
  alt,
  marker,
  contributionType,
}: {
  src: string | undefined;
  alt: string;
  marker: { x: number; y: number } | undefined;
  contributionType: Contribution["type"];
}) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <PhotoMissing />
      )}

      {marker && (
        <motion.div
          style={{
            position: "absolute",
            left: `${marker.x}%`,
            top: `${marker.y}%`,
            transform: "translate(-50%, -100%)",
            zIndex: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}
          initial={{ opacity: 0, y: -120 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 16,
            delay: 0.5,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 9,
              fontWeight: 600,
              color: "#FBF6EE",
              background: "#0B1D3A",
              padding: "2px 6px",
              letterSpacing: "0.1em",
              marginBottom: 4,
            }}
          >
            {contributionType === "concern" ? "CONCERN" : "STICKY"}
          </div>
          <div
            aria-hidden
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#F47560",
              boxShadow:
                "0 0 0 4px #FBF6EE, 0 8px 18px -3px rgba(244,117,96,0.6)",
            }}
          />
          <div
            aria-hidden
            style={{
              width: 1,
              height: 8,
              background: "#0B1D3A",
              opacity: 0.5,
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

function AiBeforeAfter({
  existingSrc,
  aiSrc,
  alt,
}: {
  existingSrc: string | undefined;
  aiSrc: string | undefined;
  alt: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "1fr 1fr",
        height: "100%",
        minHeight: 360,
      }}
    >
      <Stamped src={existingSrc} alt={`${alt} — existing`} stamp="EXISTING" />
      <Stamped src={aiSrc} alt={`${alt} — AI vision`} stamp="AI VISION" />
    </div>
  );
}

function Stamped({
  src,
  alt,
  stamp,
}: {
  src: string | undefined;
  alt: string;
  stamp: string;
}) {
  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: 180 }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <PhotoMissing />
      )}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          zIndex: 5,
          padding: "4px 10px",
          background: "rgba(11,29,58,0.78)",
          color: "#FBF6EE",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.18em",
          border: "1px solid rgba(251,246,238,0.2)",
        }}
      >
        {stamp}
      </div>
    </div>
  );
}

function PhotoMissing() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background:
          "repeating-linear-gradient(45deg, rgba(251,246,238,0.04) 0 8px, transparent 8px 16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: 11,
        color: "rgba(251,246,238,0.5)",
        letterSpacing: "0.12em",
      }}
    >
      PHOTO · UNAVAILABLE
    </div>
  );
}

function DetailSheet({
  contribution,
  filedDate,
  typeName,
}: {
  contribution: Contribution;
  filedDate: string;
  typeName: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        padding: "28px 32px 24px",
        background: "#FBF6EE",
        // Paper-ruled lines: faint horizontals every 24px so the right
        // pane reads as a notebook leaf in the project file.
        backgroundImage:
          "repeating-linear-gradient(180deg, transparent 0 23px, rgba(11,29,58,0.06) 23px 24px)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* File header strip */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          paddingBottom: 8,
          borderBottom: "1px dashed #E0DCD4",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 10,
            fontWeight: 600,
            color: "#0B1D3A",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Detail Sheet
        </span>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 10,
            color: "#6B7A8C",
            letterSpacing: "0.14em",
          }}
        >
          ID · {contribution.rawId.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {/* Metadata grid — every label is mono caps so the page reads as
          structured records instead of prose. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "76px 1fr",
          rowGap: 6,
          columnGap: 14,
          fontSize: 12.5,
          color: "#0B1D3A",
        }}
      >
        <Meta label="SITE" value={`LOC-${contribution.locationId}`} />
        <Meta label="TYPE" value={typeName} />
        <Meta label="BY" value={metaBy(contribution)} />
        <Meta label="FILED" value={filedDate} />
        {contribution.echoCount !== undefined && (
          <Meta label="ECHOES" value={String(contribution.echoCount)} />
        )}
        {contribution.category && (
          <Meta label="CATEGORY" value={contribution.category} />
        )}
      </div>

      {/* Planner-response Q chip — same teal-bordered transcript pattern
          as the feed card, just larger to read at modal scale. */}
      {contribution.type === "question_response" && contribution.question && (
        <div
          style={{
            border: "1px solid rgba(15,138,126,0.4)",
            borderLeft: "3px solid #0F8A7E",
            padding: "12px 14px",
            background: "rgba(216,239,235,0.55)",
            fontSize: 13.5,
            color: "#0B1D3A",
            lineHeight: 1.5,
            fontStyle: "italic",
          }}
        >
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 9.5,
              fontWeight: 600,
              color: "#0F8A7E",
              letterSpacing: "0.16em",
              fontStyle: "normal",
              marginBottom: 4,
              textTransform: "uppercase",
            }}
          >
            Question
          </span>
          {contribution.question}
        </div>
      )}

      {/* The content as a quote — slightly oversized so the voice feels
          like the focus of the sheet rather than the metadata. */}
      <div
        style={{
          position: "relative",
          paddingLeft: 16,
          borderLeft: "3px solid #F47560",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -6,
            left: 8,
            fontSize: 32,
            color: "#F47560",
            opacity: 0.5,
            fontFamily: "Georgia, serif",
            lineHeight: 1,
          }}
        >
          “
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 17,
            lineHeight: 1.5,
            color: "#0B1D3A",
            letterSpacing: "-0.005em",
          }}
        >
          {contribution.content}
        </p>
      </div>

      {/* Bottom file-strip mark */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: 14,
          borderTop: "1px dashed #E0DCD4",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 9.5,
          color: "#8899AA",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        <span>IBX · CO-CONNECT</span>
        <span>REV · 2026.05</span>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 10,
          fontWeight: 600,
          color: "#6B7A8C",
          letterSpacing: "0.14em",
          paddingTop: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 11.5,
          color: "#0B1D3A",
          letterSpacing: "0.04em",
        }}
      >
        {value}
      </div>
    </>
  );
}

function metaBy(c: Contribution): string {
  const role = c.contributorRole;
  const age = c.contributorAge;
  const stk = c.isStakeholder ? " · STAKEHOLDER" : "";
  return age ? `${role} · ${age}${stk}` : `${role}${stk}`;
}

function formatFiled(iso: string): string {
  try {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd} · ${hh}:${mi}`;
  } catch {
    return iso;
  }
}
