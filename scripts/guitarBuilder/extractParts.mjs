/**
 * Guitar Builder POC — cuts the Arsenal guitar renders into interchangeable
 * parts (body / neck / headstock) on one shared template, plus the masks the
 * client needs to repaint finishes and pickguards.
 *
 * Template space: every source is deskewed and scaled so the neck is NECK_WIDTH
 * px wide where it meets the body. Bodies end at the joint, necks run from the
 * end of their fretboard (over the body) to the nut, headstocks start at the nut.
 *
 *   node scripts/guitarBuilder/extractParts.mjs
 */
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const SRC_DIR = "public/static/images/rank/special";
const OUT_DIR = "public/images/guitar-builder";
const MANIFEST = "src/feature/guitarBuilder/data/parts.generated.json";
const NECK_WIDTH = 88;

/** pickguard: tone of the guard to isolate for repainting (null = none).
 *  finish: finishMask tuning when the dominant hue is not the paint (tortoise
 *  guards, pale or relic finishes). Goldtops are out: the paint shares its hue
 *  with the hardware. */
const BODIES = [
  {
    key: "t-style",
    source: 20,
    name: "T-Style",
    pickguard: "light",
    // the shadowed strip between bridge plate and guard is its own small
    // island of paint — the 1% island cut (meant for knobs) dropped it
    finish: { minComponent: 0.0003 },
  },
  {
    key: "t-style-coral",
    source: 28,
    name: "T-Style Coral",
    pickguard: "light",
    finish: { minComponent: 0.0003 },
  },
  {
    key: "s-style",
    source: 24,
    name: "S-Style Burst",
    pickguard: "light",
    finish: { hueTol: 50 },
    // chrome bridge and jack plate pass for white plastic at their highlights
    // [x, y, w, h], traced off the bridge plate (with its notch) and jack plate
    guardExclude: [
      [196, 199, 66, 116],
      [196, 315, 50, 22],
      [100, 345, 98, 95],
      [100, 440, 45, 40],
    ],
  },
  { key: "s-style-green", source: 57, name: "S-Style", pickguard: null },
  { key: "superstrat", source: 30, name: "Superstrat", pickguard: null },
  {
    key: "superstrat-flame",
    source: 40,
    name: "Superstrat Flame",
    pickguard: null,
  },
  {
    key: "single-cut",
    source: 58,
    name: "Single-Cut",
    pickguard: null,
    // the strip of paint between bridge and tailpiece is its own small island
    finish: { minComponent: 0.0003 },
  },
  { key: "double-cut", source: 73, name: "Double-Cut", pickguard: null },
  {
    key: "carved-double-cut",
    source: 64,
    name: "Carved Double-Cut",
    pickguard: null,
  },
  {
    key: "offset",
    source: 7,
    name: "Offset",
    pickguard: null,
    finish: { hue: 205 },
  },
  {
    key: "offset-seafoam",
    source: 76,
    name: "Offset Relic",
    pickguard: null,
    // relic: wear and glare cut the paint into islands, and the default
    // "drop islands under 1%" (meant for knobs) threw away the top-edge band and
    // the wedge under the bridge — nothing else here shares the seafoam hue
    finish: { hue: 155, minSat: 0.09, hueTol: 36, minComponent: 0.0003 },
    // chipped, near-white edges fall below the colour test altogether
    fillFinish: { close: 22, rim: 16 },
  },
  { key: "semi-hollow", source: 78, name: "Semi-Hollow", pickguard: null },
  { key: "x-style", source: 71, name: "X-Style", pickguard: null },
];

const NECKS = [
  { key: "maple-dots", source: 69, name: "Maple · dots" },
  { key: "maple-vines", source: 20, name: "Maple · vine inlays" },
  { key: "maple-blocks", source: 47, name: "Maple · blocks" },
  { key: "rosewood-dots", source: 57, name: "Rosewood · dots" },
  { key: "rosewood-trapezoid", source: 58, name: "Rosewood · trapezoids" },
  { key: "ebony-blocks", source: 70, name: "Ebony · blocks" },
  { key: "ebony-birds", source: 41, name: "Ebony · birds" },
  { key: "ebony-sharks", source: 40, name: "Ebony · abalone" },
];

/** Figured tops, generated (the renders' own figure carries glare, strings and
 *  scanline noise once high-passed), tiled over any body's finish. */
const TOPS = [
  // figured maple tops: drawn under any colour
  { key: "flame", name: "Flame", depth: 0.13 },
  { key: "quilt", name: "Quilt", depth: 0.13 },
  { key: "birdseye", name: "Birdseye", depth: 0.11 },
  { key: "koa", name: "Koa", depth: 0.14, size: 512 },
  // plain woods for natural and see-through finishes; grain runs along the
  // guitar, so it's horizontal on the art
  { key: "ash", name: "Ash", depth: 0.17, size: 512 },
  { key: "mahogany", name: "Mahogany", depth: 0.09, size: 512 },
  { key: "walnut", name: "Walnut", depth: 0.15, size: 512 },
  { key: "burl", name: "Burl", depth: 0.17 },
  { key: "spalted", name: "Spalted", depth: 0.22, size: 512 },
];

const HEADS = [
  { key: "six-inline", source: 69, name: "Six in line" },
  { key: "three-three", source: 58, name: "Three a side" },
  { key: "three-three-black", source: 70, name: "Three a side · black" },
  { key: "pointy", source: 40, name: "Pointy" },
  { key: "pointy-reverse", source: 25, name: "Pointy · maple" },
  // 64, not the RPS (41): that one carries a model name and signature
  { key: "carved", source: 64, name: "Carved" },
  { key: "offset", source: 76, name: "Offset" },
];

/** Manual fretboard overhang (template px left of the joint), keyed by source,
 *  where the colour walk in findFretStart can't tell a dark fretboard from dark
 *  hardware. Check with `--debug <dir>` (writes fret-sheet.png). */
const FRET_EXT = {
  7: 210,
  11: 53,
  19: 148,
  20: 146,
  41: 198,
  47: 196,
  57: 234,
  70: 128,
  71: 183,
  73: 88,
  76: 188,
  78: 120,
};

/** Px trimmed off every side of a pickup shape before it's painted. */
const PICKUP_INSET = 0;

/**
 * Hand-placed pickup covers, body-crop px: [centreX, centreY, width, height,
 * lean° (top toward the neck), corner radius]. Auto-detection (the fallback)
 * grabs the bridge or a mounting ring, or loses a black cover on a black guard,
 * so every body is placed by hand. Read off `--debug` pickups-*.png.
 */
const PICKUP_SHAPES = {
  superstrat: [
    [333, 265, 59, 115, 0, 8],
    [412, 265, 27.5, 135, 0, 13],
    [489, 265, 58, 115, 0, 8],
  ],
  "superstrat-flame": [
    [332.5, 265, 60, 117, 0, 8],
    [412, 266, 27.5, 133, 0, 13],
    [488, 265, 61, 117, 0, 8],
  ],
  "x-style": [
    [407, 290, 58, 116, 0, 6],
    [567, 290, 58, 116, 0, 6],
  ],
  "t-style": [
    [319, 268.5, 37, 128, 17, 18],
    [506, 267.5, 27, 115, 0, 13],
  ],
  "t-style-coral": [
    [317.5, 266, 37, 127, 15, 18],
    [504, 270, 27, 114, 0, 13],
  ],
  "s-style": [
    [306, 262.5, 30, 126, 9, 15],
    [396, 261, 30, 118, 0, 15],
    [488, 261, 30, 118, 0, 15],
  ],
  "s-style-green": [
    [338, 281, 31, 118, 11, 15],
    [432, 281, 31, 118, 0, 15],
    [532, 281, 31, 118, 0, 15],
  ],
  "single-cut": [
    [356, 260.5, 56, 113, 0, 6],
    [512.5, 260.5, 57, 113, 0, 6],
  ],
  "double-cut": [
    [315, 236, 48, 104, 0, 6],
    [461, 236, 50, 104, 0, 6],
  ],
  "carved-double-cut": [
    [312.5, 260, 55, 118, 0, 6],
    [448.5, 259.5, 55, 118, 0, 6],
  ],
  offset: [
    [369.5, 287, 61, 126, 0, 6],
    [535.5, 287, 61, 126, 0, 6],
  ],
  "offset-seafoam": [
    [321.5, 266, 62, 146, 0, 10],
    [490.5, 267.5, 60, 146, 0, 10],
  ],
  "semi-hollow": [
    [387, 299.5, 62, 120, 0, 6],
    [552, 300, 61, 120, 0, 6],
  ],
};

