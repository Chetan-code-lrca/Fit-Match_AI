import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import type { WardrobeItem } from "@/lib/fitmatch-data";
import { ImageProcessingError, normalizeUploadedImage } from "@/lib/image-processing";

const ACCESS_COOKIE = "fitmatch-access";
const REFRESH_COOKIE = "fitmatch-refresh";
const STORAGE_BUCKET = "wardrobe-private";
const SIGNED_URL_TTL_SECONDS = 3600;

type SupabaseConfig = { url: string; key: string };
export type SupabaseUser = { id: string; email?: string; aud?: string; role?: string };
export type AuthContext = { user: SupabaseUser; accessToken: string };
type SupabaseSession = { access_token?: string; refresh_token?: string; expires_in?: number; user?: SupabaseUser };
type WardrobeRow = {
  id: string; user_id: string; name: string; category: WardrobeItem["category"];
  color: string; palette: WardrobeItem["palette"]; occasions: WardrobeItem["occasion"];
  seasons: WardrobeItem["season"]; tags: string[]; image_path: string | null;
  extracted_image_path: string | null; style: string | null; fabric: string | null;
  pattern: WardrobeItem["pattern"] | null; created_at: string;
};

export class SupabaseRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = "SupabaseRequestError"; }
}

function getConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new SupabaseRequestError("Supabase is not configured. Set the project URL and publishable key.", 503);
  return { url: url.replace(/\/+$/, ""), key };
}

export function isSupabaseConfigured(): boolean {
  try { getConfig(); return true; } catch { return false; }
}

async function readResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: unknown = null;
  if (text) { try { data = JSON.parse(text); } catch { data = { message: text.slice(0, 300) }; } }
  if (!response.ok) {
    const detail = typeof data === "object" && data !== null && "msg" in data
      ? String((data as { msg: unknown }).msg)
      : typeof data === "object" && data !== null && "message" in data
        ? String((data as { message: unknown }).message) : "Supabase request failed.";
    throw new SupabaseRequestError(detail, response.status);
  }
  return data as T;
}

async function authRequest<T>(path: string, body?: unknown): Promise<T> {
  const config = getConfig();
  const response = await fetch(config.url + "/auth/v1" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { apikey: config.key, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store",
  });
  return readResponse<T>(response);
}

function cookieOptions(maxAge: number) {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge };
}

export async function writeAuthCookies(session: SupabaseSession): Promise<void> {
  if (!session.access_token || !session.refresh_token) return;
  const store = await cookies();
  const age = Math.max(60, Math.min(session.expires_in ?? 3600, 86400));
  store.set(ACCESS_COOKIE, session.access_token, cookieOptions(age));
  store.set(REFRESH_COOKIE, session.refresh_token, cookieOptions(60 * 60 * 24 * 30));
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, "", cookieOptions(0));
  store.set(REFRESH_COOKIE, "", cookieOptions(0));
}

async function fetchUser(accessToken: string): Promise<SupabaseUser> {
  const config = getConfig();
  return readResponse<SupabaseUser>(await fetch(config.url + "/auth/v1/user", {
    headers: { apikey: config.key, Authorization: "Bearer " + accessToken }, cache: "no-store",
  }));
}

export async function getAuthenticatedUser(): Promise<AuthContext | null> {
  const config = (() => { try { return getConfig(); } catch { return null; } })();
  if (!config) return null;
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!accessToken && !refreshToken) return null;

  if (accessToken) {
    try { return { user: await fetchUser(accessToken), accessToken }; }
    catch { /* Try refresh token rotation. */ }
  }
  if (!refreshToken) { await clearAuthCookies(); return null; }

  try {
    const session = await authRequest<SupabaseSession>("/token?grant_type=refresh_token", { refresh_token: refreshToken });
    await writeAuthCookies(session);
    if (!session.access_token) return null;
    const user = session.user ?? await fetchUser(session.access_token);
    return { user, accessToken: session.access_token };
  } catch {
    await clearAuthCookies();
    return null;
  }
}

export async function getUserByPassword(email: string, password: string): Promise<SupabaseSession> {
  return authRequest<SupabaseSession>("/token?grant_type=password", { email, password });
}

export async function signUpWithPassword(email: string, password: string, redirectTo: string): Promise<SupabaseSession> {
  const config = getConfig();
  const response = await fetch(config.url + "/auth/v1/signup?redirect_to=" + encodeURIComponent(redirectTo), {
    method: "POST",
    headers: { apikey: config.key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }), cache: "no-store",
  });
  return readResponse<SupabaseSession>(response);
}

export async function verifyEmailToken(tokenHash: string, type: string): Promise<SupabaseSession> {
  return authRequest<SupabaseSession>("/verify", { token_hash: tokenHash, type });
}

export async function signOut(accessToken?: string): Promise<void> {
  if (accessToken) {
    const config = getConfig();
    await fetch(config.url + "/auth/v1/logout", {
      method: "POST", headers: { apikey: config.key, Authorization: "Bearer " + accessToken }, cache: "no-store",
    }).catch(() => undefined);
  }
  await clearAuthCookies();
}

async function dataRequest<T>(path: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const config = getConfig();
  const headers = new Headers(init.headers);
  headers.set("apikey", config.key);
  headers.set("Authorization", "Bearer " + accessToken);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return readResponse<T>(await fetch(config.url + path, { ...init, headers, cache: "no-store" }));
}

