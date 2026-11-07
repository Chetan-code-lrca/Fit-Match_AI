import fs from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

import { NextResponse } from "next/server";

import { uploadFormats } from "@/lib/fitmatch-data";
import { hasValidImageSignature } from "@/lib/image-validation.js";
import { isLocalDemoStorageAllowed } from "@/lib/local-demo-storage.js";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_FILES * MAX_FILE_SIZE + 256 * 1024;

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
    hasToken("black")
      ? "black top"
      : hasToken("white")
        ? "white accent"
        : "neutral palette",
    hasToken("shoe") || hasToken("sneaker")
      ? "sneaker styling"
      : hasToken("travel")
        ? "travel ready"
        : "smart casual ready",
  ];

  return {
    dominantColors: hasToken("black")
      ? ["black", "charcoal", "white"]
      : ["cream", "olive", "charcoal"],
    tags,
    occasionHint: hasToken("travel") ? "Travel-ready" : "Campus + smart-casual",
  };
}

export async function POST(request: Request) {
  if (!isLocalDemoStorageAllowed()) {
    return NextResponse.json(
      {
        message:
          "Local public-file uploads are disabled in production. Configure authenticated private object storage before enabling user uploads.",
      },
      { status: 503 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_SIZE) {
    return NextResponse.json({ message: "The upload request is too large." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid multipart upload body." }, { status: 400 });
  }
  const files = formData.getAll("files");

  if (files.length === 0) {
    return NextResponse.json({ message: "At least one image is required." }, { status: 400 });
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { message: `You can upload up to ${MAX_FILES} images at a time.` },
      { status: 400 },
    );
  }

  const invalidEntry = files.find((entry) => !(entry instanceof File));
  if (invalidEntry) {
    return NextResponse.json({ message: "Invalid upload." }, { status: 400 });
  }

  const validatedFiles: Array<{ file: File; buffer: Buffer }> = [];
  for (const entry of files) {
    const file = entry as File;
    if (!uploadFormats.includes(file.type) || !extensionByMime[file.type]) {
      return NextResponse.json(
        { message: "Only JPG, PNG, and WEBP uploads are supported." },
        { status: 400 },
      );
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "Each image must be larger than 0 bytes and 5 MB or smaller." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidImageSignature(file.type, buffer)) {
      return NextResponse.json(
        { message: "The file contents do not match the declared JPG, PNG, or WEBP type." },
        { status: 400 },
      );
    }
    validatedFiles.push({ file, buffer });
  }

  await ensureUploadsDir();

  const savedPaths: string[] = [];
  const analysis = [];
  try {
    for (const [index, { file, buffer }] of validatedFiles.entries()) {
      const ext = extensionByMime[file.type];
      const base = sanitizeFileName(path.basename(file.name, path.extname(file.name)));
      const savedName = `${base}_${randomUUID()}_${index}${ext}`;
      const savedPath = path.join(UPLOADS_DIR, savedName);
      await fs.writeFile(savedPath, buffer, { flag: "wx" });
      savedPaths.push(savedPath);

      analysis.push({
        fileName: file.name,
        imageUrl: `/uploads/${savedName}`,
        ...inferTags(file.name),
      });
    }

    return NextResponse.json({ analysis });
  } catch {
    await Promise.all(savedPaths.map((savedPath) => fs.unlink(savedPath).catch(() => undefined)));
    return NextResponse.json({ message: "Could not save uploaded images." }, { status: 500 });
  }
}
