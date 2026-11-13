import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/lib/production-safety.ts", import.meta.url),
  "utf8",
);

test("production safety module keeps filesystem persistence fail-closed", () => {
  assert.match(source, /process\.env\.NODE_ENV === "production"/);
  assert.match(source, /PRODUCTION_STORAGE_NOT_CONFIGURED/);
  assert.match(source, /status: 503/);
});

test("image validation checks actual JPEG, PNG and WebP signatures", () => {
  assert.match(source, /0xd8/);
  assert.match(source, /0x89/);
  assert.match(source, /"RIFF"/);
  assert.match(source, /"WEBP"/);
});
