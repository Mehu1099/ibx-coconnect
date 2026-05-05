"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ActivityCounters from "@/components/explore/ActivityCounters";
import AIGenerationModal from "@/components/explore/AIGenerationModal";
import AIProposalsPanel from "@/components/explore/AIProposalsPanel";
import CinematicPhoto from "@/components/explore/CinematicPhoto";
import ConcernCreationModal from "@/components/explore/ConcernCreationModal";
import ConcernMarker from "@/components/explore/ConcernMarker";
import ConcernsBanner from "@/components/explore/ConcernsBanner";
import FloatingQuestionCards from "@/components/explore/FloatingQuestionCards";
import LocationToolbar, {
  type ToolId,
} from "@/components/explore/LocationToolbar";
import LocationTopNav from "@/components/explore/LocationTopNav";
import PersonalCanvasHint from "@/components/explore/PersonalCanvasHint";
import SketchCanvas from "@/components/explore/SketchCanvas";
import SketchToolbar from "@/components/explore/SketchToolbar";
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
  echoConcern,
  loadAIProposals,
  loadAnnotations,
  loadQuestionResponses,
  loadSketches,
  submitContributions,
  type SubmissionData,
} from "@/lib/annotations-api";
import { useAuth } from "@/lib/auth-context";
import type { ConcernCategory } from "@/lib/concern-categories";
import type {
  DatabaseAIProposal,
  DatabaseAnnotation,
  DatabaseQuestionResponse,
  DatabaseSketch,
  SketchStroke,
} from "@/lib/database-types";
import {
  clearAllDrafts,
  loadDraftAIProposals,
  loadDraftAnnotations,
  loadDraftConcerns,
  loadDraftResponses,
  loadDraftSketch,
  makeDraftId,
  saveDraftAIProposals,
  saveDraftAnnotations,
  saveDraftConcerns,
  saveDraftResponses,
  saveDraftSketch,
  type DraftAIProposal,
  type DraftAnnotation,
  type DraftConcern,
  type DraftQuestionResponse,
  type DraftSketch,
} from "@/lib/draft-state";
import { EXPLORE_LOCATIONS } from "@/lib/explore-locations";
import { PLANNER_QUESTIONS } from "@/lib/planner-questions";
import { getAnonymousSessionId } from "@/lib/supabase-client";
import { useRealtimeConcerns } from "@/lib/use-realtime-concerns";
import { Z_INDEX } from "@/lib/z-index";

const NAVY = "#0B1D3A";
const CREAM = "#EDE5D5";

const TUTORIAL_STORAGE_KEY = "ibx-tutorial-completed";

