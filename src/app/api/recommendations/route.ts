import { NextResponse } from "next/server";
import { wardrobeItems, type WardrobeOccasion } from "@/lib/fitmatch-data";
import { getAuthenticatedUser, listWardrobeItems, enforceUserRateLimit, supabaseApiError } from "@/lib/supabase-rest";
import { buildRecommendations } from "@/lib/style-engine";

const validOccasions: WardrobeOccasion[] = ["campus", "travel", "smart-casual", "streetwear", "night-out"];
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  try { await enforceUserRateLimit(auth, "recommendations", 60, 60); }
  catch (error) { return supabaseApiError(error, "Recommendations are temporarily unavailable."); }
  const saved = await listWardrobeItems(auth);
  const wardrobe = saved.length ? saved : wardrobeItems;
  const { searchParams } = new URL(request.url);
  const requested = searchParams.get("occasion");
  const occasion = validOccasions.includes(requested as WardrobeOccasion) ? requested as WardrobeOccasion : "campus";
  const selected = searchParams.get("item");
  const item = selected && wardrobe.some((entry) => entry.id === selected) ? selected : wardrobe[0]?.id;
  return NextResponse.json({ recommendations: item ? buildRecommendations(item, occasion, wardrobe) : [] }, { headers: { "Cache-Control": "no-store" } });
}
