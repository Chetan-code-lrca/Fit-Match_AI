import { NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE, isSameOriginMutation } from "@/lib/auth";
import { getSupabaseConfig, supabaseAuthRequest } from "@/lib/supabase-rest";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ message: "Cross-origin request rejected." }, { status: 403 });
  }
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(ACCESS_COOKIE + "="))?.slice(ACCESS_COOKIE.length + 1);
  if (token && getSupabaseConfig()) {
    try {
      await supabaseAuthRequest("/auth/v1/logout", {
        method: "POST",
        headers: { Authorization: "Bearer " + decodeURIComponent(token) },
      });
    } catch {
      // Clear local credentials even if remote revocation is temporarily unavailable.
    }
  }
  const response = NextResponse.json({ success: true });
  const secure = process.env.NODE_ENV === "production";
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0,
    });
  }
  return response;
}
