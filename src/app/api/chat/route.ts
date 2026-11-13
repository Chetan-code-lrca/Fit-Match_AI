import { NextResponse } from "next/server";

import { getCurrentSession, isSameOriginMutation } from "@/lib/auth";
import { readLimitedJson } from "@/lib/http-validation";
import { wardrobeItems } from "@/lib/fitmatch-data";
import { buildChatReply } from "@/lib/style-engine";
import { consumeRateLimit } from "@/lib/supabase-rest";
import { readUserWardrobeItems } from "@/lib/wardrobe-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ message: "Cross-origin request rejected.", recommendations: [] }, { status: 403 });
  }
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "Authentication required.", recommendations: [] }, { status: 401 });
  const parsed = await readLimitedJson<{ prompt?: string }>(request, 8_000);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.reason === "too_large" ? "Request is too large." : "Invalid JSON body.", recommendations: [] },
      { status: parsed.reason === "too_large" ? 413 : 400 },
    );
  }
  const prompt = parsed.data.prompt?.trim();
  if (!prompt || prompt.length > 2_000) {
    return NextResponse.json({ message: "Enter a prompt between 1 and 2,000 characters.", recommendations: [] }, { status: 400 });
  }
  try {
    const allowed = await consumeRateLimit(session.accessToken, "stylist-chat", 30, 60);
    if (!allowed) return NextResponse.json({ message: "Stylist request limit reached.", recommendations: [] }, { status: 429 });
    const savedItems = await readUserWardrobeItems(session.accessToken, session.user.id);
    const activeWardrobe = savedItems.length > 0 ? savedItems : wardrobeItems;
    return NextResponse.json(buildChatReply(prompt, activeWardrobe), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ message: "Stylist service is unavailable.", recommendations: [] }, { status: 503 });
  }
}
