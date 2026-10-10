import type { SingleCoilShape } from "../types/guitarBuilder.types";

export type Hsl = [h: number, s: number, l: number];

/** Template px over which a burst fades from the edge into the finish. */
const BURST_WIDTH = 95;
const BURST_DEPTH = 0.88;
/** Fallback for a top that doesn't carry its own depth. */
const TOP_DEPTH = 0.13;
/** A colour burst blends finish → burst colour over this many px, then darkens. */
const BURST_COLOR_WIDTH = 150;

/**
 * How the paint itself behaves, on top of colour:
 * - gloss: the body's own shading and glare, as drawn
 * - satin: glare flattened out, a touch less saturated
 * - metallic: harder contrast, fine flake noise, highlights go silver
 * - sparkle: metallic plus coarse bright flakes
 * - pearl / chameleon: hue drifts with the light (a little / a lot)
 */
export type FinishStyle =
  | "gloss"
  | "satin"
  | "metallic"
  | "sparkle"
  | "pearl"
  | "chameleon";

/** Integer hash → 0..1, for per-pixel flake. */
function hash2(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const lerpHue = (a: number, b: number, t: number) => {
  let d = b - a;
  if (d > 0.5) d -= 1;
  if (d < -0.5) d += 1;
  return (((a + d * t) % 1) + 1) % 1;
};
/**
 * How a pickup cover takes its new colour.
 *
 * Metal (chrome, nickel, gold) is drawn off the cover's full shading,
 * normalised to its own light range (`CoverTone`) so a black plastic source
 * and a chrome one feed the same 0..1 ramp — strong contrast, glinting white.
 *
 * Plastic is drawn mostly off the fine detail (lightness minus its blur):
 * poles, strings and the moulded edge carry over, but a chrome source's broad
 * mirror reflections don't — those would read as white blotches on a red or
 * black plastic cover. Bright details go to silver: pole pieces are metal.
 */
const COVER_METAL = { contrast: 0.5, glintFrom: 0.82, glint: 0.45 };
const COVER_PLASTIC = {
  contrast: 0.12,
  detail: 1.1,
  glintFrom: 0.05,
  glintTo: 0.18,
  glint: 0.85,
  silver: 0.74,
};

export function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h / 6, s, l];
}

export function hexToHsl(hex: string): Hsl {
  const n = parseInt(hex.replace("#", ""), 16);
  return rgbToHsl((n >> 16) & 255, (n >> 8) & 255, n & 255);
}

function hueToChannel(p: number, q: number, t: number) {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

export function hslToRgb(
  h: number,
  s: number,
  l: number,
): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    hueToChannel(p, q, h + 1 / 3) * 255,
    hueToChannel(p, q, h) * 255,
    hueToChannel(p, q, h - 1 / 3) * 255,
  ];
}

/**
 * Moves the source's average lightness onto the target while keeping shading:
 * darker pixels scale toward black, brighter ones (gloss) toward white.
 */
export function remapLightness(l: number, sourceMean: number, target: number) {
  if (l <= sourceMean)
    return sourceMean > 0 ? (l / sourceMean) * target : target;
  return target + ((l - sourceMean) / (1 - sourceMean)) * (1 - target);
}

