"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ActivityCounters from "@/components/explore/ActivityCounters";
import CinematicPhoto from "@/components/explore/CinematicPhoto";
import ConcernsBanner from "@/components/explore/ConcernsBanner";
import FloatingQuestionCards from "@/components/explore/FloatingQuestionCards";
import LocationToolbar, {
  type ToolId,
} from "@/components/explore/LocationToolbar";
import LocationTopNav from "@/components/explore/LocationTopNav";
import {
  StickyNoteComposer,
  StickyNoteDot,
} from "@/components/explore/StickyNote";
import SubmissionModal from "@/components/explore/SubmissionModal";
import SubmitContributionsButton from "@/components/explore/SubmitContributionsButton";
import TutorialOverlay, {
  type TutorialStep,
} from "@/components/explore/TutorialOverlay";
import {
  loadAnnotations,
  loadQuestionResponses,
  submitContributions,
  type SubmissionData,
} from "@/lib/annotations-api";
import type {
  DatabaseAnnotation,
  DatabaseQuestionResponse,
} from "@/lib/database-types";
import {
  clearAllDrafts,
  loadDraftAnnotations,
  loadDraftResponses,
  makeDraftId,
  saveDraftAnnotations,
  saveDraftResponses,
  type DraftAnnotation,
  type DraftQuestionResponse,
} from "@/lib/draft-state";
import { EXPLORE_LOCATIONS } from "@/lib/explore-locations";
import { PLANNER_QUESTIONS } from "@/lib/planner-questions";

const NAVY = "#0B1D3A";
const CREAM = "#EDE5D5";

const TUTORIAL_STORAGE_KEY = "ibx-tutorial-completed";

const PLACEHOLDER_TOOL_LABELS: Record<Exclude<ToolId, "sticky">, string> = {
  sketch: "Sketch",
  concern: "Concern",
  ai: "AI Generate",
};

// SVG-cursor data URIs so each tool feels distinct on the photo. Hot-spot
// coords (the trailing two numbers) are tuned to the icon center.
const STICKY_CURSOR =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 18 18'><circle cx='9' cy='9' r='5' fill='%23F47560' stroke='white' stroke-width='2'/></svg>\") 9 9, crosshair";
const SKETCH_CURSOR =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%230B1D3A' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><path d='M12 19l7-7 3 3-7 7-3-3z'/></svg>\") 4 18, crosshair";
const CONCERN_CURSOR =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='%23F47560' stroke='white' stroke-width='1.5'><path d='M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'/></svg>\") 10 18, crosshair";
const AI_CURSOR =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='%231ABFAD'><path d='M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z'/></svg>\") 10 10, crosshair";

function cursorForTool(tool: ToolId | null): string {
  switch (tool) {
    case "sticky":
      return STICKY_CURSOR;
    case "sketch":
      return SKETCH_CURSOR;
    case "concern":
      return CONCERN_CURSOR;
    case "ai":
      return AI_CURSOR;
    default:
      return "default";
  }
}

