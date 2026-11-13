import { NextResponse } from "next/server";
import { getAuthenticatedUser, isSameOriginMutation, SupabaseRequestError, uploadPrivateImage, enforceUserRateLimit } from "@/lib/supabase-rest";

export const runtime = "nodejs";
const MAX_FILES = 8;
const MAX_TOTAL_SIZE = 20 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

function inferTags(fileName: string) {
  const tokens = fileName.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const has = (token: string) => tokens.includes(token);
  return {
    dominantColors: has("black") ? ["black", "charcoal", "white"] : ["cream", "olive", "charcoal"],
    tags: [
      has("hoodie") ? "hoodie layer" : has("jacket") ? "outer layer" : "uploaded outfit",
      has("black") ? "black accent" : has("white") ? "white accent" : "neutral palette",
      has("shoe") || has("sneaker") ? "sneaker styling" : has("travel") ? "travel ready" : "smart casual ready",
    ],
    occasionHint: has("travel") ? "Travel-ready" : "Campus + smart-casual",
  };
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Cross-origin request blocked." }, { status: 403 });
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ message: "Authentication required." }, { status: 401 });

  let formData: FormData;
  try {
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > MAX_TOTAL_SIZE + 1024 * 1024) return NextResponse.json({ message: "Upload request is too large." }, { status: 413 });
    formData = await request.formData();
  } catch { return NextResponse.json({ message: "Invalid multipart upload." }, { status: 400 }); }

  const entries = formData.getAll("files");
  if (!entries.length) return NextResponse.json({ message: "At least one image is required." }, { status: 400 });
  if (entries.length > MAX_FILES || entries.some((entry) => !(entry instanceof File))) return NextResponse.json({ message: "Upload up to eight valid images at a time." }, { status: 400 });
  const files = entries as File[];
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_SIZE) return NextResponse.json({ message: "The combined upload limit is 20 MB." }, { status: 413 });
  if (files.some((file) => !allowedTypes.includes(file.type) || file.size < 12 || file.size > 5 * 1024 * 1024)) {
    return NextResponse.json({ message: "Only JPG, PNG and WEBP images up to 5 MB each are supported." }, { status: 415 });
  }

  try {
    await enforceUserRateLimit(auth, "uploads", 60, 5);
    const analysis: Array<{
      fileName: string;
      storagePath: string;
      imageUrl: string;
      dominantColors: string[];
      tags: string[];
      occasionHint: string;
    }> = [];

    // Decode/re-encode one image at a time to bound per-request memory usage.
    for (const file of files) {
      const stored = await uploadPrivateImage(auth, file);
      analysis.push({
        fileName: file.name.slice(0, 255),
        ...stored,
        ...inferTags(file.name),
      });
    }
    return NextResponse.json({ analysis }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof SupabaseRequestError ? error.status : 500;
    const message = status === 503 ? (error instanceof Error ? error.message : "Storage is not configured.")
      : status === 403 ? "Image storage access was denied."
      : status === 429 ? "Upload rate limit reached. Try again in a minute."
      : status === 503 ? (error instanceof Error ? error.message : "Upload protection is unavailable.")
      : status === 415 || status === 413 ? (error instanceof Error ? error.message : "Unsupported image.")
      : "Unable to store these images securely.";
    return NextResponse.json({ message }, { status: status >= 500 && status !== 503 ? 502 : status, headers: status === 429 ? { "Retry-After": "60" } : { "Cache-Control": "no-store" } });
  }
}
