import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Defensive: don't throw at module evaluation. Throwing breaks the
  // Vercel build (and any other env that statically analyses imports)
  // before there's a chance to surface a useful message. Log loudly
  // and fall back to placeholders so the build completes; any actual
  // Supabase call at runtime will fail with a network error that the
  // helpers in annotations-api.ts already catch and console.error.
  console.error(
    "[IBX Co-Connect] Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local (locally) or Vercel project settings (production).",
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
);

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
