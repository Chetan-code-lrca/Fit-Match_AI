import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { normalizeUploadedImage, ImageProcessingError } from "../src/lib/image-processing.ts";

test("decodes and normalizes a JPEG to a metadata-free WebP", async () => {
  const jpeg = await sharp({
    create: {
      width: 80,
      height: 48,
      channels: 3,
      background: { r: 210, g: 75, b: 44 },
    },
  }).jpeg().toBuffer();

  const normalized = await normalizeUploadedImage(jpeg, "image/jpeg");
  const metadata = await sharp(normalized.buffer).metadata();

  assert.equal(normalized.contentType, "image/webp");
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 80);
  assert.equal(metadata.height, 48);
  assert.equal(metadata.exif, undefined);
  assert.equal(metadata.iptc, undefined);
  assert.ok(normalized.buffer.length < jpeg.length + 10_000);
});

test("rejects MIME/signature mismatches and malformed images", async () => {
  await assert.rejects(
    normalizeUploadedImage(Buffer.from([0xff, 0xd8, 0xff, 0x00]), "image/png"),
    (error) => error instanceof ImageProcessingError && error.status === 415,
  );

  const invalidJpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01, 0x02, 0x03]);
  await assert.rejects(
    normalizeUploadedImage(invalidJpeg, "image/jpeg"),
    (error) => error instanceof ImageProcessingError && error.status === 415,
  );
});

test("enforces the decoded image pixel budget", async () => {
  const oversized = await sharp({
    create: {
      width: 4_500,
      height: 4_500,
      channels: 3,
      background: { r: 10, g: 20, b: 30 },
    },
  }).png().toBuffer();

  await assert.rejects(
    normalizeUploadedImage(oversized, "image/png"),
    (error) => error instanceof ImageProcessingError && error.status === 413,
  );
});
