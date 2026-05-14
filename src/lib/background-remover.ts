/**
 * Client-side background removal using canvas-based corner-sampling and flood-fill.
 *
 * Works best on images with plain/neutral backgrounds (white walls, studio backdrops).
 * Returns a data-URL PNG with transparent background.
 */

type Rgb = [number, number, number];

function colorDist(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

/** Sample the four corners of the canvas and return the average color */
function sampleBackgroundColor(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): Rgb {
  const sampleSize = Math.max(2, Math.round(Math.min(w, h) * 0.04));
  const colors: Rgb[] = [];

  for (let dy = 0; dy < sampleSize; dy++) {
    for (let dx = 0; dx < sampleSize; dx++) {
      // Top-left, top-right, bottom-left, bottom-right corners
      const corners = [
        (dy * w + dx) * 4,
        (dy * w + (w - 1 - dx)) * 4,
        ((h - 1 - dy) * w + dx) * 4,
        ((h - 1 - dy) * w + (w - 1 - dx)) * 4,
      ];
      for (const idx of corners) {
        colors.push([data[idx]!, data[idx + 1]!, data[idx + 2]!]);
      }
    }
  }

  const sum = colors.reduce(
    (acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]] as Rgb,
    [0, 0, 0] as Rgb,
  );
  return [
    Math.round(sum[0] / colors.length),
    Math.round(sum[1] / colors.length),
    Math.round(sum[2] / colors.length),
  ];
}

/**
 * BFS flood-fill from all four edges, marking pixels as background
 * if their color is within `threshold` distance of `bgColor`.
 */
function floodFillBackground(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  bgColor: Rgb,
  threshold: number,
): Uint8Array {
  const mask = new Uint8Array(w * h); // 1 = background
  const queue: number[] = [];

  function enqueue(x: number, y: number) {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (mask[idx] !== 0) return;
    const p = idx * 4;
    const px: Rgb = [data[p]!, data[p + 1]!, data[p + 2]!];
    if (colorDist(px, bgColor) <= threshold) {
      mask[idx] = 1;
      queue.push(idx);
    }
  }

  // Seed from all border pixels
  for (let x = 0; x < w; x++) {
    enqueue(x, 0);
    enqueue(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    enqueue(0, y);
    enqueue(w - 1, y);
  }

  let qi = 0;
  while (qi < queue.length) {
    const idx = queue[qi++]!;
    const x = idx % w;
    const y = Math.floor(idx / w);
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  return mask;
}

/** Apply a 3×3 dilation to the mask to slightly expand background removal */
function dilateMask(mask: Uint8Array, w: number, h: number, radius = 2): Uint8Array {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < w && ny < h) {
              out[ny * w + nx] = 1;
            }
          }
        }
      }
    }
  }
  return out;
}

/** Apply feathered transparency at mask edges for a soft transition */
function applyMaskWithFeather(
  data: Uint8ClampedArray,
  mask: Uint8Array,
  w: number,
  h: number,
  featherRadius = 3,
): void {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (!mask[idx]) continue;

      // Count nearby foreground pixels to compute feathering
      let fgCount = 0;
      let total = 0;
      for (let dy = -featherRadius; dy <= featherRadius; dy++) {
        for (let dx = -featherRadius; dx <= featherRadius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < w && ny < h) {
            total++;
            if (!mask[ny * w + nx]) fgCount++;
          }
        }
      }

      const alpha = Math.round((fgCount / total) * 255 * 0.6);
      data[idx * 4 + 3] = alpha;
    }
  }
}

/**
 * Remove background from an image File using canvas flood-fill.
 * Returns a PNG data-URL with transparent background.
 */
export async function removeBackground(imageFile: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(imageFile);

    img.onload = () => {
      const maxDim = 800;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      URL.revokeObjectURL(objectUrl);

      const imageData = ctx.getImageData(0, 0, w, h);
      const { data } = imageData;

      const bgColor = sampleBackgroundColor(data, w, h);
      // Adaptive threshold: looser for light/white backgrounds
      const bgBrightness = (bgColor[0] + bgColor[1] + bgColor[2]) / 3;
      const threshold = bgBrightness > 200 ? 55 : 45;

      let mask = floodFillBackground(data, w, h, bgColor, threshold);
      mask = dilateMask(mask, w, h, 1);
      applyMaskWithFeather(data, mask, w, h, 2);

      // Zero out fully background pixels
      for (let i = 0; i < mask.length; i++) {
        if (mask[i] && data[i * 4 + 3]! < 10) {
          data[i * 4 + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Return original as fallback
      resolve(objectUrl);
    };

    img.src = objectUrl;
  });
}

/** Convert a data-URL PNG back to a File object (for upload) */
export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0]!.match(/:(.*?);/)![1]!;
  const bstr = atob(arr[1]!);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  const baseName = fileName.replace(/\.[^.]+$/, "");
  return new File([u8arr], `${baseName}_nobg.png`, { type: mime });
}
