import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";
import { wardrobeItems } from "@/lib/fitmatch-data";
import { buildOutfitOfTheDay } from "@/lib/style-engine";
import { consumeRateLimit } from "@/lib/supabase-rest";
import { readUserWardrobeItems } from "@/lib/wardrobe-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  try {
    const allowed = await consumeRateLimit(session.accessToken, "daily-outfit", 60, 60);
    if (!allowed) return NextResponse.json({ message: "Outfit request limit reached." }, { status: 429 });
    const savedItems = await readUserWardrobeItems(session.accessToken, session.user.id);
    const activeWardrobe = savedItems.length > 0 ? savedItems : wardrobeItems;
    return NextResponse.json({ outfit: buildOutfitOfTheDay(activeWardrobe) }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ message: "Outfit service is unavailable." }, { status: 503 });
  }
}
