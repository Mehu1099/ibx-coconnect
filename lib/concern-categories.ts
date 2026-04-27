// Standard categories surfaced in the concern-creation modal and used
// to colour the marker badge. Order here is the order shown in the
// dropdown.

export const CONCERN_CATEGORIES = [
  { id: "safety", label: "Safety", color: "#F47560" },
  { id: "accessibility", label: "Accessibility", color: "#1ABFAD" },
  { id: "infrastructure", label: "Infrastructure", color: "#8899AA" },
  { id: "noise", label: "Noise", color: "#F47560" },
  { id: "cleanliness", label: "Cleanliness", color: "#1ABFAD" },
  { id: "transit", label: "Transit", color: "#0B1D3A" },
  { id: "other", label: "Other", color: "#8899AA" },
] as const;

export type ConcernCategory = typeof CONCERN_CATEGORIES[number]["id"];

export function getConcernCategory(id: string | null | undefined) {
  if (!id) return null;
  return CONCERN_CATEGORIES.find((c) => c.id === id) ?? null;
}
