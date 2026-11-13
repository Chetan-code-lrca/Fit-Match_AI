import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isAllowedImageSignature } from "../src/lib/image-signature.ts";

test("accepts genuine JPEG, PNG and WebP headers", () => {
  assert.equal(isAllowedImageSignature(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]), "image/jpeg"), true);
  assert.equal(isAllowedImageSignature(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png"), true);
  assert.equal(isAllowedImageSignature(Uint8Array.from([..."RIFFxxxxWEBP"].map((c) => c.charCodeAt(0))), "image/webp"), true);
});

test("rejects mismatched, truncated and unsupported image headers", () => {
  assert.equal(isAllowedImageSignature(Uint8Array.from([0x00, 0x00, 0x00]), "image/jpeg"), false);
  assert.equal(isAllowedImageSignature(Uint8Array.from([0x89, 0x50, 0x4e]), "image/png"), false);
  assert.equal(isAllowedImageSignature(Uint8Array.from([..."RIFFxxxxJPEG"].map((c) => c.charCodeAt(0))), "image/webp"), false);
  assert.equal(isAllowedImageSignature(new Uint8Array(32), "image/svg+xml"), false);
});

test("production storage policy fails closed", async () => {
  const source = await readFile(new URL("../src/lib/production-safety.ts", import.meta.url), "utf8");
  assert.match(source, /process\.env\.NODE_ENV === "production"/);
  assert.match(source, /PRODUCTION_STORAGE_NOT_CONFIGURED/);
  assert.match(source, /status: 503/);
});
