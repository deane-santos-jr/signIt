type Pixels = Pick<ImageData, "data" | "width" | "height">;

export type PixelBounds = { x: number; y: number; width: number; height: number };

const ALPHA_OFFSET = 3;
const BYTES_PER_PIXEL = 4;

export function opaqueBounds({ data, width, height }: Pixels): PixelBounds | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * BYTES_PER_PIXEL + ALPHA_OFFSET] === 0) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable");
  return context;
}

export function trimmedPngDataUrl(canvas: HTMLCanvasElement): string | null {
  const bounds = opaqueBounds(context2d(canvas).getImageData(0, 0, canvas.width, canvas.height));
  if (!bounds) return null;
  const trimmed = document.createElement("canvas");
  trimmed.width = bounds.width;
  trimmed.height = bounds.height;
  context2d(trimmed).drawImage(
    canvas,
    bounds.x, bounds.y, bounds.width, bounds.height,
    0, 0, bounds.width, bounds.height,
  );
  return trimmed.toDataURL("image/png");
}
