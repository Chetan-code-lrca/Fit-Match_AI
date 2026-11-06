const MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function startsWithAscii(bytes, text, offset = 0) {
  if (!(bytes instanceof Uint8Array) || bytes.length < offset + text.length) return false;
  for (let index = 0; index < text.length; index += 1) {
    if (bytes[offset + index] !== text.charCodeAt(index)) return false;
  }
  return true;
}

function readUint32LE(bytes, offset) {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

export function isSupportedImagePayload(mimeType, header, footer, fileSize) {
  if (!MIME_TYPES.has(mimeType) || !(header instanceof Uint8Array) ||
      !(footer instanceof Uint8Array) || !Number.isSafeInteger(fileSize) || fileSize < 12) {
    return false;
  }

  if (mimeType === "image/jpeg") {
    return fileSize >= 4 &&
      header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff &&
      footer[footer.length - 2] === 0xff && footer[footer.length - 1] === 0xd9;
  }

  if (mimeType === "image/png") {
    return fileSize >= 45 &&
      header.length >= 24 &&
      header[0] === 0x89 && startsWithAscii(header, "PNG", 1) &&
      readUint32LE(new Uint8Array([header[11], header[10], header[9], header[8]]), 0) === 13 &&
      startsWithAscii(header, "IHDR", 12) &&
      footer.length >= 12 &&
      footer[footer.length - 12] === 0 &&
      footer[footer.length - 11] === 0 &&
      footer[footer.length - 10] === 0 &&
      footer[footer.length - 9] === 0 &&
      startsWithAscii(footer, "IEND", footer.length - 8) &&
      footer[footer.length - 4] === 0xae &&
      footer[footer.length - 3] === 0x42 &&
      footer[footer.length - 2] === 0x60 &&
      footer[footer.length - 1] === 0x82;
  }

  return fileSize >= 30 &&
    header.length >= 20 &&
    startsWithAscii(header, "RIFF") &&
    readUint32LE(header, 4) + 8 === fileSize &&
    startsWithAscii(header, "WEBP", 8) &&
    (startsWithAscii(header, "VP8 ", 12) ||
      startsWithAscii(header, "VP8L", 12) ||
      startsWithAscii(header, "VP8X", 12));
}

export async function parseBoundedFormData(request, maxBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new TypeError("maxBytes must be a positive safe integer.");
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const length = Number(declaredLength);
    if (Number.isFinite(length) && length > maxBytes) {
      return { ok: false, reason: "too_large" };
    }
  }

  const reader = request.body?.getReader();
  if (!reader) {
    try {
      return { ok: true, formData: await request.formData() };
    } catch {
      return { ok: false, reason: "invalid" };
    }
  }

  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) return { ok: false, reason: "invalid" };
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return { ok: false, reason: "too_large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: "invalid" };
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    const response = new Response(body, { headers: { "content-type": contentType } });
    return { ok: true, formData: await response.formData() };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
