import { NextResponse } from "next/server";

import { wardrobeItems } from "@/lib/fitmatch-data";
import { rejectUnsafeProductionStorage } from "@/lib/production-safety";
import { buildOutfitOfTheDay } from "@/lib/style-engine";
import { readUserWardrobeItems } from "@/lib/wardrobe-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const blocked = rejectUnsafeProductionStorage();
  if (blocked) return blocked;

  const savedItems = readUserWardrobeItems();
  const activeWardrobe = savedItems.length > 0 ? savedItems : wardrobeItems;
  return NextResponse.json(
    { outfit: buildOutfitOfTheDay(activeWardrobe) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
