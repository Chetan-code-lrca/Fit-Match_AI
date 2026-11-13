import type { WardrobeItem } from "@/lib/fitmatch-data";

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
  user?: { id: string; email?: string };
};
export type SupabaseConfig = { url: string; key: string };

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !key.startsWith("sb_publishable_")) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && process.env.NODE_ENV === "production") return null;
    return { url: parsed.origin, key };
  } catch {
    return null;
  }
}

export async function supabaseAuthRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  const headers = new Headers(init.headers);
  headers.set("apikey", config.key);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  return fetch(config.url + path, {
    ...init, headers, cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(7000),
  });
}

export async function verifyAccessToken(accessToken: string) {
  if (!accessToken) return null;
  try {
    const response = await supabaseAuthRequest("/auth/v1/user", {
      headers: { Authorization: "Bearer " + accessToken },
    });
    if (!response.ok) return null;
    const user = await response.json() as { id?: string; email?: string };
    return typeof user.id === "string" ? user : null;
  } catch {
    return null;
  }
}

export async function refreshSupabaseSession(refreshToken: string): Promise<SupabaseSession | null> {
  if (!refreshToken) return null;
  try {
    const response = await supabaseAuthRequest("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) return null;
    const session = await response.json() as SupabaseSession;
    return session.access_token && session.refresh_token && session.user?.id ? session : null;
  } catch {
    return null;
  }
}

export async function databaseRequest(path: string, accessToken: string, init: RequestInit = {}) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  const headers = new Headers(init.headers);
  headers.set("apikey", config.key);
  headers.set("Authorization", "Bearer " + accessToken);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(config.url + "/rest/v1/" + path, {
    ...init, headers, cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(8000),
  });
}

function encodedStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function createPrivateUploadUrl(userId: string, accessToken: string, storagePath: string): Promise<string> {
  if (!storagePath.startsWith(userId + "/") || storagePath.includes("..")) {
    throw new Error("Invalid private storage path.");
  }
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  const response = await fetch(
    config.url + "/storage/v1/object/upload/sign/wardrobe-private/" + encodedStoragePath(storagePath),
    {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: "{}",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    },
  );
  if (!response.ok) throw new Error("Unable to create a private upload URL.");
  const payload = await response.json() as { url?: string; signedUrl?: string };
  const rawUrl = payload.url ?? payload.signedUrl;
  if (!rawUrl) throw new Error("Storage did not return an upload URL.");
  const uploadUrl = /^https:\/\//i.test(rawUrl)
    ? rawUrl
    : config.url + "/storage/v1" + (rawUrl.startsWith("/") ? rawUrl : "/" + rawUrl);
  const parsed = new URL(uploadUrl);
  if (
    parsed.origin !== new URL(config.url).origin ||
    !parsed.pathname.includes("/storage/v1/object/upload/sign/wardrobe-private/") ||
    !parsed.searchParams.has("token")
  ) throw new Error("Storage returned an invalid signed upload URL.");
  return parsed.toString();
}

export async function downloadPrivateImage(
  userId: string, accessToken: string, storagePath: string,
): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  if (!storagePath.startsWith(userId + "/") || storagePath.includes("..")) return null;
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  const response = await fetch(
    config.url + "/storage/v1/object/authenticated/wardrobe-private/" + encodedStoragePath(storagePath),
    {
      headers: { apikey: config.key, Authorization: "Bearer " + accessToken },
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
    },
  );
  if (!response.ok) return null;
  const mimeType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 5 * 1024 * 1024) return null;
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > 5 * 1024 * 1024) return null;
  return { bytes, mimeType };
}

export async function signPrivateImage(userId: string, accessToken: string, storagePath: string): Promise<string | undefined> {
  if (!storagePath.startsWith(userId + "/") || storagePath.includes("..")) return undefined;
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  const response = await fetch(
    config.url + "/storage/v1/object/sign/wardrobe-private/" + encodedStoragePath(storagePath),
    {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 3600 }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    },
  );
  if (!response.ok) return undefined;
  const payload = await response.json() as { signedURL?: string; signedUrl?: string };
  const signed = payload.signedURL ?? payload.signedUrl;
  if (!signed) return undefined;
  if (/^https:\/\//i.test(signed)) return signed;
  return config.url + "/storage/v1" + (signed.startsWith("/") ? signed : "/" + signed);
}

export async function removePrivateImages(accessToken: string, storagePaths: string[]) {
  if (storagePaths.length === 0) return;
  const config = getSupabaseConfig();
  if (!config) return;
  const response = await fetch(config.url + "/storage/v1/object/wardrobe-private", {
    method: "DELETE",
    headers: {
      apikey: config.key,
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefixes: storagePaths }),
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Unable to remove private wardrobe images.");
}

export async function consumeRateLimit(accessToken: string, bucket: string, limit: number, windowSeconds: number): Promise<boolean> {
  const response = await databaseRequest("rpc/consume_fitmatch_rate_limit", accessToken, {
    method: "POST",
    body: JSON.stringify({ p_bucket: bucket, p_limit: limit, p_window_seconds: windowSeconds }),
  });
  if (!response.ok) throw new Error("Rate-limit service is unavailable. Apply the database migration.");
  return (await response.json()) === true;
}

export async function checkSupabaseDatabaseHealth(): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config) return false;
  try {
    const response = await fetch(config.url + "/rest/v1/rpc/fitmatch_health", {
      method: "POST",
      headers: { apikey: config.key, "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    return response.ok && (await response.json()) === true;
  } catch {
    return false;
  }
}

export function isWardrobeItemRecord(value: unknown): value is WardrobeItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  const categories = ["top", "bottom", "layer", "shoes", "accessory"];
  const palettes = ["neutral", "earth", "cool", "warm", "monochrome"];
  const occasions = ["campus", "travel", "smart-casual", "streetwear", "night-out"];
  const seasons = ["spring", "summer", "autumn", "winter"];
  const shortString = (v: unknown, max: number) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
  const stringArray = (v: unknown, allowed?: string[]) =>
    Array.isArray(v) && v.length <= 12 &&
    v.every((entry) => typeof entry === "string" && entry.length <= 48 && (!allowed || allowed.includes(entry)));
  return shortString(item.id, 80) && /^[a-zA-Z0-9_-]+$/.test(item.id as string) &&
    shortString(item.name, 80) && typeof item.category === "string" && categories.includes(item.category) &&
    shortString(item.color, 40) && typeof item.palette === "string" && palettes.includes(item.palette) &&
    stringArray(item.occasion, occasions) && stringArray(item.season, seasons) && stringArray(item.tags);
}
