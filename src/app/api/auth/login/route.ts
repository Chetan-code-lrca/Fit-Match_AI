import { NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE, isSameOriginMutation } from "@/lib/auth";
import { readLimitedJson } from "@/lib/http-validation";
import { getSupabaseConfig, supabaseAuthRequest, type SupabaseSession } from "@/lib/supabase-rest";

function applyCookies(response: NextResponse, session: SupabaseSession) {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(ACCESS_COOKIE, session.access_token, {
    httpOnly: true, secure, sameSite: "lax", path: "/",
    maxAge: Math.max(60, Math.min(session.expires_in ?? 3600, 3600)),
  });
  response.cookies.set(REFRESH_COOKIE, session.refresh_token, {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ message: "Cross-origin request rejected." }, { status: 403 });
  }
  if (!getSupabaseConfig()) {
    return NextResponse.json({ message: "Supabase is not configured." }, { status: 503 });
  }
  const parsed = await readLimitedJson<{ email?: string; password?: string }>(request, 8_000);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.reason === "too_large" ? "Request is too large." : "Invalid JSON body." },
      { status: parsed.reason === "too_large" ? 413 : 400 },
    );
  }
  const email = parsed.data.email?.trim().toLowerCase();
  const password = parsed.data.password;
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" || password.length < 1 || password.length > 128) {
    return NextResponse.json({ message: "Enter a valid email and password." }, { status: 400 });
  }
  try {
    const auth = await supabaseAuthRequest("/auth/v1/token?grant_type=password", {
      method: "POST", body: JSON.stringify({ email, password }),
    });
    if (!auth.ok) return NextResponse.json({ message: "Email or password is incorrect." }, { status: 401 });
    const session = await auth.json() as SupabaseSession;
    if (!session.access_token || !session.refresh_token) {
      return NextResponse.json({ message: "Sign-in did not return a valid session." }, { status: 401 });
    }
    const response = NextResponse.json({ success: true });
    applyCookies(response, session);
    return response;
  } catch {
    return NextResponse.json({ message: "Unable to sign in right now." }, { status: 503 });
  }
}
