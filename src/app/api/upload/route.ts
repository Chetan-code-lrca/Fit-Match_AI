import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

import { uploadFormats } from "@/lib/fitmatch-data";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
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

  const invalidFile = files.find(
    (entry) => !(entry instanceof File) || !uploadFormats.includes(entry.type),
  );

  if (invalidFile) {
    return NextResponse.json(
      { message: "Only JPG, PNG, and WEBP uploads are supported." },
      { status: 400 },
    );
  }

  ensureUploadsDir();

  const analysis = await Promise.all(
    files.map(async (entry) => {
      const file = entry as File;
      const timestamp = Date.now();
      const ext = path.extname(file.name) || ".jpg";
      const base = path.basename(file.name, ext);
      const savedName = `${sanitizeFileName(base)}_${timestamp}${ext}`;
      const savedPath = path.join(UPLOADS_DIR, savedName);

      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(savedPath, buffer);

      const imageUrl = `/uploads/${savedName}`;

      return {
        fileName: file.name,
        imageUrl,
        ...inferTags(file.name),
      };
    }),
  );

  return NextResponse.json({ analysis });
}
