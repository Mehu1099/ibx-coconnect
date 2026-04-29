// POST /api/ai-generate
//
// Synchronous AI image edit, backed by Google's Gemini API directly
// (gemini-3.1-flash-image-preview, aka "Nano Banana 2"). The Replicate
// middleman is gone — one HTTP round-trip from client to server,
// server fetches the source photo, base64-encodes it, calls Gemini
// with a multi-part `inline_data` body, takes the returned image,
// uploads it to Supabase Storage, and replies with the public URL.
// No prediction id, no polling.
//
// GEMINI_API_KEY is read from process.env (server-only). It must
// NEVER be exposed via NEXT_PUBLIC_*.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Vercel serverless function timeout. Gemini's image generation can
// take 10–30s; 60s gives plenty of headroom for cold starts and the
// surrounding fetch + storage upload work.
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = "gemini-3.1-flash-image-preview";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const STORAGE_BUCKET = "ai-proposals";

// In-memory rate limit. Keyed by anonymous session id (or user id).
// Survives the lifetime of a single serverless instance — fine for
// rate-limiting one impatient user, not a global cap.
const recentGenerations = new Map<string, number>();
const RATE_LIMIT_MS = 30 * 1000;

const MAX_PROMPT_LENGTH = 500;
const MIN_PROMPT_LENGTH = 1;

type GeminiPart = {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
  inline_data?: { mime_type?: string; data?: string };
};

type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: GeminiPart[] };
  }>;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { locationId, prompt, basePhotoUrl, sessionId } = body as {
      locationId?: string;
      prompt?: string;
      basePhotoUrl?: string;
      sessionId?: string;
    };

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
      return NextResponse.json({ error: "Prompt is empty" }, { status: 400 });
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

    // ── Step A: fetch the location photo and base64-encode it ──────────
    let imageBase64: string;
    let imageMimeType: string;
    try {
      const imageResponse = await fetch(basePhotoUrl);
      if (!imageResponse.ok) {
        console.error(
          "[ai-generate] Could not load base photo:",
          imageResponse.status,
          basePhotoUrl,
        );
        return NextResponse.json(
          {
            error: `Could not load location photo (status ${imageResponse.status})`,
          },
          { status: 400 },
        );
      }
      imageMimeType =
        imageResponse.headers.get("content-type") || "image/jpeg";
      if (!imageMimeType.startsWith("image/")) {
        return NextResponse.json(
          { error: "The provided URL did not return an image" },
          { status: 400 },
        );
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      imageBase64 = Buffer.from(imageBuffer).toString("base64");
      console.log("[ai-generate] Base photo fetched and encoded:", {
        bytes: imageBuffer.byteLength,
        mimeType: imageMimeType,
      });
    } catch (fetchError: unknown) {
      const msg =
        fetchError instanceof Error ? fetchError.message : "unknown";
      console.error("[ai-generate] Failed to fetch base photo:", msg);
      return NextResponse.json(
        { error: "Failed to load location photo" },
        { status: 500 },
      );
    }

    // ── Step B: call Gemini with prompt + inline image data ────────────
    const geminiRequestBody = {
      contents: [
        {
          parts: [
            { text: trimmed },
            {
              inline_data: {
                mime_type: imageMimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        // IMAGE-only response. The model may emit text alongside the
        // image; we filter that out below either way.
        responseModalities: ["IMAGE"],
      },
    };

    console.log("[ai-generate] Calling Gemini API:", {
      model: GEMINI_MODEL,
      promptPreview:
        trimmed.length > 100 ? `${trimmed.substring(0, 100)}...` : trimmed,
    });

    const geminiResponse = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify(geminiRequestBody),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error("[ai-generate] Gemini API error:", {
        status: geminiResponse.status,
        body: errorBody.substring(0, 1000),
      });
      if (geminiResponse.status === 429) {
        return NextResponse.json(
          { error: "Rate limit reached. Please try again in a moment." },
          { status: 429 },
        );
      }
      if (geminiResponse.status === 400) {
        return NextResponse.json(
          {
            error:
              "The prompt or image was rejected. Try a different description.",
          },
          { status: 400 },
        );
      }
      if (geminiResponse.status === 403) {
        return NextResponse.json(
          { error: "API key issue. Please contact support." },
          { status: 500 },
        );
      }
      return NextResponse.json(
        { error: `Generation failed (status ${geminiResponse.status})` },
        { status: 500 },
      );
    }

    const geminiData = (await geminiResponse.json()) as GeminiResponse;

    // ── Step C: pull the image part out of the Gemini response ─────────
    // The response wraps content in candidates[0].content.parts; each
    // part is either {text} or {inlineData|inline_data}. We tolerate
    // both casings since the API has emitted both historically.
    const candidate = geminiData?.candidates?.[0];
    if (!candidate) {
      console.error(
        "[ai-generate] No candidate in Gemini response:",
        JSON.stringify(geminiData).substring(0, 500),
      );
      return NextResponse.json(
        { error: "Gemini did not return any output. Try a different prompt." },
        { status: 500 },
      );
    }

    if (
      candidate.finishReason === "SAFETY" ||
      candidate.finishReason === "PROHIBITED_CONTENT"
    ) {
      return NextResponse.json(
        {
          error:
            "The prompt was blocked by safety filters. Try a different description.",
        },
        { status: 400 },
      );
    }

    const parts: GeminiPart[] = candidate.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData || p.inline_data);

    if (!imagePart) {
      console.error(
        "[ai-generate] No image in Gemini response. Parts:",
        JSON.stringify(parts).substring(0, 500),
      );
      return NextResponse.json(
        { error: "Gemini did not return an image. Try a different prompt." },
        { status: 500 },
      );
    }

    const inline = imagePart.inlineData ?? imagePart.inline_data ?? {};
    const generatedImageBase64 = (inline as { data?: string }).data;
    const generatedMimeType =
      (inline as { mimeType?: string; mime_type?: string }).mimeType ||
      (inline as { mime_type?: string }).mime_type ||
      "image/png";

    if (!generatedImageBase64) {
      console.error("[ai-generate] Image part had no data field");
      return NextResponse.json(
        { error: "Gemini returned an empty image. Try a different prompt." },
        { status: 500 },
      );
    }

    console.log("[ai-generate] Gemini returned image:", {
      mimeType: generatedMimeType,
      base64Length: generatedImageBase64.length,
    });

    // ── Step D: upload generated image to Supabase Storage ─────────────
    const generatedImageBuffer = Buffer.from(generatedImageBase64, "base64");
    const fileExtension = generatedMimeType.includes("png") ? "png" : "jpg";
    const filename = `gemini-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, generatedImageBuffer, {
        contentType: generatedMimeType,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("[ai-generate] Storage upload failed:", uploadError);
      return NextResponse.json(
        { error: "Failed to save generated image" },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);

    console.log("[ai-generate] Generation complete:", { publicUrl, filename });

    // The client hook treats `predictionId` as an opaque identifier
    // for the run. The filename is unique-per-generation, persists
    // alongside the row in ai_proposals, and is the natural choice
    // now that there's no Replicate prediction id.
    return NextResponse.json({
      status: "succeeded",
      imageUrl: publicUrl,
      storagePath: filename,
      predictionId: filename,
    });
  } catch (error: unknown) {
    console.error("[ai-generate] Unexpected error:", error);
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
