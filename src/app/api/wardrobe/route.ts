import { NextResponse } from "next/server";

import type { WardrobeItem } from "@/lib/fitmatch-data";
import {
  addUserWardrobeItem,
  deleteUserWardrobeItem,
  readUserWardrobeItems,
} from "@/lib/wardrobe-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = readUserWardrobeItems();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  let body: Partial<WardrobeItem> = {};
  try {
    body = (await request.json()) as Partial<WardrobeItem>;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.id || !body.name || !body.category) {
    return NextResponse.json({ message: "Missing required fields: id, name, category." }, { status: 400 });
  }

  const item: WardrobeItem = {
    id: body.id,
    name: body.name,
    category: body.category,
    color: body.color ?? "black",
    palette: body.palette ?? "neutral",
    occasion: body.occasion ?? ["campus"],
    season: body.season ?? ["spring", "summer", "autumn", "winter"],
    tags: body.tags ?? [],
    imageUrl: body.imageUrl,
    extractedItemImage: body.extractedItemImage,
    style: body.style,
    fabric: body.fabric,
    pattern: body.pattern,
  };

  const items = addUserWardrobeItem(item);
  return NextResponse.json({ items });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "Missing id query parameter." }, { status: 400 });
  }
  const items = deleteUserWardrobeItem(id);
  return NextResponse.json({ items });
}
