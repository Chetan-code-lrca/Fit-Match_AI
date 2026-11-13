import { NextResponse } from "next/server";

import { wardrobeItems, type WardrobeItem, type WardrobeOccasion } from "@/lib/fitmatch-data";
import { rejectUnsafeProductionStorage } from "@/lib/production-safety";
import { generateOutfits, type GeneratedOutfit } from "@/lib/style-engine";
import { readUserWardrobeItems } from "@/lib/wardrobe-server";

const validOccasions: WardrobeOccasion[] = ["campus", "travel", "smart-casual", "streetwear", "night-out"];

async function enrichWithOpenAI(outfits: GeneratedOutfit[]): Promise<GeneratedOutfit[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || outfits.length === 0) return outfits;

  const prompt = outfits.map((outfit, index) =>
    `${index + 1}. ${outfit.outfitName}: ${outfit.items.map((item) => item.color + " " + item.name).join(", ")}`,
  ).join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a concise fashion stylist. Given outfit combinations, write a single useful styling explanation (max 20 words) for each outfit. Return only a JSON array of strings in the same order." },
        { role: "user", content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.5,
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) return outfits;
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  try {
    const reasonings = JSON.parse(data.choices?.[0]?.message?.content?.trim() ?? "") as unknown;
    if (!Array.isArray(reasonings)) return outfits;
    return outfits.map((outfit, index) => ({
      ...outfit,
      reasoning: typeof reasonings[index] === "string" ? reasonings[index].slice(0, 300) : outfit.reasoning,
    }));
  } catch {
    return outfits;
  }
}

function readOccasion(value: string | null): WardrobeOccasion {
  return validOccasions.includes(value as WardrobeOccasion) ? value as WardrobeOccasion : "campus";
}

function readCount(value: unknown, fallback = 4) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.floor(parsed), 1), 8) : fallback;
}

function getActiveWardrobe(customItems?: WardrobeItem[]) {
  if (customItems && customItems.length > 0) {
    return Array.from(new Map(customItems.map((item) => [item.id, item])).values());
  }
  const savedItems = readUserWardrobeItems();
  return savedItems.length > 0 ? savedItems : wardrobeItems;
}

export async function GET(request: Request) {
  const blocked = rejectUnsafeProductionStorage();
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const selectedItem = searchParams.get("item") ?? undefined;
  const count = readCount(searchParams.get("count"));
  const occasion = readOccasion(searchParams.get("occasion"));
  const activeWardrobe = getActiveWardrobe();
  const item = selectedItem && activeWardrobe.some((entry) => entry.id === selectedItem) ? selectedItem : undefined;

  let outfits = generateOutfits(item, count, activeWardrobe, occasion);
  try { outfits = await enrichWithOpenAI(outfits); } catch { /* Local scoring remains available. */ }

  return NextResponse.json({ outfits }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const blocked = rejectUnsafeProductionStorage();
  if (blocked) return blocked;

  let body: { items?: WardrobeItem[]; baseItemId?: string; count?: number; occasion?: WardrobeOccasion } = {};
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (body.items && (!Array.isArray(body.items) || body.items.length > 100)) {
    return NextResponse.json({ message: "Wardrobe payload is invalid or too large." }, { status: 400 });
  }

  const count = readCount(body.count);
  const occasion = body.occasion && validOccasions.includes(body.occasion) ? body.occasion : "campus";
  const activeWardrobe = getActiveWardrobe(body.items);
  const requestedBase = body.baseItemId && activeWardrobe.some((item) => item.id === body.baseItemId)
    ? body.baseItemId : undefined;

  let outfits = generateOutfits(requestedBase, count, activeWardrobe, occasion);
  try { outfits = await enrichWithOpenAI(outfits); } catch { /* Local scoring remains available. */ }

  return NextResponse.json({ outfits }, { headers: { "Cache-Control": "no-store" } });
}
