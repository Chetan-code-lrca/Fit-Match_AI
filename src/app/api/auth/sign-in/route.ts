import { NextResponse } from "next/server";
import { getUserByPassword, isSameOriginMutation, isValidEmail, SupabaseRequestError, writeAuthCookies } from "@/lib/supabase-rest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Cross-origin request blocked." }, { status: 403 });
  let body: { email?: unknown; password?: unknown };
  try { body = await request.json() as typeof body; }
  catch { return NextResponse.json({ message: "Invalid request body." }, { status: 400 }); }
  if (!isValidEmail(body.email) || typeof body.password !== "string" || !body.password.length || body.password.length > 128) {
    return NextResponse.json({ message: "Enter a valid email and password." }, { status: 400 });
  }
  try {
    const session = await getUserByPassword(body.email.trim().toLowerCase(), body.password);
    if (!session.access_token || !session.refresh_token) return NextResponse.json({ message: "Sign-in did not return a valid session." }, { status: 401 });
    await writeAuthCookies(session);
    return NextResponse.json({ user: { id: session.user?.id, email: session.user?.email } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof SupabaseRequestError ? error.status : 500;
    const message = status === 400 || status === 401 ? "Email or password is incorrect."
      : status === 429 ? "Too many sign-in attempts. Wait before trying again."
      : status === 503 ? (error instanceof Error ? error.message : "Authentication is not configured.")
      : "Unable to sign in right now.";
    return NextResponse.json(
      { message },
      {
        status: status === 503 || status === 429 ? status : status === 500 ? 502 : 401,
        headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": "60" } : {}) },
      },
    );
  }
}
