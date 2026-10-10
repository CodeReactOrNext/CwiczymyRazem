import type { PlacedSticker } from "../types/guitarBuilder.types";
import { rgbToHsl } from "./paint";

/**
 * Lays a rendered sticker layer onto a painted body. Stickers only show where
 * the surface map allows, so pickups, bridge and strings stay on top of them,
 * and they take the body's own shading and gloss so they read as stuck on.
 */
export function applyStickers(
  target: Uint8ClampedArray,
  layer: Uint8ClampedArray,
  base: Uint8ClampedArray,
  surface: Uint8ClampedArray,
  maps: Uint8ClampedArray,
  finishL: number,
  pickguardL: number | null,
) {
  for (let i = 0; i < target.length; i += 4) {
    const alpha = (layer[i + 3] / 255) * (surface[i] / 255);
    if (alpha === 0) continue;

    const l = rgbToHsl(base[i], base[i + 1], base[i + 2])[2];
    const ref = pickguardL !== null && maps[i + 2] > 127 ? pickguardL : finishL;
    const shade = 0.4 + 0.6 * Math.min(1, ref > 0 ? l / ref : 1);
    const gloss = Math.min(0.55, Math.max(0, (l - ref - 0.12) * 1.2));

    for (let c = 0; c < 3; c++) {
      const lit = layer[i + c] * shade;
      const color = lit + (255 - lit) * gloss;
      target[i + c] += (color - target[i + c]) * alpha;
    }
  }
  return target;
}

/** Topmost sticker under a point (body pixels), or null. */
export function hitSticker(stickers: PlacedSticker[], x: number, y: number) {
  for (let i = stickers.length - 1; i >= 0; i--) {
    const sticker = stickers[i];
    if (Math.hypot(x - sticker.x, y - sticker.y) <= sticker.size / 2)
      return sticker;
  }
  return null;
}

/**
 * Pointer position → body pixels for a canvas shown with `object-fit:
 * contain`: the drawing is scaled to fit and centred inside the element box.
 */
export function clientToBody(
  clientX: number,
  clientY: number,
  box: { left: number; top: number; width: number; height: number },
  canvas: { width: number; height: number },
  bodyOrigin: { x: number; y: number },
) {
  const scale = Math.min(box.width / canvas.width, box.height / canvas.height);
  const offsetX = (box.width - canvas.width * scale) / 2;
  const offsetY = (box.height - canvas.height * scale) / 2;
  return {
    x: (clientX - box.left - offsetX) / scale - bodyOrigin.x,
    y: (clientY - box.top - offsetY) / scale - bodyOrigin.y,
  };
}

/**
 * Undoes a CSS `rotate(-90deg)` around the element's centre: a screen point
 * comes back in the element's own, unrotated frame, as a box-relative point
 * plus a box of the element's layout size — what `clientToBody` expects.
 */
export function unrotateQuarterTurn(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  size: { width: number; height: number },
) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const sx = clientX - cx;
  const sy = clientY - cy;
  // rotate(-90deg) maps local (x, y) to screen (y, -x)
  return {
    clientX: -sy + size.width / 2,
    clientY: sx + size.height / 2,
    box: { left: 0, top: 0, width: size.width, height: size.height },
  };
}
