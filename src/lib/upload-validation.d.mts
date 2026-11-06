export type BoundedFormDataResult =
  | { ok: true; formData: FormData }
  | { ok: false; reason: "too_large" | "invalid" };

export function isSupportedImagePayload(
  mimeType: string,
  header: Uint8Array,
  footer: Uint8Array,
  fileSize: number,
): boolean;

export function parseBoundedFormData(
  request: Request,
  maxBytes: number,
): Promise<BoundedFormDataResult>;
