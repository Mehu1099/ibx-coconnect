"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type {
  SubmissionAgeRange,
  SubmissionData,
  SubmissionRole,
} from "@/lib/annotations-api";

const NAVY = "#0B1D3A";
const TEAL = "#1ABFAD";
const CORAL = "#F47560";
const CREAM = "#F5F2EB";
const SLATE = "#6B7A8C";
const SOFT_BORDER = "#D8D2C5";
const FAINT_BORDER = "#E0DCD4";

type SubmitResult =
  | { success: true }
  | { success: false; error?: unknown };

type Props = {
  open: boolean;
  draftAnnotationsCount: number;
  draftResponsesCount: number;
  onClose: () => void;
  /** Triggered when the user clicks "Back to neighborhood" from the
   *  celebration. Parent handles fade-out + navigation. */
  onNavigateAway: () => void;
  onSubmit: (data: SubmissionData) => Promise<SubmitResult>;
};

export default function SubmissionModal({
  open,
  draftAnnotationsCount,
  draftResponsesCount,
  onClose,
  onNavigateAway,
  onSubmit,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <ModalShell key="submission-modal" onClose={onClose}>
          <ModalBody
            draftAnnotationsCount={draftAnnotationsCount}
            draftResponsesCount={draftResponsesCount}
            onSubmit={onSubmit}
            onClose={onClose}
            onNavigateAway={onNavigateAway}
          />
        </ModalShell>
      )}
    </AnimatePresence>
  );
}

// Shell renders the backdrop, the rising spark layer (only during the
// celebration stage — toggled via a prop hook from the body), and the
// cream card. Card content swaps between form and success internally.
function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
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
            width: "min(460px, 100%)",
            background: CREAM,
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.20)",
            fontFamily: "var(--font-space-grotesk)",
            color: NAVY,
            position: "relative",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </motion.div>
    </>
  );
}

