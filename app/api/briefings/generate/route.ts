import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

// POST /api/briefings/generate — captures the current filtered snapshot
// from the Analyze dashboard, calls Claude for the executive-summary
// prose, persists the result as an immutable briefing_versions row, and
// returns { id, briefing_label } so the client can open the print route.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Opus calls run ~5–15s on this prompt size; bump above the default
// hobby-tier 10s so we don't 504 mid-generation.
export const maxDuration = 60;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-7";

function getServerSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase server env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function getAnthropicKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Missing ANTHROPIC_API_KEY in env.");
  return key;
}

interface SnapshotTheme {
  id: string;
  name: string;
  summary?: string;
  kind: "concern" | "vision";
  contribution_ids: string[];
  demographic_distribution?: Record<string, number>;
}

interface SnapshotContribution {
  id: string;
  rawId: string;
  type: string;
  locationId: string;
  content: string;
  contributorRole: string;
  contributorAge: string;
  createdAt: string;
}

interface SnapshotLocation {
  id: string;
  label: string;
  description: string;
  image: string;
  category: string;
}

interface GenerateBody {
  filter_state: {
    status: string;
    selectedThemeId: string | null;
    search: string;
    type: string;
    location: string;
  };
  snapshot_data: {
    themes: SnapshotTheme[];
    contributions: SnapshotContribution[];
    locations: SnapshotLocation[];
    generationTimestamp: string;
  };
  contribution_count: number;
  theme_count: number;
  theme_generation_id: string | null;
}

const LOCATION_SHORT_NAMES: Record<string, string> = {
  "01": "Flatbush × Glenwood",
  "02": "Station Exit",
  "03": "The Junction",
  "04": "Hillel Place",
  "05": "Campus Rd Co-op",
  "06": "Brooklyn College",
  "07": "South of IBX",
  "08": "Avenue I",
};

export async function POST(req: NextRequest) {
  try {
    const supabase = getServerSupabase();

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
    const userId = userData.user.id;

    const body = (await req.json()) as GenerateBody;
    if (
      !body.snapshot_data ||
      !Array.isArray(body.snapshot_data.themes) ||
      !Array.isArray(body.snapshot_data.contributions)
    ) {
      return NextResponse.json(
        { error: "Invalid snapshot payload" },
        { status: 400 },
      );
    }
    if (body.contribution_count === 0) {
      return NextResponse.json(
        { error: "No contributions match the current filter." },
        { status: 400 },
      );
    }

    const summary = await callClaudeForSummary(body);

    const briefingLabel = formatBriefingLabel(body.contribution_count);

    const { data: row, error: insertError } = await supabase
      .from("briefing_versions")
      .insert({
        generated_by: userId,
        theme_generation_id: body.theme_generation_id,
        contribution_count: body.contribution_count,
        theme_count: body.theme_count,
        filter_state: body.filter_state,
        snapshot_data: body.snapshot_data,
        executive_summary: summary,
        briefing_label: briefingLabel,
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`Failed to insert briefing: ${insertError.message}`);
    }

    return NextResponse.json({
      id: row.id,
      briefing_label: briefingLabel,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[briefings/generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function callClaudeForSummary(body: GenerateBody): Promise<string> {
  // Three structured data blocks so the model can cite specifically
  // without hunting through raw rows. We deliberately strip ids and
  // demographic role keys we don't reference in the prose to keep the
  // payload focused.
  const themesForPrompt = body.snapshot_data.themes.map((t) => ({
    name: t.name,
    kind: t.kind,
    voice_count: t.contribution_ids.length,
    demographic_distribution: t.demographic_distribution ?? {},
  }));

  const byLocation: Record<
    string,
    { name: string; concern_count: number; vision_count: number; total: number }
  > = {};
  body.snapshot_data.contributions.forEach((c) => {
    const id = c.locationId;
    if (!byLocation[id]) {
      byLocation[id] = {
        name: LOCATION_SHORT_NAMES[id] ?? `Location ${id}`,
        concern_count: 0,
        vision_count: 0,
        total: 0,
      };
    }
    const isVision = c.type === "ai_proposal";
    if (isVision) byLocation[id].vision_count += 1;
    else byLocation[id].concern_count += 1;
    byLocation[id].total += 1;
  });

  const totals = {
    contribution_count: body.contribution_count,
    theme_count: body.theme_count,
    generation_timestamp: body.snapshot_data.generationTimestamp,
  };

  const prompt = `You are writing the executive summary for a community engagement briefing on the proposed Interborough Express (IBX) light rail at the Flatbush–Brooklyn College station area. You are writing for urban planners, MTA stakeholders, and elected officials who will make decisions based on this document.

Below is the current state of community input. Write a 3-paragraph executive summary in clear, professional planning prose. Each paragraph ~80–110 words.

Paragraph 1 — What people are telling us. Synthesize the dominant themes. Use the voice counts to weight emphasis. Mention the 1-2 most-voiced concerns and the most-voiced vision.

Paragraph 2 — Where the conversation is concentrated. Use the location data to identify which parts of the corridor are generating the most input and what kinds of feedback (concerns vs. visions) cluster where. Reference specific locations by name.

Paragraph 3 — What this suggests. Offer a measured, planner-voice synthesis of what to investigate first. Do NOT make policy recommendations. Frame as "the data points toward..." or "the next analytical step is...". Avoid hype, avoid filler. End on a forward-looking note.

DATA:

Themes (with voice counts and demographic breakdown):
\`\`\`json
${JSON.stringify(themesForPrompt, null, 2)}
\`\`\`

Contributions by location (concern vs. vision split):
\`\`\`json
${JSON.stringify(byLocation, null, 2)}
\`\`\`

Totals:
\`\`\`json
${JSON.stringify(totals, null, 2)}
\`\`\`

Constraints:
- Do not invent data. Only use what is in the JSON above.
- Do not use bullet points or headers — flowing prose only.
- Avoid words: "leverage", "stakeholder buy-in", "on the ground", "robust", "actionable insights".
- US English. Past or present tense as appropriate. No first person.

Return only the three paragraphs separated by blank lines. No preamble, no headers, no commentary.`;

  const claudeRes = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getAnthropicKey(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!claudeRes.ok) {
    const errText = await claudeRes.text();
    throw new Error(`Claude API error: ${claudeRes.status} ${errText}`);
  }

  const claudeData = (await claudeRes.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const summary = (claudeData.content[0]?.text ?? "").trim();
  if (!summary) throw new Error("Claude returned an empty summary");
  return summary;
}

function formatBriefingLabel(contributionCount: number): string {
  const date = new Date();
  const dateStr = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `Briefing · ${dateStr} · ${contributionCount} contribution${
    contributionCount === 1 ? "" : "s"
  }`;
}
