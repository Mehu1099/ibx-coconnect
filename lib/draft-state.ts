// Drafts live in browser memory + sessionStorage. They survive page
// refreshes within the same tab/session but are NEVER persisted to
// Supabase until the user explicitly submits via the demographic
// modal — at which point they're inserted in one batch tied to a
// `submissions` row and cleared from session.

import type { SketchStroke } from "./database-types";

export interface DraftAnnotation {
  /** Local-only id; the Supabase row will get its own UUID on insert. */
  tempId: string;
  type: "sticky" | "sketch" | "concern";
  x: number;
  y: number;
  content: string;
  createdAt: string;
}

export interface DraftQuestionResponse {
  tempId: string;
  questionIndex: number;
  response: string;
  createdAt: string;
}

export interface DraftConcern {
  tempId: string;
  x: number;
  y: number;
  description: string;
  category: string;
  createdAt: string;
}

// Each location holds at most ONE draft sketch. New strokes are appended
// to its `strokes` array rather than spawning new draft records — that
// matches how a real sketching app works (one canvas, many strokes).
export interface DraftSketch {
  tempId: string;
  strokes: SketchStroke[];
  createdAt: string;
}

const annotationsKey = (locationId: string) => `ibx-drafts-${locationId}`;
const responsesKey = (locationId: string) =>
  `ibx-response-drafts-${locationId}`;
const concernsKey = (locationId: string) =>
  `ibx-concerns-drafts-${locationId}`;
const sketchKey = (locationId: string) => `ibx-sketch-drafts-${locationId}`;

const isBrowser = () => typeof window !== "undefined";

function readJSON<T>(key: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeJSON<T>(key: string, value: T[]): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded or storage disabled — silently drop */
  }
}

export function makeDraftId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ── Draft annotations ───────────────────────────────────────────────────────

export function loadDraftAnnotations(locationId: string): DraftAnnotation[] {
  return readJSON<DraftAnnotation>(annotationsKey(locationId));
}

export function saveDraftAnnotations(
  locationId: string,
  drafts: DraftAnnotation[],
): void {
  writeJSON(annotationsKey(locationId), drafts);
}

// ── Draft question responses ────────────────────────────────────────────────

export function loadDraftResponses(
  locationId: string,
): DraftQuestionResponse[] {
  return readJSON<DraftQuestionResponse>(responsesKey(locationId));
}

export function saveDraftResponses(
  locationId: string,
  drafts: DraftQuestionResponse[],
): void {
  writeJSON(responsesKey(locationId), drafts);
}

// ── Draft concerns ──────────────────────────────────────────────────────────

export function loadDraftConcerns(locationId: string): DraftConcern[] {
  return readJSON<DraftConcern>(concernsKey(locationId));
}

export function saveDraftConcerns(
  locationId: string,
  drafts: DraftConcern[],
): void {
  writeJSON(concernsKey(locationId), drafts);
}

// ── Draft sketch (one per location) ─────────────────────────────────────────

export function loadDraftSketch(locationId: string): DraftSketch | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(sketchKey(locationId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftSketch;
    return parsed && Array.isArray(parsed.strokes) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDraftSketch(
  locationId: string,
  sketch: DraftSketch | null,
): void {
  if (!isBrowser()) return;
  try {
    if (sketch === null) {
      window.sessionStorage.removeItem(sketchKey(locationId));
    } else {
      window.sessionStorage.setItem(
        sketchKey(locationId),
        JSON.stringify(sketch),
      );
    }
  } catch {
    /* quota exceeded or storage disabled — silently drop */
  }
}

// ── Bulk clear (called after a successful submission) ──────────────────────

export function clearAllDrafts(locationId: string): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(annotationsKey(locationId));
    window.sessionStorage.removeItem(responsesKey(locationId));
    window.sessionStorage.removeItem(concernsKey(locationId));
    window.sessionStorage.removeItem(sketchKey(locationId));
  } catch {
    /* ignore */
  }
}
