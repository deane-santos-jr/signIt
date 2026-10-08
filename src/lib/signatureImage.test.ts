import { test } from "node:test";
import assert from "node:assert/strict";
import { opaqueBounds } from "./signatureImage";

function transparentImage(width: number, height: number) {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

function paint(image: ReturnType<typeof transparentImage>, x: number, y: number, alpha = 255) {
  image.data[(y * image.width + x) * 4 + 3] = alpha;
}

test("bounds hug the drawn strokes, ignoring the blank margins", () => {
  const image = transparentImage(40, 20);
  paint(image, 7, 3);
  paint(image, 30, 12);
  paint(image, 12, 16, 1);

  assert.deepEqual(opaqueBounds(image), { x: 7, y: 3, width: 24, height: 14 });
});

test("a blank canvas has no bounds", () => {
  assert.equal(opaqueBounds(transparentImage(40, 20)), null);
});