// Body manages stage transitions (form ↔ success) inside the same
// shell so the cream card stays anchored while content swaps.
function ModalBody({
  draftAnnotationsCount,
  draftResponsesCount,
  onSubmit,
  onClose,
  onNavigateAway,
}: {
  draftAnnotationsCount: number;
  draftResponsesCount: number;
  onSubmit: (data: SubmissionData) => Promise<SubmitResult>;
  onClose: () => void;
  onNavigateAway: () => void;
}) {
  const [stage, setStage] = useState<"form" | "submitting" | "success">("form");
  const [role, setRole] = useState<SubmissionRole | null>(null);
  const [ageRange, setAgeRange] = useState<SubmissionAgeRange | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Snapshot draft counts at submission time. The page clears its
  // drafts on success (so the props would zero out before the success
  // view renders) — these locals preserve the numbers for the stats card.
  const [submittedSticky, setSubmittedSticky] = useState(0);
  const [submittedResponses, setSubmittedResponses] = useState(0);
  const totalDraftCount = draftAnnotationsCount + draftResponsesCount;

  const handleSubmit = async () => {
    if (!role || !ageRange) return;
    setSubmittedSticky(draftAnnotationsCount);
    setSubmittedResponses(draftResponsesCount);
    setStage("submitting");
    setErrorMessage(null);
    const result = await onSubmit({
      role,
      ageRange,
      organization: undefined,
      isStakeholder: role === "planner_stakeholder",
    });
    if (result.success) {
      setStage("success");
    } else {
      setStage("form");
      setErrorMessage(
        "We couldn't submit your contributions. Please try again.",
      );
    }
  };

  return (
    <>
      {/* Sparks layer — siblings of the modal card, fixed to viewport,
          only painted during success. pointer-events: none so they
          don't block button clicks. */}
      {stage === "success" && <SparksLayer />}

      <AnimatePresence mode="wait">
        {stage === "success" ? (
          <SuccessView
            key="success"
            stickyCount={submittedSticky}
            responseCount={submittedResponses}
            role={role}
            ageRange={ageRange}
            onClose={onClose}
            onNavigateAway={onNavigateAway}
          />
        ) : (
          <FormView
            key="form"
            stage={stage}
            role={role}
            ageRange={ageRange}
            errorMessage={errorMessage}
            totalCount={totalDraftCount}
            onSelectRole={setRole}
            onSelectAge={setAgeRange}
            onSubmit={handleSubmit}
            onClose={onClose}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Form ───────────────────────────────────────────────────────────────────

function FormView({
  stage,
  role,
  ageRange,
  errorMessage,
  totalCount,
  onSelectRole,
  onSelectAge,
  onSubmit,
  onClose,
}: {
  stage: "form" | "submitting";
  role: SubmissionRole | null;
  ageRange: SubmissionAgeRange | null;
  errorMessage: string | null;
  totalCount: number;
  onSelectRole: (r: SubmissionRole) => void;
  onSelectAge: (a: SubmissionAgeRange) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const isSubmitting = stage === "submitting";
  const canSubmit = role !== null && ageRange !== null && !isSubmitting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <CloseButton onClick={onClose} />

      {/* Tiny pulsing teal dot + label */}
      <div className="flex items-center" style={{ gap: 8 }}>
        <PulsingDot />
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            color: TEAL,
          }}
        >
          Almost there
        </span>
      </div>

      <h2
        style={{
          marginTop: 10,
          fontSize: 22,
          fontWeight: 500,
          lineHeight: 1.2,
          color: NAVY,
        }}
      >
        Tell us about you
      </h2>
      <p
        style={{
          marginTop: 8,
          fontSize: 13,
          lineHeight: 1.5,
          color: SLATE,
        }}
      >
        Your perspective shapes how we read the data. Two quick questions,
        then we send your contributions.
      </p>

      <SectionLabel>I&apos;m a</SectionLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 8,
        }}
      >
        {ROLES.map((r) => (
          <RoleCard
            key={r.id}
            label={r.label}
            icon={r.icon}
            selected={role === r.id}
            onClick={() => onSelectRole(r.id)}
          />
        ))}
      </div>

      <SectionLabel>My age range</SectionLabel>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 5,
        }}
      >
        {AGE_RANGES.map((a) => (
          <AgePill
            key={a.id}
            label={a.label}
            selected={ageRange === a.id}
            muted={a.id === "prefer_not_to_say"}
            onClick={() => onSelectAge(a.id)}
          />
        ))}
      </div>

      {errorMessage && (
        <div
          style={{
            marginTop: 14,
            color: CORAL,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {errorMessage}
        </div>
      )}

      <motion.button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="cursor-pointer"
        style={{
          marginTop: 20,
          width: "100%",
          background: CORAL,
          color: "#FFFFFF",
          border: "none",
          borderRadius: 12,
          padding: "14px 16px",
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 600,
          cursor: canSubmit ? "pointer" : "not-allowed",
          opacity: canSubmit ? 1 : 0.4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: canSubmit
            ? "0 8px 22px rgba(244, 117, 96, 0.32)"
            : "none",
          transition: "opacity 0.2s ease",
        }}
        whileHover={
          canSubmit
            ? {
                scale: 1.02,
                boxShadow: "0 12px 28px rgba(244, 117, 96, 0.40)",
                transition: { duration: 0.18 },
              }
            : undefined
        }
      >
        {isSubmitting ? (
          <Spinner />
        ) : (
          <>
            <span>
              Send my {totalCount}{" "}
              {totalCount === 1 ? "contribution" : "contributions"}
            </span>
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
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </>
        )}
      </motion.button>
    </motion.div>
  );
}

// ── Success / celebration ──────────────────────────────────────────────────

