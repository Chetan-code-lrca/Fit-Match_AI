import { NextResponse } from "next/server";

import { uploadFormats } from "@/lib/fitmatch-data";

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

  const analysis = files.map((entry) => {
    const file = entry as File;
    return {
      fileName: file.name,
      ...inferTags(file.name),
    };
  });

  return NextResponse.json({ analysis });
}
