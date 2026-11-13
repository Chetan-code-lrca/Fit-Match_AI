import { NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth";
import {
  getSupabaseConfig,
  refreshSupabaseSession,
  verifyAccessToken,
  type SupabaseSession,
} from "@/lib/supabase-rest";

const cookieOptions = (secure: boolean) => ({
  httpOnly: true,
  secure,
  sameSite: "lax" as const,
  path: "/",
});

function setSession(response: NextResponse, session: SupabaseSession, secure: boolean) {
  response.cookies.set(ACCESS_COOKIE, session.access_token, {
    ...cookieOptions(secure),
    maxAge: Math.max(60, Math.min(session.expires_in ?? 3600, 3600)),
  });
  response.cookies.set(REFRESH_COOKIE, session.refresh_token, {
    ...cookieOptions(secure),
    maxAge: 60 * 60 * 24 * 30,
  });
}
function clearSession(response: NextResponse, secure: boolean) {
  response.cookies.set(ACCESS_COOKIE, "", { ...cookieOptions(secure), maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...cookieOptions(secure), maxAge: 0 });
}
function addSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const secure = request.nextUrl.protocol === "https:";
  const isAuthApi = pathname.startsWith("/api/auth/");
  const isHealthApi = pathname === "/api/health";
  const isPrivateApi = pathname.startsWith("/api/") && !isAuthApi && !isHealthApi;
  const privatePages = ["/dashboard", "/upload", "/suggestions", "/chat", "/settings"];
  const isPrivatePage = privatePages.some((path) => pathname === path || pathname.startsWith(path + "/"));
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const requiresSession = isPrivateApi || isPrivatePage || isAuthPage;

  if (!requiresSession) return addSecurityHeaders(NextResponse.next());
  if (!getSupabaseConfig()) {
    if (isPrivateApi) {
      return addSecurityHeaders(NextResponse.json({ message: "Supabase is not configured." }, { status: 503 }));
    }
    if (isPrivatePage) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/login?setup=required", request.url)));
    }
    return addSecurityHeaders(NextResponse.next());
  }

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value ?? "";
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value ?? "";
  let user = accessToken ? await verifyAccessToken(accessToken) : null;
  let refreshed: SupabaseSession | null = null;

  if (!user && refreshToken) {
    refreshed = await refreshSupabaseSession(refreshToken);
    if (refreshed) {
      accessToken = refreshed.access_token;
      user = await verifyAccessToken(accessToken);
      if (user) {
        request.cookies.set(ACCESS_COOKIE, refreshed.access_token);
        request.cookies.set(REFRESH_COOKIE, refreshed.refresh_token);
      }
    }
  }

  if ((isPrivateApi || isPrivatePage) && !user) {
    if (isPrivateApi) {
      const response = NextResponse.json({ message: "Authentication required." }, { status: 401 });
      clearSession(response, secure);
      return addSecurityHeaders(response);
    }
    const destination = new URL("/login", request.url);
    destination.searchParams.set("next", pathname + search);
    const response = NextResponse.redirect(destination);
    clearSession(response, secure);
    return addSecurityHeaders(response);
  }
  if (isAuthPage && user) {
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    if (refreshed) setSession(response, refreshed, secure);
    return addSecurityHeaders(response);
  }

  const response = NextResponse.next({ request: { headers: request.headers } });
  if (refreshed && user) setSession(response, refreshed, secure);
  return addSecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
