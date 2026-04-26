// Drafts live in browser memory + sessionStorage. They survive page
// refreshes within the same tab/session but are NEVER persisted to
// Supabase until the user explicitly submits via the demographic
// modal — at which point they're inserted in one batch tied to a
// `submissions` row and cleared from session.

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

const annotationsKey = (locationId: string) => `ibx-drafts-${locationId}`;
const responsesKey = (locationId: string) =>
  `ibx-response-drafts-${locationId}`;

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

// ── Bulk clear (called after a successful submission) ──────────────────────

export function clearAllDrafts(locationId: string): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(annotationsKey(locationId));
    window.sessionStorage.removeItem(responsesKey(locationId));
  } catch {
    /* ignore */
  }
}
