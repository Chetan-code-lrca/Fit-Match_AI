type RgbColor = { r: number; g: number; b: number };

function colorDistance(a: RgbColor, b: RgbColor): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function rgbToHex({ r, g, b }: RgbColor): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function sampleDominantColors(pixels: RgbColor[], maxColors: number): RgbColor[] {
  const stride = Math.max(1, Math.floor(pixels.length / 500));
  const sampled = pixels.filter((_, i) => i % stride === 0);

  const clusters: RgbColor[] = [];
  for (const pixel of sampled) {
    const tooClose = clusters.some((c) => colorDistance(pixel, c) < 45);
    if (!tooClose) {
      clusters.push(pixel);
      if (clusters.length >= maxColors) break;
    }
  }
  return clusters;
}

export async function extractDominantColors(imageFile: File, maxColors = 5): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 100;
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

      const pixels: RgbColor[] = [];
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] ?? 0;
        const g = data[i + 1] ?? 0;
        const b = data[i + 2] ?? 0;
        const a = data[i + 3] ?? 0;
        const brightness = r + g + b;
        if (a > 128 && brightness > 30 && brightness < 720) {
          pixels.push({ r, g, b });
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
  { hex: "#8B4513", name: "Brown", rgb: { r: 139, g: 69, b: 19 } },
  { hex: "#C0392B", name: "Red", rgb: { r: 192, g: 57, b: 43 } },
  { hex: "#2980B9", name: "Blue", rgb: { r: 41, g: 128, b: 185 } },
  { hex: "#27AE60", name: "Green", rgb: { r: 39, g: 174, b: 96 } },
  { hex: "#F39C12", name: "Tan", rgb: { r: 243, g: 156, b: 18 } },
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
