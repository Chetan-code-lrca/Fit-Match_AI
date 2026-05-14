import { NextResponse } from "next/server";

import { uploadFormats } from "@/lib/fitmatch-data";

function inferTags(fileName: string) {
  const normalized = fileName.toLowerCase();
  const tags = [
    normalized.includes("hoodie") ? "hoodie layer" : "mirror selfie",
    normalized.includes("black") ? "black top" : "neutral palette",
    normalized.includes("shoe") ? "white sneakers" : "smart casual ready",
  ];

  return {
    dominantColors: normalized.includes("black")
      ? ["black", "charcoal", "white"]
      : ["cream", "olive", "charcoal"],
    tags,
    occasionHint: normalized.includes("travel") ? "Travel-ready" : "Campus + smart-casual",
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
