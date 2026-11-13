import { NextResponse } from "next/server";

import { wardrobeItems } from "@/lib/fitmatch-data";
import {
  enforceUserRateLimit,
  getAuthenticatedUser,
  listWardrobeItems,
  supabaseApiError,
} from "@/lib/supabase-rest";
import { buildOutfitOfTheDay } from "@/lib/style-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ message: "Authentication required." }, { status: 401 });

    await enforceUserRateLimit(auth, "daily_outfit", 60, 30);
    const saved = await listWardrobeItems(auth);

    return NextResponse.json(
      { outfit: buildOutfitOfTheDay(saved.length ? saved : wardrobeItems) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return supabaseApiError(error, "Daily outfit is temporarily unavailable.");
  }
}
