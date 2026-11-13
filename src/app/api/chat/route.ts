import { NextResponse } from "next/server";
import { wardrobeItems } from "@/lib/fitmatch-data";
import { getAuthenticatedUser, listWardrobeItems, enforceUserRateLimit, supabaseApiError } from "@/lib/supabase-rest";
import { buildChatReply } from "@/lib/style-engine";

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ message: "Authentication required.", recommendations: [] }, { status: 401 });
  try { await enforceUserRateLimit(auth, "chat", 60, 12); }
  catch (error) { return supabaseApiError(error, "Stylist chat is temporarily unavailable."); }
  let body: { prompt?: string };
  try { body = await request.json() as { prompt?: string }; }
  catch { return NextResponse.json({ message: "Invalid JSON body.", recommendations: [] }, { status: 400 }); }
  const prompt = body.prompt?.trim();
  if (!prompt || prompt.length > 2000) return NextResponse.json({ message: "Prompt must contain between 1 and 2,000 characters.", recommendations: [] }, { status: 400 });
  const saved = await listWardrobeItems(auth);
  return NextResponse.json(buildChatReply(prompt, saved.length ? saved : wardrobeItems), { headers: { "Cache-Control": "no-store" } });
}
