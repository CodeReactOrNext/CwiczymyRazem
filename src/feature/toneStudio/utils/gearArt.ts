/**
 * The rendered gear Tone Studio is built on, and the measurements that let the
 * UI sit on top of it.
 *
 * Each render was commissioned with its control surfaces left deliberately
 * bare, so the knobs you can actually turn are ours rather than painted on.
 * That only works if the code knows exactly where the bare surface is — and a
 * number eyeballed off a screenshot drifts the moment anyone re-exports the
 * art. Every fraction below was measured out of the file itself (luminance and
 * surface roughness for the amp's panel, the red channel's centroid for the
 * pedal's lamp), so re-measuring is a script away rather than a guess.
 *
 * All fractions are of the image's own width/height, so they survive any
 * display size.
 */

const BASE = "/static/images/tone-studio";

export const AMP_HEAD_SRC = `${BASE}/amp-head.webp`;
export const CABINET_SRC = `${BASE}/cabinet.webp`;
export const KNOB_SRC = `${BASE}/knob.webp`;
export const GATE_PEDAL_SRC = `${BASE}/pedal-gate.webp`;

/** Natural size of the amp head render — drives the height the plate reserves
 *  before the image has loaded, so nothing jumps. */
export const AMP_HEAD_ASPECT = 2048 / 768;

/**
 * The blank brushed strip across the amp's face, as fractions of the render.
 * Found by surface roughness: the tolex and the grille cloth are noisy, the
 * machined panel is not (roughness ~2.5 against ~18 for the covering).
 */
export const AMP_PANEL = {
  left: 0.032,
  top: 0.212,
  width: 0.936,
  height: 0.397,
} as const;

/**
 * The speaker-grille band under the amp's panel, found the same way: the cloth
 * is both dark and finely woven, so it reads as low mean luminance with high
 * roughness, unlike the smooth panel above or the pebbled tolex around it.
 * This is where the valves are lit from behind.
 */
export const AMP_GRILLE = {
  left: 0.032,
  top: 0.628,
  width: 0.936,
  height: 0.281,
} as const;

export const CABINET_ASPECT = 1;

export const OVERDRIVE_PEDAL_SRC = `${BASE}/pedal-overdrive.webp`;
export const DELAY_PEDAL_SRC = `${BASE}/pedal-delay.webp`;

/**
 * The three stompboxes were commissioned as one product line: one base render
 * (the overdrive), the other two made as edits of it that change only the
 * finish and the engraved word — and for the gate, remove the knobs. They
 * measure that way too: silhouettes and knob positions identical to the pixel
 * across all three, so one set of fractions drives them all.
 *
 * Unlike the amp, the pedals are rendered WITH their knobs on. The caps are
 * blank — no pointer, no scale — so the only things the UI has to draw are the
 * pointer and the value arc, on top of a knob that was lit by the same lamp as
 * the enclosure it stands on. (The first set had bare panels with a separate
 * knob render pasted on, and no amount of shading in code made two renders
 * with two cameras and two lights look like one object.)
 *
 * The overdrive and delay come from 1600x2400 PNGs with a real alpha channel,
 * cropped to the silhouette plus a 31px margin (98,37 1404x2304). The gate is
 * still the first-round file, whose generator had baked its checkerboard into
 * the pixels and had to be keyed by hand at 1024x1536; it was cropped the same
 * way, so its proportions match the other two to within a tenth of a percent.
 */
export const PEDAL_ASPECT = 1404 / 2304;

/**
 * Where the three knob caps stand, from the cream pixels' centroids and
 * bounding boxes. The camera sits a hair above straight-down, so the cap's
 * flat top is a slight ellipse (132 by 104 source px) with the fluted side wall
 * showing beneath it — `faceAspect` is that squash, and the pointer and arc are
 * drawn in the face's own plane so they sit on the cap rather than float over
 * it. `diameter` is the face's width as a fraction of the image width.
 */
export const PEDAL_KNOBS = {
  cx: [0.2517, 0.4972, 0.7439],
  cy: 0.2114,
  diameter: 0.149,
  faceAspect: 0.79,
} as const;

/**
 * The jewel lamp, from the red channel's centroid (measured on the blue
 * enclosure, where red is unmistakable). It is painted unlit, dark red glass in
 * a brass bezel, so engaging a pedal means lighting it from above.
 */
export const PEDAL_LED = {
  cx: 0.5007,
  cy: 0.625,
  diameter: 0.0711,
} as const;

/**
 * The footswitch, and the only part of a pedal that switches it. The chrome
 * button and its nut span 38.6-61.4% across and 67.8-81.8% down; this is that
 * rectangle with a little padding, because a footswitch is something you stamp
 * on rather than aim at.
 */
export const PEDAL_FOOTSWITCH = {
  left: 0.37,
  top: 0.665,
  width: 0.26,
  height: 0.165,
} as const;

/**
 * How much of the knob render's frame the cap actually fills (1138px of 1254).
 * The Knob component scales the render up by this so that the cap's painted
 * edge lands exactly on the knob's nominal diameter, and its lighting (drawn
 * in code, never rotated) can be fitted to that edge.
 *
 * The render is deliberately collarless and lit flat on its own axis — a turned
 * image is only convincing when everything but the pointer is rotationally
 * symmetric. The first attempt had a directional key light (a 188-of-255
 * brightness gradient across the face) and a cap sitting off-centre inside a
 * brass collar, so turning it swung a highlight around the dial and pumped the
 * collar's width between 0 and 59px. This one measures 5-8 of 255 across the
 * face and 1.2% out of round. The directional light it needs to look solid is
 * laid over it as a static layer instead (see Knob.tsx).
 */
export const KNOB_CAP_FRACTION = 1138 / 1254;

/** The knob render's pointer is drawn straight up, so the rotation the UI wants
 *  is the dial angle itself with no offset. */
export const KNOB_POINTER_AT_ZERO_DEG = 0;
