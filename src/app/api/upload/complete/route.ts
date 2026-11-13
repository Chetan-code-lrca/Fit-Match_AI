import { NextResponse } from "next/server";

import { getCurrentSession, isSameOriginMutation } from "@/lib/auth";
import { readLimitedJson } from "@/lib/http-validation";
import { hasValidImageSignature, isUserStoragePath } from "@/lib/security-validation";
import { consumeRateLimit, downloadPrivateImage, removePrivateImages } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";
const MAX_FILES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const mimeByExtension: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
type CompletedUpload = { fileName?: string; imageUrl?: string; mimeType?: string };

function cleanName(value: string) {
  return value.replace(/[^a-zA-Z0-9._ -]/g, "").slice(0, 100) || "wardrobe-image";
}
function inferTags(fileName: string) {
  const tokens = fileName.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const hasToken = (token: string) => tokens.includes(token);
  const colors = hasToken("black") ? ["black", "charcoal", "white"] : ["cream", "olive", "charcoal"];
  return {
    dominantColors: colors,
    colorNames: colors,
    tags: [
      hasToken("hoodie") ? "hoodie layer" : hasToken("jacket") ? "outer layer" : "uploaded garment",
      hasToken("black") ? "black accent" : hasToken("white") ? "white accent" : "neutral palette",
      hasToken("shoe") || hasToken("sneaker") ? "sneaker styling" : hasToken("travel") ? "travel ready" : "smart casual",
    ],
    occasionHint: hasToken("travel") ? "Travel-ready" : "Campus + smart-casual",
  };
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Cross-origin request rejected." }, { status: 403 });
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const parsed = await readLimitedJson<{ files?: CompletedUpload[] }>(request, 16_000);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.reason === "too_large" ? "Upload verification request is too large." : "Invalid upload verification request." },
      { status: parsed.reason === "too_large" ? 413 : 400 },
    );
  }
  const entries = parsed.data.files;
  if (!Array.isArray(entries) || entries.length < 1 || entries.length > MAX_FILES) {
    return NextResponse.json({ message: "Select between 1 and 8 uploaded images." }, { status: 400 });
  }
  const files = entries.map((entry) => ({
    fileName: typeof entry.fileName === "string" ? cleanName(entry.fileName) : "",
    imageUrl: typeof entry.imageUrl === "string" ? entry.imageUrl : "",
    mimeType: typeof entry.mimeType === "string" ? entry.mimeType : "",
  }));
  if (files.some((file) => {
    const extension = file.imageUrl.split(".").pop()?.toLowerCase() ?? "";
    return !file.fileName || !isUserStoragePath(file.imageUrl, session.user.id) ||
      file.imageUrl.length > 240 || mimeByExtension[extension] !== file.mimeType;
  })) {
    return NextResponse.json({ message: "An uploaded image path or type is invalid." }, { status: 400 });
  }

  try {
    const allowed = await consumeRateLimit(session.accessToken, "wardrobe-upload-verify", 40, 3600);
    if (!allowed) return NextResponse.json({ message: "Upload verification limit reached." }, { status: 429 });
    const checks = await Promise.all(files.map(async (file) => {
      const stored = await downloadPrivateImage(session.user.id, session.accessToken, file.imageUrl);
      const valid = Boolean(
        stored && stored.bytes.length <= MAX_FILE_SIZE &&
        stored.mimeType === file.mimeType &&
        hasValidImageSignature(stored.bytes, file.mimeType)
      );
      return {
        valid,
        analysis: valid ? { fileName: file.fileName, imageUrl: file.imageUrl, ...inferTags(file.fileName) } : null,
      };
    }));
    if (checks.some((check) => !check.valid)) {
      await removePrivateImages(session.accessToken, files.map((file) => file.imageUrl));
      return NextResponse.json({
        message: "One or more uploads are incomplete or are not valid image files. Please try again.",
      }, { status: 415 });
    }
    return NextResponse.json({ analysis: checks.flatMap((check) => check.analysis ? [check.analysis] : []) }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    await removePrivateImages(session.accessToken, files.map((file) => file.imageUrl)).catch(() => undefined);
    return NextResponse.json({ message: "Unable to verify the private image uploads." }, { status: 503 });
  }
}
