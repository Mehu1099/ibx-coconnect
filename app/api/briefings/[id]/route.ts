import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/briefings/[id] — returns the full briefing_versions row
// (snapshot + executive summary) so the print client can re-render
// the historical state. Authenticated stakeholders only.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServerSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase server env vars.");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ briefing: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[briefings/[id]]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