const debugBodies = [];

/** Nut correction (template px, + = toward the tip), keyed by source. A head
 *  that flares gently on one side (six-in-line) leaves the edge lines late, so
 *  the detected nut lands inside the headstock. Check with --debug nut-sheet.png. */
const NUT_SHIFT = {
  20: -11,
  41: -22,
  47: -6,
  57: -14,
  25: -12,
  40: -10,
  58: -15,
  64: -12,
  67: -5,
  69: -12,
  70: -5,
  76: -5,
};

const DEBUG_DIR = process.argv.includes("--debug")
  ? process.argv[process.argv.indexOf("--debug") + 1]
  : null;

// ---------------------------------------------------------------- helpers

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function toRaw(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height };
}
const rawInput = (img) => ({
  raw: { width: img.W, height: img.H, channels: 4 },
});
const alphaAt = (img, x, y) => img.data[(y * img.W + x) * 4 + 3];

function columnSpan(img, x) {
  let a = -1;
  let b = -1;
  for (let y = 0; y < img.H; y++) {
    if (alphaAt(img, x, y) > 128) {
      if (a < 0) a = y;
      b = y;
    }
  }
  return [a, b];
}

function runAt(img, x, y0) {
  if (alphaAt(img, x, y0) <= 128) return null;
  let a = y0;
  let b = y0;
  while (a > 0 && alphaAt(img, x, a - 1) > 128) a--;
  while (b < img.H - 1 && alphaAt(img, x, b + 1) > 128) b++;
  return [a, b];
}

function fitLine(points) {
  const n = points.length;
  let sx = 0,
    sy = 0,
    sxx = 0,
    sxy = 0;
  for (const [x, y] of points) {
    sx += x;
    sy += y;
    sxx += x * x;
    sxy += x * y;
  }
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return { m, c: (sy - m * sx) / n, at: (x) => m * x + (sy - m * sx) / n };
}

/** Joint, neck edge lines and nut of a horizontal guitar render. */
function findNeck(img) {
  const ref = Math.round(img.W * 0.6);
  const [ra, rb] = columnSpan(img, ref);
  const mid = Math.round((ra + rb) / 2);
  const refHeight = rb - ra;

  let joint = ref;
  for (let x = ref; x > 0; x--) {
    const [a, b] = columnSpan(img, x);
    if (b - a > refHeight * 1.6) {
      joint = x;
      break;
    }
  }

  const runs = [];
  for (let x = joint + 2; x < img.W; x++) {
    const r = runAt(img, x, mid);
    if (!r) break;
    runs.push([x, r[0], r[1]]);
  }
  // Fit the edges on the part of the neck that is surely neck, then call the
  // nut the first spot where either edge leaves its line for good.
  const stable = runs.slice(10, Math.round(runs.length * 0.55));
  const top = fitLine(stable.map(([x, a]) => [x, a]));
  const bottom = fitLine(stable.map(([x, , b]) => [x, b]));
  let nut = runs[runs.length - 1][0];
  for (let i = stable.length; i < runs.length - 6; i++) {
    const off = (k) => {
      const [x, a, b] = runs[i + k];
      return Math.max(Math.abs(a - top.at(x)), Math.abs(b - bottom.at(x)));
    };
    if ([0, 1, 2, 3, 4, 5].every((k) => off(k) > 3)) {
      nut = runs[i][0];
      break;
    }
  }
  const width = (x) => bottom.at(x) - top.at(x);
  const axis = (x) => (top.at(x) + bottom.at(x)) / 2;
  return {
    joint,
    nut,
    top,
    bottom,
    width,
    axis,
    slope: (top.m + bottom.m) / 2,
  };
}

/** Where the fretboard ends over the body: walk left from the joint while the
 *  band still looks like the neck's wood. */
function findFretStart(img, neck) {
  const { joint, top, bottom } = neck;
  const sample = [];
  for (let x = joint + 10; x < joint + 70; x++) {
    const a = Math.ceil(top.at(x) + width15(neck, x));
    const b = Math.floor(bottom.at(x) - width15(neck, x));
    for (let y = a; y <= b; y++) sample.push((y * img.W + x) * 4);
  }
  const wood = [0, 1, 2].map((c) => {
    const v = sample.map((i) => img.data[i + c]).sort((p, q) => p - q);
    return v[Math.floor(v.length / 2)];
  });
  const isWood = (i) =>
    Math.hypot(
      img.data[i] - wood[0],
      img.data[i + 1] - wood[1],
      img.data[i + 2] - wood[2],
    ) < 40;

  const minRun = Math.round(NECK_WIDTH * 0.45);
  let run = 0;
  for (let x = joint; x > 0; x--) {
    const a = Math.ceil(top.at(x) + width15(neck, x));
    const b = Math.floor(bottom.at(x) - width15(neck, x));
    let hit = 0;
    for (let y = a; y <= b; y++) if (isWood((y * img.W + x) * 4)) hit++;
    if (hit / (b - a + 1) < 0.35) {
      run++;
      if (run >= minRun) return x + run;
    } else run = 0;
  }
  return joint;
}
const width15 = (neck, x) => neck.width(x) * 0.15;

async function loadSource(id) {
  const file = path.join(SRC_DIR, `${id}.webp`);
  let img = await toRaw(file);
  // deskew: the renders lean up to ~0.9° — straighten so the neck axis is level
  const skew = (Math.atan(findNeck(img).slope) * 180) / Math.PI;
  if (Math.abs(skew) > 0.02) {
    img = await toRaw(
      await sharp(file)
        .ensureAlpha()
        .rotate(-skew, { background: TRANSPARENT })
        .png()
        .toBuffer(),
    );
  }
  const scale = NECK_WIDTH / findNeck(img).width(findNeck(img).joint);
  img = await toRaw(
    await sharp(img.data, rawInput(img))
      .resize(Math.round(img.W * scale), Math.round(img.H * scale), {
        kernel: "lanczos3",
      })
      .png()
      .toBuffer(),
  );
  const neck = findNeck(img);
  if (NUT_SHIFT[id]) neck.nut += NUT_SHIFT[id];
  const fretStart =
    FRET_EXT[id] !== undefined
      ? neck.joint - FRET_EXT[id]
      : findFretStart(img, neck);
  return { id, img, neck, fretStart, scale };
}

function crop(img, x0, y0, w, h, keep) {
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = x0 + x;
      const sy = y0 + y;
      if (sx < 0 || sy < 0 || sx >= img.W || sy >= img.H) continue;
      const si = (sy * img.W + sx) * 4;
      const di = (y * w + x) * 4;
      const k = keep ? keep(sx, sy) : 1;
      if (k <= 0) continue;
      out[di] = img.data[si];
      out[di + 1] = img.data[si + 1];
      out[di + 2] = img.data[si + 2];
      out[di + 3] = Math.round(img.data[si + 3] * k);
    }
  }
  return { data: out, W: w, H: h };
}

