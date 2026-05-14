import { NextResponse } from "next/server";

import type { WardrobeOccasion } from "@/lib/fitmatch-data";
import { buildRecommendations } from "@/lib/style-engine";

const validOccasions: WardrobeOccasion[] = [
  "campus",
  "travel",
  "smart-casual",
  "streetwear",
  "night-out",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const item = searchParams.get("item") ?? "black-hoodie";
  const occasionParam = searchParams.get("occasion");
  const occasion = validOccasions.includes(occasionParam as WardrobeOccasion)
    ? (occasionParam as WardrobeOccasion)
    : "campus";

  return NextResponse.json({ recommendations: buildRecommendations(item, occasion) });
}
