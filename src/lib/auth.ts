import { cookies } from "next/headers";

import { getSupabaseConfig, verifyAccessToken } from "@/lib/supabase-rest";

export const ACCESS_COOKIE = "fitmatch-access-token";
export const REFRESH_COOKIE = "fitmatch-refresh-token";

export type CurrentSession = {
  accessToken: string;
  user: { id: string; email?: string };
};

export async function getCurrentSession(): Promise<CurrentSession | null> {
  if (!getSupabaseConfig()) return null;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;
  const user = await verifyAccessToken(accessToken);
  return user ? { accessToken, user } : null;
}

export function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const configuredOrigin = process.env.APP_ORIGIN;
    const expectedOrigin = configuredOrigin
      ? new URL(configuredOrigin).origin
      : new URL(request.url).origin;
    return new URL(origin).origin === expectedOrigin;
  } catch {
    return false;
  }
}