const DEFAULT_SKETCH_COLOR = "#F47560";
const DEFAULT_SKETCH_WIDTH = 6;

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

  // Authenticated stakeholders see their submissions across browsers
  // (filtered by user_id); anonymous users see this-browser-only
  // (filtered by anon session id). authLoading gates the first fetch
  // so we don't kick off an anonymous read before Supabase has had a
  // chance to restore an existing session.
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const photoRef = useRef<HTMLDivElement | null>(null);
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  // Submitted = persisted in Supabase. Drafts = local-only, held in
  // sessionStorage until the user goes through the submission modal.
  const [submittedAnnotations, setSubmittedAnnotations] = useState<DatabaseAnnotation[]>([]);
  const [submittedResponses, setSubmittedResponses] = useState<DatabaseQuestionResponse[]>([]);
  const [draftAnnotations, setDraftAnnotations] = useState<DraftAnnotation[]>([]);
  const [draftResponses, setDraftResponses] = useState<DraftQuestionResponse[]>([]);
  const [draftConcerns, setDraftConcerns] = useState<DraftConcern[]>([]);
  const [submittedSketches, setSubmittedSketches] = useState<DatabaseSketch[]>([]);
  const [draftSketch, setDraftSketch] = useState<DraftSketch | null>(null);
  const [sketchColor, setSketchColor] = useState(DEFAULT_SKETCH_COLOR);
  const [sketchWidth, setSketchWidth] = useState(DEFAULT_SKETCH_WIDTH);
  const [isErasing, setIsErasing] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [pendingNote, setPendingNote] = useState<{ x: number; y: number } | null>(null);
  const [pendingConcern, setPendingConcern] = useState<{ x: number; y: number } | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep | null>(null);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [submittedAIProposals, setSubmittedAIProposals] = useState<
    DatabaseAIProposal[]
  >([]);
  const [draftAIProposals, setDraftAIProposals] = useState<DraftAIProposal[]>(
    [],
  );
  const [aiModalOpen, setAIModalOpen] = useState(false);

  // Realtime concerns are PUBLIC — every browser sees the same feed. The
  // hook handles initial load + INSERT/UPDATE subscriptions internally.
  const { concerns: submittedConcerns } = useRealtimeConcerns(id);

  // Hydrate submitted from Supabase + drafts from sessionStorage. The
  // helpers swallow errors and return [] so the page stays usable when
  // offline or RLS-blocked.
  //
  // The effect re-runs whenever `userId` flips (sign-in / sign-out). On
  // each run we CLEAR submitted state up-front before the async fetch
  // resolves — otherwise stakeholder rows would remain visible during
  // the 100–300ms it takes the new anonymous fetch to come back, which
  // is both a UX glitch and a privacy concern. Drafts are session-scoped
  // and not affected by auth, so they're hydrated unconditionally.
  useEffect(() => {
    if (!id) return;
    if (authLoading) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- canonical clear-before-refetch when auth identity changes; otherwise stakeholder rows linger during the new anonymous fetch
    setSubmittedAnnotations([]);
    setSubmittedResponses([]);
    setSubmittedSketches([]);
    setSubmittedAIProposals([]);
    Promise.all([
      loadAnnotations(id, true, userId),
      loadQuestionResponses(id, true, userId),
      loadSketches(id, true, userId),
      loadAIProposals(id, true, userId),
    ]).then(
      ([annotationsData, responsesData, sketchesData, aiProposalsData]) => {
        if (cancelled) return;
        setSubmittedAnnotations(
          annotationsData.filter((a) => a.type === "sticky"),
        );
        setSubmittedResponses(responsesData);
        setSubmittedSketches(sketchesData);
        setSubmittedAIProposals(aiProposalsData);
      },
    );
    setDraftAnnotations(loadDraftAnnotations(id));
    setDraftResponses(loadDraftResponses(id));
    setDraftConcerns(loadDraftConcerns(id));
    setDraftSketch(loadDraftSketch(id));
    setDraftAIProposals(loadDraftAIProposals(id));
    return () => {
      cancelled = true;
    };
  }, [id, userId, authLoading]);

  const sketchDraftCount =
    draftSketch && draftSketch.strokes.length > 0 ? 1 : 0;
  const draftCount =
    draftAnnotations.length +
    draftResponses.length +
    draftConcerns.length +
    sketchDraftCount +
    draftAIProposals.length;
  // "Weight" = creator (1) + echoers (echo_count). Drafts contribute 1
  // each; their authors haven't pushed them to Supabase yet so there
  // are no echoes to count. The Explore badge, the banner here, and
  // the bottom-right pill all share this metric.
  const totalConcernWeight = useMemo(() => {
    const submittedWeight = submittedConcerns.reduce(
      (sum, c) => sum + 1 + (c.echo_count ?? 0),
      0,
    );
    return submittedWeight + draftConcerns.length;
  }, [submittedConcerns, draftConcerns]);
  const anonSessionId =
    typeof window !== "undefined" ? getAnonymousSessionId() : "";

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

  // Toast lifecycle. Visibility-toggle toasts dismiss after 1.6s.
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1600);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Escape deactivates the active tool. Pairs with clicking the same
  // tool icon again — both routes drop the user back to "viewing" mode
  // so the tool can never get stuck. Also clears any pending composer
  // so the photo isn't left in a half-committed state.
  useEffect(() => {
    if (!activeTool && !pendingNote && !pendingConcern) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (pendingNote) setPendingNote(null);
      else if (pendingConcern) setPendingConcern(null);
      else if (activeTool) {
        setActiveTool(null);
        setIsErasing(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTool, pendingNote, pendingConcern]);

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
    // The AI tool is modal — clicking it opens the generation dialog
    // and never enters a "drawing on the photo" state, so we don't
    // touch activeTool. Leaves the previously-selected tool intact
    // for when the user dismisses the modal.
    if (tool === "ai") {
      setAIModalOpen(true);
      return;
    }
    setActiveTool(tool);
    setPendingNote(null);
    setSelectedNoteId(null);
    setPendingConcern(null);
    // Leaving the sketch tool drops eraser mode so the next entry starts
    // in the default draw state.
    if (tool !== "sketch") {
      setIsErasing(false);
    }
    setToast(null);
  }, []);

  // Save a kept AI proposal as a draft. The image already lives in
  // Supabase Storage by this point — submitContributions later writes
  // the row that links it.
  const handleSaveAIProposal = useCallback(
    (proposal: {
      prompt: string;
      imageUrl: string;
      storagePath: string;
      predictionId: string;
    }) => {
      if (!id) return;
      const newDraft: DraftAIProposal = {
        tempId: makeDraftId(),
        prompt: proposal.prompt,
        imageUrl: proposal.imageUrl,
        storagePath: proposal.storagePath,
        predictionId: proposal.predictionId,
        createdAt: new Date().toISOString(),
      };
      setDraftAIProposals((prev) => {
        const next = [...prev, newDraft];
        saveDraftAIProposals(id, next);
        return next;
      });
      setAIModalOpen(false);
    },
    [id],
  );

  // Drop a draft AI proposal before submission. The Supabase Storage
  // file generated for it is intentionally left in place — clean-up
  // would need a server-side route since the storage policy doesn't
  // grant delete from the client. Cheap enough to leave for now.
  const handleDeleteDraftAIProposal = useCallback(
    (tempId: string) => {
      if (!id) return;
      setDraftAIProposals((prev) => {
        const next = prev.filter((d) => d.tempId !== tempId);
        saveDraftAIProposals(id, next);
        return next;
      });
    },
    [id],
  );

  // ── Photo click → maybe start a new sticky note + tutorial advance ──────

  const handlePhotoClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (pendingNote || pendingConcern) return;
      const el = photoRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const clampedX = Math.max(0, Math.min(100, Number(x.toFixed(2))));
      const clampedY = Math.max(0, Math.min(100, Number(y.toFixed(2))));

      if (activeTool === "sticky") {
        setPendingNote({ x: clampedX, y: clampedY });
        setSelectedNoteId(null);
      } else if (activeTool === "concern") {
        setPendingConcern({ x: clampedX, y: clampedY });
        setSelectedNoteId(null);
      } else if (selectedNoteId) {
        setSelectedNoteId(null);
      }
    },
    [activeTool, pendingNote, pendingConcern, selectedNoteId],
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

  // ── Draft concerns (local + sessionStorage) ─────────────────────────────

  const handleSaveConcern = useCallback(
    (description: string, category: ConcernCategory) => {
      if (!pendingConcern || !id) return;
      const newDraft: DraftConcern = {
        tempId: makeDraftId(),
        x: pendingConcern.x,
        y: pendingConcern.y,
        description,
        category,
        createdAt: new Date().toISOString(),
      };
      setDraftConcerns((prev) => {
        const next = [...prev, newDraft];
        saveDraftConcerns(id, next);
        return next;
      });
      setPendingConcern(null);
    },
    [pendingConcern, id],
  );

  // Echo a submitted concern. The realtime UPDATE subscription on
  // `concerns` is what reflects the new echo_count back into the UI;
  // we don't optimistically mutate state here. The marker also
  // disables its echo button immediately on click so the realtime
  // delay isn't visible to the clicker.
  const handleEchoConcern = useCallback(async (concernId: string) => {
    await echoConcern(concernId);
  }, []);

  // ── Draft sketch (local + sessionStorage) ───────────────────────────────
  // One sketch per location; new strokes append to the same draft. Empty
  // drafts (after undo / erase / clear) collapse back to null so the
  // submission flow doesn't try to insert a sketch row with no strokes.

  const handleStrokeComplete = useCallback(
    (stroke: SketchStroke) => {
      if (!id) return;
      setDraftSketch((prev) => {
        const next: DraftSketch = prev
          ? { ...prev, strokes: [...prev.strokes, stroke] }
          : {
              tempId: makeDraftId(),
              strokes: [stroke],
              createdAt: new Date().toISOString(),
            };
        saveDraftSketch(id, next);
        return next;
      });
    },
    [id],
  );

  // The scrub eraser passes the full post-split stroke list — it can
  // split one stroke into many, drop strokes entirely, or just shorten
  // them, so a stroke-index-based callback isn't enough.
  const handleDraftStrokesChange = useCallback(
    (strokes: SketchStroke[]) => {
      if (!id) return;
      setDraftSketch((prev) => {
        if (strokes.length === 0) {
          saveDraftSketch(id, null);
          return null;
        }
        const next: DraftSketch = prev
          ? { ...prev, strokes }
          : {
              tempId: makeDraftId(),
              strokes,
              createdAt: new Date().toISOString(),
            };
        saveDraftSketch(id, next);
        return next;
      });
    },
    [id],
  );

  const handleUndoSketch = useCallback(() => {
    if (!id) return;
    setDraftSketch((prev) => {
      if (!prev || prev.strokes.length === 0) return prev;
      const remaining = prev.strokes.slice(0, -1);
      if (remaining.length === 0) {
        saveDraftSketch(id, null);
        return null;
      }
      const next: DraftSketch = { ...prev, strokes: remaining };
      saveDraftSketch(id, next);
      return next;
    });
  }, [id]);

  const handleClearAllSketch = useCallback(() => {
    if (!id) return;
    setDraftSketch(null);
    saveDraftSketch(id, null);
    setIsErasing(false);
  }, [id]);

  const handleSketchColorChange = useCallback((color: string) => {
    setSketchColor(color);
    setIsErasing(false);
  }, []);

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
        draftConcerns,
        draftSketch,
        draftAIProposals,
        data,
        userId,
      );
      if (!result.success) {
        return { success: false as const, error: result.error };
      }
      // Re-fetch submitted from Supabase so the just-promoted drafts
      // appear in their final styling, then clear the drafts from
      // both state and sessionStorage. Concerns aren't refetched here —
      // the realtime hook will pick up the INSERTs and prepend them.
      const [annotationsData, responsesData, sketchesData, aiProposalsData] =
        await Promise.all([
          loadAnnotations(id, true, userId),
          loadQuestionResponses(id, true, userId),
          loadSketches(id, true, userId),
          loadAIProposals(id, true, userId),
        ]);
      setSubmittedAnnotations(
        annotationsData.filter((a) => a.type === "sticky"),
      );
      setSubmittedResponses(responsesData);
      setSubmittedSketches(sketchesData);
      setSubmittedAIProposals(aiProposalsData);
      setDraftAnnotations([]);
      setDraftResponses([]);
      setDraftConcerns([]);
      setDraftSketch(null);
      setDraftAIProposals([]);
      setIsErasing(false);
      clearAllDrafts(id);
      return { success: true as const };
    },
    [
      id,
      draftAnnotations,
      draftResponses,
      draftConcerns,
      draftSketch,
      draftAIProposals,
      userId,
    ],
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

          {/* Concerns are PUBLIC — every viewer sees the full feed.
              The "isMyConcern" flag suppresses the echo button and
              swaps in the muted "Your concern · N echoes" line for
              rows the current viewer authored. */}
          {submittedConcerns.map((c, i) => {
            const mine = userId
              ? c.user_id === userId
              : c.anonymous_session_id === anonSessionId &&
                c.user_id === null;
            return (
              <ConcernMarker
                key={c.id}
                concern={c}
                index={i}
                isMyConcern={mine}
                isStakeholder={userId !== null}
                onEcho={() => handleEchoConcern(c.id)}
              />
            );
          })}

          {/* Concern drafts — render with dashed inner ring just like
              sticky-note drafts. They're "yours" by definition. */}
          {draftConcerns.map((d, i) => (
            <ConcernMarker
              key={d.tempId}
              concern={{
                id: d.tempId,
                x_position: d.x,
                y_position: d.y,
                description: d.description,
                category: d.category,
                echo_count: 0,
              }}
              index={submittedConcerns.length + i}
              isDraft
              isMyConcern
            />
          ))}

          {/* Sketch overlay — fills the photo area, renders all
              submitted strokes plus the user's draft strokes, and
              becomes interactive only when the sketch tool is active. */}
          <SketchCanvas
            isActive={activeTool === "sketch" && showAnnotations}
            isErasing={isErasing}
            currentColor={sketchColor}
            currentWidth={sketchWidth}
            existingStrokes={submittedSketches.flatMap((s) => s.strokes)}
            draftStrokes={draftSketch?.strokes ?? []}
            onStrokeComplete={handleStrokeComplete}
            onDraftStrokesChange={handleDraftStrokesChange}
          />
        </motion.div>

        {pendingNote && (
          <StickyNoteComposer
            x={pendingNote.x}
            y={pendingNote.y}
            onSave={handleSaveNote}
            onCancel={() => setPendingNote(null)}
          />
        )}

        {pendingConcern && (
          <ConcernCreationModal
            x={pendingConcern.x}
            y={pendingConcern.y}
            onSave={handleSaveConcern}
            onCancel={() => setPendingConcern(null)}
          />
        )}
      </CinematicPhoto>

      {/* ── Top nav, concerns banner ────────────────────────────────────── */}
      <LocationTopNav
        label={location.label}
        subtitle={location.description}
        onBack={handleBack}
      />
      {totalConcernWeight > 0 && <ConcernsBanner count={totalConcernWeight} />}

      {/* ── Always-visible planner question cards ───────────────────────── */}
      <FloatingQuestionCards
        questions={questions}
        submittedResponses={submittedResponses}
        draftResponses={draftResponses}
        onAddDraftResponse={handleAddDraftResponse}
        tutorialHighlight={tutorialStep === 3}
      />

      {/* ── AI proposals strip (mirrors the question cards on the left) ─── */}
      <AIProposalsPanel
        proposals={submittedAIProposals}
        draftProposals={draftAIProposals}
        onDeleteDraft={handleDeleteDraftAIProposal}
      />

      {/* ── Toolbar + counters ──────────────────────────────────────────── */}
      <LocationToolbar
        activeTool={activeTool}
        onSelectTool={handleSelectTool}
        showAnnotations={showAnnotations}
        onToggleVisibility={handleToggleVisibility}
        tutorialHighlight={tutorialStep === 2}
      />

      {/* ── Sketch tool's secondary toolbar (color/width/eraser/undo/clear) */}
      <SketchToolbar
        isVisible={activeTool === "sketch"}
        currentColor={sketchColor}
        currentWidth={sketchWidth}
        isErasing={isErasing}
        hasStrokes={(draftSketch?.strokes.length ?? 0) > 0}
        onColorChange={handleSketchColorChange}
        onWidthChange={setSketchWidth}
        onToggleErase={() => setIsErasing((prev) => !prev)}
        onUndo={handleUndoSketch}
        onClearAll={handleClearAllSketch}
      />
      <ActivityCounters
        concerns={totalConcernWeight}
        questions={submittedResponses.length + draftResponses.length}
      />

      {/* ── Submit Contributions floating button ────────────────────────── */}
      <SubmitContributionsButton
        count={draftCount}
        onClick={() => setSubmissionModalOpen(true)}
      />

      {/* ── Personal-canvas hint (zero-contribution state) ──────────────── */}
      {/* Sits in the same slot as the Submit button. The two are mutually
          exclusive: hint requires zero of everything, button requires
          draftCount > 0, so they never overlap on screen. */}
      <PersonalCanvasHint
        show={
          activeTool !== "sketch" &&
          submittedAnnotations.length === 0 &&
          submittedResponses.length === 0 &&
          submittedSketches.length === 0 &&
          submittedAIProposals.length === 0 &&
          draftAnnotations.length === 0 &&
          draftResponses.length === 0 &&
          draftConcerns.length === 0 &&
          sketchDraftCount === 0 &&
          draftAIProposals.length === 0
        }
      />

      {/* ── Demographic submission modal ────────────────────────────────── */}
      <SubmissionModal
        open={submissionModalOpen}
        draftAnnotationsCount={draftAnnotations.length}
        draftResponsesCount={draftResponses.length}
        draftConcernsCount={draftConcerns.length}
        draftSketchCount={sketchDraftCount}
        draftAIProposalsCount={draftAIProposals.length}
        onClose={() => setSubmissionModalOpen(false)}
        onNavigateAway={() => {
          setSubmissionModalOpen(false);
          handleBack();
        }}
        onSubmit={handleSubmitContributions}
      />

      {/* ── AI generation modal ─────────────────────────────────────────── */}
      <AIGenerationModal
        isOpen={aiModalOpen}
        onClose={() => setAIModalOpen(false)}
        locationId={id}
        // Replicate fetches the base image over the public web, so we
        // hand it an absolute URL. /public is served at the site root,
        // and location.image is already prefixed with /explore/...
        basePhotoUrl={
          typeof window !== "undefined"
            ? `${window.location.origin}${location.image}`
            : location.image
        }
        onSave={handleSaveAIProposal}
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
              zIndex: Z_INDEX.active_interaction.toast,
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
            style={{ zIndex: Z_INDEX.leaving_overlay, background: "#FFFFFF", pointerEvents: "all" }}
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
