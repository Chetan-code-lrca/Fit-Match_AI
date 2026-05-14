import { NextResponse } from "next/server";

import { wardrobeItems, type WardrobeItem } from "@/lib/fitmatch-data";
import { generateOutfits, type GeneratedOutfit } from "@/lib/style-engine";

async function enrichWithOpenAI(outfits: GeneratedOutfit[]): Promise<GeneratedOutfit[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return outfits;

  const prompt = outfits
    .map(
      (o, i) =>
        `${i + 1}. ${o.outfitName}: ${o.items.map((item) => `${item.color} ${item.name}`).join(", ")}`,
    )
    .join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a concise fashion stylist. Given outfit combinations, write a single punchy sentence (max 20 words) of styling reasoning for each outfit. Return only a JSON array of strings in the same order.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  if (!response.ok) return outfits;

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";

  try {
    const reasonings = JSON.parse(content) as string[];
    return outfits.map((outfit, i) => ({
      ...outfit,
      reasoning: reasonings[i] ?? outfit.reasoning,
    }));
  } catch {
    return outfits;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const item = searchParams.get("item") ?? undefined;
  const count = Math.min(Math.max(Number(searchParams.get("count") ?? "4"), 1), 8);

  let outfits = generateOutfits(item, count);

  try {
    outfits = await enrichWithOpenAI(outfits);
  } catch {
    // fall through with local outfits
  }

  return NextResponse.json({ outfits });
}

export async function POST(request: Request) {
  let body: { items?: WardrobeItem[]; baseItemId?: string; count?: number } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const count = Math.min(Math.max(Number(body.count ?? 4), 1), 8);

  // If custom items are provided, use them; otherwise use the base item from the wardrobe
  if (body.items && body.items.length > 0) {
    // Generate outfits using provided custom wardrobe items
    const { buildRecommendations } = await import("@/lib/style-engine");

    // Temporarily merge custom items with static wardrobe for scoring purposes
    const augmented = [...wardrobeItems, ...body.items];
    const tops = augmented.filter(
      (i) => i.category === "top" || i.category === "layer",
    );
    const baseItems = tops.slice(0, count);

    const customOutfits = baseItems.map((base) => {
      const rec = buildRecommendations(base.id, "smart-casual")[0] ?? {
        title: `${base.name} outfit`,
        confidenceScore: 80,
        explanation: `A clean outfit anchored by ${base.color} ${base.name}.`,
        occasion: "smart-casual",
        items: [base],
      };
      return {
        outfitName: rec.title,
        score: rec.confidenceScore,
        reasoning: rec.explanation,
        occasion: rec.occasion,
        items: rec.items,
      };
    });

    let outfits = customOutfits;
    try {
      outfits = await enrichWithOpenAI(customOutfits);
    } catch {
      // fall through
    }

    return NextResponse.json({ outfits });
  }

  let outfits = generateOutfits(body.baseItemId, count);
  try {
    outfits = await enrichWithOpenAI(outfits);
  } catch {
    // fall through
  }

  return NextResponse.json({ outfits });
}
