"use client";

import { useCallback, useRef, useState } from "react";
import { getAnonymousSessionId } from "./supabase-client";

export type GenerationProgress =
  | "idle"
  | "starting"
  | "processing"
  | "finalizing";

export interface GenerationResult {
  imageUrl: string;
  storagePath: string;
  predictionId: string;
}

// Roughly when we expect Gemini to be wrapping up. Used purely to
// switch the user-facing copy from "processing" → "finalizing" so
// the UI looks alive even though we're just sitting on one fetch.
const FINALIZING_AFTER_MS = 18_000;

export function useAIGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>("idle");
  const [error, setError] = useState<string | null>(null);
  // Guard against overlapping calls (double-clicked Generate button).
  const inFlight = useRef(false);

  const generate = useCallback(
    async (
      locationId: string,
      prompt: string,
      basePhotoUrl: string,
    ): Promise<GenerationResult | null> => {
      if (inFlight.current) return null;
      inFlight.current = true;
      setIsGenerating(true);
      setProgress("starting");
      setError(null);

      // Mirrors the server log so a single browser tab can be
      // correlated with the Vercel logs by the photo URL it sent.
      console.log("[ai-generate] Sending request:", {
        locationId,
        basePhotoUrl,
        promptLength: prompt.length,
      });

      // Cosmetic-only progress timers. Gemini is synchronous, so
      // we don't actually know where it is — these just keep the
      // copy in sync with elapsed time.
      const toProcessing = window.setTimeout(
        () => setProgress("processing"),
        500,
      );
      const toFinalizing = window.setTimeout(
        () => setProgress("finalizing"),
        FINALIZING_AFTER_MS,
      );

      try {
        const sessionId = getAnonymousSessionId();

        const response = await fetch("/api/ai-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locationId,
            prompt,
            basePhotoUrl,
            sessionId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Generation failed");
        }

        const data = await response.json();

        if (data.status !== "succeeded" || !data.imageUrl) {
          throw new Error(data.error || "Generation failed");
        }

        return {
          imageUrl: data.imageUrl,
          storagePath: data.storagePath,
          predictionId: data.predictionId,
        };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Generation failed";
        setError(message);
        return null;
      } finally {
        window.clearTimeout(toProcessing);
        window.clearTimeout(toFinalizing);
        setProgress("idle");
        setIsGenerating(false);
        inFlight.current = false;
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return { generate, isGenerating, progress, error, clearError };
}