function bbox(img, keep) {
  let x0 = img.W,
    x1 = -1,
    y0 = img.H,
    y1 = -1;
  for (let y = 0; y < img.H; y++) {
    for (let x = 0; x < img.W; x++) {
      if (alphaAt(img, x, y) > 8 && (!keep || keep(x, y))) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { x0, x1, y0, y1 };
}

// ---------------------------------------------------------------- colour

function hsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h =
    max === r
      ? (g - b) / d + (g < b ? 6 : 0)
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;
  return [h * 60, s, l];
}
const smooth = (e0, e1, v) => {
  const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const hueDist = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/** Connected components (4-way) of `on`; returns labels + sizes. */
function components(W, H, on) {
  const label = new Int32Array(W * H).fill(-1);
  const sizes = [];
  const stack = [];
  for (let i = 0; i < W * H; i++) {
    if (!on[i] || label[i] >= 0) continue;
    const id = sizes.length;
    let size = 0;
    stack.push(i);
    label[i] = id;
    while (stack.length) {
      const p = stack.pop();
      size++;
      const x = p % W;
      const y = (p - x) / W;
      const nb = [
        x > 0 && p - 1,
        x < W - 1 && p + 1,
        y > 0 && p - W,
        y < H - 1 && p + W,
      ];
      for (const q of nb) {
        if (q !== false && on[q] && label[q] < 0) {
          label[q] = id;
          stack.push(q);
        }
      }
    }
    sizes.push(size);
  }
  return { label, sizes };
}

function dilate(W, H, mask, r) {
  let cur = mask;
  for (let k = 0; k < r; k++) {
    const next = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        next[i] =
          cur[i] ||
          (x > 0 && cur[i - 1]) ||
          (x < W - 1 && cur[i + 1]) ||
          (y > 0 && cur[i - W]) ||
          (y < H - 1 && cur[i + W])
            ? 1
            : 0;
      }
    }
    cur = next;
  }
  return cur;
}

/** Finish weight: pixels of the dominant saturated hue, in big connected areas
 *  (drops knobs and other small hardware that happens to share the hue). */
function finishMask(
  body,
  { hueTol = 28, hue: forcedHue, minSat = 0.16, minComponent = 0.01 } = {},
) {
  const { W, H, data } = body;
  const n = W * H;
  const H_ = new Float32Array(n),
    S_ = new Float32Array(n),
    L_ = new Float32Array(n);
  const bins = new Float64Array(36);
  for (let i = 0; i < n; i++) {
    const [h, s, l] = hsl(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    H_[i] = h;
    S_[i] = s;
    L_[i] = l;
    if (data[i * 4 + 3] > 200 && s > 0.3 && l > 0.1 && l < 0.9)
      bins[Math.floor(h / 10) % 36] += s;
  }
  let peak = 0;
  for (let b = 1; b < 36; b++) if (bins[b] > bins[peak]) peak = b;
  const seed = forcedHue ?? peak * 10 + 5;
  // circular mean of the hues near the peak
  let cx = 0,
    cy = 0;
  for (let i = 0; i < n; i++) {
    if (data[i * 4 + 3] > 200 && S_[i] > minSat && hueDist(H_[i], seed) < 20) {
      cx += Math.cos((H_[i] * Math.PI) / 180) * S_[i];
      cy += Math.sin((H_[i] * Math.PI) / 180) * S_[i];
    }
  }
  const hue = ((Math.atan2(cy, cx) * 180) / Math.PI + 360) % 360;

  const weight = new Float32Array(n);
  const hard = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const a = data[i * 4 + 3] / 255;
    weight[i] =
      a *
      smooth(minSat - 0.06, minSat + 0.06, S_[i]) *
      (1 - smooth(hueTol - 6, hueTol + 6, hueDist(H_[i], hue))) *
      smooth(0.03, 0.07, L_[i]);
    hard[i] = weight[i] > 0.5 ? 1 : 0;
  }
  const { label, sizes } = components(W, H, hard);
  const total = sizes.reduce((p, q) => p + q, 0);
  const keepIds = new Set(
    sizes
      .map((s, id) => (s >= total * minComponent ? id : -1))
      .filter((id) => id >= 0),
  );
  const keep = new Uint8Array(n);
  for (let i = 0; i < n; i++)
    keep[i] = label[i] >= 0 && keepIds.has(label[i]) ? 1 : 0;
  const near = dilate(W, H, keep, 2);
  let sumL = 0,
    sumW = 0;
  for (let i = 0; i < n; i++) {
    weight[i] *= near[i];
    sumL += L_[i] * weight[i];
    sumW += weight[i];
  }
  return { weight, hue, meanL: sumW ? sumL / sumW : 0.5, L: L_, S: S_ };
}

function erode(W, H, mask, r) {
  const inv = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) inv[i] = mask[i] ? 0 : 1;
  const grown = dilate(W, H, inv, r);
  for (let i = 0; i < W * H; i++) inv[i] = grown[i] ? 0 : 1;
  return inv;
}

/** Pickguard: the biggest pale, colourless area that barely touches the outline.
 *  Uses chroma, not HSL saturation — near white, compression noise makes HSL
 *  saturation jump and the mask comes out in JPEG-like blocks. */
function pickguardMask(body, f) {
  const { W, H, data } = body;
  const n = W * H;
  const chroma = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4],
      g = data[i * 4 + 1],
      b = data[i * 4 + 2];
    chroma[i] = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  }
  const hard = new Uint8Array(n);
  for (let i = 0; i < n; i++)
    hard[i] =
      data[i * 4 + 3] > 250 && chroma[i] < 0.14 && f.L[i] > 0.66 ? 1 : 0;
  const { label, sizes } = components(W, H, hard);
  const opaque = new Uint8Array(n);
  for (let i = 0; i < n; i++) opaque[i] = data[i * 4 + 3] > 128 ? 0 : 1;
  const outline = dilate(W, H, opaque, 3);
  const touching = new Float64Array(sizes.length);
  for (let i = 0; i < n; i++)
    if (outline[i] && label[i] >= 0) touching[label[i]]++;
  let best = -1;
  sizes.forEach((s, id) => {
    if (touching[id] < s * 0.02 && (best < 0 || s > sizes[best])) best = id;
  });
  if (best < 0 || sizes[best] < n * 0.03) return null;
  // close pinholes (screws, compression specks) so the guard repaints as one
  // sheet; dark bits inside it still drop out through the lightness ramp
  const own = new Uint8Array(n);
  // strings and pickups split a guard into several islands — take them all,
  // but only the bright ones: chrome plates (bridge, jack) pass the colour
  // test too, and sit a good deal darker on average than white plastic
  const lightSum = new Float64Array(sizes.length);
  for (let i = 0; i < n; i++) if (label[i] >= 0) lightSum[label[i]] += f.L[i];
  const parts = new Set(
    sizes.map((s, id) =>
      touching[id] < s * 0.02 &&
      s >= sizes[best] * 0.08 &&
      lightSum[id] / s > 0.86
        ? id
        : -1,
    ),
  );
  for (let i = 0; i < n; i++) own[i] = parts.has(label[i]) ? 1 : 0;
  // wide enough to bridge the strip the strings cut between pickups
  const closed = dilate(W, H, erode(W, H, dilate(W, H, own, 9), 9), 1);
  const weight = new Float32Array(n);
  let sumL = 0,
    sumW = 0;
  for (let i = 0; i < n; i++) {
    if (!closed[i]) continue;
    weight[i] =
      smooth(0.5, 0.68, f.L[i]) *
      (1 - smooth(0.14, 0.24, chroma[i])) *
      (data[i * 4 + 3] / 255);
    sumL += f.L[i] * weight[i];
    sumW += weight[i];
  }
  return { weight, meanL: sumL / sumW };
}

