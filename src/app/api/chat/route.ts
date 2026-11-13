import { NextResponse } from "next/server";

import { wardrobeItems } from "@/lib/fitmatch-data";
import {
  enforceUserRateLimit,
  getAuthenticatedUser,
  listWardrobeItems,
  supabaseApiError,
} from "@/lib/supabase-rest";
import { buildChatReply } from "@/lib/style-engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json(
        { message: "Authentication required.", recommendations: [] },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    await enforceUserRateLimit(auth, "chat", 60, 12);

    const body = await request.json().catch(() => null) as { prompt?: unknown } | null;
    if (!body || typeof body.prompt !== "string") {
      return NextResponse.json({ message: "Invalid JSON body.", recommendations: [] }, { status: 400 });
    }

    const prompt = body.prompt.trim();
    if (!prompt || prompt.length > 2000) {
      return NextResponse.json(
        { message: "Prompt must contain between 1 and 2,000 characters.", recommendations: [] },
        { status: 400 },
      );
    }

    const saved = await listWardrobeItems(auth);
    return NextResponse.json(
      buildChatReply(prompt, saved.length ? saved : wardrobeItems),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return supabaseApiError(error, "Stylist chat is temporarily unavailable.");
  }
}
