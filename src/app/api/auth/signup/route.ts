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
      typeof password !== "string" || password.length < 12 || password.length > 128) {
    return NextResponse.json({ message: "Use a valid email and a password with at least 12 characters." }, { status: 400 });
  }
  try {
    const configuredOrigin = process.env.APP_ORIGIN;
    const appOrigin = configuredOrigin ? new URL(configuredOrigin).origin : new URL(request.url).origin;
    if (process.env.NODE_ENV === "production" && !appOrigin.startsWith("https://")) {
      return NextResponse.json({ message: "Set APP_ORIGIN to the HTTPS production site URL." }, { status: 503 });
    }
    const redirectTo = new URL("/login?verified=1", appOrigin).toString();
    const signup = await supabaseAuthRequest(
      "/auth/v1/signup?redirect_to=" + encodeURIComponent(redirectTo),
      { method: "POST", body: JSON.stringify({ email, password }) },
    );
    const payload = await signup.json() as SupabaseSession;
    if (!signup.ok) {
      const message = signup.status === 422
        ? "An account may already exist for this email, or the password was rejected."
        : "Unable to create the account. Check your Supabase Auth configuration.";
      return NextResponse.json({ message }, { status: signup.status === 429 ? 429 : 400 });
    }
    if (payload.access_token && payload.refresh_token) {
      const response = NextResponse.json({ success: true, requiresEmailConfirmation: false });
      applyCookies(response, payload);
      return response;
    }
    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: true,
      message: "Check your inbox to verify your email, then sign in.",
    });
  } catch {
    return NextResponse.json({ message: "Unable to create the account right now." }, { status: 503 });
  }
}
