import type { WardrobeItem } from "@/lib/fitmatch-data";

export function hasValidImageSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((value, index) => bytes[index] === value);
  }
  if (mimeType === "image/webp") {
    return bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

export function isUserStoragePath(path: string, userId: string): boolean {
  return path.startsWith(userId + "/") &&
    !path.startsWith("/") &&
    !path.includes("..") &&
    !path.includes("\\") &&
    path.length <= 240;
}

export function normalizeWardrobeItem(value: unknown): WardrobeItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const categories = ["top", "bottom", "layer", "shoes", "accessory"];
  const palettes = ["neutral", "earth", "cool", "warm", "monochrome"];
  const occasions = ["campus", "travel", "smart-casual", "streetwear", "night-out"];
  const seasons = ["spring", "summer", "autumn", "winter"];
  const validString = (entry: unknown, max: number) => typeof entry === "string" && entry.trim().length > 0 && entry.length <= max;
  const validArray = (entry: unknown, allowed?: string[]) =>
    Array.isArray(entry) && entry.length <= 12 &&
    entry.every((entry) => typeof entry === "string" && entry.length <= 48 && (!allowed || allowed.includes(entry)));

  if (
    !validString(item.id, 80) || !/^[a-zA-Z0-9_-]+$/.test(item.id as string) ||
    !validString(item.name, 80) ||
    typeof item.category !== "string" || !categories.includes(item.category) ||
    !validString(item.color, 40) ||
    typeof item.palette !== "string" || !palettes.includes(item.palette) ||
    !validArray(item.occasion, occasions) ||
    !validArray(item.season, seasons) ||
    !validArray(item.tags)
  ) return null;

  return {
    id: item.id as string,
    name: (item.name as string).trim(),
    category: item.category as WardrobeItem["category"],
    color: (item.color as string).trim(),
    palette: item.palette as WardrobeItem["palette"],
    occasion: item.occasion as WardrobeItem["occasion"],
    season: item.season as WardrobeItem["season"],
    tags: item.tags as string[],
    ...(typeof item.imageUrl === "string" ? { imageUrl: item.imageUrl } : {}),
    ...(typeof item.extractedItemImage === "string" ? { extractedItemImage: item.extractedItemImage } : {}),
    ...(typeof item.style === "string" && item.style.length <= 40 ? { style: item.style } : {}),
    ...(typeof item.fabric === "string" && item.fabric.length <= 40 ? { fabric: item.fabric } : {}),
    ...(typeof item.pattern === "string" && ["solid", "striped", "graphic", "plaid", "checkered", "floral"].includes(item.pattern)
      ? { pattern: item.pattern as WardrobeItem["pattern"] }
      : {}),
  };
}