const smoothstep = (e0: number, e1: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export interface TopTexture {
  /** RGBA tile, grey value 128 = no figure */
  pixels: Uint8ClampedArray;
  size: number;
  /** Lightness swing at full tile value; defaults to TOP_DEPTH. */
  depth?: number;
}

export interface PaintOptions {
  /** Body image width — needed to tile the top texture. */
  width: number;
  finish: string | null;
  top: TopTexture | null;
  burst: boolean;
  /** Middle ring of a multi-tone burst (finish → this → dark edge). */
  burstColor?: string | null;
  style?: FinishStyle;
  pickguard: string | null;
  /** Pickup cover paint; needs `surface` (G = cover weight) and `pickupTone`. */
  pickups?: CoverPaint | null;
  surface?: Uint8ClampedArray | null;
  /** Single-coil covers to redraw (see shadeSingleCoilPixel). */
  singleCoils?: SingleCoilShape[] | null;
  finishL: number;
  pickguardL: number | null;
  pickupTone?: CoverTone | null;
}

export interface CoverPaint {
  color: string;
  metal: boolean;
}

/** Light range of a body's original covers (5th pct, median, 95th pct). */
export interface CoverTone {
  lo: number;
  mid: number;
  hi: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * One cover pixel of original lightness `l`, repainted. `detail` is the
 * pixel's lightness above (+) or below (−) its 2 px neighbourhood.
 */
/**
 * Single-coil covers are drawn fresh rather than recoloured. Recolouring the
 * source cover dragged its chrome reflections, pole rings and outline along,
 * and a pale colour came out as a see-through ghost cut into stripes. Here
 * each capsule gets its own domed shading in the set's colour, a crisp rim,
 * round silver pole pieces under the strings and the strings themselves.
 */
const SINGLE_PLASTIC = { dome: 0.12, streak: 0.3, rim: 0.5 };
const SINGLE_METAL = { dome: 0.3, streak: 0.5, rim: 0.35 };

export function shadeSingleCoilPixel(
  x: number,
  y: number,
  shape: SingleCoilShape,
  target: Hsl,
  metal: boolean,
): [number, number, number] | null {
  const t = (shape.lean * Math.PI) / 180;
  const dx = x - shape.cx;
  const dy = y - shape.cy;
  const across = dx * Math.cos(t) + dy * Math.sin(t);
  const along = dx * Math.sin(t) - dy * Math.cos(t);
  const hw = shape.w / 2;
  const hh = shape.h / 2;
  const qx = Math.abs(across) - (hw - shape.r);
  const qy = Math.abs(along) - (hh - shape.r);
  const dist =
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    shape.r;
  if (dist > 0.5) return null;
  const inset = -dist;
  const look = metal ? SINGLE_METAL : SINGLE_PLASTIC;

  const u = across / hw;
  let light = target[2] + (1 - u * u - 0.6) * look.dome;
  const streak = Math.exp(-(((u + 0.38) / 0.26) ** 2)) * look.streak;
  light += (1 - light) * streak;
  let sat = target[1] * (1 - streak * 0.7);
  // a crisp rim: pale covers get a darker edge so they don't melt into a white
  // guard, dark ones a lighter one so they don't vanish on a black guard
  const rim = 1 - smoothstep(0.4, 2.2, inset);
  light =
    light < 0.3
      ? light + (0.5 - light) * rim * 0.75
      : light + (light * (1 - look.rim) - light) * rim;
  if (metal) sat *= 0.9;
  let [r, g, b] = hslToRgb(target[0], clamp01(sat), clamp01(light));

  const mix = (v: number, k: number) => {
    const c = clamp01(v) * 255;
    r += (c - r) * k;
    g += (c - g) * k;
    b += (c - b) * k;
  };
  const poleR = Math.min(4.2, Math.max(2.5, shape.w * 0.12));
  for (const sy of shape.strings) {
    // pole piece on the cover's centre line, right under the string
    const px = shape.cx + (shape.cy - sy) * Math.tan(t);
    const d = Math.hypot(x - px, y - sy);
    const pole = clamp01(poleR + 0.5 - d);
    if (pole > 0) {
      const shine = (-(x - px) - (y - sy)) / (poleR * 1.4);
      mix(
        0.72 -
          (0.22 * d) / poleR +
          0.18 * shine -
          0.3 * smoothstep(poleR - 1.2, poleR, d),
        pole,
      );
    }
    // the string: a thin bright line with a soft shadow just under it
    const off = y - sy;
    const shadow =
      off > 0.8 && off < 2.6 ? 0.18 * (1 - Math.abs(off - 1.7) / 0.9) : 0;
    if (shadow > 0) mix(light * (1 - shadow * 2), shadow * 2);
    const str = clamp01(1.1 - Math.abs(off) * 1.1);
    if (str > 0) mix(0.86, str * 0.9);
  }
  return [r, g, b];
}

export function shadeCover(
  l: number,
  detail: number,
  tone: CoverTone,
  target: Hsl,
  metal: boolean,
): [number, number, number] {
  const span = Math.max(0.05, tone.hi - tone.lo);
  const mid = clamp01((tone.mid - tone.lo) / span);
  if (metal) {
    const t = clamp01((l - tone.lo) / span);
    const lightness = clamp01(target[2] + (t - mid) * COVER_METAL.contrast);
    const glint = smoothstep(COVER_METAL.glintFrom, 1, t) * COVER_METAL.glint;
    const [r, g, b] = hslToRgb(target[0], target[1] * (1 - glint), lightness);
    return [
      r + (255 - r) * glint,
      g + (255 - g) * glint,
      b + (255 - b) * glint,
    ];
  }
  const smooth = clamp01((l - detail - tone.lo) / span);
  const lightness = clamp01(
    target[2] +
      (smooth - mid) * COVER_PLASTIC.contrast +
      detail * COVER_PLASTIC.detail,
  );
  const glint =
    smoothstep(COVER_PLASTIC.glintFrom, COVER_PLASTIC.glintTo, detail) *
    COVER_PLASTIC.glint;
  const [r, g, b] = hslToRgb(target[0], target[1] * (1 - glint), lightness);
  const silver = COVER_PLASTIC.silver * 255;
  return [
    r + (silver - r) * glint,
    g + (silver - g) * glint,
    b + (silver - b) * glint,
  ];
}

interface FinishPixel {
  x: number;
  y: number;
  /** px to the body outline, capped at 255 */
  dist: number;
  /** 0..1 burst darkening toward the outline */
  edge: number;
  /** lightness offset from the figured top */
  figure: number;
}

/**
 * One finish pixel. `l` is the source lightness; `sourceMean` its average
 * over the original paint. Without a colour the original paint is kept and
 * only burst, figure and style are applied on top of it.
 */
export function shadeFinish(
  l: number,
  px: FinishPixel,
  finish: Hsl | null,
  burstColor: Hsl | null,
  style: FinishStyle,
  sourceMean: number,
  original: [number, number, number],
): [number, number, number] {
  let light = l;
  if (style === "satin" && light > sourceMean + 0.06) {
    light = sourceMean + 0.06 + (light - sourceMean - 0.06) * 0.3;
  }
  if (style === "metallic" || style === "sparkle") {
    light = sourceMean + (light - sourceMean) * 1.3;
    light += (hash2(px.x, px.y, 3) - 0.5) * 0.06;
  }

  let h: number;
  let s: number;
  let target: number;
  if (finish) {
    [h, s] = finish;
    target = remapLightness(clamp01(light), sourceMean, finish[2]);
  } else {
    [h, s] = rgbToHsl(...original);
    target = light;
  }
  target += px.figure;

  if (burstColor) {
    const mix = 1 - smoothstep(0, BURST_COLOR_WIDTH, px.dist);
    h = lerpHue(h, burstColor[0], mix);
    s += (burstColor[1] - s) * mix;
    target += (burstColor[2] - (finish?.[2] ?? sourceMean)) * mix;
  }
  target *= 1 - BURST_DEPTH * px.edge;
  // a burst also deepens the colour toward the edge, like a real stain
  s = Math.min(1, s + px.edge * 0.25 * (1 - s));

  if (style === "satin") s *= 0.92;
  if (style === "pearl" || style === "chameleon") {
    const shift = style === "pearl" ? 0.1 : 0.2;
    const rim = 1 - smoothstep(0, 220, px.dist);
    // drift toward the cool side (purple → teal, blue → aqua): the warm
    // way read as a rainbow
    h = (((h - ((l - sourceMean) * shift + rim * shift * 1.4)) % 1) + 1) % 1;
    if (style === "pearl") {
      s *= 0.8;
      target = target + (1 - target) * 0.12;
    }
  }
  if (style === "metallic" || style === "sparkle") {
    s *= 1 - smoothstep(0.7, 0.95, target) * 0.7;
  }
  if (style === "sparkle") {
    const cx = px.x >> 1;
    const cy = px.y >> 1;
    if (hash2(cx, cy, 11) > 0.955) {
      target += 0.22 + hash2(cx, cy, 12) * 0.3;
      s *= 0.55;
    }
  }
  return hslToRgb(h, clamp01(s), clamp01(target));
}

/** Repaints a body image in place, driven by its masks image (see BodyPart.maps). */
export function paintBody(
  pixels: Uint8ClampedArray,
  maps: Uint8ClampedArray,
  options: PaintOptions,
) {
  const finish = options.finish ? hexToHsl(options.finish) : null;
  const guard =
    options.pickguard && options.pickguardL !== null
      ? hexToHsl(options.pickguard)
      : null;
  const { top, width } = options;
  const burstColor = options.burstColor ? hexToHsl(options.burstColor) : null;
  const style = options.style ?? "gloss";
  const cover =
    options.pickups && options.surface && options.pickupTone
      ? {
          hsl: hexToHsl(options.pickups.color),
          metal: options.pickups.metal,
          map: options.surface,
          tone: options.pickupTone,
        }
      : null;
  if (
    !finish &&
    !guard &&
    !top &&
    !cover &&
    !options.burst &&
    style === "gloss"
  ) {
    return pixels;
  }

  for (let i = 0; i < pixels.length; i += 4) {
    const finishWeight = maps[i] / 255;
    const guardWeight = maps[i + 2] / 255;
    const coverWeight = cover ? cover.map[i + 1] / 255 : 0;
    if (finishWeight === 0 && guardWeight === 0 && coverWeight === 0) continue;

    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    let outR = r;
    let outG = g;
    let outB = b;

    let fr = r;
    let fg = g;
    let fb = b;
    if (finishWeight > 0) {
      const p = i / 4;
      const x = p % width;
      const y = (p - x) / width;
      const dist = maps[i + 1];
      const edge = options.burst ? 1 - smoothstep(0, BURST_WIDTH, dist) : 0;
      let figure = 0;
      if (top) {
        figure =
          ((top.pixels[((y % top.size) * top.size + (x % top.size)) * 4] -
            128) /
            128) *
          (top.depth ?? TOP_DEPTH);
      }
      [fr, fg, fb] = shadeFinish(
        rgbToHsl(r, g, b)[2],
        { x, y, dist, edge, figure },
        finish,
        burstColor,
        style,
        options.finishL,
        [r, g, b],
      );
      outR += (fr - outR) * finishWeight;
      outG += (fg - outG) * finishWeight;
      outB += (fb - outB) * finishWeight;
    }

    if (guard && guardWeight > 0 && options.pickguardL !== null) {
      // guards are flat sheets — shift, don't stretch, or a pale target washes
      // back to white wherever the original was brighter than its average
      const l = rgbToHsl(r, g, b)[2];
      const target = guard[2] + (l - options.pickguardL);
      const [gr, gg, gb] = hslToRgb(
        guard[0],
        guard[1],
        Math.min(1, Math.max(0, target)),
      );
      outR += (gr - outR) * guardWeight;
      outG += (gg - outG) * guardWeight;
      outB += (gb - outB) * guardWeight;
    }

    if (cover && coverWeight > 0) {
      const p = i / 4;
      const px = p % width;
      const py = (p - px) / width;
      let fresh: [number, number, number] | null = null;
      for (const shape of options.singleCoils ?? []) {
        fresh = shadeSingleCoilPixel(px, py, shape, cover.hsl, cover.metal);
        if (fresh) break;
      }
      const [cr, cg, cb] =
        fresh ??
        shadeCover(
          rgbToHsl(r, g, b)[2],
          (cover.map[i + 2] - 128) / 510,
          cover.tone,
          cover.hsl,
          cover.metal,
        );
      outR += (cr - outR) * coverWeight;
      outG += (cg - outG) * coverWeight;
      outB += (cb - outB) * coverWeight;
    }

    pixels[i] = outR;
    pixels[i + 1] = outG;
    pixels[i + 2] = outB;
  }
  return pixels;
}
