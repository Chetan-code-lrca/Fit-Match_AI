import assert from "node:assert/strict";
import test from "node:test";

import { isLocalDemoStorageAllowed } from "../src/lib/local-demo-storage.js";

test("filesystem demo storage is enabled in development", () => {
  assert.equal(isLocalDemoStorageAllowed({ NODE_ENV: "development" }), true);
  assert.equal(isLocalDemoStorageAllowed({ NODE_ENV: "test" }), true);
});

test("filesystem demo storage is disabled by default in production", () => {
  assert.equal(isLocalDemoStorageAllowed({ NODE_ENV: "production" }), false);
  assert.equal(
    isLocalDemoStorageAllowed({
      NODE_ENV: "production",
      FITMATCH_ALLOW_INSECURE_LOCAL_STORAGE: "false",
    }),
    false,
  );
});

test("production demo storage requires an explicit opt-in", () => {
  assert.equal(
    isLocalDemoStorageAllowed({
      NODE_ENV: "production",
      FITMATCH_ALLOW_INSECURE_LOCAL_STORAGE: "true",
    }),
    true,
  );
});
