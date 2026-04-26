import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SESSION_KEY = "ibx-anon-session-id";

// Persistent anonymous session id, stored client-side. Identifies an
// unauthenticated browser across page loads so writes can be attributed
// (and later edited / deleted) without forcing the user to sign in.
export function getAnonymousSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Private mode / disabled storage — return a per-call ephemeral id
    // so the call still goes through; just won't persist across loads.
    return `anon_ephemeral_${Date.now()}`;
  }
}
