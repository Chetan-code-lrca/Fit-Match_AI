import { NextResponse } from "next/server";

import {
  deleteOwnAccount,
  enforceUserRateLimit,
  getAuthenticatedUser,
  isSameOriginMutation,
  supabaseApiError,
} from "@/lib/supabase-rest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ message: "Cross-origin request blocked." }, { status: 403 });
  }
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ message: "Authentication required." }, { status: 401 });

  try {
    await enforceUserRateLimit(auth, "wardrobe_write", 60, 2);
    await deleteOwnAccount(auth);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return supabaseApiError(error, "Unable to delete this account.");
  }
}
