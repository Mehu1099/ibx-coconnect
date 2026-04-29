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

    // FLUX.2 Pro is an instruction-based image editor: it preserves the
    // source photo's structure (buildings, perspective, lighting) and
    // only changes what the prompt describes. We deliberately don't
    // wrap the user's prompt with extra style hints — that pulled the
    // earlier flux-dev attempt off the source image entirely.
    const prediction = await replicate.predictions.create({
      model: "black-forest-labs/flux-2-pro",
      input: {
        prompt: trimmed,
        input_image: basePhotoUrl,
        aspect_ratio: "match_input_image",
        output_format: "webp",
        output_quality: 90,
        safety_tolerance: 2,
      },
    });

    return NextResponse.json({
      predictionId: prediction.id,
      status: prediction.status,
    });
  } catch (error: unknown) {
    console.error("AI generation error:", error);
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