/** Where a sticker may sit: finish, pickguard and the gloss streaks lying on
 *  them — not hardware, strings or the outline. Gloss is pale and colourless
 *  like chrome, so it's told apart by size after an opening that also wipes
 *  out the 1–3 px strings. */
function surfaceMask(body, finish, guard) {
  const { W, H, data } = body;
  const n = W * H;
  const base = new Uint8Array(n);
  const glare = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const g = guard ? guard.weight[i] : 0;
    base[i] = finish.weight[i] > 0.5 || g > 0.5 ? 1 : 0;
    const r = data[i * 4],
      gr = data[i * 4 + 1],
      b = data[i * 4 + 2];
    const chroma = (Math.max(r, gr, b) - Math.min(r, gr, b)) / 255;
    glare[i] =
      !base[i] && data[i * 4 + 3] > 250 && finish.L[i] > 0.7 && chroma < 0.3
        ? 1
        : 0;
  }
  const opened = dilate(W, H, erode(W, H, glare, 2), 2);
  const { label, sizes } = components(W, H, opened);
  const nearBase = dilate(W, H, base, 2);
  const touches = new Uint8Array(sizes.length);
  for (let i = 0; i < n; i++)
    if (label[i] >= 0 && nearBase[i]) touches[label[i]] = 1;
  const weight = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const keepGlare =
      label[i] >= 0 &&
      touches[label[i]] &&
      sizes[label[i]] >= n * 0.003 &&
      glare[i];
    weight[i] = Math.max(
      finish.weight[i],
      guard ? guard.weight[i] : 0,
      keepGlare ? 1 : 0,
    );
  }
  return weight;
}

/**
 * Pickup covers: blocks on the string axis, between the bridge end and the
 * fretboard, that aren't paintable surface. An opening first wipes out the
 * strings that would otherwise tie every pickup and the bridge into one blob;
 * what's left is kept when it is pickup-shaped. `PICKUP_RECTS` overrides a body
 * where a plate or bridge merges in (template px, [x, y, w, h] in the body crop).
 * The whole shape is the cover: strings crossing it get the new tone too, but
 * keep their light/dark line, so they still read as strings.
 */
function pickupMask(body, surface, axisY, fretStartX, override) {
  const { W, H, data } = body;
  const n = W * H;
  const half = NECK_WIDTH * 1.15;
  const cand = new Uint8Array(n);
  for (
    let y = Math.max(0, Math.floor(axisY - half));
    y < Math.min(H, axisY + half);
    y++
  ) {
    for (let x = 0; x < fretStartX; x++) {
      const i = y * W + x;
      cand[i] = data[i * 4 + 3] > 230 && surface[i] < 0.4 ? 1 : 0;
    }
  }
  const opened = dilate(W, H, erode(W, H, cand, 2), 2);
  let shapes = override;
  if (!shapes) {
    const { label, sizes } = components(W, H, opened);
    const boxes = sizes.map(() => ({ x0: W, y0: H, x1: -1, y1: -1 }));
    for (let i = 0; i < n; i++) {
      if (label[i] < 0) continue;
      const b = boxes[label[i]];
      const x = i % W;
      const y = (i - x) / W;
      b.x0 = Math.min(b.x0, x);
      b.x1 = Math.max(b.x1, x);
      b.y0 = Math.min(b.y0, y);
      b.y1 = Math.max(b.y1, y);
    }
    shapes = boxes
      .map((b) => [b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1])
      .filter(
        ([, y, w, h]) =>
          h > NECK_WIDTH * 0.55 &&
          h < NECK_WIDTH * 2 &&
          w > NECK_WIDTH * 0.14 &&
          w < NECK_WIDTH * 0.9 &&
          Math.abs(y + h / 2 - axisY) < NECK_WIDTH * 0.25,
      )
      .map(([x, y, w, h]) => [x + w / 2, y + h / 2, w, h, 0, 4]);
  }
  const weight = new Float32Array(n);
  let sumL = 0,
    sumW = 0;
  for (const [cx, cy, sw, sh, lean, sr] of shapes) {
    // pull in off the cover's rim, so the ring, guard or plate around it
    // never picks up the new colour
    const w = sw - PICKUP_INSET * 2;
    const h = sh - PICKUP_INSET * 2;
    const radius = Math.max(0, sr - PICKUP_INSET);
    const t = (lean * Math.PI) / 180;
    const reach = Math.ceil(Math.hypot(w, h) / 2) + 1;
    for (let y = Math.floor(cy - reach); y <= cy + reach; y++) {
      for (let x = Math.floor(cx - reach); x <= cx + reach; x++) {
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const i = y * W + x;
        // rounded-rect SDF in the cover's own frame, 1 px anti-aliased edge
        const dx = x - cx;
        const dy = y - cy;
        const u =
          Math.abs(dx * Math.cos(t) + dy * Math.sin(t)) - (w / 2 - radius);
        const v =
          Math.abs(dx * Math.sin(t) - dy * Math.cos(t)) - (h / 2 - radius);
        const dist =
          Math.hypot(Math.max(u, 0), Math.max(v, 0)) +
          Math.min(Math.max(u, v), 0) -
          radius;
        const cover = Math.min(1, Math.max(0, 0.5 - dist));
        if (cover <= weight[i]) continue;
        weight[i] = cover;
        const r = data[i * 4],
          g = data[i * 4 + 1],
          b = data[i * 4 + 2];
        sumL += ((Math.max(r, g, b) + Math.min(r, g, b)) / 510) * cover;
        sumW += cover;
      }
    }
  }
  // the cover's own light range: the client maps the new colour onto it, so
  // a black plastic cover and a chrome one both come out shaded the same way
  const ls = [];
  for (let i = 0; i < n; i++) {
    if (weight[i] > 0.5)
      ls.push(
        (Math.max(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]) +
          Math.min(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])) /
          510,
      );
  }
  ls.sort((a, b) => a - b);
  const pct = (p) => ls[Math.min(ls.length - 1, Math.floor(ls.length * p))];
  const tone = ls.length
    ? { lo: pct(0.05), mid: pct(0.5), hi: pct(0.95) }
    : null;
  void sumL;
  void sumW;
  return { weight, shapes, tone };
}

/** Centre of the biggest clear circle of sticker ground left of the
 *  fretboard — where a freshly added sticker lands. */
function stickerSpot(W, H, surface, limitX) {
  const d = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++)
    d[i] = surface[i] > 0.5 && i % W < limitX ? 1e9 : 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : d[y * W + x]);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (d[i])
        d[i] = Math.min(
          d[i],
          at(x - 1, y) + 1,
          at(x, y - 1) + 1,
          at(x - 1, y - 1) + 1.414,
          at(x + 1, y - 1) + 1.414,
        );
    }
  }
  let best = { x: 0, y: 0, r: -1 };
  for (let y = H - 1; y >= 0; y--) {
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (!d[i]) continue;
      d[i] = Math.min(
        d[i],
        at(x + 1, y) + 1,
        at(x, y + 1) + 1,
        at(x + 1, y + 1) + 1.414,
        at(x - 1, y + 1) + 1.414,
      );
      if (d[i] > best.r) best = { x, y, r: d[i] };
    }
  }
  return best;
}

/**
 * Pulls into the finish what a colour test can't see on a worn body: gaps
 * narrower than `close` px inside the paint (glare, wear streaks) and the band
 * within `rim` px of the outline next to it (chipped edges). Hardware is far
 * wider than `close`, so a closing never reaches it.
 */
