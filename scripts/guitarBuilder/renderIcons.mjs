/**
 * Guitar Builder — stash icons rendered from the real art, through the same
 * `paintBody` the guitar preview uses, so an icon is exactly what the item
 * looks like once it's on a guitar.
 *
 * - pickups: the covers lifted off a body and packed side by side
 * - finishes: a whole body (FINISH_BODY) painted with the finish
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
const { paintBody } = jiti("../../src/feature/guitarBuilder/utils/paint.ts");
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
/** Big, plain paint area, so colour, burst and grain all read at icon size. */
const FINISH_BODY = "single-cut";
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
const finishBody = manifest.bodies.find((b) => b.key === FINISH_BODY);
const fb = {
  base: await raw(finishBody.src),
  maps: await raw(finishBody.maps),
};
fs.mkdirSync(FINISH_DIR, { recursive: true });
for (const def of COMPONENT_DEFS.filter((d) => d.slot === "finish")) {
  const pixels = paintBody(new Uint8ClampedArray(fb.base.data), fb.maps.data, {
    width: fb.base.W,
    finish: def.color,
    top: def.top ? tops[def.top] : null,
    burst: def.burst,
    burstColor: def.burstColor,
    style: def.style,
    pickguard: null,
    finishL: finishBody.finishL,
    pickguardL: finishBody.pickguardL,
  });
  const file = path.join(FINISH_DIR, `${def.id.replace("finish:", "")}.webp`);
  await sharp(Buffer.from(pixels), {
    raw: { width: fb.base.W, height: fb.base.H, channels: 4 },
  })
    .resize({ height: FINISH_ICON_HEIGHT })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(file);
}
console.log(
  "finish icons:",
  COMPONENT_DEFS.filter((d) => d.slot === "finish").length,
);