export default function LocationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const location = EXPLORE_LOCATIONS.find((l) => l.id === id);
  const questions = PLANNER_QUESTIONS[id] ?? [];

  const photoRef = useRef<HTMLDivElement | null>(null);
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  // Submitted = persisted in Supabase. Drafts = local-only, held in
  // sessionStorage until the user goes through the submission modal.
  const [submittedAnnotations, setSubmittedAnnotations] = useState<DatabaseAnnotation[]>([]);
  const [submittedResponses, setSubmittedResponses] = useState<DatabaseQuestionResponse[]>([]);
  const [draftAnnotations, setDraftAnnotations] = useState<DraftAnnotation[]>([]);
  const [draftResponses, setDraftResponses] = useState<DraftQuestionResponse[]>([]);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [pendingNote, setPendingNote] = useState<{ x: number; y: number } | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep | null>(null);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);

  // Hydrate submitted from Supabase + drafts from sessionStorage. The
  // helpers swallow errors and return [] so the page stays usable when
  // offline or RLS-blocked.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([loadAnnotations(id), loadQuestionResponses(id)]).then(
      ([annotationsData, responsesData]) => {
        if (cancelled) return;
        setSubmittedAnnotations(
          annotationsData.filter((a) => a.type === "sticky"),
        );
        setSubmittedResponses(responsesData);
      },
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect -- canonical sessionStorage hydration on mount
    setDraftAnnotations(loadDraftAnnotations(id));
    setDraftResponses(loadDraftResponses(id));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const draftCount = draftAnnotations.length + draftResponses.length;

  // Hydrate tutorial gate. Only show if the user has never completed it.
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(TUTORIAL_STORAGE_KEY)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- canonical localStorage hydration on mount
        setTutorialStep(1);
      }
    } catch {
      /* SSR or private browsing — skip tutorial */
    }
  }, []);

  // Toast lifecycle. Placeholder tools auto-dismiss after 3s and also
  // deselect themselves; visibility-toggle toasts are shorter (1.6s)
  // and don't touch the active tool.
  useEffect(() => {
    if (!toast) return;
    const isPlaceholder =
      toast.startsWith("Sketch ") ||
      toast.startsWith("Concern ") ||
      toast.startsWith("AI Generate ");
    const t = window.setTimeout(() => {
      setToast(null);
      if (isPlaceholder) {
        setActiveTool((current) =>
          current === "sketch" || current === "concern" || current === "ai"
            ? null
            : current,
        );
      }
    }, isPlaceholder ? 3000 : 1600);
    return () => window.clearTimeout(t);
  }, [toast]);

  // ── Visibility toggle ─────────────────────────────────────────────────────

  const handleToggleVisibility = useCallback(() => {
    setShowAnnotations((prev) => {
      const next = !prev;
      setToast(next ? "Annotations visible" : "Annotations hidden");
      return next;
    });
  }, []);

  // ── Tutorial control ─────────────────────────────────────────────────────

  const finishTutorial = useCallback(() => {
    setTutorialStep(null);
    try {
      window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
  }, []);

  const handleTutorialAdvance = useCallback(() => {
    setTutorialStep((prev) => {
      if (prev === null) return null;
      if (prev === 4) {
        try {
          window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
        } catch {
          /* ignore */
        }
        return null;
      }
      return (prev + 1) as TutorialStep;
    });
  }, []);

  // ── Tool handlers ──────────────────────────────────────────────────────────

  const handleSelectTool = useCallback((tool: ToolId | null) => {
    setActiveTool(tool);
    setPendingNote(null);
    setSelectedNoteId(null);

    if (tool === "sketch" || tool === "concern" || tool === "ai") {
      setToast(
        `${PLACEHOLDER_TOOL_LABELS[tool]} — coming in next update, building this in Session 4!`,
      );
    } else {
      setToast(null);
    }
  }, []);

  // ── Photo click → maybe start a new sticky note + tutorial advance ──────

  const handlePhotoClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (pendingNote) return;
      const el = photoRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      if (activeTool === "sticky") {
        setPendingNote({
          x: Math.max(0, Math.min(100, Number(x.toFixed(2)))),
          y: Math.max(0, Math.min(100, Number(y.toFixed(2)))),
        });
        setSelectedNoteId(null);
      } else if (selectedNoteId) {
        setSelectedNoteId(null);
      }
    },
    [activeTool, pendingNote, selectedNoteId],
  );

  // ── Draft sticky notes (local + sessionStorage) ──────────────────────────
  // Submitted notes are immutable from the UI now — drafts are the only
  // CRUD surface. The submission modal flow is what promotes drafts to
  // Supabase rows.

  const handleSaveNote = useCallback(
    (content: string) => {
      if (!pendingNote || !id) return;
      const newDraft: DraftAnnotation = {
        tempId: makeDraftId(),
        type: "sticky",
        x: pendingNote.x,
        y: pendingNote.y,
        content,
        createdAt: new Date().toISOString(),
      };
      setDraftAnnotations((prev) => {
        const next = [...prev, newDraft];
        saveDraftAnnotations(id, next);
        return next;
      });
      setPendingNote(null);
    },
    [pendingNote, id],
  );

  const handleDeleteDraftNote = useCallback(
    (tempId: string) => {
      if (!id) return;
      setDraftAnnotations((prev) => {
        const next = prev.filter((d) => d.tempId !== tempId);
        saveDraftAnnotations(id, next);
        return next;
      });
      setSelectedNoteId((sel) => (sel === tempId ? null : sel));
    },
    [id],
  );

  const handleUpdateDraftNote = useCallback(
    (tempId: string, content: string) => {
      if (!id) return;
      setDraftAnnotations((prev) => {
        const next = prev.map((d) =>
          d.tempId === tempId ? { ...d, content } : d,
        );
        saveDraftAnnotations(id, next);
        return next;
      });
    },
    [id],
  );

  // ── Draft question responses (local + sessionStorage) ────────────────────

  const handleAddDraftResponse = useCallback(
    (draft: DraftQuestionResponse) => {
      if (!id) return;
      setDraftResponses((prev) => {
        const next = [...prev, draft];
        saveDraftResponses(id, next);
        return next;
      });
    },
    [id],
  );

  // ── Batch submission ─────────────────────────────────────────────────────

  const handleSubmitContributions = useCallback(
    async (data: SubmissionData) => {
      if (!id) return { success: false as const };
      const result = await submitContributions(
        id,
        draftAnnotations,
        draftResponses,
        data,
      );
      if (!result.success) {
        return { success: false as const, error: result.error };
      }
      // Re-fetch submitted from Supabase so the just-promoted drafts
      // appear in their final styling, then clear the drafts from
      // both state and sessionStorage.
      const [annotationsData, responsesData] = await Promise.all([
        loadAnnotations(id),
        loadQuestionResponses(id),
      ]);
      setSubmittedAnnotations(
        annotationsData.filter((a) => a.type === "sticky"),
      );
      setSubmittedResponses(responsesData);
      setDraftAnnotations([]);
      setDraftResponses([]);
      clearAllDrafts(id);
      return { success: true as const };
    },
    [id, draftAnnotations, draftResponses],
  );

  // ── Back navigation with fade-out ─────────────────────────────────────────

  const handleBack = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => router.push("/explore"), 380);
  }, [leaving, router]);

  // ── Empty / not-found states ──────────────────────────────────────────────

  if (!location) {
    return (
      <main
        className="relative w-screen h-screen overflow-hidden flex items-center justify-center"
        style={{ background: CREAM }}
      >
        <div
          style={{
            fontFamily: "var(--font-space-grotesk)",
            color: NAVY,
            textAlign: "center",
            padding: 24,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
            Location not found
          </div>
          <div style={{ fontSize: 14, color: "#5F6E80", marginBottom: 20 }}>
            {id
              ? `No location matches the id "${id}".`
              : "No location id was provided."}
          </div>
          <button
            type="button"
            onClick={() => router.push("/explore")}
            className="cursor-pointer"
            style={{
              background: "#1ABFAD",
              color: "#0B1D3A",
              border: "none",
              borderRadius: 9999,
              padding: "10px 18px",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Back to neighborhood
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: "#FFFFFF" }}
    >
      {/* ── Cinematic photo with parallax + entrance ────────────────────── */}
      <CinematicPhoto
        src={location.image}
        alt={location.description}
        cursor={cursorForTool(activeTool)}
        toolTint={activeTool !== null}
        photoRef={photoRef}
        onClick={handlePhotoClick}
      >
        {/* Sticky notes — render the dots regardless and animate the
            wrapper's opacity so toggling visibility fades smoothly
            instead of pop-out/pop-in. pointer-events disabled when
            hidden so the dots can't be hovered/clicked through. */}
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: showAnnotations ? 1 : 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ pointerEvents: showAnnotations ? "auto" : "none" }}
        >
          {/* Submitted notes: solid coral. No edit/delete handlers
              — submitted contributions are part of the public record
              and shouldn't be mutated from the same browser. */}
          {submittedAnnotations.map((a, i) => (
            <StickyNoteDot
              key={a.id}
              annotation={a}
              index={i}
              selected={selectedNoteId === a.id}
              isDraft={false}
              onSelect={() =>
                setSelectedNoteId((sel) => (sel === a.id ? null : a.id))
              }
              onDelete={() => undefined}
              onUpdate={() => undefined}
            />
          ))}
          {/* Drafts: dashed border + slight transparency. Edit/Delete
              mutate local state + sessionStorage. */}
          {draftAnnotations.map((d, i) => (
            <StickyNoteDot
              key={d.tempId}
              annotation={{
                id: d.tempId,
                x_position: d.x,
                y_position: d.y,
                content: d.content,
              }}
              index={submittedAnnotations.length + i}
              selected={selectedNoteId === d.tempId}
              isDraft
              onSelect={() =>
                setSelectedNoteId((sel) =>
                  sel === d.tempId ? null : d.tempId,
                )
              }
              onDelete={() => handleDeleteDraftNote(d.tempId)}
              onUpdate={(content) => handleUpdateDraftNote(d.tempId, content)}
            />
          ))}
        </motion.div>

        {pendingNote && (
          <StickyNoteComposer
            x={pendingNote.x}
            y={pendingNote.y}
            onSave={handleSaveNote}
            onCancel={() => setPendingNote(null)}
          />
        )}
      </CinematicPhoto>

      {/* ── Top nav, concerns banner ────────────────────────────────────── */}
      <LocationTopNav
        label={location.label}
        subtitle={location.description}
        onBack={handleBack}
      />
      <ConcernsBanner count={3} />

      {/* ── Always-visible planner question cards ───────────────────────── */}
      <FloatingQuestionCards
        questions={questions}
        submittedResponses={submittedResponses}
        draftResponses={draftResponses}
        onAddDraftResponse={handleAddDraftResponse}
        tutorialHighlight={tutorialStep === 3}
      />

      {/* ── Toolbar + counters ──────────────────────────────────────────── */}
      <LocationToolbar
        activeTool={activeTool}
        onSelectTool={handleSelectTool}
        showAnnotations={showAnnotations}
        onToggleVisibility={handleToggleVisibility}
        tutorialHighlight={tutorialStep === 2}
      />
      <ActivityCounters concerns={3} questions={4} />

      {/* ── Submit Contributions floating button ────────────────────────── */}
      <SubmitContributionsButton
        count={draftCount}
        onClick={() => setSubmissionModalOpen(true)}
      />

      {/* ── Demographic submission modal ────────────────────────────────── */}
      <SubmissionModal
        open={submissionModalOpen}
        draftAnnotationsCount={draftAnnotations.length}
        draftResponsesCount={draftResponses.length}
        onClose={() => setSubmissionModalOpen(false)}
        onNavigateAway={() => {
          setSubmissionModalOpen(false);
          handleBack();
        }}
        onSubmit={handleSubmitContributions}
      />

      {/* ── Tutorial (first-visit only) ─────────────────────────────────── */}
      <TutorialOverlay
        step={tutorialStep}
        onAdvance={handleTutorialAdvance}
        onSkip={finishTutorial}
      />

      {/* ── Top-center toast for placeholder tools ──────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed"
            style={{
              top: 88,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 60,
              background: NAVY,
              color: "#F5F2EB",
              padding: "10px 18px",
              borderRadius: 9999,
              fontFamily: "var(--font-space-grotesk)",
              fontSize: 13,
              fontWeight: 500,
              boxShadow: "0 8px 24px rgba(11, 29, 58, 0.30)",
              maxWidth: "calc(100vw - 48px)",
              textAlign: "center",
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Leaving fade overlay (back to neighborhood) ─────────────────── */}
      <AnimatePresence>
        {leaving && (
          <motion.div
            className="fixed inset-0"
            style={{ zIndex: 90, background: "#FFFFFF", pointerEvents: "all" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
