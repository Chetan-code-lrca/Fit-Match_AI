import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";
import { consumeRateLimit, databaseRequest } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "Authentication required." }, { status: 401 });

  try {
    const allowed = await consumeRateLimit(session.accessToken, "account-export", 3, 3600);
    if (!allowed) return NextResponse.json({ message: "Export limit reached. Try again later." }, { status: 429 });

    const query = "wardrobe_items?select=id,item,created_at,updated_at&user_id=eq." +
      encodeURIComponent(session.user.id) + "&order=created_at.asc";
    const response = await databaseRequest(query, session.accessToken);
    if (!response.ok) throw new Error("Export query failed.");
    const wardrobe = await response.json();

    return NextResponse.json({
      format: "fitmatch-account-export-v1",
      exportedAt: new Date().toISOString(),
      account: { id: session.user.id, email: session.user.email ?? null },
      wardrobe,
      note: "Image paths are private Storage object keys. Image bytes are not embedded in this JSON export.",
    }, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": 'attachment; filename="fitmatch-account-export.json"',
      },
    });
  } catch {
    return NextResponse.json({ message: "Unable to export account data right now." }, { status: 503 });
  }
}
