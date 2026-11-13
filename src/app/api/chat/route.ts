import { NextResponse } from "next/server";

import { wardrobeItems } from "@/lib/fitmatch-data";
import { rejectUnsafeProductionStorage } from "@/lib/production-safety";
import { buildChatReply } from "@/lib/style-engine";
import { readUserWardrobeItems } from "@/lib/wardrobe-server";

export async function POST(request: Request) {
  const blocked = rejectUnsafeProductionStorage();
  if (blocked) return blocked;

  let body: { prompt?: string };
  try {
    body = (await request.json()) as { prompt?: string };
  } catch {
    return NextResponse.json({ message: "Invalid JSON body.", recommendations: [] }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt || prompt.length > 2000) {
    return NextResponse.json(
      { message: "Prompt must contain between 1 and 2,000 characters.", recommendations: [] },
      { status: 400 },
    );
  }

  const savedItems = readUserWardrobeItems();
  const activeWardrobe = savedItems.length > 0 ? savedItems : wardrobeItems;
  return NextResponse.json(buildChatReply(prompt, activeWardrobe), {
    headers: { "Cache-Control": "no-store" },
  });
}
