import { NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE, getCurrentSession, isSameOriginMutation } from "@/lib/auth";
import { readLimitedJson } from "@/lib/http-validation";
import { databaseRequest, removePrivateImages } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";
const CONFIRMATION = "DELETE MY FITMATCH ACCOUNT";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ message: "Cross-origin request rejected." }, { status: 403 });
  }
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "Authentication required." }, { status: 401 });

  const parsed = await readLimitedJson<{ confirmation?: string }>(request, 1000);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.reason === "too_large" ? "Request is too large." : "Invalid request." },
      { status: parsed.reason === "too_large" ? 413 : 400 },
    );
  }
  if (parsed.data.confirmation !== CONFIRMATION) {
    return NextResponse.json({ message: "The account deletion confirmation did not match." }, { status: 400 });
  }

  try {
    const query = "wardrobe_items?select=item&user_id=eq." + encodeURIComponent(session.user.id);
    const response = await databaseRequest(query, session.accessToken);
    if (!response.ok) throw new Error("Unable to list account objects.");
    const rows = await response.json() as Array<{ item?: { imageUrl?: unknown; extractedItemImage?: unknown } }>;
    const paths = rows.flatMap(({ item }) => [item?.imageUrl, item?.extractedItemImage])
      .filter((value): value is string =>
        typeof value === "string" &&
        value.startsWith(session.user.id + "/") &&
        !value.includes("..") &&
        !value.includes("\\")
      );

    // Storage is cleaned while the user's JWT is still valid; the SQL function then
    // removes auth.users and cascades the account's database rows.
    await removePrivateImages(session.accessToken, paths);
    const deleted = await databaseRequest("rpc/delete_my_fitmatch_account", session.accessToken, {
      method: "POST",
      body: "{}",
    });
    if (!deleted.ok || (await deleted.json()) !== true) {
      throw new Error("Account deletion RPC failed.");
    }

    const result = NextResponse.json({ success: true });
    const secure = process.env.NODE_ENV === "production";
    for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
      result.cookies.set(name, "", {
        httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0,
      });
    }
    return result;
  } catch {
    return NextResponse.json({
      message: "Account deletion could not be completed. Your account is still active; please retry or contact support.",
    }, { status: 503 });
  }
}
