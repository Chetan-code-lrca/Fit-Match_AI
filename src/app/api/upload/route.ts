import fs from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

import { NextResponse } from "next/server";

import { uploadFormats } from "@/lib/fitmatch-data";
import { isAllowedImageSignature, rejectUnsafeProductionStorage } from "@/lib/production-safety";

export const runtime = "nodejs";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 20 * 1024 * 1024;

const extensionByMime: Record<string, ".jpg" | ".png" | ".webp"> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

function sanitizeFileName(name: string): string {
  const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  return sanitized.slice(0, 80) || "wardrobe-item";
}

function inferTags(fileName: string) {
  const normalized = fileName.toLowerCase();
  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  const hasToken = (token: string) => tokens.includes(token);
  const tags = [
    hasToken("hoodie") ? "hoodie layer" : hasToken("jacket") ? "outer layer" : "uploaded outfit",
    hasToken("black") ? "black top" : hasToken("white") ? "white accent" : "neutral palette",
    hasToken("shoe") || hasToken("sneaker") ? "sneaker styling" : hasToken("travel") ? "travel ready" : "smart casual ready",
  ];

  return {
    dominantColors: hasToken("black") ? ["black", "charcoal", "white"] : ["cream", "olive", "charcoal"],
    tags,
    occasionHint: hasToken("travel") ? "Travel-ready" : "Campus + smart-casual",
  };
}

export async function POST(request: Request) {
  const blocked = rejectUnsafeProductionStorage();
  if (blocked) return blocked;

  let formData: FormData;
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_TOTAL_SIZE + 1024 * 1024) {
      return NextResponse.json({ message: "Upload request is too large." }, { status: 413 });
    }
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid multipart upload." }, { status: 400 });
  }

  const files = formData.getAll("files");
  if (files.length === 0) {
    return NextResponse.json({ message: "At least one image is required." }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ message: `You can upload up to ${MAX_FILES} images at a time.` }, { status: 400 });
  }
  if (files.some((entry) => !(entry instanceof File))) {
    return NextResponse.json({ message: "Invalid upload." }, { status: 400 });
  }

  const typedFiles = files as File[];
  const totalSize = typedFiles.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    return NextResponse.json({ message: "The combined upload limit is 20 MB." }, { status: 413 });
  }

  const validated: Array<{ file: File; buffer: Buffer }> = [];
  for (const file of typedFiles) {
    if (!uploadFormats.includes(file.type) || !extensionByMime[file.type]) {
      return NextResponse.json({ message: "Only JPG, PNG, and WEBP uploads are supported." }, { status: 400 });
    }
    if (file.size < 12 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: "Each image must be between 12 bytes and 5 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isAllowedImageSignature(buffer, file.type)) {
      return NextResponse.json({ message: "The file contents do not match the declared image type." }, { status: 415 });
    }
    validated.push({ file, buffer });
  }

  await ensureUploadsDir();
  const analysis = await Promise.all(validated.map(async ({ file, buffer }, index) => {
    const ext = extensionByMime[file.type];
    const base = sanitizeFileName(path.basename(file.name, path.extname(file.name)));
    const savedName = `${base}_${randomUUID()}_${index}${ext}`;
    await fs.writeFile(path.join(UPLOADS_DIR, savedName), buffer, { flag: "wx", mode: 0o600 });

    return {
      fileName: file.name.slice(0, 255),
      imageUrl: `/uploads/${savedName}`,
      ...inferTags(file.name),
    };
  }));

  return NextResponse.json({ analysis }, { headers: { "Cache-Control": "no-store" } });
}
