import type {
  DatabaseAnnotation,
  DatabaseConcern,
  DatabaseQuestionResponse,
} from "./database-types";
import type {
  DraftAnnotation,
  DraftQuestionResponse,
} from "./draft-state";
import { getAnonymousSessionId, supabase } from "./supabase-client";

// ── Submission types ───────────────────────────────────────────────────────

export type SubmissionRole =
  | "resident"
  | "student"
  | "retail_owner"
  | "transit_rider"
  | "visitor"
  | "planner_stakeholder";

export type SubmissionAgeRange =
  | "under_18"
  | "18_24"
  | "25_34"
  | "35_44"
  | "45_54"
  | "55_64"
  | "65_plus"
  | "prefer_not_to_say";

export interface SubmissionData {
  role: SubmissionRole;
  ageRange: SubmissionAgeRange;
  organization?: string;
  isStakeholder?: boolean;
}

export interface SubmittedRow {
  id: string;
  // Other columns omitted — we only need the id for linking inserts.
}

// ── Annotations (sticky notes) ──────────────────────────────────────────────

export async function loadAnnotations(
  locationId: string,
): Promise<DatabaseAnnotation[]> {
  const { data, error } = await supabase
    .from("annotations")
    .select("*")
    .eq("location_id", locationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading annotations:", error);
    return [];
  }
  return (data ?? []) as DatabaseAnnotation[];
}

export async function createStickyNote(
  locationId: string,
  x: number,
  y: number,
  content: string,
): Promise<DatabaseAnnotation | null> {
  const { data, error } = await supabase
    .from("annotations")
    .insert({
      location_id: locationId,
      type: "sticky",
      x_position: x,
      y_position: y,
      content,
      anonymous_session_id: getAnonymousSessionId(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating sticky note:", error);
    return null;
  }
  return data as DatabaseAnnotation;
}

export async function updateAnnotationContent(
  annotationId: string,
  content: string,
): Promise<DatabaseAnnotation | null> {
  const { data, error } = await supabase
    .from("annotations")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", annotationId)
    .select()
    .single();

  if (error) {
    console.error("Error updating annotation:", error);
    return null;
  }
  return data as DatabaseAnnotation;
}

export async function deleteAnnotation(
  annotationId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("annotations")
    .delete()
    .eq("id", annotationId);

  if (error) {
    console.error("Error deleting annotation:", error);
    return false;
  }
  return true;
}

// ── Question responses ──────────────────────────────────────────────────────

export async function loadQuestionResponses(
  locationId: string,
): Promise<DatabaseQuestionResponse[]> {
  const { data, error } = await supabase
    .from("question_responses")
    .select("*")
    .eq("location_id", locationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading responses:", error);
    return [];
  }
  return (data ?? []) as DatabaseQuestionResponse[];
}

export async function createQuestionResponse(
  locationId: string,
  questionIndex: number,
  response: string,
): Promise<DatabaseQuestionResponse | null> {
  const { data, error } = await supabase
    .from("question_responses")
    .insert({
      location_id: locationId,
      question_index: questionIndex,
      response,
      anonymous_session_id: getAnonymousSessionId(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating response:", error);
    return null;
  }
  return data as DatabaseQuestionResponse;
}

// ── Concerns ────────────────────────────────────────────────────────────────

export async function loadConcerns(
  locationId: string,
): Promise<DatabaseConcern[]> {
  const { data, error } = await supabase
    .from("concerns")
    .select("*")
    .eq("location_id", locationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading concerns:", error);
    return [];
  }
  return (data ?? []) as DatabaseConcern[];
}

// ── Batch submission ────────────────────────────────────────────────────────
// Inserts the submission row first, then uses its id to fan out the
// drafts as Supabase rows. Returns { success, submission? } so the
// caller can show success/failure UI.

export async function submitContributions(
  locationId: string,
  draftAnnotations: DraftAnnotation[],
  draftResponses: DraftQuestionResponse[],
  submissionData: SubmissionData,
): Promise<
  | { success: true; submission: SubmittedRow }
  | { success: false; error: unknown }
> {
  const sessionId = getAnonymousSessionId();
  const totalCount = draftAnnotations.length + draftResponses.length;

  // 1. Create the parent submission row.
  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .insert({
      anonymous_session_id: sessionId,
      role: submissionData.role,
      age_range: submissionData.ageRange,
      organization: submissionData.organization || null,
      is_stakeholder: submissionData.isStakeholder ?? false,
      location_id: locationId,
      contribution_count: totalCount,
    })
    .select()
    .single();

  if (submissionError || !submission) {
    console.error("Submission creation failed:", submissionError);
    return { success: false, error: submissionError };
  }

  const submissionId = (submission as { id: string }).id;

  // 2. Fan out annotation drafts.
  if (draftAnnotations.length > 0) {
    const annotationsToInsert = draftAnnotations.map((d) => ({
      location_id: locationId,
      type: d.type,
      x_position: d.x,
      y_position: d.y,
      content: d.content,
      anonymous_session_id: sessionId,
      submission_id: submissionId,
    }));

    const { error: annotationsError } = await supabase
      .from("annotations")
      .insert(annotationsToInsert);

    if (annotationsError) {
      console.error("Annotations insert failed:", annotationsError);
      return { success: false, error: annotationsError };
    }
  }

  // 3. Fan out question-response drafts.
  if (draftResponses.length > 0) {
    const responsesToInsert = draftResponses.map((d) => ({
      location_id: locationId,
      question_index: d.questionIndex,
      response: d.response,
      anonymous_session_id: sessionId,
      submission_id: submissionId,
    }));

    const { error: responsesError } = await supabase
      .from("question_responses")
      .insert(responsesToInsert);

    if (responsesError) {
      console.error("Responses insert failed:", responsesError);
      return { success: false, error: responsesError };
    }
  }

  return { success: true, submission: { id: submissionId } };
}

// Returns { locationId → count } across all locations. Used by the
// explore page to decorate pins with a concern badge.
export async function getConcernCountByLocation(): Promise<
  Record<string, number>
> {
  const { data, error } = await supabase
    .from("concerns")
    .select("location_id");

  if (error) {
    console.error("Error counting concerns:", error);
    return {};
  }

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { location_id: string }[]) {
    counts[row.location_id] = (counts[row.location_id] ?? 0) + 1;
  }
  return counts;
}
