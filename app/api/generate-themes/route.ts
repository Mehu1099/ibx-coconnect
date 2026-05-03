import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { PLANNER_QUESTIONS } from "@/lib/planner-questions";

// Server-side route. Reads every submitted contribution, hands them to
// Claude for thematic clustering, and writes the resulting themes to
// the `themes` table tagged with a fresh `generation_id`. Authenticated
// users only — the auth header proves the caller is a stakeholder; the
// service-role Supabase client does the privileged inserts.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Clustering takes ~10–30s on a typical Sonnet call; bump above the
// default 10s hobby-tier limit so we don't 504 mid-generation.
export const maxDuration = 60;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
// User spec called for `claude-sonnet-4-5`. The platform default for new
// AI features is `claude-sonnet-4-6` (see CLAUDE.md / system guidance);
// the prompt structure works on either model and the upgrade is a
// single-constant change if you want to pin to an older Sonnet.
const MODEL = "claude-sonnet-4-6";

type ContributionType =
  | "sticky"
  | "concern"
  | "question_response"
  | "ai_proposal";

interface ContributionForPrompt {
  id: string; // composite "type:rawId"
  type: ContributionType;
  location_id: string;
  content: string;
  category?: string;
  question?: string;
  prompt?: string;
  title?: string;
  role: string;
  age_range: string;
}

interface ParsedTheme {
  name: string;
  summary: string;
  kind: "concern" | "vision";
  contribution_count: number;
  contribution_ids: string[];
  station_distribution: Record<string, number>;
  demographic_distribution: Record<string, number>;
}

// Slim row shapes for the four source tables.
interface StickyRow {
  id: string;
  location_id: string;
  type: string;
  content: string | null;
  submission_id: string;
}
interface ConcernRow {
  id: string;
  location_id: string;
  category: string | null;
  description: string;
  submission_id: string;
}
interface ResponseRow {
  id: string;
  location_id: string;
  question_index: number;
  response: string;
  submission_id: string;
}
interface ProposalRow {
  id: string;
  location_id: string;
  prompt: string;
  title: string | null;
  submission_id: string;
}
interface SubmissionRow {
  id: string;
  role: string | null;
  age_range: string | null;
}

// ── Lazy server clients ────────────────────────────────────────────────────
// Created inside the handler rather than at module scope so a missing
// env var shows up as a clean 500 at request time, not a build crash.

function getServerSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase server env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (and in Vercel environment variables for production).",
    );
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function getAnthropicKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "Missing ANTHROPIC_API_KEY. Add it to .env.local (and Vercel env vars).",
    );
  }
  return key;
}

