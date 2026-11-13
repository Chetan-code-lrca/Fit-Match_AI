import { NextResponse } from "next/server";
import { SupabaseRequestError, verifyEmailToken, writeAuthCookies } from "@/lib/supabase-rest";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") ?? "email";
  if (!tokenHash || !["email", "signup", "magiclink", "recovery", "invite", "email_change"].includes(type)) {
    return NextResponse.redirect(new URL("/login?error=invalid-confirmation", url.origin));
  }
  try {
    const session = await verifyEmailToken(tokenHash, type);
    if (!session.access_token || !session.refresh_token) return NextResponse.redirect(new URL("/login?message=confirmed", url.origin));
    await writeAuthCookies(session);
    return NextResponse.redirect(new URL("/dashboard", url.origin));
  } catch (error) {
    const code = error instanceof SupabaseRequestError && error.status === 503 ? "auth-not-configured" : "confirmation-expired";
    return NextResponse.redirect(new URL("/login?error=" + code, url.origin));
  }
}