function fillFinishGaps(
  body,
  finish,
  guard,
  dist,
  { close = 0, rim = 0, halo = 0, haloHue = 0 },
) {
  const { W, H, data } = body;
  const n = W * H;
  const hard = new Uint8Array(n);
  for (let i = 0; i < n; i++) hard[i] = finish.weight[i] > 0.5 ? 1 : 0;
  const closed = close ? erode(W, H, dilate(W, H, hard, close), close) : hard;
  const near = dilate(W, H, hard, Math.max(rim, halo));
  for (let i = 0; i < n; i++) {
    const alpha = data[i * 4 + 3] / 255;
    if (!alpha || (guard && guard.weight[i] > 0.1)) continue;
    // halo: paint tinted by the hardware glow beside it — near the paint,
    // still coloured, and closer to the paint's hue than to the hardware's
    const [h] = halo ? hsl(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]) : [0];
    const tinted =
      halo && near[i] && finish.S[i] > 0.15 && hueDist(h, finish.hue) < haloHue;
    if (closed[i] || (rim && near[i] && dist[i] <= rim) || tinted) {
      finish.weight[i] = Math.max(finish.weight[i], alpha);
    }
  }
}

/**
 * Rows the six strings run along over a pickup: a string is a thin line
 * running the whole width of the cover and on past it, so a row's mean
 * second difference (lightness against the rows 2 px above and below) is
 * strongly signed there, while a pole ring only moves it locally. Takes the
 * six strongest rows at least `gap` px apart, top to bottom.
 */
function findStringRows(L, W, H, shape) {
  const [cx, cy, w, h, lean] = shape;
  const t = (lean * Math.PI) / 180;
  const halfH = h / 2;
  const reachX = Math.abs(Math.sin(t)) * halfH + w / 2 + 10;
  const score = [];
  for (let y = Math.round(cy - halfH); y <= Math.round(cy + halfH); y++) {
    if (y < 2 || y >= H - 2) continue;
    let sum = 0;
    let count = 0;
    // centre of the cover on this row
    const x0 = cx + (cy - y) * Math.tan(t);
    for (let x = Math.round(x0 - reachX); x <= Math.round(x0 + reachX); x++) {
      if (x < 0 || x >= W) continue;
      const i = y * W + x;
      sum += L[i] - (L[i - 2 * W] + L[i + 2 * W]) / 2;
      count++;
    }
    score.push({ y, v: Math.abs(sum / count) });
  }
  // strings are evenly spaced: fit the best grid of six instead of picking
  // peaks, which a pole ring or the cover's end can steal
  const at = new Map(score.map((r) => [r.y, r.v]));
  const val = (y) =>
    Math.max(at.get(Math.floor(y)) ?? 0, at.get(Math.ceil(y)) ?? 0);
  let best = { total: -1, rows: [] };
  for (let gap = 13; gap <= 22; gap += 0.25) {
    const span = gap * 5;
    // the covers sit centred under the strings
    for (let o = cy - span / 2 - 7; o <= cy - span / 2 + 7; o += 0.5) {
      const rows = [0, 1, 2, 3, 4, 5].map((k) => o + k * gap);
      const total = rows.reduce((sum, y) => sum + val(y), 0);
      if (total > best.total) best = { total, rows };
    }
  }
  return best.rows.map((y) => +y.toFixed(1));
}

/** Chamfer distance (px) from each opaque pixel to the body outline. */
function edgeDistance(body) {
  const { W, H, data } = body;
  const d = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) d[i] = data[i * 4 + 3] > 128 ? 1e9 : 0;
  const pass = (x, y, dx, dy, c) => {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) return 0;
    return d[ny * W + nx] + c;
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!d[i]) continue;
      d[i] = Math.min(
        d[i],
        pass(x, y, -1, 0, 1),
        pass(x, y, 0, -1, 1),
        pass(x, y, -1, -1, 1.414),
        pass(x, y, 1, -1, 1.414),
      );
    }
  }
  for (let y = H - 1; y >= 0; y--) {
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (!d[i]) continue;
      d[i] = Math.min(
        d[i],
        pass(x, y, 1, 0, 1),
        pass(x, y, 0, 1, 1),
        pass(x, y, 1, 1, 1.414),
        pass(x, y, -1, 1, 1.414),
      );
    }
  }
  return d;
}

// ---------------------------------------------------------------- parts

async function writeWebp(img, file, lossless = false) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp(img.data, rawInput(img))
    .webp(lossless ? { lossless: true } : { quality: 90, alphaQuality: 100 })
    .toFile(file);
}

const publicUrl = (file) =>
  "/" + path.relative("public", file).split(path.sep).join("/");

async function buildBody(def, src) {
  const { img, neck } = src;
  const J = neck.joint;
  const box = bbox(img, (x) => x <= J);
  const W = J - box.x0 + 1;
  const H = box.y1 - box.y0 + 1;
  const body = crop(img, box.x0, box.y0, W, H, (x) => (x <= J ? 1 : 0));

  const finish = finishMask(body, def.finish);
  const guard = def.pickguard ? pickguardMask(body, finish) : null;
  if (guard) {
    // white crumbs of guard cut off from the main sheet (a sliver under a
    // pickup, a wedge between knobs) fail the island tests and would stay
    // white on any recolour: take bright colourless pixels right next to it
    const hard = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) hard[i] = guard.weight[i] > 0.5 ? 1 : 0;
    const near = dilate(W, H, hard, 6);
    for (let i = 0; i < W * H; i++) {
      if (!near[i] || guard.weight[i] > 0.5 || body.data[i * 4 + 3] < 250)
        continue;
      const r = body.data[i * 4],
        g = body.data[i * 4 + 1],
        b = body.data[i * 4 + 2];
      const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
      if (finish.L[i] > 0.82 && chroma < 0.12) guard.weight[i] = 1;
    }
  }
  for (const [rx, ry, rw, rh] of def.guardExclude ?? []) {
    for (let y = ry; y < Math.min(H, ry + rh); y++) {
      for (let x = rx; x < Math.min(W, rx + rw); x++)
        guard.weight[y * W + x] = 0;
    }
  }
  const dist = edgeDistance(body);
  if (def.fillFinish) fillFinishGaps(body, finish, guard, dist, def.fillFinish);
  const surface = surfaceMask(body, finish, guard);
  const axisY = neck.axis(J) - box.y0;
  const pickups = pickupMask(
    body,
    surface,
    axisY,
    src.fretStart - box.x0,
    PICKUP_SHAPES[def.key],
  );
  // a cover is neither finish, guard nor sticker ground — pale covers on a
  // white guard would otherwise repaint with the guard
  for (let i = 0; i < W * H; i++) {
    const keep = 1 - pickups.weight[i];
    finish.weight[i] *= keep;
    if (guard) guard.weight[i] *= keep;
    surface[i] *= keep;
  }
  // Cover detail: lightness minus its 2 px blur. Pole pieces, strings and the
  // cover's edge live here; a chrome cover's broad reflections don't, which is
  // what lets a plastic repaint keep the poles without inheriting the mirror.
  const gray = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) gray[i] = Math.round(finish.L[i] * 255);
  // sharp hands a blurred single channel back as RGB — keep one
  const blurred = await sharp(gray, {
    raw: { width: W, height: H, channels: 1 },
  })
    .blur(2)
    .extractChannel(0)
    .raw()
    .toBuffer();
  // R = sticker surface, G = pickup covers, B = cover detail (128 = flat, ×2)
  const surfaceImg = { data: Buffer.alloc(W * H * 4), W, H };
  for (let i = 0; i < W * H; i++) {
    surfaceImg.data[i * 4] = Math.round(surface[i] * 255);
    surfaceImg.data[i * 4 + 1] = Math.round(pickups.weight[i] * 255);
    surfaceImg.data[i * 4 + 2] =
      pickups.weight[i] > 0
        ? Math.max(0, Math.min(255, 128 + (gray[i] - blurred[i]) * 2))
        : 128;
    surfaceImg.data[i * 4 + 3] = 255;
  }
  const spot = stickerSpot(W, H, surface, src.fretStart - box.x0);
  debugBodies.push({
    key: def.key,
    body,
    shapes: pickups.shapes,
    weight: pickups.weight,
  });
  const maps = { data: Buffer.alloc(W * H * 4), W, H };
  for (let i = 0; i < W * H; i++) {
    const g = guard ? guard.weight[i] : 0;
    maps.data[i * 4] = Math.round(finish.weight[i] * (1 - g) * 255);
    maps.data[i * 4 + 1] = Math.min(255, Math.round(dist[i]));
    maps.data[i * 4 + 2] = Math.round(g * 255);
    maps.data[i * 4 + 3] = 255;
  }
  const base = path.join(OUT_DIR, "bodies", `${def.key}.webp`);
  const mapFile = path.join(OUT_DIR, "bodies", `${def.key}.maps.webp`);
  await writeWebp(body, base);
  await writeWebp(maps, mapFile, true);
  const surfaceFile = path.join(OUT_DIR, "bodies", `${def.key}.surface.webp`);
  await writeWebp(surfaceImg, surfaceFile, true);
  return {
    key: def.key,
    name: def.name,
    src: publicUrl(base),
    maps: publicUrl(mapFile),
    surface: publicUrl(surfaceFile),
    width: W,
    height: H,
    jointX: J - box.x0,
    axisY: +(neck.axis(J) - box.y0).toFixed(1),
    fretStartX: src.fretStart - box.x0,
    finishHue: +finish.hue.toFixed(1),
    finishL: +finish.meanL.toFixed(3),
    pickguardL: guard ? +guard.meanL.toFixed(3) : null,
    pickupTone: pickups.tone && {
      lo: +pickups.tone.lo.toFixed(3),
      mid: +pickups.tone.mid.toFixed(3),
      hi: +pickups.tone.hi.toFixed(3),
    },
    stickerSpot: { x: spot.x, y: spot.y },
    // single-coil capsules, redrawn by the client with poles under the strings
    singleCoils: pickups.shapes
      .filter(([, , w]) => w < 40)
      .map((shape) => {
        const [cx, cy, w, h, lean, r] = shape;
        return {
          cx,
          cy,
          w,
          h,
          lean,
          r,
          strings: findStringRows(finish.L, W, H, shape),
        };
      }),
  };
}

