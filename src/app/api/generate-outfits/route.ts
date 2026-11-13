import { NextResponse } from "next/server";
import { wardrobeItems, type WardrobeOccasion } from "@/lib/fitmatch-data";
import { getAuthenticatedUser, listWardrobeItems } from "@/lib/supabase-rest";
import { generateOutfits, type GeneratedOutfit } from "@/lib/style-engine";

const validOccasions: WardrobeOccasion[] = ["campus", "travel", "smart-casual", "streetwear", "night-out"];

async function enrichWithOpenAI(outfits: GeneratedOutfit[]): Promise<GeneratedOutfit[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !outfits.length) return outfits;
  const prompt = outfits.map((outfit, index) =>
    (index + 1) + ". " + outfit.outfitName + ": " + outfit.items.map((item) => item.color + " " + item.name).join(", "),
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
      max_tokens: 400, temperature: 0.5,
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) return outfits;
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  try {
    const reasons = JSON.parse(data.choices?.[0]?.message?.content?.trim() ?? "") as unknown;
    if (!Array.isArray(reasons)) return outfits;
    return outfits.map((outfit, index) => ({ ...outfit, reasoning: typeof reasons[index] === "string" ? reasons[index].slice(0, 300) : outfit.reasoning }));
  } catch { return outfits; }
}

function readOccasion(value: string | null): WardrobeOccasion {
  return validOccasions.includes(value as WardrobeOccasion) ? value as WardrobeOccasion : "campus";
}
function readCount(value: string | null) {
  const parsed = Number(value ?? 4);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.floor(parsed), 1), 8) : 4;
}
async function activeWardrobe() {
  const auth = await getAuthenticatedUser();
  if (!auth) return null;
  const saved = await listWardrobeItems(auth);
  return saved.length ? saved : wardrobeItems;
}

export async function GET(request: Request) {
  const wardrobe = await activeWardrobe();
  if (!wardrobe) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const selected = searchParams.get("item");
  const itemId = selected && wardrobe.some((item) => item.id === selected) ? selected : undefined;
  let outfits = generateOutfits(itemId, readCount(searchParams.get("count")), wardrobe, readOccasion(searchParams.get("occasion")));
  try { outfits = await enrichWithOpenAI(outfits); } catch { /* Local styling remains available. */ }
  return NextResponse.json({ outfits }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const wardrobe = await activeWardrobe();
  if (!wardrobe) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  let body: { baseItemId?: string; count?: number; occasion?: WardrobeOccasion };
  try { body = await request.json() as typeof body; }
  catch { return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 }); }
  const count = Number.isFinite(body.count) ? Math.min(Math.max(Math.floor(body.count!), 1), 8) : 4;
  const occasion = body.occasion && validOccasions.includes(body.occasion) ? body.occasion : "campus";
  const base = body.baseItemId && wardrobe.some((item) => item.id === body.baseItemId) ? body.baseItemId : undefined;
  let outfits = generateOutfits(base, count, wardrobe, occasion);
  try { outfits = await enrichWithOpenAI(outfits); } catch { /* Local styling remains available. */ }
  return NextResponse.json({ outfits }, { headers: { "Cache-Control": "no-store" } });
}
