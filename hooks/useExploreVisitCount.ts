"use client";

import { useEffect, useRef, useState } from "react";

const VISIT_KEY = "ibx-explore-visit-count";

// Increments and returns the running visit count for /explore.
// Exactly one increment per real mount — guarded against React 18
// StrictMode's setup → cleanup → setup double-fire via a ref that
// persists across the cleanup (same component instance). A genuine
// route change (away then back) creates a new instance with a fresh
// ref, so it increments correctly on legitimate revisits.
//
// Returns 0 until the effect lands; the toast's gating requires
// count >= 2, so a 0 will never trigger a false positive.
export function useExploreVisitCount(): number {
  const [count, setCount] = useState(0);
  const incrementedRef = useRef(false);

  useEffect(() => {
    if (incrementedRef.current) return;
    incrementedRef.current = true;
    try {
      const raw = window.localStorage.getItem(VISIT_KEY);
      const prev = raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
      const next = prev + 1;
      window.localStorage.setItem(VISIT_KEY, String(next));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- canonical hydration-safe localStorage read; mirrors app/explore/page.tsx pattern
      setCount(next);
    } catch {
      setCount(1);
    }
  }, []);

  return count;
}
