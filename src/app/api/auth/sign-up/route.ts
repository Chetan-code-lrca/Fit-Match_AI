import { NextResponse } from "next/server";
import { isSameOriginMutation, isValidEmail, signUpWithPassword, SupabaseRequestError, writeAuthCookies } from "@/lib/supabase-rest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Cross-origin request blocked." }, { status: 403 });
  let body: { email?: unknown; password?: unknown };
  try { body = await request.json() as typeof body; }
  catch { return NextResponse.json({ message: "Invalid request body." }, { status: 400 }); }
  if (!isValidEmail(body.email) || typeof body.password !== "string" || body.password.length < 10 || body.password.length > 128) {
    return NextResponse.json({ message: "Use a valid email and a password with at least 10 characters." }, { status: 400 });
  }
  try {
    const origin = new URL(request.url).origin;
    const session = await signUpWithPassword(body.email.trim().toLowerCase(), body.password, origin + "/auth/confirm");
    if (session.access_token && session.refresh_token) {
      await writeAuthCookies(session);
      return NextResponse.json({ authenticated: true, message: "Your account is ready." }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ authenticated: false, message: "Check your inbox for the confirmation email, then return here to sign in." });
  } catch (error) {
    const status = error instanceof SupabaseRequestError ? error.status : 500;
    const message = status === 409 ? "An account with this email may already exist. Try signing in."
      : status === 429 ? "Too many account creation attempts. Wait before trying again."
      : status === 503 ? (error instanceof Error ? error.message : "Authentication is not configured.")
      : "Unable to create the account. Check the details and try again.";
    return NextResponse.json(
      { message },
      {
        status: status === 503 || status === 429 ? status : status >= 500 ? 502 : 400,
        headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": "60" } : {}) },
      },
    );
  }
}