function SuccessView({
  stickyCount,
  responseCount,
  role,
  ageRange,
  onClose,
  onNavigateAway,
}: {
  stickyCount: number;
  responseCount: number;
  role: SubmissionRole | null;
  ageRange: SubmissionAgeRange | null;
  onClose: () => void;
  onNavigateAway: () => void;
}) {
  const total = stickyCount + responseCount;
  const roleLabel = role ? roleDisplay(role) : "—";
  const ageLabel = ageRange ? ageDisplay(ageRange) : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      style={{ textAlign: "center" }}
    >
      <BuildingIllustration />

      {/* SUBMITTED ✓ badge */}
      <div
        className="inline-flex items-center rounded-full"
        style={{
          marginTop: 18,
          background: "rgba(244, 117, 96, 0.15)",
          color: CORAL,
          padding: "4px 12px",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.6px",
          textTransform: "uppercase",
          gap: 5,
        }}
      >
        <span>Submitted</span>
        <motion.svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <polyline points="20 6 9 17 4 12" />
        </motion.svg>
      </div>

      {/* Headline (lines fade up with a small stagger) */}
      <motion.h2
        style={{
          marginTop: 14,
          fontSize: 22,
          fontWeight: 500,
          lineHeight: 1.3,
          color: NAVY,
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
      >
        Your voice is now part of Flatbush&apos;s future.
      </motion.h2>

      <motion.p
        style={{
          marginTop: 8,
          fontSize: 13,
          lineHeight: 1.5,
          color: SLATE,
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
      >
        {total} {total === 1 ? "contribution" : "contributions"} added to the
        conversation. Planners will see your perspective.
      </motion.p>

      {/* Stats recap card */}
      <motion.div
        className="flex items-stretch"
        style={{
          marginTop: 18,
          background: "#FFFFFF",
          borderRadius: 12,
          padding: 12,
          gap: 0,
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.35, ease: "easeOut" }}
      >
        <Stat
          big={String(stickyCount)}
          label={
            stickyCount === 1 ? "STICKY NOTE" : "STICKY NOTES"
          }
        />
        <Divider />
        <Stat
          big={String(responseCount)}
          label={responseCount === 1 ? "QUESTION" : "QUESTIONS"}
        />
        <Divider />
        <Stat big={roleLabel} label={ageLabel} bigSize={14} />
      </motion.div>

      {/* Action buttons */}
      <motion.div
        style={{ marginTop: 20, display: "grid", gap: 6 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.45, ease: "easeOut" }}
      >
        <motion.button
          type="button"
          onClick={onClose}
          className="cursor-pointer"
          style={{
            width: "100%",
            background: CORAL,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 12,
            padding: "12px 16px",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 8px 22px rgba(244, 117, 96, 0.32)",
          }}
          whileHover={{
            scale: 1.02,
            boxShadow: "0 12px 28px rgba(244, 117, 96, 0.40)",
            transition: { duration: 0.18 },
          }}
        >
          Keep exploring this location
        </motion.button>
        <button
          type="button"
          onClick={onNavigateAway}
          className="cursor-pointer"
          style={{
            background: "transparent",
            color: SLATE,
            border: "none",
            padding: "8px 12px",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: 400,
          }}
        >
          Back to neighborhood
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Bits ───────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 22,
        marginBottom: 8,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        color: SLATE,
      }}
    >
      {children}
    </div>
  );
}

function PulsingDot() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <motion.circle
        cx="7"
        cy="7"
        r="6"
        fill={TEAL}
        opacity={0.3}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <circle cx="7" cy="7" r="3" fill={TEAL} />
    </svg>
  );
}

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
        (e.currentTarget as HTMLButtonElement).style.background = "#EDE5D5";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
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