async function signStoragePath(path: string | null, accessToken: string): Promise<string | undefined> {
  if (!path) return undefined;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  try {
    const result = await dataRequest<{ signedURL?: string }>(
      "/storage/v1/object/sign/" + STORAGE_BUCKET + "/" + encoded, accessToken,
      { method: "POST", body: JSON.stringify({ expiresIn: SIGNED_URL_TTL_SECONDS }) },
    );
    if (!result.signedURL) return undefined;
    if (/^https?:\/\//i.test(result.signedURL)) return result.signedURL;
    return getConfig().url + "/storage/v1" + (result.signedURL.startsWith("/") ? result.signedURL : "/" + result.signedURL);
  } catch { return undefined; }
}

function rowToItem(row: WardrobeRow, imageUrl?: string, extractedItemImage?: string): WardrobeItem {
  return {
    id: row.id, name: row.name, category: row.category, color: row.color, palette: row.palette,
    occasion: row.occasions ?? ["campus"], season: row.seasons ?? ["spring", "summer", "autumn", "winter"],
    tags: row.tags ?? [], imageUrl, extractedItemImage, style: row.style ?? undefined,
    fabric: row.fabric ?? undefined, pattern: row.pattern ?? undefined,
  };
}

export async function listWardrobeItems(auth: AuthContext): Promise<WardrobeItem[]> {
  const rows = await dataRequest<WardrobeRow[]>("/rest/v1/wardrobe_items?select=*&order=created_at.desc&limit=200", auth.accessToken);
  return Promise.all(rows.map(async (row) => {
    const [imageUrl, extracted] = await Promise.all([
      signStoragePath(row.image_path, auth.accessToken), signStoragePath(row.extracted_image_path, auth.accessToken),
    ]);
    return rowToItem(row, imageUrl, extracted);
  }));
}

export async function readUserWardrobeItems(): Promise<WardrobeItem[]> {
  const auth = await getAuthenticatedUser();
  return auth ? listWardrobeItems(auth) : [];
}

export async function insertWardrobeItem(
  auth: AuthContext,
  input: Partial<WardrobeItem> & { imagePath?: string; extractedImagePath?: string },
): Promise<WardrobeItem> {
  const imagePath = input.imagePath ?? null;
  const extractedImagePath = input.extractedImagePath ?? null;
  for (const path of [imagePath, extractedImagePath]) {
    if (path && (!path.startsWith(auth.user.id + "/") || path.includes(".."))) {
      throw new SupabaseRequestError("Image path is not owned by this account.", 403);
    }
  }
  const rows = await dataRequest<WardrobeRow[]>("/rest/v1/wardrobe_items?select=*", auth.accessToken, {
    method: "POST", headers: { Prefer: "return=representation" },
    body: JSON.stringify([{
      user_id: auth.user.id, name: input.name, category: input.category, color: input.color ?? "black",
      palette: input.palette ?? "neutral", occasions: input.occasion ?? ["campus"],
      seasons: input.season ?? ["spring", "summer", "autumn", "winter"], tags: input.tags ?? [],
      image_path: imagePath, extracted_image_path: extractedImagePath,
      style: input.style ?? null, fabric: input.fabric ?? null, pattern: input.pattern ?? null,
    }]),
  });
  const row = rows[0];
  if (!row) throw new SupabaseRequestError("Wardrobe item was not saved.", 500);
  const [imageUrl, extracted] = await Promise.all([
    signStoragePath(row.image_path, auth.accessToken), signStoragePath(row.extracted_image_path, auth.accessToken),
  ]);
  return rowToItem(row, imageUrl, extracted);
}

export async function deleteWardrobeItem(auth: AuthContext, id: string): Promise<void> {
  const rows = await dataRequest<WardrobeRow[]>(
    "/rest/v1/wardrobe_items?id=eq." + encodeURIComponent(id) + "&select=*",
    auth.accessToken, { method: "DELETE", headers: { Prefer: "return=representation" } },
  );
  const paths = rows.flatMap((row) => [row.image_path, row.extracted_image_path].filter((path): path is string => Boolean(path)));
  if (paths.length) {
    await dataRequest("/storage/v1/object/" + STORAGE_BUCKET, auth.accessToken, {
      method: "DELETE", body: JSON.stringify({ prefixes: paths }),
    }).catch(() => undefined);
  }
}

export async function uploadPrivateImage(auth: AuthContext, file: File): Promise<{ storagePath: string; imageUrl: string }> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new SupabaseRequestError("Only JPEG, PNG and WebP images are supported.", 415);
  }
  if (file.size < 12 || file.size > 5 * 1024 * 1024) {
    throw new SupabaseRequestError("Each image must be between 12 bytes and 5 MB.", 413);
  }

  let normalized: Awaited<ReturnType<typeof normalizeUploadedImage>>;
  try {
    normalized = await normalizeUploadedImage(Buffer.from(await file.arrayBuffer()), file.type);
  } catch (error) {
    if (error instanceof ImageProcessingError) {
      throw new SupabaseRequestError(error.message, error.status);
    }
    throw new SupabaseRequestError("The uploaded image could not be processed safely.", 415);
  }

  const storagePath = auth.user.id + "/" + randomUUID() + ".webp";
  const config = getConfig();
  const response = await fetch(
    config.url + "/storage/v1/object/" + STORAGE_BUCKET + "/" +
      storagePath.split("/").map(encodeURIComponent).join("/"),
    {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: "Bearer " + auth.accessToken,
        "Content-Type": normalized.contentType,
        "x-upsert": "false",
      },
      body: normalized.buffer,
      cache: "no-store",
    },
  );
  await readResponse<unknown>(response);

  const imageUrl = await signStoragePath(storagePath, auth.accessToken);
  if (!imageUrl) {
    await dataRequest(
      "/storage/v1/object/" + STORAGE_BUCKET,
      auth.accessToken,
      { method: "DELETE", body: JSON.stringify({ prefixes: [storagePath] }) },
    ).catch(() => undefined);
    throw new SupabaseRequestError("Private image URL could not be created.", 502);
  }

  return { storagePath, imageUrl };
}

export function isSameOriginMutation(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