async function buildNeck(def, src) {
  const { img, neck, fretStart } = src;
  const J = neck.joint;
  const half = NECK_WIDTH / 2 + 8;
  const x0 = fretStart;
  const y0 = Math.floor(neck.axis(J) - half);
  const W = neck.nut - x0 + 1;
  const H = Math.ceil(half * 2);
  // over the body keep only the fretboard band, with anti-aliased edges
  const keep = (x, y) => {
    if (x >= J) return 1;
    const a = neck.top.at(x) + 0.5;
    const b = neck.bottom.at(x) - 0.5;
    return (
      Math.min(1, Math.max(0, y + 0.5 - a)) *
      Math.min(1, Math.max(0, b - (y - 0.5)))
    );
  };
  const part = crop(img, x0, y0, W, H, keep);
  // the run right of the joint must be the neck only (drop tuner buttons etc.)
  for (let x = J - x0; x < W; x++) {
    const sx = x + x0;
    const r = runAt(img, sx, Math.round(neck.axis(sx)));
    for (let y = 0; y < H; y++) {
      const sy = y + y0;
      if (!r || sy < r[0] - 1 || sy > r[1] + 1)
        part.data[(y * W + x) * 4 + 3] = 0;
    }
  }
  const file = path.join(OUT_DIR, "necks", `${def.key}.webp`);
  await writeWebp(part, file);
  return {
    key: def.key,
    name: def.name,
    src: publicUrl(file),
    width: W,
    height: H,
    jointX: J - x0,
    axisY: +(neck.axis(J) - y0).toFixed(1),
    nutX: neck.nut - x0,
    nutWidth: +neck.width(neck.nut).toFixed(1),
  };
}

// ---------------------------------------------------------------- tops

/** Periodic value noise: tiles seamlessly every `period` lattice cells. */
function periodicNoise(seed, period) {
  const rand = (i, j) => {
    const h =
      Math.sin(
        (((i % period) + period) % period) * 127.1 +
          (((j % period) + period) % period) * 311.7 +
          seed * 74.7,
      ) * 43758.5453;
    return h - Math.floor(h);
  };
  return (x, y) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    const top = rand(i, j) + (rand(i + 1, j) - rand(i, j)) * u;
    const bottom = rand(i, j + 1) + (rand(i + 1, j + 1) - rand(i, j + 1)) * u;
    return top + (bottom - top) * v;
  };
}

