import { NextResponse } from "next/server";

import type { WardrobeItem } from "@/lib/fitmatch-data";
import { rejectUnsafeProductionStorage } from "@/lib/production-safety";
import {
  addUserWardrobeItem,
  deleteUserWardrobeItem,
  readUserWardrobeItems,
} from "@/lib/wardrobe-server";

export const dynamic = "force-dynamic";

const categories = ["top", "bottom", "layer", "shoes", "accessory"];
const palettes = ["neutral", "earth", "cool", "warm", "monochrome"];
const occasions = ["campus", "travel", "smart-casual", "streetwear", "night-out"];

export async function GET() {
  const blocked = rejectUnsafeProductionStorage();
  if (blocked) return blocked;

  const items = readUserWardrobeItems();
  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const blocked = rejectUnsafeProductionStorage();
  if (blocked) return blocked;

  let body: Partial<WardrobeItem> = {};
  try {
    body = (await request.json()) as Partial<WardrobeItem>;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (
    typeof body.id !== "string" || body.id.length > 80 ||
    typeof body.name !== "string" || body.name.trim().length < 1 || body.name.length > 120 ||
    !categories.includes(body.category ?? "")
  ) {
    return NextResponse.json(
      { message: "A valid id, name and clothing category are required." },
      { status: 400 },
    );
  }

  if (body.palette && !palettes.includes(body.palette)) {
    return NextResponse.json({ message: "Invalid colour palette." }, { status: 400 });
  }

  if (body.occasion && (
    !Array.isArray(body.occasion) ||
    body.occasion.length > 5 ||
    body.occasion.some((value) => !occasions.includes(value))
  )) {
    return NextResponse.json({ message: "Invalid occasion list." }, { status: 400 });
  }

  const item: WardrobeItem = {
    id: body.id,
    name: body.name.trim(),
    category: body.category as WardrobeItem["category"],
    color: typeof body.color === "string" ? body.color.slice(0, 40) : "black",
    palette: (body.palette as WardrobeItem["palette"] | undefined) ?? "neutral",
    occasion: (body.occasion as WardrobeItem["occasion"] | undefined) ?? ["campus"],
    season: body.season ?? ["spring", "summer", "autumn", "winter"],
    tags: Array.isArray(body.tags)
      ? body.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 20).map((tag) => tag.slice(0, 40))
      : [],
    imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.slice(0, 500) : undefined,
    extractedItemImage: typeof body.extractedItemImage === "string"
      ? body.extractedItemImage.slice(0, 500)
      : undefined,
    style: typeof body.style === "string" ? body.style.slice(0, 40) : undefined,
    fabric: typeof body.fabric === "string" ? body.fabric.slice(0, 40) : undefined,
    pattern: body.pattern,
  };

  const items = addUserWardrobeItem(item);
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  const blocked = rejectUnsafeProductionStorage();
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id || id.length > 80) {
    return NextResponse.json({ message: "A valid id query parameter is required." }, { status: 400 });
  }
  const items = deleteUserWardrobeItem(id);
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
