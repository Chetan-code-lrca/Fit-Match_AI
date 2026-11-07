const signatures = {
  "image/jpeg": (bytes) =>
    bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes) =>
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a,
  "image/webp": (bytes) =>
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP",
};

/**
 * Validate the actual file signature rather than trusting multipart Content-Type.
 * Accepts Buffer and Uint8Array so it can be tested without Next.js runtime APIs.
 */
export function hasValidImageSignature(mimeType, bytes) {
  const validate = signatures[mimeType];
  return typeof validate === "function" && validate(Buffer.from(bytes));
}
