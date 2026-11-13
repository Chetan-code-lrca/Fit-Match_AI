import { NextResponse } from "next/server";

import { getCurrentSession, isSameOriginMutation } from "@/lib/auth";
import { readLimitedJson } from "@/lib/http-validation";
import type { WardrobeItem } from "@/lib/fitmatch-data";
import { isUserStoragePath, normalizeWardrobeItem } from "@/lib/security-validation";
import { consumeRateLimit } from "@/lib/supabase-rest";
import { addUserWardrobeItem, deleteUserWardrobeItem, readUserWardrobeItems } from "@/lib/wardrobe-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  try {
    const items = await readUserWardrobeItems(session.accessToken, session.user.id);
    return NextResponse.json({ items }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ message: "Wardrobe service is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Cross-origin request rejected." }, { status: 403 });
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const parsed = await readLimitedJson<unknown>(request, 24_000);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.reason === "too_large" ? "Request is too large." : "Invalid JSON body." },
      { status: parsed.reason === "too_large" ? 413 : 400 },
    );
  }
  const item = normalizeWardrobeItem(parsed.data);
  if (!item) return NextResponse.json({ message: "Wardrobe item metadata is invalid." }, { status: 400 });
  for (const path of [item.imageUrl, item.extractedItemImage]) {
    if (path && !isUserStoragePath(path, session.user.id)) {
      return NextResponse.json({ message: "Image path does not belong to this account." }, { status: 403 });
    }
  }
  try {
    const allowed = await consumeRateLimit(session.accessToken, "wardrobe-write", 60, 3600);
    if (!allowed) return NextResponse.json({ message: "Wardrobe change limit reached. Try again later." }, { status: 429 });
    await addUserWardrobeItem(item as WardrobeItem, session.accessToken, session.user.id);
    return NextResponse.json({ success: true, itemId: item.id }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Unable to save this item. Confirm the Supabase migration is applied." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Cross-origin request rejected." }, { status: 403 });
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || id.length > 80 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return NextResponse.json({ message: "A valid id query parameter is required." }, { status: 400 });
  }
  try {
    const allowed = await consumeRateLimit(session.accessToken, "wardrobe-write", 60, 3600);
    if (!allowed) return NextResponse.json({ message: "Wardrobe change limit reached. Try again later." }, { status: 429 });
    await deleteUserWardrobeItem(id, session.accessToken, session.user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Unable to delete this item." }, { status: 503 });
  }
}
