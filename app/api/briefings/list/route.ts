import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/briefings/list — returns the most recent briefing_versions
// rows (id, generated_at, counts, label) for the Panel 05 archive list.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServerSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase server env vars.");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getServerSupabase();

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const { data, error } = await supabase
      .from("briefing_versions")
      .select(
        "id, generated_at, contribution_count, theme_count, briefing_label",
      )
      .order("generated_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);

    return NextResponse.json({ briefings: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[briefings/list]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
