import type {
  DatabaseAIProposal,
  DatabaseAnnotation,
  DatabaseConcern,
  DatabaseQuestionResponse,
  DatabaseSketch,
} from "./database-types";
import type {
  DraftAIProposal,
  DraftAnnotation,
  DraftConcern,
  DraftQuestionResponse,
  DraftSketch,
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
  // The location photo page is a PRIVATE canvas — each user only sees
  // their own contributions. The future Engage page will pass false
  // to load everyone's annotations for the public collective view.
  filterByCurrentUser: boolean = true,
  // Authenticated stakeholders are identified by their Supabase user_id,
  // which persists across browsers. Anonymous users continue to be
  // identified by a localStorage session id (current browser only).
  authenticatedUserId?: string | null,
): Promise<DatabaseAnnotation[]> {
  let query = supabase
    .from("annotations")
    .select("*")
    .eq("location_id", locationId)
    .order("created_at", { ascending: true });

  if (filterByCurrentUser) {
    if (authenticatedUserId) {
      // Stakeholder canvas: strictly user_id-owned rows. Don't surface
      // any prior anonymous contributions from this browser.
      query = query.eq("user_id", authenticatedUserId);
    } else {
      // Anonymous canvas: strictly session-owned AND user_id IS NULL
      // (belt-and-suspenders so a stakeholder row never leaks into the
      // anonymous view even if both columns somehow match).
      query = query
        .eq("anonymous_session_id", getAnonymousSessionId())
        .is("user_id", null);
    }
  }

  const { data, error } = await query;

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
  // Same private-by-default contract as loadAnnotations.
  filterByCurrentUser: boolean = true,
  authenticatedUserId?: string | null,
): Promise<DatabaseQuestionResponse[]> {
  let query = supabase
    .from("question_responses")
    .select("*")
    .eq("location_id", locationId)
    .order("created_at", { ascending: false });

  if (filterByCurrentUser) {
    if (authenticatedUserId) {
      // Same belt-and-suspenders as loadAnnotations.
      query = query.eq("user_id", authenticatedUserId);
    } else {
      query = query
        .eq("anonymous_session_id", getAnonymousSessionId())
        .is("user_id", null);
    }
  }

  const { data, error } = await query;

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

// ── Sketches ────────────────────────────────────────────────────────────────

export async function loadSketches(
  locationId: string,
  // Same private-by-default contract as loadAnnotations / loadQuestionResponses.
  // The future Engage page will pass false for the public collective view.
  filterByCurrentUser: boolean = true,
  authenticatedUserId: string | null = null,
): Promise<DatabaseSketch[]> {
  let query = supabase
    .from("sketches")
    .select("*")
    .eq("location_id", locationId)
    .order("created_at", { ascending: true });

  if (filterByCurrentUser) {
    if (authenticatedUserId) {
      query = query.eq("user_id", authenticatedUserId);
    } else {
      query = query
        .eq("anonymous_session_id", getAnonymousSessionId())
        .is("user_id", null);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error loading sketches:", error);
    return [];
  }
  return (data ?? []) as DatabaseSketch[];
}

// ── AI proposals ────────────────────────────────────────────────────────────

export async function loadAIProposals(
  locationId: string,
  // Same private-by-default contract as the other loaders. AI proposals
  // are full-image alternatives; until we surface them on the public
  // Engage page they're scoped to the author's own canvas.
  filterByCurrentUser: boolean = true,
  authenticatedUserId: string | null = null,
): Promise<DatabaseAIProposal[]> {
  let query = supabase
    .from("ai_proposals")
    .select("*")
    .eq("location_id", locationId)
    // Only surface successful generations. Failed/pending rows would
    // never have a usable image_url anyway.
    .eq("generation_status", "succeeded")
    .order("created_at", { ascending: false });

  if (filterByCurrentUser) {
    if (authenticatedUserId) {
      query = query.eq("user_id", authenticatedUserId);
    } else {
      query = query
        .eq("anonymous_session_id", getAnonymousSessionId())
        .is("user_id", null);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error loading AI proposals:", error);
    return [];
  }
  return (data ?? []) as DatabaseAIProposal[];
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
  draftConcerns: DraftConcern[],
  draftSketch: DraftSketch | null,
  draftAIProposals: DraftAIProposal[],
  submissionData: SubmissionData,
  // Authenticated stakeholders pass their Supabase user.id; rows are
  // tagged with user_id and anonymous_session_id is left null. Anonymous
  // users continue to be tagged by session id only. Either way, the
  // private-canvas filter on read uses the matching column.
  userId: string | null = null,
): Promise<
  | { success: true; submission: SubmittedRow }
  | { success: false; error: unknown }
> {
  const sessionId = userId ? null : getAnonymousSessionId();
  const sketchCount =
    draftSketch && draftSketch.strokes.length > 0 ? 1 : 0;
  const totalCount =
    draftAnnotations.length +
    draftResponses.length +
    draftConcerns.length +
    sketchCount +
    draftAIProposals.length;
  // Stakeholder when authenticated OR when the anonymous form's role
  // self-identifies as one — keep the existing flag honored.
  const isStakeholder = !!userId || (submissionData.isStakeholder ?? false);

  // 1. Create the parent submission row.
  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .insert({
      anonymous_session_id: sessionId,
      user_id: userId,
      role: submissionData.role,
      age_range: submissionData.ageRange,
      organization: submissionData.organization || null,
      is_stakeholder: isStakeholder,
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
      user_id: userId,
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
      user_id: userId,
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

  // 4. Fan out concern drafts. Concerns are PUBLIC — every user sees
  // every concern — but they're still linked back to this submission
  // via submission_id so the planner-side dashboards can attribute them.
  if (draftConcerns.length > 0) {
    const concernsToInsert = draftConcerns.map((d) => ({
      location_id: locationId,
      x_position: d.x,
      y_position: d.y,
      description: d.description,
      category: d.category,
      anonymous_session_id: sessionId,
      user_id: userId,
      submission_id: submissionId,
      echo_count: 0,
    }));

    const { error: concernsError } = await supabase
      .from("concerns")
      .insert(concernsToInsert);

    if (concernsError) {
      console.error("Concerns insert failed:", concernsError);
      return { success: false, error: concernsError };
    }
  }

  // 5. Insert the sketch (one row per submission, holding the full
  // strokes array as JSONB). Skipped if the user's draft is empty.
  if (draftSketch && draftSketch.strokes.length > 0) {
    const { error: sketchError } = await supabase.from("sketches").insert({
      location_id: locationId,
      strokes: draftSketch.strokes,
      anonymous_session_id: sessionId,
      user_id: userId,
      submission_id: submissionId,
    });

    if (sketchError) {
      console.error("Sketch insert failed:", sketchError);
      return { success: false, error: sketchError };
    }
  }

  // 6. Fan out AI proposal drafts. The image already lives in Supabase
  // Storage by this point (the polling endpoint uploads it the moment
  // the prediction succeeds); we're only writing the row that links
  // the public URL to this submission.
  if (draftAIProposals.length > 0) {
    const proposalsToInsert = draftAIProposals.map((d) => ({
      location_id: locationId,
      prompt: d.prompt,
      generated_image_url: d.imageUrl,
      storage_path: d.storagePath,
      replicate_prediction_id: d.predictionId,
      generation_status: "succeeded" as const,
      anonymous_session_id: sessionId,
      user_id: userId,
      submission_id: submissionId,
    }));

    const { error: aiError } = await supabase
      .from("ai_proposals")
      .insert(proposalsToInsert);

    if (aiError) {
      console.error("AI proposals insert failed:", aiError);
      return { success: false, error: aiError };
    }
  }

  return { success: true, submission: { id: submissionId } };
}

// Echo = "I'm concerned too." A bare upvote on someone else's concern.
// Tries the SQL RPC first (atomic increment); falls back to a non-atomic
// fetch+update if the RPC isn't installed yet. Returns true on success.
//
// SQL to install the RPC once in the Supabase SQL editor:
//
//   CREATE OR REPLACE FUNCTION increment_concern_echo(concern_id UUID)
//   RETURNS void AS $$
//     UPDATE concerns SET echo_count = echo_count + 1 WHERE id = concern_id;
//   $$ LANGUAGE SQL;
export async function echoConcern(concernId: string): Promise<boolean> {
  const { error } = await supabase.rpc("increment_concern_echo", {
    concern_id: concernId,
  });
  if (!error) return true;

  const { data } = await supabase
    .from("concerns")
    .select("echo_count")
    .eq("id", concernId)
    .single();
  if (!data) return false;

  const { error: updateError } = await supabase
    .from("concerns")
    .update({ echo_count: (data.echo_count ?? 0) + 1 })
    .eq("id", concernId);

  return !updateError;
}

// Returns { locationId → weight } across all locations. Used by the
// explore page to decorate pins with a concern badge.
//
// "Weight" = creator + echoers. Each row contributes (1 + echo_count)
// to its location's total — so a single concern with 2 echoes counts
// as 3 voices, not 1 row. The Explore badge, the location-page banner,
// and the bottom-right pill all use this same metric for consistency.
export async function getConcernWeightByLocation(): Promise<
  Record<string, number>
> {
  const { data, error } = await supabase
    .from("concerns")
    .select("location_id, echo_count");

  if (error) {
    console.error("Error counting concerns:", error);
    return {};
  }

  const weights: Record<string, number> = {};
  for (const row of (data ?? []) as {
    location_id: string;
    echo_count: number | null;
  }[]) {
    const w = 1 + (row.echo_count ?? 0);
    weights[row.location_id] = (weights[row.location_id] ?? 0) + w;
  }
  return weights;
}

// Back-compat alias. Older callers expected row counts; they now get
// weights instead, which is the correct metric for badge display.
export const getConcernCountByLocation = getConcernWeightByLocation;
