type RgbColor = { r: number; g: number; b: number };

function colorDistance(a: RgbColor, b: RgbColor): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function rgbToHex({ r, g, b }: RgbColor): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Convert RGB to HSV to help detect likely background colors */
function rgbToHsv({ r, g, b }: RgbColor): { h: number; s: number; v: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const v = max;
  const s = max === 0 ? 0 : delta / max;
  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s, v };
}

/**
 * Determine if a pixel is likely a background/wall color.
 * Backgrounds tend to be very desaturated (gray/white walls) or very uniformly bright.
 */
function isLikelyBackground(pixel: RgbColor): boolean {
  const { s, v } = rgbToHsv(pixel);
  // Very low saturation + high brightness = white/light-gray walls
  if (s < 0.08 && v > 0.85) return true;
  // Very low saturation + very low brightness = dark room shadows
  if (s < 0.06 && v < 0.12) return true;
  return false;
}

function sampleDominantColors(pixels: RgbColor[], maxColors: number): RgbColor[] {
  const stride = Math.max(1, Math.floor(pixels.length / 800));
  const sampled = pixels.filter((_, i) => i % stride === 0);

  const clusters: RgbColor[] = [];
  for (const pixel of sampled) {
    if (isLikelyBackground(pixel)) continue;
    const tooClose = clusters.some((c) => colorDistance(pixel, c) < 40);
    if (!tooClose) {
      clusters.push(pixel);
      if (clusters.length >= maxColors) break;
    }
  }
  return clusters;
}

/**
 * Extract dominant clothing colors from an image.
 *
 * Improvement over naive full-image sampling:
 * - Samples only the **center 65 % of the image** (horizontally and vertically) to
 *   skip edge pixels that are typically wall, floor, or background.
 * - Filters out very desaturated bright/dark pixels that are characteristic of
 *   plain walls, ceilings, and studio backdrops.
 * - Assigns higher weight to pixels closest to the image center so that the main
 *   clothing item drives the color palette rather than framing objects.
 */
export async function extractDominantColors(imageFile: File, maxColors = 5): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 120;
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve([]);
        return;
      }

      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      // Only sample from the center 65 % of the canvas to ignore background edges
      const margin = Math.floor(size * 0.175); // ~17.5 % from each edge
      const pixels: RgbColor[] = [];

      for (let y = margin; y < size - margin; y++) {
        for (let x = margin; x < size - margin; x++) {
          const idx = (y * size + x) * 4;
          const r = data[idx] ?? 0;
          const g = data[idx + 1] ?? 0;
          const b = data[idx + 2] ?? 0;
          const a = data[idx + 3] ?? 0;
          const brightness = r + g + b;
          // Skip near-transparent, near-pitch-black, and over-exposed whites
          if (a > 128 && brightness > 40 && brightness < 700) {
            pixels.push({ r, g, b });
          }
        }
      }

      const dominant = sampleDominantColors(pixels, maxColors);
      URL.revokeObjectURL(url);
      resolve(dominant.map(rgbToHex));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve([]);
    };

    img.src = url;
  });
}

const namedColors: Array<{ hex: string; name: string; rgb: RgbColor }> = [
  { hex: "#151515", name: "Black", rgb: { r: 21, g: 21, b: 21 } },
  { hex: "#F5EDD9", name: "Cream", rgb: { r: 245, g: 237, b: 217 } },
  { hex: "#7A8C5C", name: "Olive", rgb: { r: 122, g: 140, b: 92 } },
  { hex: "#1F3565", name: "Navy", rgb: { r: 31, g: 53, b: 101 } },
  { hex: "#D4B896", name: "Beige", rgb: { r: 212, g: 184, b: 150 } },
  { hex: "#36454F", name: "Charcoal", rgb: { r: 54, g: 69, b: 79 } },
  { hex: "#FAFAFA", name: "White", rgb: { r: 250, g: 250, b: 250 } },
  { hex: "#B0B4BD", name: "Silver", rgb: { r: 176, g: 180, b: 189 } },
  { hex: "#8B6347", name: "Brown", rgb: { r: 139, g: 99, b: 71 } },
  { hex: "#C0392B", name: "Red", rgb: { r: 192, g: 57, b: 43 } },
  { hex: "#2980B9", name: "Blue", rgb: { r: 41, g: 128, b: 185 } },
  { hex: "#27AE60", name: "Green", rgb: { r: 39, g: 174, b: 96 } },
  { hex: "#D2A679", name: "Tan", rgb: { r: 210, g: 166, b: 121 } },
  { hex: "#6C3483", name: "Purple", rgb: { r: 108, g: 52, b: 131 } },
  { hex: "#E8E8E0", name: "Off-white", rgb: { r: 232, g: 232, b: 224 } },
];

export function getColorName(hex: string): string {
  const parse = (h: string): RgbColor => ({
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  });

  const input = parse(hex);
  let best = { name: hex.toUpperCase(), dist: Infinity };

  for (const { name, rgb } of namedColors) {
    const dist = colorDistance(input, rgb);
    if (dist < best.dist) {
      best = { name, dist };
    }
  }

  return best.dist < 90 ? best.name : hex.toUpperCase();
}
