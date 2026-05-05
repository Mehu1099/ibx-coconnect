import { getAnonymousSessionId, supabase } from "@/lib/supabase-client";

// Returns true when the current viewer has at least one row in
// `submissions` — the parent table that every contribution path
// writes to via submitContributions(). One head-count lookup
// covers all contribution types (concerns, visions, sketches,
// notes, AI proposals, question responses).
//
// Attribution mirrors the rest of the app: authenticated users
// are identified by Supabase user_id; anonymous viewers by the
// persistent localStorage session id (with user_id IS NULL so a
// stakeholder's rows never leak into an anonymous viewer).
//
// Fail-safe: any error → false. Better to suppress the nudge
// than show it incorrectly.

type Entry = {
  promise: Promise<boolean>;
  resolvedTrue: boolean;
  t: number;
};

// Module-level dedupe so the toast and the nav dot — both of
// which mount on /explore — share a single in-flight query.
// Sticky-true: once a viewer has contributed, the answer can't
// flip back, so we cache forever. False results are re-checked
// after a short TTL so the dot flips on after a fresh contribution.
const cache = new Map<string, Entry>();
const FALSE_TTL_MS = 60_000;

export async function userHasContributions(
  authenticatedUserId: string | null,
): Promise<boolean> {
  const key = authenticatedUserId ?? `anon:${getAnonymousSessionId()}`;
  const entry = cache.get(key);
  if (entry?.resolvedTrue) return entry.promise;
  if (entry && Date.now() - entry.t < FALSE_TTL_MS) return entry.promise;

  const promise = (async () => {
    try {
      const base = supabase
        .from("submissions")
        .select("*", { count: "exact", head: true });
      const query = authenticatedUserId
        ? base.eq("user_id", authenticatedUserId)
        : base
            .eq("anonymous_session_id", getAnonymousSessionId())
            .is("user_id", null);

      const { count, error } = await query;
      if (error) return false;
      return (count ?? 0) > 0;
    } catch {
      return false;
    }
  })();

  const next: Entry = { promise, resolvedTrue: false, t: Date.now() };
  cache.set(key, next);
  void promise.then((v) => {
    next.resolvedTrue = v;
  });
  return promise;
}
