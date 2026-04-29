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

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60; // 60 × 2s = 2 minutes

export function useAIGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>("idle");
  const [error, setError] = useState<string | null>(null);
  // Guard against overlapping calls (e.g. double-clicked Generate button)
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

      try {
        const sessionId = getAnonymousSessionId();

        const startResponse = await fetch("/api/ai-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationId, prompt, basePhotoUrl, sessionId }),
        });

        if (!startResponse.ok) {
          const errorData = await startResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to start generation");
        }

        const { predictionId } = (await startResponse.json()) as {
          predictionId: string;
        };

        setProgress("processing");

        for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
          await new Promise((resolve) =>
            setTimeout(resolve, POLL_INTERVAL_MS),
          );

          const statusResponse = await fetch(
            `/api/ai-generate/${predictionId}`,
          );
          const statusData = await statusResponse.json();

          if (statusData.status === "succeeded") {
            setProgress("idle");
            setIsGenerating(false);
            return {
              imageUrl: statusData.imageUrl,
              storagePath: statusData.storagePath,
              predictionId,
            };
          }

          if (statusData.status === "failed") {
            throw new Error(statusData.error || "Generation failed");
          }

          // Last few polls — show "finalizing" so the spinner copy
          // matches what the user is seeing (the model is mostly done).
          if (attempt === MAX_POLL_ATTEMPTS - 5) {
            setProgress("finalizing");
          }
        }

        throw new Error("Generation timed out");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Generation failed";
        setError(message);
        setIsGenerating(false);
        setProgress("idle");
        return null;
      } finally {
        inFlight.current = false;
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return { generate, isGenerating, progress, error, clearError };
}
