import type { WardrobeCategory } from "@/lib/fitmatch-data";

export const colorHexMap: Record<string, string> = {
  black: "#151515",
  cream: "#F5EDD9",
  olive: "#7A8C5C",
  navy: "#1F3565",
  beige: "#D4B896",
  charcoal: "#36454F",
  white: "#FAFAFA",
  silver: "#B0B4BD",
  brown: "#8B6347",
  red: "#C0392B",
  blue: "#2980B9",
  green: "#27AE60",
  tan: "#D2A679",
  grey: "#9B9B9B",
  gray: "#9B9B9B",
  pink: "#E88CA4",
  purple: "#6C3483",
  yellow: "#F0C040",
  orange: "#E67E22",
  burgundy: "#6D1E2E",
  camel: "#C19A6B",
  rust: "#B7410E",
  teal: "#1A8080",
  blush: "#F4A9BB",
};

export const categoryMeta: Record<WardrobeCategory, { emoji: string; label: string }> = {
  top: { emoji: "👕", label: "Top" },
  bottom: { emoji: "👖", label: "Bottom" },
  layer: { emoji: "🧥", label: "Layer" },
  shoes: { emoji: "👟", label: "Shoes" },
  accessory: { emoji: "⌚", label: "Accessory" },
};

export function resolveColorHex(color: string): string {
  return colorHexMap[color.toLowerCase()] ?? "#555555";
}

export function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55;
}
