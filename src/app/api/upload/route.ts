import fs from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

import { uploadFormats } from "@/lib/fitmatch-data";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
  const formData = await request.formData();
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

  for (const entry of files) {
    const file = entry as File;
    if (!uploadFormats.includes(file.type) || !extensionByMime[file.type]) {
      return NextResponse.json(
        { message: "Only JPG, PNG, and WEBP uploads are supported." },
        { status: 400 },
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "Each image must be 5 MB or smaller." },
        { status: 400 },
      );
    }
  }

  await ensureUploadsDir();

  const analysis = await Promise.all(
    files.map(async (entry, index) => {
      const file = entry as File;
      const ext = extensionByMime[file.type];
      const base = sanitizeFileName(path.basename(file.name, path.extname(file.name)));
      const savedName = `${base}_${Date.now()}_${index}${ext}`;
      const savedPath = path.join(UPLOADS_DIR, savedName);

      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(savedPath, buffer);

      return {
        fileName: file.name,
        imageUrl: `/uploads/${savedName}`,
        ...inferTags(file.name),
      };
    }),
  );

  return NextResponse.json({ analysis });
}
