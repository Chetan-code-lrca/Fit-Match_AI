import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";
import { wardrobeItems, type WardrobeOccasion } from "@/lib/fitmatch-data";
import { buildRecommendations } from "@/lib/style-engine";
import { consumeRateLimit } from "@/lib/supabase-rest";
import { readUserWardrobeItems } from "@/lib/wardrobe-server";

const validOccasions: WardrobeOccasion[] = ["campus", "travel", "smart-casual", "streetwear", "night-out"];
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  try {
    const allowed = await consumeRateLimit(session.accessToken, "styling-recommendations", 60, 60);
    if (!allowed) return NextResponse.json({ message: "Recommendation limit reached." }, { status: 429 });
    const { searchParams } = new URL(request.url);
    const requestedOccasion = searchParams.get("occasion");
    const occasion = validOccasions.includes(requestedOccasion as WardrobeOccasion)
      ? requestedOccasion as WardrobeOccasion : "campus";
    const savedItems = await readUserWardrobeItems(session.accessToken, session.user.id);
    const wardrobe = savedItems.length > 0 ? savedItems : wardrobeItems;
    const requestedItem = searchParams.get("item") ?? wardrobe[0]?.id;
    const item = requestedItem && wardrobe.some((entry) => entry.id === requestedItem)
      ? requestedItem : wardrobe[0]?.id;
    return NextResponse.json({
      recommendations: item ? buildRecommendations(item, occasion, wardrobe) : [],
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ message: "Recommendation service is unavailable." }, { status: 503 });
  }
}
