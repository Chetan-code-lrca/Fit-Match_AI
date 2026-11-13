
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isAllowedImageSignature } from "../src/lib/image-signature.ts";

test("accepts genuine JPEG, PNG and WebP file signatures", () => {
  assert.equal(isAllowedImageSignature(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]), "image/jpeg"), true);
  assert.equal(isAllowedImageSignature(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png"), true);
  assert.equal(isAllowedImageSignature(Uint8Array.from([..."RIFFxxxxWEBP"].map((c) => c.charCodeAt(0))), "image/webp"), true);
});

test("rejects MIME mismatches and truncated image headers", () => {
  assert.equal(isAllowedImageSignature(Uint8Array.from([0x00, 0x00, 0x00]), "image/jpeg"), false);
  assert.equal(isAllowedImageSignature(Uint8Array.from([0x89, 0x50, 0x4e]), "image/png"), false);
  assert.equal(isAllowedImageSignature(Uint8Array.from([..."RIFFxxxxJPEG"].map((c) => c.charCodeAt(0))), "image/webp"), false);
  assert.equal(isAllowedImageSignature(new Uint8Array(32), "image/svg+xml"), false);
});

test("server auth uses verified users and protected session cookies", async () => {
  const source = await readFile(new URL("../src/lib/supabase-rest.ts", import.meta.url), "utf8");
  assert.match(source, /httpOnly: true/);
  assert.match(source, /sameSite: "lax"/);
  assert.match(source, /auth\/v1\/user/);
  assert.match(source, /grant_type=refresh_token/);
  assert.match(source, /user_id: auth\.user\.id/);
  assert.match(source, /storage\/v1\/object\/sign/);
});

test("database migration enforces user ownership and private image access", async () => {
  const sql = await readFile(new URL("../supabase/migrations/202611130001_initial_schema.sql", import.meta.url), "utf8");
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /auth\.uid\(\).*user_id/is);
  assert.match(sql, /'wardrobe-private',\s*'wardrobe-private',\s*false/is);
  assert.match(sql, /storage\.foldername\(name\)/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.wardrobe_items to authenticated/i);
});

test("shared filesystem wardrobe adapter is not used at runtime", async () => {
  const source = await readFile(new URL("../src/lib/wardrobe-server.ts", import.meta.url), "utf8");
  assert.match(source, /supabase-rest/);
  assert.doesNotMatch(source, /readFileSync|writeFileSync|wardrobe\.json/);
});
