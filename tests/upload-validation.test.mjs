import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isSupportedImagePayload,
  parseBoundedFormData,
} from "../src/lib/upload-validation.mjs";

function pngFixture() {
  const header = new Uint8Array(24);
  header.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  header.set([0, 0, 0, 13], 8);
  header.set([0x49, 0x48, 0x44, 0x52], 12);
  const footer = new Uint8Array([
    0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
  return { header, footer, size: 45 };
}

function webpFixture() {
  const header = new Uint8Array(30);
  header.set([0x52, 0x49, 0x46, 0x46], 0);
  header.set([22, 0, 0, 0], 4);
  header.set([0x57, 0x45, 0x42, 0x50], 8);
  header.set([0x56, 0x50, 0x38, 0x58], 12);
  header.set([10, 0, 0, 0], 16);
  return { header, footer: header.slice(-12), size: 30 };
}

test("accepts JPEG signature and end marker", () => {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x01, 0xff, 0xd9]);
  assert.equal(isSupportedImagePayload("image/jpeg", bytes, bytes, bytes.length), true);
});

test("accepts PNG signature, IHDR header, and IEND footer", () => {
  const fixture = pngFixture();
  assert.equal(isSupportedImagePayload("image/png", fixture.header, fixture.footer, fixture.size), true);
});

test("accepts RIFF WebP container signature", () => {
  const fixture = webpFixture();
  assert.equal(isSupportedImagePayload("image/webp", fixture.header, fixture.footer, fixture.size), true);
});

test("rejects a mismatched declared MIME type", () => {
  const fixture = pngFixture();
  assert.equal(isSupportedImagePayload("image/jpeg", fixture.header, fixture.footer, fixture.size), false);
});

test("rejects incomplete and non-image content", () => {
  const bytes = new TextEncoder().encode("<html>not an image</html>");
  assert.equal(isSupportedImagePayload("image/png", bytes, bytes.slice(-12), bytes.length), false);
  assert.equal(isSupportedImagePayload("image/png", new Uint8Array([1]), new Uint8Array(), 1), false);
});

test("parses bounded multipart FormData and preserves the file", async () => {
  const form = new FormData();
  form.append("files", new Blob(["photo-bytes"], { type: "image/jpeg" }), "photo.jpg");
  const request = new Request("https://example.test/api/upload", { method: "POST", body: form });

  const result = await parseBoundedFormData(request, 4096);

  assert.equal(result.ok, true);
  if (result.ok) {
    const file = result.formData.get("files");
    assert.ok(file instanceof File);
    assert.equal(file.name, "photo.jpg");
    assert.equal(await file.text(), "photo-bytes");
  }
});

test("rejects streamed multipart bodies above the configured byte cap", async () => {
  const form = new FormData();
  form.append("files", new Blob(["x".repeat(8192)]), "large.txt");
  const request = new Request("https://example.test/api/upload", { method: "POST", body: form });

  const result = await parseBoundedFormData(request, 1024);

  assert.deepEqual(result, { ok: false, reason: "too_large" });
});

test("rejects malformed multipart content", async () => {
  const request = new Request("https://example.test/api/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{bad json",
  });

  const result = await parseBoundedFormData(request, 1024);

  assert.deepEqual(result, { ok: false, reason: "invalid" });
});
