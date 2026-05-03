// Maps `submissions.role` and `submissions.age_range` enum values
// (written by the submission flow on the location page) to the human
// strings the Engage feed renders next to each contribution. Keep in
// sync with SubmissionRole / SubmissionAgeRange in annotations-api.ts.

export const ROLE_DISPLAY: Record<string, string> = {
  resident: "Resident",
  student: "Student",
  retail_owner: "Local business owner",
  transit_rider: "Transit rider",
  visitor: "Visitor",
  planner_stakeholder: "Planner",
};

export const AGE_DISPLAY: Record<string, string> = {
  under_18: "Under 18",
  "18_24": "18–24",
  "25_34": "25–34",
  "35_44": "35–44",
  "45_54": "45–54",
  "55_64": "55–64",
  "65_plus": "65+",
  prefer_not_to_say: "",
};

export function getRoleDisplay(role: string | null | undefined): string {
  if (!role) return "Anonymous";
  return ROLE_DISPLAY[role] ?? "Community member";
}

export function getAgeDisplay(age: string | null | undefined): string {
  if (!age) return "";
  return AGE_DISPLAY[age] ?? "";
}

// Coarse demographic bucket used by the Living Desk theme cards' stack-
// bar visualization (Session 10B will render colored segments per group).
// We collapse 6 roles + 8 age ranges into 5 mutually-exclusive groups so
// the bar stays legible even for small theme clusters.
export type DemographicGroup =
  | "student"
  | "transit"
  | "senior"
  | "stakeholder"
  | "resident"
  | "other";

export function getDemographicGroup(
  role: string | null | undefined,
  age: string | null | undefined,
): DemographicGroup {
  if (!role) return "other";
  if (role === "student") return "student";
  if (role === "transit_rider") return "transit";
  if (age === "65_plus" || age === "55_64") return "senior";
  if (role === "planner_stakeholder" || role === "retail_owner")
    return "stakeholder";
  return "resident";
}
