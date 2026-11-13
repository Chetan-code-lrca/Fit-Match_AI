import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = "fitmatch-access";
const REFRESH_COOKIE = "fitmatch-refresh";

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url: url.replace(/\/+$/, ""), key } : null;
}

export async function proxy(request: NextRequest) {
  const settings = config();
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const signInUrl = new URL("/login", request.url);
  signInUrl.searchParams.set("next", request.nextUrl.pathname);
  if (!settings || (!accessToken && !refreshToken)) return NextResponse.redirect(signInUrl);

  if (accessToken) {
    const check = await fetch(settings.url + "/auth/v1/user", {
      headers: { apikey: settings.key, Authorization: "Bearer " + accessToken }, cache: "no-store",
    }).catch(() => null);
    if (check?.ok) return NextResponse.next();
  }

  if (refreshToken) {
    const refreshed = await fetch(settings.url + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: { apikey: settings.key, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }), cache: "no-store",
    }).catch(() => null);
    if (refreshed?.ok) {
      const session = await refreshed.json() as { access_token?: string; refresh_token?: string; expires_in?: number };
      if (session.access_token && session.refresh_token) {
        const response = NextResponse.next();
        const secure = process.env.NODE_ENV === "production";
        response.cookies.set(ACCESS_COOKIE, session.access_token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: Math.max(60, Math.min(session.expires_in ?? 3600, 86400)) });
        response.cookies.set(REFRESH_COOKIE, session.refresh_token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 2592000 });
        return response;
      }
    }
  }

  const response = NextResponse.redirect(signInUrl);
  response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

export const configMatcher = { matcher: ["/dashboard/:path*", "/upload/:path*", "/suggestions/:path*", "/chat/:path*", "/settings/:path*"] };
export const config = configMatcher;
