import { NextResponse } from "next/server";

import {
  enforceUserRateLimit,
  getAuthenticatedUser,
  listWardrobeItems,
  supabaseApiError,
} from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ message: "Authentication required." }, { status: 401 });

  try {
    await enforceUserRateLimit(auth, "wardrobe_read", 60, 5);
    const items = await listWardrobeItems(auth);
    const payload = {
      format: "fitmatch-wardrobe-export",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      account: { id: auth.user.id, email: auth.user.email ?? null },
      note: "Private image links expire after approximately one hour. This export contains wardrobe metadata and signed links, not a permanent copy of image files.",
      wardrobe: items,
    };
    const date = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="fitmatch-wardrobe-' + date + '.json"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return supabaseApiError(error, "Unable to export wardrobe data.");
  }
}