/** Integer hash → 0..1, for per-pixel speckle. */
function hash2(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Wood pores: short dashes along the grain, `len` px long, tiling `T`. */
function pore(u, v, T, len, density, seed) {
  const x = Math.floor(u * T);
  const y = Math.floor(v * T);
  const cell = Math.floor(x / len);
  // stagger the dash grid row by row so pores don't line up in columns
  const shift = Math.floor(hash2(0, y, seed + 1) * len);
  const c = Math.floor((x + shift) / len) % Math.ceil(T / len);
  void cell;
  return hash2(c, y, seed) > 1 - density;
}

function fbm(noises, x, y) {
  let sum = 0;
  let amp = 0.5;
  noises.forEach((n, k) => {
    sum += n(x * 2 ** k, y * 2 ** k) * amp;
    amp /= 2;
  });
  return sum;
}

/** Figure generators over a unit tile (u, v in 0..1), returning -1..1.
 *  The guitar lies horizontally, so flame bands run up-down across the grain. */
const FIGURES = {
  flame: () => {
    const warp = [0, 1, 2, 3].map((k) => periodicNoise(11 + k, 4 * 2 ** k));
    const fade = [0, 1].map((k) => periodicNoise(31 + k, 3 * 2 ** k));
    return (u, v) => {
      const w = fbm(warp, u * 4, v * 4);
      const band = Math.sin(
        2 * Math.PI * (u * 18 + w * 2.6 + Math.sin(2 * Math.PI * v) * 0.15),
      );
      const strength = 0.2 + 0.8 * smooth(0.3, 0.7, fbm(fade, u * 3, v * 3));
      return Math.sign(band) * Math.abs(band) ** 0.6 * strength;
    };
  },
  birdseye: () => {
    // small dark "eyes" scattered over faint straight grain
    const N = 13;
    const jx = periodicNoise(101, N);
    const jy = periodicNoise(102, N);
    const on = periodicNoise(103, N);
    const grain = [0, 1].map((k) => periodicNoise(104 + k, 3 * 2 ** k));
    return (u, v) => {
      const x = u * N;
      const y = v * N;
      const ci = Math.floor(x);
      const cj = Math.floor(y);
      let eye = 0;
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          const cx = ci + di + 0.5;
          const cy = cj + dj + 0.5;
          if (on(cx, cy) < 0.3) continue;
          const d = Math.hypot(
            x - (ci + di + 0.2 + jx(cx, cy) * 0.6),
            (y - (cj + dj + 0.2 + jy(cx, cy) * 0.6)) * 1.4,
          );
          // dark pip with a pale ring around it
          // dark pip, a dark rim a little out, pale between
          const e = d < 0.07 ? -1 : d < 0.16 ? 0.4 : d < 0.21 ? -0.45 : 0;
          if (Math.abs(e) > Math.abs(eye)) eye = e;
        }
      }
      const lines = Math.sin(
        2 * Math.PI * (v * 24 + fbm(grain, u * 3, v * 3) * 1.2),
      );
      return eye !== 0 ? eye : lines * 0.15;
    };
  },
  koa: () => {
    // tight curl crossing a ribbon of straight grain
    const warp = [0, 1, 2].map((k) => periodicNoise(111 + k, 4 * 2 ** k));
    const fade = [0, 1].map((k) => periodicNoise(121 + k, 2 * 2 ** k));
    return (u, v) => {
      const w = fbm(warp, u * 4, v * 4);
      const curl = Math.sin(
        2 * Math.PI * (u * 46 + w * 3 + Math.sin(2 * Math.PI * v * 2) * 0.3),
      );
      const ribbon = Math.sin(2 * Math.PI * (v * 9 + w * 0.8));
      const strength = 0.3 + 0.7 * smooth(0.35, 0.7, fbm(fade, u * 2, v * 2));
      return curl * 0.55 * strength + ribbon * 0.35;
    };
  },
  ash: () => {
    // open-pored: wide pale bands broken by dark late-wood lines and pores
    const warp = [0, 1, 2].map((k) => periodicNoise(131 + k, 2 * 2 ** k));
    const widths = periodicNoise(136, 8);
    return (u, v) => {
      const w = fbm(warp, u * 2, v * 2);
      const phase =
        (((v * 13 + w * 1.8 + Math.sin(2 * Math.PI * u) * 0.25) % 1) + 1) % 1;
      // late-wood band: sharp dark edge fading into the next pale band
      const wide = 0.18 + widths(u * 8, v * 8) * 0.2;
      const line = smooth(0, 0.04, phase) * (1 - smooth(0.04, wide, phase));
      const p = pore(u, v, 512, 7, 0.05 + line * 0.25, 7) ? -0.55 : 0;
      return 0.2 - line * 1.1 + p;
    };
  },
  mahogany: () => {
    // fine straight grain with broad ribbon stripes
    const warp = [0, 1].map((k) => periodicNoise(141 + k, 2 * 2 ** k));
    return (u, v) => {
      const w = fbm(warp, u * 2, v * 2);
      const fine = Math.sin(2 * Math.PI * (v * 52 + w * 2));
      const ribbon = Math.sin(2 * Math.PI * (v * 5 + w * 0.6));
      const p = pore(u, v, 512, 4, 0.04, 9) ? -0.35 : 0;
      return fine * 0.3 + ribbon * 0.5 + p;
    };
  },
  walnut: () => {
    // wavy medium grain with dark streaks
    const warp = [0, 1, 2].map((k) => periodicNoise(151 + k, 3 * 2 ** k));
    const streak = [0, 1].map((k) => periodicNoise(155 + k, 2 * 2 ** k));
    return (u, v) => {
      const w = fbm(warp, u * 3, v * 3);
      const lines = Math.sin(2 * Math.PI * (v * 18 + w * 2.4));
      const dark = smooth(0.55, 0.75, fbm(streak, u * 2, v * 6));
      return lines * 0.45 - dark * 0.7;
    };
  },
  burl: () => {
    // swirling contour lines of warped noise, with knots
    const base = [0, 1, 2, 3].map((k) => periodicNoise(161 + k, 3 * 2 ** k));
    const warp = [0, 1].map((k) => periodicNoise(166 + k, 3 * 2 ** k));
    return (u, v) => {
      const wu = u + (fbm(warp, u * 3, v * 3) - 0.45) * 0.08;
      const n = fbm(base, wu * 3, v * 3);
      const rings = Math.sin(2 * Math.PI * n * 14);
      // small dark knots where the noise peaks, soft-edged
      const knot = smooth(0.74, 0.79, n);
      return rings * 0.6 * (1 - knot) - knot * 0.9;
    };
  },
  spalted: () => {
    // pale wood crossed by thin meandering dark zone lines
    const a = [0, 1, 2].map((k) => periodicNoise(171 + k, 2 * 2 ** k));
    const b = [0, 1, 2].map((k) => periodicNoise(175 + k, 3 * 2 ** k));
    const grain = [0, 1].map((k) => periodicNoise(179 + k, 2 * 2 ** k));
    return (u, v) => {
      const lineA =
        1 - smooth(0.0012, 0.0035, Math.abs(fbm(a, u * 2, v * 2) - 0.45));
      const lineB =
        1 - smooth(0.001, 0.003, Math.abs(fbm(b, u * 3, v * 3) - 0.5));
      const g =
        Math.sin(2 * Math.PI * (v * 30 + fbm(grain, u * 2, v * 2) * 2)) * 0.12;
      return Math.max(-1, g - (lineA + lineB) * 1.2) + 0.1;
    };
  },
  quilt: () => {
    // billowy cells: periodic Worley distance, domain-warped
    const N = 12;
    const jitter = periodicNoise(71, N);
    const jitter2 = periodicNoise(72, N);
    const warp = [0, 1, 2].map((k) => periodicNoise(81 + k, 4 * 2 ** k));
    const warp2 = [0, 1, 2].map((k) => periodicNoise(91 + k, 4 * 2 ** k));
    return (u, v) => {
      const x = (u + (fbm(warp, u * 4, v * 4) - 0.45) * 0.12) * N;
      const y = (v + (fbm(warp2, u * 4, v * 4) - 0.45) * 0.12) * N;
      const ci = Math.floor(x);
      const cj = Math.floor(y);
      let d1 = 9;
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          const px = ci + di + jitter(ci + di + 0.5, cj + dj + 0.5);
          const py = cj + dj + jitter2(ci + di + 0.5, cj + dj + 0.5);
          d1 = Math.min(d1, Math.hypot(x - px, y - py));
        }
      }
      const blob = Math.max(0, 1 - d1 / 0.85);
      return (blob * blob * 2 - 0.6) * 0.6;
    };
  },
};

async function buildTop(def) {
  const T = def.size ?? 320;
  const figure = FIGURES[def.key]();
  const tile = { data: Buffer.alloc(T * T * 4), W: T, H: T };
  for (let y = 0; y < T; y++) {
    for (let x = 0; x < T; x++) {
      const val = Math.round(128 + figure(x / T, y / T) * 100);
      const o = (y * T + x) * 4;
      tile.data[o] =
        tile.data[o + 1] =
        tile.data[o + 2] =
          Math.max(0, Math.min(255, val));
      tile.data[o + 3] = 255;
    }
  }
  const file = path.join(OUT_DIR, "tops", `${def.key}.webp`);
  await writeWebp(tile, file, true);
  return {
    key: def.key,
    name: def.name,
    src: publicUrl(file),
    size: T,
    depth: def.depth,
  };
}

async function buildHead(def, src) {
  const { img, neck } = src;
  const x0 = neck.nut - 3;
  const box = bbox(img, (x) => x >= x0);
  const W = box.x1 - x0 + 1;
  const H = box.y1 - box.y0 + 1;
  const part = crop(img, x0, box.y0, W, H, (x) => (x >= x0 ? 1 : 0));
  const file = path.join(OUT_DIR, "heads", `${def.key}.webp`);
  await writeWebp(part, file);
  return {
    key: def.key,
    name: def.name,
    src: publicUrl(file),
    width: W,
    height: H,
    nutX: 3,
    axisY: +(neck.axis(neck.nut) - box.y0).toFixed(1),
    nutWidth: +neck.width(neck.nut).toFixed(1),
  };
}

/** Debug sheet: the band around each joint with ticks every 10 px (labels =
 *  px left of the joint) and the detected fretboard end in green. */
