"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase-client";

export interface Theme {
  id: string;
  name: string;
  summary: string;
  kind: "concern" | "vision";
  contribution_count: number;
  station_distribution: Record<string, number>;
  demographic_distribution: Record<string, number>;
  contribution_ids: string[];
  generated_at: string;
  generation_id: string;
}

// Fetches the most recent generation's themes from the `themes` table
// and keeps them fresh via a realtime INSERT subscription. The Engage
// page only ever shows ONE generation at a time — the latest — so we
// reload on any insert (a fresh generation lands as a batch with a new
// `generation_id`).

export function useThemes() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [latestGenerationId, setLatestGenerationId] = useState<string | null>(
    null,
  );
  const [latestGeneratedAt, setLatestGeneratedAt] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // Find the latest generation. `maybeSingle` so an empty table
        // resolves cleanly to null instead of throwing.
        const { data: latest, error: latestErr } = await supabase
          .from("themes")
          .select("generation_id, generated_at")
          .order("generated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!mounted) return;
        if (latestErr) {
          console.error("[useThemes] latest lookup failed:", latestErr);
          setIsLoading(false);
          return;
        }
        if (!latest) {
          setThemes([]);
          setLatestGenerationId(null);
          setLatestGeneratedAt(null);
          setIsLoading(false);
          return;
        }

        const { data: rows } = await supabase
          .from("themes")
          .select("*")
          .eq("generation_id", latest.generation_id)
          .order("contribution_count", { ascending: false });

        if (!mounted) return;
        setThemes((rows ?? []) as Theme[]);
        setLatestGenerationId(latest.generation_id);
        setLatestGeneratedAt(latest.generated_at);
        setIsLoading(false);
      } catch (err) {
        console.error("[useThemes] load failed:", err);
        if (mounted) setIsLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel("engage-themes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "themes" },
        () => load(),
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const concernThemes = themes.filter((t) => t.kind === "concern");
  const visionThemes = themes.filter((t) => t.kind === "vision");

  return {
    themes,
    concernThemes,
    visionThemes,
    latestGenerationId,
    latestGeneratedAt,
    isLoading,
    hasThemes: themes.length > 0,
  };
}
