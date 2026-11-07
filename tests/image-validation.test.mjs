import assert from "node:assert/strict";
import test from "node:test";

import { hasValidImageSignature } from "../src/lib/image-validation.js";

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const webp = Buffer.from("RIFF0000WEBP", "ascii");

test("accepts supported image signatures", () => {
  assert.equal(hasValidImageSignature("image/png", png), true);
  assert.equal(hasValidImageSignature("image/jpeg", jpeg), true);
  assert.equal(hasValidImageSignature("image/webp", webp), true);
});

test("rejects MIME types that do not match the actual file signature", () => {
  assert.equal(hasValidImageSignature("image/png", jpeg), false);
  assert.equal(hasValidImageSignature("image/jpeg", webp), false);
  assert.equal(hasValidImageSignature("image/webp", png), false);
});

test("rejects unknown MIME types and truncated payloads", () => {
  assert.equal(hasValidImageSignature("image/gif", png), false);
  assert.equal(hasValidImageSignature("image/png", Buffer.from([0x89, 0x50])), false);
  assert.equal(hasValidImageSignature("image/jpeg", Buffer.alloc(0)), false);
});