// ── Route ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;
  let supabase: SupabaseClient | null = null;

  try {
    supabase = getServerSupabase();

    // Auth: require a Supabase JWT in the Authorization header. Any
    // authenticated user counts as a stakeholder for now (the button
    // that triggers this route is gated client-side too).
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized — stakeholder login required" },
        { status: 401 },
      );
    }
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: userData, error: authError } =
      await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json(
        { error: "Invalid auth token" },
        { status: 401 },
      );
    }
    userId = userData.user.id;

    const contributions = await fetchAllSubmittedContributions(supabase);

    if (contributions.length < 3) {
      return NextResponse.json(
        {
          error: `Need at least 3 contributions to generate themes. Currently have ${contributions.length}.`,
        },
        { status: 400 },
      );
    }

    // Call Claude with the static instructions cached and the dynamic
    // contributions JSON in a separate (uncached) content block. Repeat
    // generations within ~5 minutes will hit the cache for the
    // instructions and only pay for the JSON + output.
    const claudeResponse = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAnthropicKey(),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: STATIC_INSTRUCTIONS,
                cache_control: { type: "ephemeral" },
              },
              {
                type: "text",
                text: buildContributionsBlock(contributions),
              },
            ],
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      throw new Error(
        `Claude API error: ${claudeResponse.status} ${errorText}`,
      );
    }

    const claudeData = (await claudeResponse.json()) as {
      content: Array<{ type: string; text?: string }>;
    };
    const claudeText = claudeData.content[0]?.text ?? "";

    const themes = parseClaudeThemes(claudeText, contributions);
    const validThemes = themes.filter((t) => t.contribution_ids.length >= 2);
    if (validThemes.length === 0) {
      throw new Error(
        "Claude returned no valid themes (each must have 2+ contributions)",
      );
    }

    const generationId = crypto.randomUUID();
    const themesToInsert = validThemes.map((t) => ({
      ...t,
      generation_id: generationId,
    }));

    const { error: insertError } = await supabase
      .from("themes")
      .insert(themesToInsert);

    if (insertError) {
      throw new Error(`Failed to insert themes: ${insertError.message}`);
    }

    await supabase.from("theme_generations").insert({
      generated_by: userId,
      contribution_count: contributions.length,
      theme_count: validThemes.length,
      duration_ms: Date.now() - startTime,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      generation_id: generationId,
      theme_count: validThemes.length,
      contribution_count: contributions.length,
      duration_ms: Date.now() - startTime,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-themes]", message);

    // Best-effort failure log. If Supabase setup itself failed we won't
    // have a client; swallow that secondary error.
    try {
      if (supabase) {
        await supabase.from("theme_generations").insert({
          generated_by: userId,
          contribution_count: 0,
          theme_count: 0,
          duration_ms: Date.now() - startTime,
          status: "failed",
          error_message: message,
        });
      }
    } catch {
      /* ignore */
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Data fetch ─────────────────────────────────────────────────────────────

async function fetchAllSubmittedContributions(
  supabase: SupabaseClient,
): Promise<ContributionForPrompt[]> {
  const [stickiesRes, concernsRes, responsesRes, proposalsRes] =
    await Promise.all([
      supabase
        .from("annotations")
        .select("id, location_id, type, content, submission_id")
        .eq("type", "sticky")
        .not("submission_id", "is", null),
      supabase
        .from("concerns")
        .select("id, location_id, category, description, submission_id")
        .not("submission_id", "is", null),
      supabase
        .from("question_responses")
        .select(
          "id, location_id, question_index, response, submission_id",
        )
        .not("submission_id", "is", null),
      supabase
        .from("ai_proposals")
        .select("id, location_id, prompt, title, submission_id")
        .not("submission_id", "is", null),
    ]);

  const stickies = (stickiesRes.data ?? []) as StickyRow[];
  const concerns = (concernsRes.data ?? []) as ConcernRow[];
  const responses = (responsesRes.data ?? []) as ResponseRow[];
  const proposals = (proposalsRes.data ?? []) as ProposalRow[];

  const submissionIds = Array.from(
    new Set(
      [
        ...stickies.map((s) => s.submission_id),
        ...concerns.map((c) => c.submission_id),
        ...responses.map((r) => r.submission_id),
        ...proposals.map((p) => p.submission_id),
      ].filter((id): id is string => Boolean(id)),
    ),
  );

  const submissionMap = new Map<string, SubmissionRow>();
  if (submissionIds.length > 0) {
    const { data: subs } = await supabase
      .from("submissions")
      .select("id, role, age_range")
      .in("id", submissionIds);
    ((subs ?? []) as SubmissionRow[]).forEach((s) => {
      submissionMap.set(s.id, s);
    });
  }

  const all: ContributionForPrompt[] = [];

  stickies.forEach((s) => {
    const sub = submissionMap.get(s.submission_id);
    all.push({
      id: `sticky:${s.id}`,
      type: "sticky",
      location_id: s.location_id,
      content: s.content ?? "",
      role: sub?.role ?? "unknown",
      age_range: sub?.age_range ?? "unknown",
    });
  });

  concerns.forEach((c) => {
    const sub = submissionMap.get(c.submission_id);
    all.push({
      id: `concern:${c.id}`,
      type: "concern",
      location_id: c.location_id,
      content: c.description,
      category: c.category ?? undefined,
      role: sub?.role ?? "unknown",
      age_range: sub?.age_range ?? "unknown",
    });
  });

  responses.forEach((r) => {
    const sub = submissionMap.get(r.submission_id);
    const question =
      PLANNER_QUESTIONS[r.location_id]?.[r.question_index]?.question ?? "";
    all.push({
      id: `question_response:${r.id}`,
      type: "question_response",
      location_id: r.location_id,
      content: r.response,
      question,
      role: sub?.role ?? "unknown",
      age_range: sub?.age_range ?? "unknown",
    });
  });

  proposals.forEach((p) => {
    const sub = submissionMap.get(p.submission_id);
    all.push({
      id: `ai_proposal:${p.id}`,
      type: "ai_proposal",
      location_id: p.location_id,
      content: `${p.title ?? "AI Vision"}: ${p.prompt}`,
      prompt: p.prompt,
      title: p.title ?? undefined,
      role: sub?.role ?? "unknown",
      age_range: sub?.age_range ?? "unknown",
    });
  });

  return all;
}

// ── Prompt ─────────────────────────────────────────────────────────────────
// Static instructions live in their own const so they can be cached as a
// single content block. Anything that varies between calls (the JSON
// payload, the contribution count) goes in the second block.

const STATIC_INSTRUCTIONS = `You are a community engagement analyst working on the Interborough Express (IBX) light rail planning project in Brooklyn, NYC. Your task is to read community contributions about 8 specific locations around the proposed Flatbush–Brooklyn College station and identify meaningful thematic patterns.

# CONTEXT

These contributions came from residents, students, business owners, transit riders, and visitors who walked through 8 locations on the platform's Explore page. They left sticky notes, raised concerns, answered planner questions, and generated AI vision images of how each place could change.

The 8 locations:
- 01: Flatbush Avenue & Glenwood Road (commercial intersection)
- 02: Exit street for the 2 and 5 MTA stations
- 03: The Junction (heavy transit hub)
- 04: Hillel Place pedestrianized street
- 05: Student co-op housing on Campus Road
- 06: Main street through Brooklyn College
- 07: Dead-end street south of the IBX line
- 08: Southern residential streets along Avenue I

# YOUR TASK

Read all contributions provided in the next block and identify 3-8 meaningful themes. Themes should:

1. Be specific and journalistic (e.g., "Late-night safety on student walking routes" — NOT generic like "Safety concerns")
2. Have at least 2 contributions per theme (1-contribution clusters are not themes)
3. Group contributions by SUBSTANCE, not just by category enum or location
4. Separate clearly into two kinds:
   - **kind: "concern"** — patterns from sticky notes, concerns, and planner responses (issues, observations, frustrations, ideas about what's missing)
   - **kind: "vision"** — patterns from AI proposals (visions for what the place could become)
5. Have a 1-2 sentence summary capturing the distinctive thread across the contributions
6. Acknowledge demographic diversity within the theme

# QUALITY OVER QUANTITY

It's far better to return 3 strong, defensible themes than 8 weak ones.

Strong themes have:
- 2+ contributions that are CLEARLY about the same underlying issue (not just related categories)
- A specific shared substance — same place, same population, same concern type, OR same proposed solution
- A theme name that accurately describes EVERY contribution in the cluster

Weak themes (REJECT THESE) have:
- Contributions grouped only because they share a category enum (e.g., all "safety" concerns)
- Contributions about different specific issues that happen to be in the same broad domain
- A theme name that only accurately describes one or two of the contributions

If a contribution doesn't have a clear pair (or more) on the same specific issue, LEAVE IT OUT of all themes. It's fine to return only 3-4 themes if the data only supports that.

Before finalizing each theme, ask yourself:
- If I removed the theme name, would these contributions OBVIOUSLY belong together?
- Does the theme name accurately describe what EACH contribution is about?
- Is the shared substance specific (same intersection, same population, same concrete issue)?

If the answer to any of these is "not really" — don't include that theme.

# OUTPUT FORMAT

Return ONLY a JSON array. No preamble, no markdown fences, no commentary. Just the array. Each theme follows this schema:

\`\`\`
{
  "name": "Late-night safety on student walking routes",
  "summary": "Students and faculty describe poor lighting and feeling unsafe on the corridor between campus and the train station after evening hours, with several reporting they take longer detours to feel safer.",
  "kind": "concern",
  "contribution_ids": ["concern:abc-123", "sticky:def-456", "question_response:ghi-789"]
}
\`\`\`

Notes:
- contribution_ids must be the EXACT id strings from the contributions block (format "type:rawId")
- name should be 5-10 words, specific and concrete
- summary should be 1-2 sentences, ~30-50 words
- kind is either "concern" or "vision" — never both
- Each theme must have 2+ contribution_ids

# CONTRIBUTIONS TO CLUSTER`;

function buildContributionsBlock(
  contributions: ContributionForPrompt[],
): string {
  const contribJson = contributions.map((c) => ({
    id: c.id,
    type: c.type,
    location: c.location_id,
    role: c.role,
    age: c.age_range,
    ...(c.category ? { category: c.category } : {}),
    ...(c.question ? { question: c.question } : {}),
    content: c.content,
  }));
  return `\n\n(${contributions.length} contributions)\n\n\`\`\`json\n${JSON.stringify(contribJson, null, 2)}\n\`\`\`\n\nNow identify the themes. Return only the JSON array.`;
}

// ── Parsing ────────────────────────────────────────────────────────────────

function parseClaudeThemes(
  claudeText: string,
  contributions: ContributionForPrompt[],
): ParsedTheme[] {
  let cleaned = claudeText.trim();
  cleaned = cleaned
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/```\s*$/m, "")
    .trim();

  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!arrayMatch) {
    throw new Error("Claude response did not contain a JSON array");
  }

  const parsed: unknown = JSON.parse(arrayMatch[0]);
  if (!Array.isArray(parsed)) {
    throw new Error("Claude response was not an array");
  }

  const validIds = new Set(contributions.map((c) => c.id));

  return parsed.map((rawTheme): ParsedTheme => {
    if (typeof rawTheme !== "object" || rawTheme === null) {
      throw new Error("Theme entry is not an object");
    }
    const theme = rawTheme as {
      name?: unknown;
      summary?: unknown;
      kind?: unknown;
      contribution_ids?: unknown;
    };
    if (
      typeof theme.name !== "string" ||
      typeof theme.summary !== "string" ||
      typeof theme.kind !== "string" ||
      !Array.isArray(theme.contribution_ids)
    ) {
      throw new Error(`Invalid theme structure: ${JSON.stringify(theme)}`);
    }
    if (theme.kind !== "concern" && theme.kind !== "vision") {
      throw new Error(`Invalid theme kind: ${theme.kind}`);
    }

    const validContribIds = (theme.contribution_ids as unknown[]).filter(
      (id): id is string => typeof id === "string" && validIds.has(id),
    );

    const stationDist: Record<string, number> = {};
    const demoDist: Record<string, number> = {};
    validContribIds.forEach((cid) => {
      const c = contributions.find((c) => c.id === cid);
      if (!c) return;
      stationDist[c.location_id] = (stationDist[c.location_id] ?? 0) + 1;
      demoDist[c.role] = (demoDist[c.role] ?? 0) + 1;
    });

    return {
      name: theme.name,
      summary: theme.summary,
      kind: theme.kind,
      contribution_count: validContribIds.length,
      contribution_ids: validContribIds,
      station_distribution: stationDist,
      demographic_distribution: demoDist,
    };
  });
}
