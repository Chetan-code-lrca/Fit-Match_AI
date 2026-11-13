import { NextResponse } from "next/server";
import { wardrobeItems } from "@/lib/fitmatch-data";
import { getAuthenticatedUser, listWardrobeItems, enforceUserRateLimit, supabaseApiError } from "@/lib/supabase-rest";
import { buildOutfitOfTheDay } from "@/lib/style-engine";

export const dynamic = "force-dynamic";
export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  try { await enforceUserRateLimit(auth, "daily_outfit", 60, 30); }
  catch (error) { return supabaseApiError(error, "Daily outfit is temporarily unavailable."); }
  const saved = await listWardrobeItems(auth);
  return NextResponse.json({ outfit: buildOutfitOfTheDay(saved.length ? saved : wardrobeItems) }, { headers: { "Cache-Control": "no-store" } });
}
