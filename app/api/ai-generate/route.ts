// POST /api/ai-generate
//
// Kicks off a Replicate prediction using the location photo as a base
// image plus the user's text prompt. Returns the prediction id
// immediately so the client can poll the sibling [predictionId]
// endpoint for status — generations take 10–30 seconds and we don't
// want to hold a serverless function open the whole time.
//
// REPLICATE_API_TOKEN is read from process.env (server-only). It must
// NEVER be exposed via NEXT_PUBLIC_*.

import { NextResponse, type NextRequest } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// In-memory rate limit. Keyed by anonymous session id (or user id).
// "Acceptable for studio project, not production-scale" — survives the
// lifetime of a single serverless instance only, which is plenty for
// rate-limiting one impatient user clicking Generate ten times.
const recentGenerations = new Map<string, number>();
const RATE_LIMIT_MS = 30 * 1000;

const MAX_PROMPT_LENGTH = 500;
const MIN_PROMPT_LENGTH = 1;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { locationId, prompt, basePhotoUrl, sessionId } = body as {
      locationId?: string;
      prompt?: string;
      basePhotoUrl?: string;
      sessionId?: string;
    };

    // Visible in `vercel logs` / Functions tab. Truncate sessionId so
    // the log line stays scannable; we only need a prefix to correlate
    // with the same session's later poll requests.
    console.log("[ai-generate] Request received:", {
      locationId,
      promptLength: prompt?.length,
      basePhotoUrl,
      sessionId: sessionId ? `${sessionId.substring(0, 8)}...` : null,
    });

    if (
      typeof locationId !== "string" ||
      typeof prompt !== "string" ||
      typeof basePhotoUrl !== "string" ||
      typeof sessionId !== "string" ||
      !locationId ||
      !sessionId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const trimmed = prompt.trim();
    if (trimmed.length < MIN_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: "Prompt is empty" },
        { status: 400 },
      );
    }
    if (trimmed.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt too long (max ${MAX_PROMPT_LENGTH} characters)` },
        { status: 400 },
      );
    }

    const lastGeneration = recentGenerations.get(sessionId);
    if (lastGeneration && Date.now() - lastGeneration < RATE_LIMIT_MS) {
      const waitSeconds = Math.ceil(
        (RATE_LIMIT_MS - (Date.now() - lastGeneration)) / 1000,
      );
      return NextResponse.json(
        {
          error: `Please wait ${waitSeconds} seconds before generating again.`,
        },
        { status: 429 },
      );
    }
    recentGenerations.set(sessionId, Date.now());

    // Pre-flight HEAD on the photo URL. Replicate fetches the image
    // server-side and surfaces a cryptic
    // "aspect_ratio='match_input_image' requires at least one input image"
    // error if the URL 404s — so we'd rather fail here with a clear
    // message and a log line we can grep.
    try {
      const imageCheck = await fetch(basePhotoUrl, { method: "HEAD" });
      if (!imageCheck.ok) {
        console.error(
          "[ai-generate] Image URL returned non-OK status:",
          imageCheck.status,
          basePhotoUrl,
        );
        return NextResponse.json(
          {
            error: `Could not load location photo (status ${imageCheck.status}). The photo URL may be incorrect.`,
          },
          { status: 400 },
        );
      }
      const contentType = imageCheck.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        console.error(
          "[ai-generate] URL did not return an image:",
          contentType,
          basePhotoUrl,
        );
        return NextResponse.json(
          { error: "The provided URL did not return an image." },
          { status: 400 },
        );
      }
      console.log(
        "[ai-generate] Image URL validated:",
        basePhotoUrl,
        contentType,
      );
    } catch (fetchError: unknown) {
      const msg =
        fetchError instanceof Error ? fetchError.message : "unknown";
      console.error(
        "[ai-generate] Failed to fetch image URL:",
        msg,
        basePhotoUrl,
      );
      return NextResponse.json(
        { error: "Failed to validate location photo URL." },
        { status: 400 },
      );
    }

    // Google Nano Banana 2 (Gemini 3.1 Flash Image) on Replicate.
    // Image-edit mode wants the source URLs in image_input as an ARRAY
    // — note the parameter name difference vs. the Nano Banana family's
    // close cousins (FLUX uses `input_image` singular; fal.ai uses
    // `image_urls`). aspect_ratio: "match_input_image" is the special
    // value that auto-matches the source photo's dimensions, which is
    // exactly what we want for street-edit proposals.
    console.log("[ai-generate] Sending to Replicate (Nano Banana 2):", {
      prompt:
        trimmed.length > 100 ? `${trimmed.substring(0, 100)}...` : trimmed,
      image_input: [basePhotoUrl],
    });

    const prediction = await replicate.predictions.create({
      model: "google/nano-banana-2",
      input: {
        prompt: trimmed,
        image_input: [basePhotoUrl],
        output_format: "png",
        aspect_ratio: "match_input_image",
      },
    });

    console.log("[ai-generate] Replicate prediction created:", {
      predictionId: prediction.id,
      status: prediction.status,
      // Drop this URL into a browser (logged in to Replicate) to
      // inspect the exact input the model received and the run logs.
      dashboardUrl: `https://replicate.com/p/${prediction.id}`,
    });

    return NextResponse.json({
      predictionId: prediction.id,
      status: prediction.status,
    });
  } catch (error: unknown) {
    console.error("[ai-generate] error:", error);
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
