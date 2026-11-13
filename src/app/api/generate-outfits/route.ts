import { NextResponse } from "next/server";

import { getCurrentSession, isSameOriginMutation } from "@/lib/auth";
import { readLimitedJson } from "@/lib/http-validation";
import { wardrobeItems, type WardrobeOccasion } from "@/lib/fitmatch-data";
import { generateOutfits, type GeneratedOutfit } from "@/lib/style-engine";
import { consumeRateLimit } from "@/lib/supabase-rest";
import { readUserWardrobeItems } from "@/lib/wardrobe-server";

const validOccasions: WardrobeOccasion[] = ["campus", "travel", "smart-casual", "streetwear", "night-out"];
function readOccasion(value: string | null | undefined): WardrobeOccasion {
  return value && validOccasions.includes(value as WardrobeOccasion) ? value as WardrobeOccasion : "campus";
}
function readCount(value: unknown) {
  if (value === null || value === undefined || value === "") return 4;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.floor(parsed), 1), 8) : 4;
}

async function enrichWithOpenAI(outfits: GeneratedOutfit[]): Promise<GeneratedOutfit[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || outfits.length === 0) return outfits;
  const prompt = outfits.map((outfit, index) =>
    (index + 1) + ". " + outfit.outfitName + ": " + outfit.items.map((item) => item.color + " " + item.name).join(", "),
  ).join("\n");
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a concise fashion stylist. Give one useful styling explanation of at most 20 words per outfit. Return only a JSON array of strings in the same order." },
          { role: "user", content: prompt },
        ],
        max_tokens: 400,
        temperature: 0.5,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return outfits;
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const result = JSON.parse(payload.choices?.[0]?.message?.content?.trim() ?? "null") as unknown;
    if (!Array.isArray(result)) return outfits;
    return outfits.map((outfit, index) => ({
      ...outfit,
      reasoning: typeof result[index] === "string" ? (result[index] as string).slice(0, 240) : outfit.reasoning,
    }));
  } catch {
    return outfits;
  }
}

async function generateForCurrentUser(options: {
  baseItemId?: string;
  count?: unknown;
  occasion?: string | null;
}) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  try {
    const allowed = await consumeRateLimit(session.accessToken, "outfit-generation", 30, 60);
    if (!allowed) return NextResponse.json({ message: "Outfit generation limit reached." }, { status: 429 });
    const savedItems = await readUserWardrobeItems(session.accessToken, session.user.id);
    const wardrobe = savedItems.length > 0 ? savedItems : wardrobeItems;
    const anchor = options.baseItemId && wardrobe.some((item) => item.id === options.baseItemId)
      ? options.baseItemId : undefined;
    const outfits = generateOutfits(anchor, readCount(options.count), wardrobe, readOccasion(options.occasion));
    return NextResponse.json({ outfits: await enrichWithOpenAI(outfits) }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ message: "Outfit generation is unavailable." }, { status: 503 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return generateForCurrentUser({
    baseItemId: searchParams.get("item") ?? undefined,
    count: searchParams.get("count"),
    occasion: searchParams.get("occasion"),
  });
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Cross-origin request rejected." }, { status: 403 });
  const parsed = await readLimitedJson<{ baseItemId?: string; count?: number; occasion?: string }>(request, 8_000);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.reason === "too_large" ? "Request is too large." : "Invalid JSON body." },
      { status: parsed.reason === "too_large" ? 413 : 400 },
    );
  }
  const body = parsed.data;
  if (body.baseItemId && (body.baseItemId.length > 80 || !/^[a-zA-Z0-9_-]+$/.test(body.baseItemId))) {
    return NextResponse.json({ message: "Invalid anchor item." }, { status: 400 });
  }
  return generateForCurrentUser({ baseItemId: body.baseItemId, count: body.count, occasion: body.occasion });
}
