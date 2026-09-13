import { NextResponse } from "next/server";

import { wardrobeItems, type WardrobeItem } from "@/lib/fitmatch-data";
import {
  buildRecommendations,
  generateOutfits,
  type GeneratedOutfit,
} from "@/lib/style-engine";

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
    // Keep local recommendations when the optional provider is unavailable.
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

  if (body.items && body.items.length > 0) {
    const augmented = [...wardrobeItems, ...body.items];
    const baseItems = augmented
      .filter((item) => item.category === "top" || item.category === "layer")
      .slice(0, count);

    const customOutfits = baseItems.map((base) => {
      const rec = buildRecommendations(base.id, "smart-casual", augmented)[0] ?? {
        title: `${base.name} outfit`,
        confidenceScore: 80,
        explanation: `A clean outfit anchored by ${base.color} ${base.name}.`,
        occasion: "smart-casual" as const,
        items: [base],
        colorHarmonyScore: 80,
        aestheticScore: 80,
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
      // Keep local recommendations when the optional provider is unavailable.
    }

    return NextResponse.json({ outfits });
  }

  let outfits = generateOutfits(body.baseItemId, count);
  try {
    outfits = await enrichWithOpenAI(outfits);
  } catch {
    // Keep local recommendations when the optional provider is unavailable.
  }

  return NextResponse.json({ outfits });
}
