import { NextResponse } from "next/server";
import { getAuthenticatedUser, isSameOriginMutation, signOut } from "@/lib/supabase-rest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Cross-origin request blocked." }, { status: 403 });
  const auth = await getAuthenticatedUser();
  await signOut(auth?.accessToken);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