async function writeFretSheet(sources, dir) {
  const TW = 340;
  const TH = 120;
  const Z = 2;
  const tiles = [];
  for (const { id, img, neck, fretStart } of sources) {
    const J = neck.joint;
    const x0 = J - 300;
    const y0 = Math.round(neck.axis(J) - TH / 2);
    const part = crop(img, x0, y0, TW, TH);
    const marks = [];
    for (let r = 0; r <= 300; r += 10) {
      const x = J - r - x0;
      marks.push(
        `<line x1="${x}" x2="${x}" y1="0" y2="${r % 50 ? 4 : 9}" stroke="#ff0" stroke-width="0.5"/>`,
      );
      if (r % 50 === 0)
        marks.push(
          `<text x="${x}" y="16" font-size="7" fill="#ff0" text-anchor="middle">${r}</text>`,
        );
    }
    const fx = fretStart - x0;
    marks.push(
      `<line x1="${fx}" x2="${fx}" y1="20" y2="${TH}" stroke="#0f0" stroke-width="0.7"/>`,
    );
    marks.push(
      `<text x="3" y="${TH - 4}" font-size="8" fill="#fff">#${id} ext=${J - fretStart}</text>`,
    );
    const tile = await sharp({
      create: { width: TW, height: TH, channels: 4, background: "#3f3f46" },
    })
      .composite([
        { input: await sharp(part.data, rawInput(part)).png().toBuffer() },
        {
          input: Buffer.from(
            `<svg width="${TW}" height="${TH}">${marks.join("")}</svg>`,
          ),
        },
      ])
      .png()
      .toBuffer();
    tiles.push(
      await sharp(tile)
        .resize(TW * Z)
        .png()
        .toBuffer(),
    );
  }
  const cols = 2;
  await sharp({
    create: {
      width: TW * Z * cols,
      height: TH * Z * Math.ceil(tiles.length / cols),
      channels: 4,
      background: "#18181b",
    },
  })
    .composite(
      tiles.map((t, i) => ({
        input: t,
        left: (i % cols) * TW * Z,
        top: Math.floor(i / cols) * TH * Z,
      })),
    )
    .png()
    .toFile(path.join(dir, "fret-sheet.png"));
}

/** Debug sheet: each body with its pickup boxes (yellow, labelled) and the
 *  recoloured cover pixels tinted magenta, on a 50 px grid. */
async function writePickupSheet(dir) {
  const tiles = [];
  for (const { key, body, shapes, weight } of debugBodies) {
    const tinted = { data: Buffer.from(body.data), W: body.W, H: body.H };
    for (let i = 0; i < body.W * body.H; i++) {
      if (!weight[i]) continue;
      tinted.data[i * 4] = 255;
      tinted.data[i * 4 + 1] = Math.round(tinted.data[i * 4 + 1] * 0.3);
      tinted.data[i * 4 + 2] = 255;
    }
    const marks = [];
    for (let x = 0; x < body.W; x += 50)
      marks.push(
        `<line x1="${x}" x2="${x}" y1="0" y2="${body.H}" stroke="#ffffff22"/><text x="${x + 2}" y="12" font-size="10" fill="#ff0">${x}</text>`,
      );
    for (let y = 0; y < body.H; y += 50)
      marks.push(
        `<line x1="0" x2="${body.W}" y1="${y}" y2="${y}" stroke="#ffffff22"/><text x="2" y="${y + 12}" font-size="10" fill="#ff0">${y}</text>`,
      );
    shapes.forEach(([cx, cy, w, h], k) =>
      marks.push(
        `<text x="${cx - w / 2}" y="${cy - h / 2 - 4}" font-size="12" fill="#ff0">${k}</text>`,
      ),
    );
    marks.push(
      `<text x="6" y="${body.H - 8}" font-size="16" fill="#fff">${key}</text>`,
    );
    const tile = await sharp({
      create: {
        width: body.W,
        height: body.H,
        channels: 4,
        background: "#27272a",
      },
    })
      .composite([
        { input: await sharp(tinted.data, rawInput(tinted)).png().toBuffer() },
        {
          input: Buffer.from(
            `<svg width="${body.W}" height="${body.H}">${marks.join("")}</svg>`,
          ),
        },
      ])
      .png()
      .toBuffer();
    tiles.push({ key, tile });
  }
  for (const { key, tile } of tiles)
    await sharp(tile).toFile(path.join(dir, `pickups-${key}.png`));
}

/** Debug sheet: around each head source's nut, ticks every 10 px (labels =
 *  px from the detected nut), the nut in green. */
async function writeNutSheet(dir) {
  const ids = [...new Set([...HEADS, ...NECKS].map((h) => h.source))];
  const TW = 260;
  const TH = 140;
  const Z = 2;
  const tiles = [];
  for (const id of ids) {
    const { img, neck } = cache.get(id);
    const x0 = neck.nut - 170;
    const y0 = Math.round(neck.axis(neck.nut) - TH / 2);
    const part = crop(img, x0, y0, TW, TH);
    const marks = [];
    for (let r = -170; r <= 90; r += 10) {
      const x = r + 170;
      marks.push(
        `<line x1="${x}" x2="${x}" y1="0" y2="${r % 50 ? 4 : 9}" stroke="#ff0" stroke-width="0.5"/>`,
      );
      if (r % 50 === 0)
        marks.push(
          `<text x="${x}" y="16" font-size="7" fill="#ff0" text-anchor="middle">${r}</text>`,
        );
    }
    marks.push(
      `<line x1="170" x2="170" y1="20" y2="${TH}" stroke="#0f0" stroke-width="0.7"/>`,
    );
    marks.push(
      `<text x="3" y="${TH - 4}" font-size="8" fill="#fff">#${id}</text>`,
    );
    const tile = await sharp({
      create: { width: TW, height: TH, channels: 4, background: "#3f3f46" },
    })
      .composite([
        { input: await sharp(part.data, rawInput(part)).png().toBuffer() },
        {
          input: Buffer.from(
            `<svg width="${TW}" height="${TH}">${marks.join("")}</svg>`,
          ),
        },
      ])
      .png()
      .toBuffer();
    tiles.push(
      await sharp(tile)
        .resize(TW * Z)
        .png()
        .toBuffer(),
    );
  }
  const cols = 3;
  await sharp({
    create: {
      width: TW * Z * cols,
      height: TH * Z * Math.ceil(tiles.length / cols),
      channels: 4,
      background: "#18181b",
    },
  })
    .composite(
      tiles.map((t, i) => ({
        input: t,
        left: (i % cols) * TW * Z,
        top: Math.floor(i / cols) * TH * Z,
      })),
    )
    .png()
    .toFile(path.join(dir, "nut-sheet.png"));
}

// ---------------------------------------------------------------- main

const cache = new Map();
async function source(id) {
  if (!cache.has(id)) cache.set(id, await loadSource(id));
  return cache.get(id);
}

const manifest = {
  neckWidth: NECK_WIDTH,
  bodies: [],
  necks: [],
  heads: [],
  tops: [],
};
for (const def of BODIES) {
  const s = await source(def.source);
  manifest.bodies.push(await buildBody(def, s));
  console.log(
    "body",
    def.key,
    "joint",
    s.neck.joint,
    "fretStart",
    s.fretStart,
    "nut",
    s.neck.nut,
  );
}
for (const def of NECKS) {
  const s = await source(def.source);
  manifest.necks.push(await buildNeck(def, s));
  console.log(
    "neck",
    def.key,
    "len",
    s.neck.nut - s.neck.joint,
    "ext",
    s.neck.joint - s.fretStart,
  );
}
for (const def of TOPS) {
  const t = await buildTop(def);
  manifest.tops.push(t);
  console.log("top", def.key, "tile", t.size);
}
for (const def of HEADS) {
  const s = await source(def.source);
  manifest.heads.push(await buildHead(def, s));
  console.log("head", def.key);
}
if (DEBUG_DIR) {
  await writeFretSheet([...cache.values()], DEBUG_DIR);
  await writePickupSheet(DEBUG_DIR);
  await writeNutSheet(DEBUG_DIR);
}
fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log("wrote", MANIFEST);
