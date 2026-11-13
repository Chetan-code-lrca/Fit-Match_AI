import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getCurrentSession, isSameOriginMutation } from "@/lib/auth";
import { readLimitedJson } from "@/lib/http-validation";
import { uploadFormats } from "@/lib/fitmatch-data";
import { createPrivateUploadUrl, consumeRateLimit } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";
const MAX_FILES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const extensionByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
type UploadRequestFile = { name?: string; type?: string; size?: number };
function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._ -]/g, "").slice(0, 100) || "wardrobe-image";
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Cross-origin request rejected." }, { status: 403 });
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const parsed = await readLimitedJson<{ files?: UploadRequestFile[] }>(request, 16_000);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.reason === "too_large" ? "Upload metadata is too large." : "Invalid upload metadata." },
      { status: parsed.reason === "too_large" ? 413 : 400 },
    );
  }
  const entries = parsed.data.files;
  if (!Array.isArray(entries) || entries.length < 1 || entries.length > MAX_FILES) {
    return NextResponse.json({ message: "Select between 1 and 8 images." }, { status: 400 });
  }
  const files = entries.map((file) => ({
    name: typeof file.name === "string" ? safeFileName(file.name) : "",
    type: typeof file.type === "string" ? file.type : "",
    size: typeof file.size === "number" ? file.size : 0,
  }));
  if (files.some((file) =>
    !file.name || !uploadFormats.includes(file.type) || !extensionByMime[file.type] ||
    !Number.isInteger(file.size) || file.size < 1 || file.size > MAX_FILE_SIZE
  )) {
    return NextResponse.json({ message: "Each image must be JPG, PNG or WEBP and no larger than 5 MB." }, { status: 400 });
  }
  try {
    const allowed = await consumeRateLimit(session.accessToken, "wardrobe-upload", 20, 3600);
    if (!allowed) return NextResponse.json({ message: "Upload limit reached. Try again later." }, { status: 429 });
    const uploads = await Promise.all(files.map(async (file) => {
      const imageUrl = session.user.id + "/" + randomUUID() + "." + extensionByMime[file.type];
      const uploadUrl = await createPrivateUploadUrl(session.user.id, session.accessToken, imageUrl);
      return { fileName: file.name, imageUrl, uploadUrl, mimeType: file.type, size: file.size };
    }));
    return NextResponse.json({ uploads }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ message: "Private upload service is unavailable. Confirm the Supabase migration and bucket policies." }, { status: 503 });
  }
}
