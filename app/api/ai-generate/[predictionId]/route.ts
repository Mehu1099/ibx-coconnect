// GET /api/ai-generate/[predictionId]
//
// Polled by the client to check on a Replicate prediction. While it's
// still running we just relay the status. Once it succeeds we
// download the generated image and re-upload it to Supabase Storage —
// Replicate's hosted output URL is short-lived (~24h) and we want the
// proposal to live indefinitely. The public Storage URL is what makes
// it onto the eventual ai_proposals row.

import { NextResponse, type NextRequest } from "next/server";
import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Server-side Supabase client. Anon key is fine: the ai-proposals
// bucket has a public-write policy for this studio project, and
// public read by definition.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const STORAGE_BUCKET = "ai-proposals";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ predictionId: string }> },
) {
  try {
    const { predictionId } = await params;

    const prediction = await replicate.predictions.get(predictionId);

    if (prediction.status === "succeeded") {
      // Output may be a string or a string array depending on the model.
      // FLUX returns an array of one URL, but be defensive.
      const output = prediction.output;
      const imageUrl = Array.isArray(output)
        ? (output[0] as string | undefined)
        : (output as string | undefined);

      if (!imageUrl) {
        return NextResponse.json({
          status: "failed",
          error: "No image in output",
        });
      }

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        return NextResponse.json({
          status: "failed",
          error: `Failed to fetch generated image (${imageResponse.status})`,
        });
      }
      const imageBuffer = await imageResponse.arrayBuffer();

      const filename = `${predictionId}-${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filename, imageBuffer, {
          contentType: "image/webp",
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return NextResponse.json({
          status: "failed",
          error: "Storage upload failed",
        });
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);

      return NextResponse.json({
        status: "succeeded",
        imageUrl: publicUrl,
        storagePath: filename,
      });
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      return NextResponse.json({
        status: "failed",
        error:
          (prediction.error as string | undefined) || "Generation failed",
      });
    }

    return NextResponse.json({ status: prediction.status });
  } catch (error: unknown) {
    console.error("Status check error:", error);
    const message =
      error instanceof Error ? error.message : "Status check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
