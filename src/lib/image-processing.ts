import sharp, { type Metadata } from "sharp";
import { isAllowedImageSignature } from "@/lib/image-signature";

const MAX_INPUT_PIXELS = 20_000_000;
const MAX_INPUT_SIDE = 10_000;
const OUTPUT_MAX_SIDE = 2_048;

const expectedFormats: Record<string, "jpeg" | "png" | "webp"> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};

export class ImageProcessingError extends Error {
  readonly status: 413 | 415;

  constructor(message: string, status: 413 | 415) {
    super(message);
    this.status = status;
    this.name = "ImageProcessingError";
  }
}

export type NormalizedImage = {
  buffer: Buffer;
  contentType: "image/webp";
  width: number;
  height: number;
};

export async function normalizeUploadedImage(
  input: Buffer,
  declaredMimeType: string,
): Promise<NormalizedImage> {
  const expectedFormat = expectedFormats[declaredMimeType];
  if (!expectedFormat || !isAllowedImageSignature(input.subarray(0, 16), declaredMimeType)) {
    throw new ImageProcessingError("Image content does not match a supported image type.", 415);
  }

  let metadata: Metadata;
  try {
    metadata = await sharp(input, {
      limitInputPixels: MAX_INPUT_PIXELS,
      sequentialRead: true,
      failOn: "warning",
    }).metadata();
  } catch {
    throw new ImageProcessingError("The uploaded image could not be decoded safely.", 415);
  }

  if (metadata.format !== expectedFormat || !metadata.width || !metadata.height) {
    throw new ImageProcessingError("The uploaded image is malformed or has an unexpected format.", 415);
  }

  if (
    metadata.width > MAX_INPUT_SIDE ||
    metadata.height > MAX_INPUT_SIDE ||
    metadata.width * metadata.height > MAX_INPUT_PIXELS
  ) {
    throw new ImageProcessingError("Image dimensions exceed the 20-megapixel processing limit.", 413);
  }

  try {
    const result = await sharp(input, {
      limitInputPixels: MAX_INPUT_PIXELS,
      sequentialRead: true,
      failOn: "warning",
    })
      .rotate()
      .resize({
        width: OUTPUT_MAX_SIDE,
        height: OUTPUT_MAX_SIDE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 86, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: result.data,
      contentType: "image/webp",
      width: result.info.width,
      height: result.info.height,
    };
  } catch {
    throw new ImageProcessingError("The uploaded image could not be normalized safely.", 415);
  }
}
