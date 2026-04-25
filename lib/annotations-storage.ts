export type StickyAnnotation = {
  id: string;
  type: "sticky";
  x: number;
  y: number;
  content: string;
  createdAt: string;
};

export type QuestionResponse = {
  id: string;
  questionIndex: number;
  response: string;
  createdAt: string;
};

const isBrowser = () => typeof window !== "undefined";

const annotationsKey = (locationId: string) => `ibx-annotations-${locationId}`;
const responsesKey = (locationId: string) => `ibx-responses-${locationId}`;

function readJSON<T>(key: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(key);
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
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded or private browsing — silently drop */
  }
}

// crypto.randomUUID is widely supported in modern browsers; fall back to a
// timestamped random string if it's missing (older Safari, some embeds).
export function makeId(): string {
  if (isBrowser() && typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ── Annotations ──────────────────────────────────────────────────────────────

export function loadAnnotations(locationId: string): StickyAnnotation[] {
  return readJSON<StickyAnnotation>(annotationsKey(locationId));
}

export function saveAnnotations(
  locationId: string,
  annotations: StickyAnnotation[],
): void {
  writeJSON(annotationsKey(locationId), annotations);
}

// ── Question responses ──────────────────────────────────────────────────────

export function loadResponses(locationId: string): QuestionResponse[] {
  return readJSON<QuestionResponse>(responsesKey(locationId));
}

export function saveResponses(
  locationId: string,
  responses: QuestionResponse[],
): void {
  writeJSON(responsesKey(locationId), responses);
}
