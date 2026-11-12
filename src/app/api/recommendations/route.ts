import { NextResponse } from "next/server";

import { wardrobeItems, type WardrobeOccasion } from "@/lib/fitmatch-data";
import { buildRecommendations } from "@/lib/style-engine";
import { readUserWardrobeItems } from "@/lib/wardrobe-server";

const validOccasions: WardrobeOccasion[] = [
  "campus",
  "travel",
  "smart-casual",
  "streetwear",
  "night-out",
];

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedOccasion = searchParams.get("occasion");
  const occasion = validOccasions.includes(requestedOccasion as WardrobeOccasion)
    ? (requestedOccasion as WardrobeOccasion)
    : "campus";

  const savedItems = readUserWardrobeItems();
  const activeWardrobe = savedItems.length > 0 ? savedItems : wardrobeItems;
  const requestedItem = searchParams.get("item") ?? activeWardrobe[0]?.id;
  const item = requestedItem && activeWardrobe.some((entry) => entry.id === requestedItem)
    ? requestedItem
    : activeWardrobe[0]?.id;

  return NextResponse.json({
    recommendations: item ? buildRecommendations(item, occasion, activeWardrobe) : [],
  });
}