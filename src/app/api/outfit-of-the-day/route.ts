import { NextResponse } from "next/server";
import { wardrobeItems } from "@/lib/fitmatch-data";
import { getAuthenticatedUser, listWardrobeItems } from "@/lib/supabase-rest";
import { buildOutfitOfTheDay } from "@/lib/style-engine";

export const dynamic = "force-dynamic";
export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const saved = await listWardrobeItems(auth);
  return NextResponse.json({ outfit: buildOutfitOfTheDay(saved.length ? saved : wardrobeItems) }, { headers: { "Cache-Control": "no-store" } });
}
