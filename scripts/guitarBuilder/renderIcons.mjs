/**
 * Guitar Builder — stash icons rendered from the real art, through the same
 * `paintBody` the guitar preview uses, so an icon is exactly what the item
 * looks like once it's on a guitar.
 *
 * - pickups: the covers lifted off a body and packed side by side
 * - finishes: a spray can (FINISH_CAN) with its red paint repainted in the
 *   finish — colour, burst, figured top and paint style
 *
 *   node scripts/guitarBuilder/renderIcons.mjs
 *
 * Run after extractParts.mjs (it reads the body art, maps and top tiles).
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const require = createRequire(import.meta.url);
const jiti = require("jiti")(import.meta.url, { interopDefault: true });
const { paintBody, rgbToHsl } = jiti("../../src/feature/guitarBuilder/utils/paint.ts");
const { COMPONENT_DEFS } = jiti(
  "../../src/feature/guitarBuilder/data/components.ts",
);
const manifest = JSON.parse(
  fs.readFileSync(
    "src/feature/guitarBuilder/data/parts.generated.json",
    "utf8",
  ),
);

const OUT_DIR = "public/images/guitar-builder/pickups";
const FINISH_DIR = "public/images/guitar-builder/finishes";
/** Hand-drawn can; its red paint (cap, top half, drips) takes the finish. */
const FINISH_CAN = "scripts/guitarBuilder/art/spray-can.png";
/** Can height while painting — a body's, so tops and bursts keep their scale. */
const FINISH_CAN_HEIGHT = 528;
const FINISH_ICON_HEIGHT = 140;
/** Body each pickup type's covers are lifted from. */
const SOURCE = { S: "s-style-green", H: "single-cut", P90: "offset-seafoam" };
/** Gap between covers in the icon, px. */
const GAP = 14;

async function raw(publicPath) {
  const { data, info } = await sharp(path.join("public", publicPath))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data: new Uint8ClampedArray(data), W: info.width, H: info.height };
}

/** Bounding boxes of the separate covers in the surface map's G channel. */
function coverBoxes(surface) {
  const { data, W, H } = surface;
  const seen = new Uint8Array(W * H);
  const boxes = [];
  for (let start = 0; start < W * H; start++) {
    if (seen[start] || data[start * 4 + 1] < 128) continue;
    const box = { x0: W, y0: H, x1: 0, y1: 0, n: 0 };
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const p = stack.pop();
      const x = p % W;
      const y = (p - x) / W;
      box.x0 = Math.min(box.x0, x);
      box.x1 = Math.max(box.x1, x);
      box.y0 = Math.min(box.y0, y);
      box.y1 = Math.max(box.y1, y);
      box.n++;
      for (const q of [p - 1, p + 1, p - W, p + W]) {
        if (q >= 0 && q < W * H && !seen[q] && data[q * 4 + 1] >= 128) {
          seen[q] = 1;
          stack.push(q);
        }
      }
    }
    if (box.n > 200) boxes.push(box);
  }
  return boxes.sort((a, b) => a.x0 - b.x0);
}

const sources = {};
for (const [type, key] of Object.entries(SOURCE)) {
  const body = manifest.bodies.find((b) => b.key === key);
  sources[type] = {
    body,
    base: await raw(body.src),
    maps: await raw(body.maps),
    surface: await raw(body.surface),
  };
  sources[type].boxes = coverBoxes(sources[type].surface);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const def of COMPONENT_DEFS.filter((d) => d.slot === "pickups")) {
  const { body, base, maps, surface, boxes } = sources[def.type];
  const pixels = paintBody(new Uint8ClampedArray(base.data), maps.data, {
    width: base.W,
    finish: null,
    top: null,
    burst: false,
    pickguard: null,
    pickups: { color: def.cover, metal: def.metal },
    surface: surface.data,
    singleCoils: body.singleCoils,
    finishL: body.finishL,
    pickguardL: body.pickguardL,
    pickupTone: body.pickupTone,
  });
  // keep only the covers: alpha = cover weight
  for (let i = 0; i < base.W * base.H; i++) {
    pixels[i * 4 + 3] = Math.round(
      (pixels[i * 4 + 3] * surface.data[i * 4 + 1]) / 255,
    );
  }
  const full = sharp(Buffer.from(pixels), {
    raw: { width: base.W, height: base.H, channels: 4 },
  });
  const crops = await Promise.all(
    boxes.map((b) =>
      full
        .clone()
        .extract({
          left: b.x0,
          top: b.y0,
          width: b.x1 - b.x0 + 1,
          height: b.y1 - b.y0 + 1,
        })
        .png()
        .toBuffer(),
    ),
  );
  const widths = boxes.map((b) => b.x1 - b.x0 + 1);
  const heights = boxes.map((b) => b.y1 - b.y0 + 1);
  const W = widths.reduce((s, w) => s + w, 0) + GAP * (boxes.length - 1);
  const H = Math.max(...heights);
  let left = 0;
  const layers = crops.map((input, i) => {
    const layer = { input, left, top: Math.round((H - heights[i]) / 2) };
    left += widths[i] + GAP;
    return layer;
  });
  const file = path.join(OUT_DIR, `${def.id.replace("pickups:", "")}.webp`);
  await sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(layers)
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(file);
  console.log(file, `${W}x${H}`);
}

