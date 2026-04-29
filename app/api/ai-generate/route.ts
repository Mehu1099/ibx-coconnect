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

    // FLUX.2 Pro is an instruction-based image editor: it preserves the
    // source photo's structure (buildings, perspective, lighting) and
    // only changes what the prompt describes. We deliberately don't
    // wrap the user's prompt with extra style hints — that pulled the
    // earlier flux-dev attempt off the source image entirely.
    //
    // aspect_ratio is intentionally OMITTED — passing
    // "match_input_image" was tripping FLUX.2 Pro's pre-validation with
    // "requires at least one input image" before it actually inspected
    // input_image. With it removed, the model infers output dimensions
    // from input_image automatically.
    //
    // If input_image still doesn't reach the model, try one of these
    // alternative parameter names (some Replicate deployments differ):
    //   1. image_url: basePhotoUrl   (Together AI-style)
    //   2. image: basePhotoUrl       (older Replicate convention)
    //   3. images: [basePhotoUrl]    (array form)
    //   4. input_images: [basePhotoUrl]  (multi-reference array)
    const prediction = await replicate.predictions.create({
      model: "black-forest-labs/flux-2-pro",
      input: {
        prompt: trimmed,
        input_image: basePhotoUrl,
        output_format: "webp",
        output_quality: 90,
        safety_tolerance: 2,
      },
    });

    console.log("[ai-generate] Replicate prediction created:", {
      predictionId: prediction.id,
      status: prediction.status,
      model: "black-forest-labs/flux-2-pro",
      // Drop this URL into a browser to inspect the exact input
      // Replicate received and the run logs/error if any.
      dashboardUrl: `https://replicate.com/p/${prediction.id}`,
      inputSent: {
        prompt:
          trimmed.length > 80 ? `${trimmed.substring(0, 80)}...` : trimmed,
        input_image: basePhotoUrl,
      },
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
