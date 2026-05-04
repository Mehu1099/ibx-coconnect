"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase-client";

export type ThemeStatus =
  | "unassigned"
  | "priority"
  | "investigating"
  | "addressed";

export interface ThemeStatusRecord {
  theme_id: string;
  status: ThemeStatus;
  notes: string | null;
  updated_by: string | null;
  updated_at: string;
}

// Per-theme planner workflow status (priority / investigating / addressed
// / unassigned) backed by `public.theme_statuses`. Reads are realtime so
// two stakeholders triaging in parallel see each other's flips. Writes
// optimistically update local state, then upsert to the row keyed by
// theme_id (the table's PK), so the UI never lags the click.

export function useThemeStatuses() {
  const [statuses, setStatuses] = useState<Record<string, ThemeStatusRecord>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("theme_statuses")
      .select("*");

    if (error) {
      console.error("[useThemeStatuses] load failed:", error);
      setIsLoading(false);
      return;
    }

    const map: Record<string, ThemeStatusRecord> = {};
    (data ?? []).forEach((s) => {
      map[(s as ThemeStatusRecord).theme_id] = s as ThemeStatusRecord;
    });
    setStatuses(map);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- canonical async on-mount load; setState lands in the awaited continuation
    void load();

    const channel = supabase
      .channel("analyze-theme-statuses")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "theme_statuses" },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const setStatus = useCallback(
    async (themeId: string, newStatus: ThemeStatus, notes?: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();
      const next: ThemeStatusRecord = {
        theme_id: themeId,
        status: newStatus,
        notes: notes ?? null,
        updated_by: user.id,
        updated_at: now,
      };

      setStatuses((prev) => ({ ...prev, [themeId]: next }));

      const { error } = await supabase
        .from("theme_statuses")
        .upsert(next, { onConflict: "theme_id" });

      if (error) {
        console.error("[useThemeStatuses] upsert failed:", error);
      }
    },
    [],
  );

  const getStatus = useCallback(
    (themeId: string): ThemeStatus =>
      statuses[themeId]?.status ?? "unassigned",
    [statuses],
  );

  return {
    statuses,
    getStatus,
    setStatus,
    isLoading,
  };
}
