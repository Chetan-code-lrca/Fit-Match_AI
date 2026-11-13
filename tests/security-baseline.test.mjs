import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { hasValidImageSignature, isUserStoragePath, normalizeWardrobeItem } from "../src/lib/security-validation.ts";
import { readLimitedJson } from "../src/lib/http-validation.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const migration = await read("supabase/migrations/202611130001_production_hardening.sql");
const wardrobeRoute = await read("src/app/api/wardrobe/route.ts");
const uploadRoute = await read("src/app/api/upload/route.ts");
const uploadCompleteRoute = await read("src/app/api/upload/complete/route.ts");
const authProxy = await read("src/proxy.ts");
const wardrobeStore = await read("src/lib/wardrobe-server.ts");
const supabaseClient = await read("src/lib/supabase-rest.ts");
const accountDeleteRoute = await read("src/app/api/account/route.ts");
const accountExportRoute = await read("src/app/api/account/export/route.ts");

test("accepts real JPEG, PNG and WEBP signatures", () => {
  assert.equal(hasValidImageSignature(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]), "image/jpeg"), true);
  assert.equal(hasValidImageSignature(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png"), true);
  assert.equal(hasValidImageSignature(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]), "image/webp"), true);
});

test("rejects spoofed image MIME types and incomplete signatures", () => {
  assert.equal(hasValidImageSignature(new TextEncoder().encode("<script>"), "image/jpeg"), false);
  assert.equal(hasValidImageSignature(Uint8Array.from([0x89, 0x50, 0x4e]), "image/png"), false);
  assert.equal(hasValidImageSignature(new Uint8Array(12), "image/gif"), false);
});

test("storage object keys remain scoped to one account", () => {
  assert.equal(isUserStoragePath("user-123/image.webp", "user-123"), true);
  assert.equal(isUserStoragePath("another-user/image.webp", "user-123"), false);
  assert.equal(isUserStoragePath("user-123/../private.png", "user-123"), false);
  assert.equal(isUserStoragePath("/user-123/image.webp", "user-123"), false);
  assert.equal(isUserStoragePath("user-123\\other.png", "user-123"), false);
});

test("wardrobe payload validation accepts supported metadata only", () => {
  const valid = {
    id: "item-1", name: "Olive overshirt", category: "layer", color: "olive", palette: "earth",
    occasion: ["campus", "travel"], season: ["autumn"], tags: ["utility", "cotton"],
  };
  assert.ok(normalizeWardrobeItem(valid));
  assert.equal(normalizeWardrobeItem({ ...valid, category: "admin" }), null);
  assert.equal(normalizeWardrobeItem({ ...valid, id: "../other-user" }), null);
  assert.equal(normalizeWardrobeItem({ ...valid, name: "x".repeat(100) }), null);
});

test("JSON body limits are enforced while reading the stream", async () => {
  const valid = await readLimitedJson(new Request("https://fitmatch.test/api", {
    method: "POST", body: JSON.stringify({ prompt: "campus fit" }),
  }), 128);
  assert.deepEqual(valid, { ok: true, data: { prompt: "campus fit" } });
  const tooLarge = await readLimitedJson(new Request("https://fitmatch.test/api", {
    method: "POST", body: JSON.stringify({ payload: "x".repeat(256) }),
  }), 64);
  assert.deepEqual(tooLarge, { ok: false, reason: "too_large" });
  const invalid = await readLimitedJson(new Request("https://fitmatch.test/api", {
    method: "POST", body: "{",
  }), 64);
  assert.deepEqual(invalid, { ok: false, reason: "invalid_json" });
});

test("database migration enforces account and private-object ownership", () => {
  assert.ok(migration.toLowerCase().includes("enable row level security"));
  assert.ok(migration.includes("auth.uid()"));
  assert.ok(migration.includes("storage.foldername(name)"));
  assert.ok(migration.includes("consume_fitmatch_rate_limit"));
  assert.ok(migration.includes("public = false"));
  assert.ok(migration.includes("fitmatch_health"));
  assert.ok(migration.includes("delete_my_fitmatch_account"));
});

test("private routes authenticate, validate and rate-limit requests", () => {
  assert.ok(wardrobeRoute.includes("getCurrentSession"));
  assert.ok(wardrobeRoute.includes("isSameOriginMutation"));
  assert.ok(wardrobeRoute.includes("readLimitedJson"));
  assert.ok(uploadRoute.includes("getCurrentSession"));
  assert.ok(uploadRoute.includes("createPrivateUploadUrl"));
  assert.ok(uploadRoute.includes("readLimitedJson"));
  assert.ok(uploadCompleteRoute.includes("hasValidImageSignature"));
  assert.ok(uploadCompleteRoute.includes("downloadPrivateImage"));
  assert.ok(uploadCompleteRoute.includes("readLimitedJson"));
  assert.ok(uploadRoute.includes("consumeRateLimit"));
  assert.ok(authProxy.includes("verifyAccessToken"));
  assert.ok(authProxy.includes("httpOnly: true"));
  assert.ok(!wardrobeStore.includes("wardrobe.json"));
  assert.ok(!wardrobeStore.includes("readFileSync"));
  assert.ok(!wardrobeStore.includes("writeFileSync"));
  assert.ok(!uploadRoute.includes("public/uploads"));
  assert.ok(supabaseClient.includes('startsWith("sb_publishable_"'));
  assert.ok(!supabaseClient.includes("SUPABASE_SECRET_KEY"));
  assert.ok(!supabaseClient.includes("SUPABASE_SERVICE_ROLE_KEY"));
  assert.ok(accountDeleteRoute.includes("getCurrentSession"));
  assert.ok(accountDeleteRoute.includes("removePrivateImages"));
  assert.ok(accountDeleteRoute.includes("delete_my_fitmatch_account"));
  assert.ok(accountExportRoute.includes("account-export"));
  assert.ok(accountExportRoute.includes("Cache-Control"));
});
