import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ user: null }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ user: { id: auth.user.id, email: auth.user.email ?? null } }, { headers: { "Cache-Control": "no-store" } });
}
