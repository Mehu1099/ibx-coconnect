"use client";

import { useEffect, useState } from "react";
import {
  getConcernWeightByLocation,
  loadConcerns,
} from "./annotations-api";
import type { DatabaseConcern } from "./database-types";
import { supabase } from "./supabase-client";

// Per-location feed. Subscribes to INSERT + UPDATE on `concerns` filtered
// by location_id so the warning markers and the active-concerns banner
// stay live without manual refresh. INSERT prepends to the front (newest
// first). UPDATE replaces in-place so echo_count bumps are reflected.

export function useRealtimeConcerns(locationId: string) {
  const [concerns, setConcerns] = useState<DatabaseConcern[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!locationId) return;
    let cancelled = false;

    loadConcerns(locationId).then((data) => {
      if (cancelled) return;
      setConcerns(data);
      setIsLoading(false);
    });

    const channel = supabase
      .channel(`concerns-${locationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "concerns",
          filter: `location_id=eq.${locationId}`,
        },
        (payload) => {
          if (cancelled) return;
          const row = payload.new as DatabaseConcern;
          setConcerns((prev) => {
            // Guard against double-deliver (initial-load race + realtime).
            if (prev.some((c) => c.id === row.id)) return prev;
            return [row, ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "concerns",
          filter: `location_id=eq.${locationId}`,
        },
        (payload) => {
          if (cancelled) return;
          const row = payload.new as DatabaseConcern;
          setConcerns((prev) =>
            prev.map((c) => (c.id === row.id ? row : c)),
          );
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [locationId]);

  return { concerns, isLoading };
}

// Cross-location weight map for the Explore page pins. Re-fetches the
// full sum on every INSERT/UPDATE/DELETE — concerns are low-volume and
// grouping client-side is simpler than maintaining a delta. UPDATE
// matters because the badge tracks WEIGHT (creator + echoes), not row
// count: every echo bumps echo_count via UPDATE and must repaint the
// badge live. DELETE is included for completeness if rows are ever
// removed by an admin tool.

export function useRealtimeConcernCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    async function refetch() {
      const data = await getConcernWeightByLocation();
      if (!cancelled) setCounts(data);
    }

    refetch();

    const channel = supabase
      .channel("concerns-counts-global")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "concerns" },
        refetch,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "concerns" },
        refetch,
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "concerns" },
        refetch,
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return counts;
}