function Spinner() {
  return (
    <motion.div
      style={{
        width: 16,
        height: 16,
        border: "2px solid rgba(255, 255, 255, 0.4)",
        borderTopColor: "#FFFFFF",
        borderRadius: "50%",
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
    />
  );
}

function Divider() {
  return (
    <div
      aria-hidden
      style={{
        width: 1,
        background: FAINT_BORDER,
        margin: "0 6px",
        alignSelf: "center",
        height: 28,
      }}
    />
  );
}

function Stat({
  big,
  label,
  bigSize = 18,
}: {
  big: string;
  label: string;
  bigSize?: number;
}) {
  return (
    <div className="flex-1 text-center">
      <div
        style={{
          fontSize: bigSize,
          fontWeight: 500,
          color: CORAL,
          lineHeight: 1.1,
          textTransform: bigSize <= 14 ? "uppercase" : "none",
          letterSpacing: bigSize <= 14 ? "0.4px" : "0",
        }}
      >
        {big}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.4px",
          textTransform: "uppercase",
          color: SLATE,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ── Role cards ─────────────────────────────────────────────────────────────

type RoleDef = {
  id: SubmissionRole;
  label: string;
  icon: React.ReactNode;
};

// Custom 18×18 outline icons. Stroke colour is set via currentColor so
// each card can flip white when selected. 1.4 stroke = light + crisp.
const Icon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);

const ICON_RESIDENT = (
  <Icon>
    <path d="M3 7.5 L9 2.5 L15 7.5" />
    <rect x="4" y="7.5" width="10" height="7.5" rx="0.5" />
    <rect x="7.5" y="10" width="3" height="5" />
  </Icon>
);

const ICON_STUDENT = (
  <Icon>
    <path d="M2 8 L9 4 L16 8 L9 12 Z" />
    <path d="M5 9.5 L5 13 L9 15 L13 13 L13 9.5" />
  </Icon>
);

const ICON_RETAIL = (
  <Icon>
    <path d="M2 7 L4 4 L14 4 L16 7" />
    <rect x="3" y="7" width="12" height="7" />
    <rect x="7" y="9" width="4" height="5" />
  </Icon>
);

const ICON_TRANSIT = (
  <Icon>
    <rect x="3" y="4" width="12" height="9" rx="1" />
    <line x1="3" y1="7" x2="15" y2="7" />
    <circle cx="6" cy="14.5" r="1.2" />
    <circle cx="12" cy="14.5" r="1.2" />
  </Icon>
);

const ICON_VISITOR = (
  <Icon>
    <circle cx="9" cy="6" r="2.5" />
    <line x1="9" y1="8.5" x2="9" y2="16" />
    <line x1="9" y1="11" x2="4" y2="14" />
    <line x1="9" y1="11" x2="14" y2="14" />
  </Icon>
);

const ICON_PLANNER = (
  <Icon>
    <rect x="3" y="3" width="12" height="12" rx="0.6" />
    <line x1="6" y1="6.5" x2="12" y2="6.5" />
    <line x1="6" y1="9" x2="12" y2="9" />
    <line x1="6" y1="11.5" x2="10" y2="11.5" />
  </Icon>
);

const ROLES: RoleDef[] = [
  { id: "resident", label: "Resident", icon: ICON_RESIDENT },
  { id: "student", label: "Student", icon: ICON_STUDENT },
  { id: "retail_owner", label: "Retail / Business Owner", icon: ICON_RETAIL },
  { id: "transit_rider", label: "Transit Rider", icon: ICON_TRANSIT },
  { id: "visitor", label: "Visitor", icon: ICON_VISITOR },
  { id: "planner_stakeholder", label: "Planner / Stakeholder", icon: ICON_PLANNER },
];

const AGE_RANGES: { id: SubmissionAgeRange; label: string }[] = [
  { id: "under_18", label: "Under 18" },
  { id: "18_24", label: "18–24" },
  { id: "25_34", label: "25–34" },
  { id: "35_44", label: "35–44" },
  { id: "45_54", label: "45–54" },
  { id: "55_64", label: "55–64" },
  { id: "65_plus", label: "65+" },
  { id: "prefer_not_to_say", label: "Prefer not to say" },
];

function RoleCard({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="cursor-pointer text-left relative"
      style={{
        background: selected ? CORAL : "#FFFFFF",
        border: selected
          ? `1px solid ${CORAL}`
          : `1px solid ${SOFT_BORDER}`,
        borderRadius: 10,
        padding: "10px 11px",
        fontFamily: "inherit",
        color: selected ? "#FFFFFF" : NAVY,
        display: "flex",
        alignItems: "center",
        gap: 8,
        scale: selected ? 1.02 : 1,
        transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease",
      }}
      whileHover={{
        boxShadow: "0 6px 14px rgba(11, 29, 58, 0.10)",
        borderColor: selected ? CORAL : "rgba(244, 117, 96, 0.4)",
        transition: { duration: 0.15 },
      }}
    >
      <span style={{ flexShrink: 0, color: selected ? "#FFFFFF" : NAVY }}>
        {icon}
      </span>
      <span style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.25 }}>
        {label}
      </span>
      {selected && (
        <span
          aria-hidden
          className="absolute"
          style={{
            top: 6,
            right: 6,
            color: "#FFFFFF",
            display: "flex",
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
    </motion.button>
  );
}

function AgePill({
  label,
  selected,
  muted,
  onClick,
}: {
  label: string;
  selected: boolean;
  muted: boolean;
  onClick: () => void;
}) {
  const baseTextColor = selected ? "#FFFFFF" : muted ? SLATE : NAVY;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-full"
      style={{
        background: selected ? CORAL : "#FFFFFF",
        color: baseTextColor,
        border: selected ? "1px solid transparent" : `1px solid ${SOFT_BORDER}`,
        padding: "6px 10px",
        fontFamily: "inherit",
        fontSize: 11,
        fontWeight: selected ? 500 : 400,
        lineHeight: 1,
        transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease",
      }}
      whileHover={{
        borderColor: selected ? "transparent" : "rgba(244, 117, 96, 0.4)",
        transition: { duration: 0.15 },
      }}
    >
      {label}
    </motion.button>
  );
}

// ── Building illustration (success view) ──────────────────────────────────

function BuildingIllustration() {
  return (
    <motion.div
      aria-hidden
      style={{
        margin: "0 auto",
        width: 110,
        height: 80,
        willChange: "transform",
      }}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 110 80" width="110" height="80">
        {/* Decorative accents */}
        <circle cx="15" cy="20" r="4" fill={CORAL} opacity="0.8" />
        <rect
          x="93"
          y="14"
          width="6"
          height="6"
          fill={TEAL}
          opacity="0.8"
          transform="rotate(45 96 17)"
        />
        <circle cx="100" cy="32" r="3" fill={CORAL} opacity="0.6" />

        {/* Left building (navy) */}
        <rect x="20" y="35" width="22" height="32" fill={NAVY} />
        {/* 3×3 cream window grid */}
        {[0, 1, 2].map((col) =>
          [0, 1, 2].map((row) => (
            <rect
              key={`L-${col}-${row}`}
              x={23.5 + col * 5}
              y={39 + row * 8}
              width="3"
              height="4"
              fill={CREAM}
            />
          )),
        )}

        {/* Center building (teal, taller) */}
        <rect x="44" y="22" width="20" height="45" fill={TEAL} />
        {/* 3×4 cream window grid */}
        {[0, 1, 2].map((col) =>
          [0, 1, 2, 3].map((row) => (
            <rect
              key={`C-${col}-${row}`}
              x={47 + col * 5}
              y={26 + row * 9}
              width="3"
              height="4"
              fill={CREAM}
            />
          )),
        )}

        {/* Right building (coral) */}
        <rect x="66" y="40" width="22" height="27" fill={CORAL} />
        {/* 3×2 cream window grid */}
        {[0, 1, 2].map((col) =>
          [0, 1].map((row) => (
            <rect
              key={`R-${col}-${row}`}
              x={69.5 + col * 5}
              y={44 + row * 9}
              width="3"
              height="4"
              fill={CREAM}
            />
          )),
        )}

        {/* Baseline + dashed coral IBX route */}
        <line x1="0" y1="68" x2="110" y2="68" stroke={NAVY} strokeWidth="1.5" />
        <line
          x1="0"
          y1="68"
          x2="110"
          y2="68"
          stroke={CORAL}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.6"
        />
      </svg>
    </motion.div>
  );
}

// ── Sparks layer ──────────────────────────────────────────────────────────

type Spark = {
  left: string;
  top: string;
  size: number;
  color: string;
  shape: "circle" | "square";
  delay: number;
  dx: number;
};

const SPARKS: Spark[] = [
  { left: "18%", top: "70%", size: 7, color: CORAL, shape: "circle", delay: 0,    dx: -8 },
  { left: "26%", top: "75%", size: 6, color: TEAL,  shape: "square", delay: 0.3,  dx: 4 },
  { left: "34%", top: "78%", size: 5, color: CORAL, shape: "circle", delay: 0.6,  dx: -2 },
  { left: "42%", top: "72%", size: 8, color: CORAL, shape: "square", delay: 0.9,  dx: 6 },
  { left: "50%", top: "76%", size: 6, color: TEAL,  shape: "circle", delay: 1.2,  dx: 0 },
  { left: "58%", top: "70%", size: 7, color: CORAL, shape: "circle", delay: 0.15, dx: -4 },
  { left: "66%", top: "78%", size: 5, color: TEAL,  shape: "square", delay: 0.45, dx: 8 },
  { left: "74%", top: "72%", size: 8, color: CORAL, shape: "circle", delay: 0.75, dx: 2 },
  { left: "82%", top: "75%", size: 6, color: CORAL, shape: "square", delay: 1.05, dx: -6 },
  { left: "88%", top: "68%", size: 5, color: TEAL,  shape: "circle", delay: 1.35, dx: 10 },
];

function SparksLayer() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 134 }}
    >
      {SPARKS.map((s, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            background: s.color,
            borderRadius: s.shape === "circle" ? "50%" : 2,
            willChange: "transform, opacity",
          }}
          initial={{ y: 0, x: 0, opacity: 0, scale: 0 }}
          animate={{
            y: [0, -180, -260],
            x: [0, s.dx, s.dx * 1.6],
            opacity: [0, 1, 0],
            scale: [0, 1, 0.4],
          }}
          transition={{
            duration: 2.5,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// ── Display helpers ───────────────────────────────────────────────────────

function roleDisplay(role: SubmissionRole): string {
  switch (role) {
    case "resident":
      return "RESIDENT";
    case "student":
      return "STUDENT";
    case "retail_owner":
      return "RETAIL";
    case "transit_rider":
      return "RIDER";
    case "visitor":
      return "VISITOR";
    case "planner_stakeholder":
      return "PLANNER";
  }
}

function ageDisplay(age: SubmissionAgeRange): string {
  switch (age) {
    case "under_18":
      return "UNDER 18";
    case "18_24":
      return "18–24";
    case "25_34":
      return "25–34";
    case "35_44":
      return "35–44";
    case "45_54":
      return "45–54";
    case "55_64":
      return "55–64";
    case "65_plus":
      return "65+";
    case "prefer_not_to_say":
      return "—";
  }
}
