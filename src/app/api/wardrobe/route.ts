import { NextResponse } from "next/server";
import type { WardrobeItem } from "@/lib/fitmatch-data";
import {
  deleteWardrobeItem, getAuthenticatedUser, insertWardrobeItem, isSameOriginMutation,
  listWardrobeItems, SupabaseRequestError,
} from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const status = error instanceof SupabaseRequestError ? error.status : 500;
  const message = status === 503 ? (error instanceof Error ? error.message : "Supabase is not configured.")
    : status === 401 ? "Your session has expired. Sign in again."
    : status >= 500 ? "Wardrobe service is temporarily unavailable."
    : error instanceof Error ? error.message : "Wardrobe request failed.";
  return NextResponse.json({ message }, { status: status >= 500 && status !== 503 ? 502 : status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  try {
    return NextResponse.json({ items: await listWardrobeItems(auth) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Cross-origin request blocked." }, { status: 403 });
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ message: "Authentication required." }, { status: 401 });

  let body: Partial<WardrobeItem> & { imagePath?: string; extractedImagePath?: string };
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 16_384) return NextResponse.json({ message: "Request is too large." }, { status: 413 });
    body = await request.json() as typeof body;
  } catch { return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 }); }

  const categories = ["top", "bottom", "layer", "shoes", "accessory"];
  const palettes = ["neutral", "earth", "cool", "warm", "monochrome"];
  const occasions = ["campus", "travel", "smart-casual", "streetwear", "night-out"];
  if (typeof body.name !== "string" || !body.name.trim() || body.name.length > 120 || !categories.includes(body.category ?? "")) {
    return NextResponse.json({ message: "A valid item name and clothing category are required." }, { status: 400 });
  }
  if (body.palette && !palettes.includes(body.palette)) return NextResponse.json({ message: "Invalid colour palette." }, { status: 400 });
  if (body.occasion && (!Array.isArray(body.occasion) || body.occasion.length > 5 || body.occasion.some((item) => !occasions.includes(item)))) {
    return NextResponse.json({ message: "Invalid occasion list." }, { status: 400 });
  }
  if (body.tags && (!Array.isArray(body.tags) || body.tags.length > 20 || body.tags.some((tag) => typeof tag !== "string" || tag.length > 40))) {
    return NextResponse.json({ message: "Invalid tags." }, { status: 400 });
  }

  try {
    const item = await insertWardrobeItem(auth, body);
    return NextResponse.json({ item }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Cross-origin request blocked." }, { status: 403 });
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ message: "A valid wardrobe item id is required." }, { status: 400 });
  }
  try {
    await deleteWardrobeItem(auth, id);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