// ---------------------------------------------------------------- finishes

const tops = {};
for (const top of manifest.tops) {
  tops[top.key] = {
    pixels: (await raw(top.src)).data,
    size: top.size,
    depth: top.depth,
  };
}
const ramp = (e0, e1, v) => Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));

/**
 * 0..1 paint weight: strong chroma around red — silver, scratches and the
 * outline drop out. The window reaches far toward magenta: the paint throws a
 * pink rim light onto the can's outline, which has to take the finish too.
 */
function paintWeight(r, g, b) {
  const deg = rgbToHsl(r, g, b)[0] * 360;
  const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  const hue =
    deg < 180 ? 1 - ramp(12, 22, deg) : 1 - ramp(70, 90, 360 - deg);
  return ramp(0.04, 0.16, chroma) * hue;
}

/** px to the nearest transparent pixel (3-4 chamfer), capped at 255. */
function outlineDistance(pixels, W, H) {
  const d = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) d[i] = pixels[i * 4 + 3] < 128 ? 0 : 1e6;
  const step = (x, y, dx, dy, w) => {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
    d[y * W + x] = Math.min(d[y * W + x], d[ny * W + nx] + w);
  };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      step(x, y, -1, 0, 3);
      step(x, y, 0, -1, 3);
      step(x, y, -1, -1, 4);
      step(x, y, 1, -1, 4);
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      step(x, y, 1, 0, 3);
      step(x, y, 0, 1, 3);
      step(x, y, 1, 1, 4);
      step(x, y, -1, 1, 4);
    }
  return d.map((v) => Math.min(255, v / 3));
}

const can = await sharp(FINISH_CAN)
  .resize({ height: FINISH_CAN_HEIGHT })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const canW = can.info.width;
const canH = can.info.height;
const canBase = new Uint8ClampedArray(can.data);
const canDist = outlineDistance(canBase, canW, canH);
// the same layout as a body's maps: R = finish weight, G = distance to the outline
const canMaps = new Uint8ClampedArray(canBase.length);
let lightSum = 0;
let weightSum = 0;
for (let i = 0; i < canW * canH; i++) {
  const r = canBase[i * 4];
  const g = canBase[i * 4 + 1];
  const b = canBase[i * 4 + 2];
  const w = canBase[i * 4 + 3] < 128 ? 0 : paintWeight(r, g, b);
  canMaps[i * 4] = Math.round(w * 255);
  canMaps[i * 4 + 1] = canDist[i];
  lightSum += (w * (Math.max(r, g, b) + Math.min(r, g, b))) / 510;
  weightSum += w;
}
const canFinishL = lightSum / weightSum;

fs.mkdirSync(FINISH_DIR, { recursive: true });
for (const def of COMPONENT_DEFS.filter((d) => d.slot === "finish")) {
  const pixels = paintBody(new Uint8ClampedArray(canBase), canMaps, {
    width: canW,
    finish: def.color,
    top: def.top ? tops[def.top] : null,
    burst: def.burst,
    burstColor: def.burstColor,
    style: def.style,
    pickguard: null,
    finishL: canFinishL,
    pickguardL: null,
  });
  const file = path.join(FINISH_DIR, `${def.id.replace("finish:", "")}.webp`);
  await sharp(Buffer.from(pixels), {
    raw: { width: canW, height: canH, channels: 4 },
  })
    .resize({ height: FINISH_ICON_HEIGHT })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(file);
}
console.log(
  "finish icons:",
  COMPONENT_DEFS.filter((d) => d.slot === "finish").length,
  `(can paint mean L ${canFinishL.toFixed(3)})`,
);
