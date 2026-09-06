import type { CSSProperties } from "react";

/**
 * Turning an accent colour into the looks the other slots are made of.
 *
 * Everything here is an inline style rather than a Tailwind class, on purpose.
 * Eight accents times five banners is forty class strings that would have to
 * be written out in full for the JIT scanner to keep them — and then kept in
 * step by hand forever. One hex threaded through a gradient is the same move
 * `getChipCustomStyle` already makes for item rarities, and it means adding a
 * ninth colour is one line in the catalog rather than five new patterns.
 *
 * The banners are one gradient each, and a quiet one. A thin stripe at a
 * tenth of the colour's opacity reads as a ruled page on a dark card; a fat
 * glow at two-thirds reads as a stain; a spot reads as a lamp. What reads as
 * expensive on a near-black surface is restraint: the colour taken half-way
 * to grey, spread thin, and run in one direction across the whole strip. The
 * guild's icons, tiled over the top, do the rest.
 */

const HEX = /^#[0-9a-f]{6}$/i;

const GREY = "#a1a1aa";

const safe = (hex: string): string => (HEX.test(hex) ? hex : GREY);

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

const channels = (hex: string): [number, number, number] => {
  const base = safe(hex);
  return [1, 3, 5].map((at) => parseInt(base.slice(at, at + 2), 16)) as [
    number,
    number,
    number,
  ];
};

const toHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b]
    .map((channel) =>
      Math.round(Math.min(255, Math.max(0, channel)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

/**
 * The colour at an opacity, as an eight-digit hex.
 *
 * Falls back to a plain grey rather than emitting `undefinedcc`: these strings
 * go straight into `background-image`, where one malformed stop takes the whole
 * gradient down with it and the card loses its backdrop entirely.
 */
export const tint = (hex: string, alpha: number): string =>
  `${safe(hex)}${Math.round(clamp(alpha) * 255)
    .toString(16)
    .padStart(2, "0")}`;

/** The colour pulled towards white — what the icons are painted in. */
export const lighten = (hex: string, amount: number): string => {
  const t = clamp(amount);
  const [r, g, b] = channels(hex);
  return toHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
};

/**
 * The colour taken down towards its own grey: what a large area of it should
 * be, so that it sits on the card instead of shouting from it.
 */
export const mute = (hex: string, amount: number): string => {
  const t = clamp(amount);
  const [r, g, b] = channels(hex);
  const grey = 0.299 * r + 0.587 * g + 0.114 * b;
  return toHex(r + (grey - r) * t, g + (grey - g) * t, b + (grey - b) * t);
};

/**
 * The colour turned some way round the wheel: a neighbour that still reads as
 * the guild's. A grey has no hue to turn, and comes back as it went in.
 */
export const shiftHue = (hex: string, degrees: number): string => {
  const [r, g, b] = channels(hex).map((channel) => channel / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return safe(hex);

  const l = (max + min) / 2;
  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  const raw =
    max === r
      ? (g - b) / delta + (g < b ? 6 : 0)
      : max === g
        ? (b - r) / delta + 2
        : (r - g) / delta + 4;
  const h = (((raw * 60 + degrees) % 360) + 360) % 360;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];

  return toHex((r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255);
};

/**
 * A banner, as the strip across the top of a guild card is drawn: a ground,
 * and the gradients painted over it in order, each on a layer of its own.
 * The guild's icons go over all of it — the bare banner included — so the
 * strip is never blank.
 */
export interface BannerLook {
  base: CSSProperties;
  layers: CSSProperties[];
}

/** A shade darker than the card, so the colour has something to sit on. */
const GROUND: CSSProperties = { backgroundColor: "rgba(0, 0, 0, 0.12)" };

/** The strip across the top of a guild card, in the guild's colour. */
export const bannerLook = (bannerId: string, hex: string): BannerLook => {
  const H = safe(hex);
  // Nearly everything is painted in this: the colour, half-way to grey.
  const M = mute(H, 0.45);

  // Every lit banner is one gradient across the whole strip — no spots, no
  // lamps. They differ in the direction the colour runs and in what it runs
  // into: itself, the dark, or a neighbouring hue.
  switch (bannerId) {
    case "banner:wash":
      // Corner to corner: in from the top left, gone by the bottom right.
      return {
        base: GROUND,
        layers: [
          {
            backgroundImage: `linear-gradient(118deg, ${tint(M, 0.28)} 0%, ${tint(M, 0.1)} 50%, transparent 85%)`,
          },
        ],
      };

    case "banner:aurora": {
      // Left to right through the colour's two neighbours, kept close: a
      // third of the way round the wheel from orange is olive, and nobody
      // wants olive.
      const cool = mute(shiftHue(H, -26), 0.3);
      const warm = mute(shiftHue(H, 20), 0.3);
      return {
        base: GROUND,
        layers: [
          {
            backgroundImage: `linear-gradient(90deg, ${tint(cool, 0.26)}, ${tint(M, 0.24)} 50%, ${tint(warm, 0.24)})`,
          },
        ],
      };
    }

    case "banner:sunburst":
      // Top to bottom: nothing along the top edge, the colour gathering
      // towards the bottom, the way a burst finish goes from the binding in.
      return {
        base: GROUND,
        layers: [
          {
            backgroundImage: `linear-gradient(180deg, transparent 15%, ${tint(M, 0.1)} 55%, ${tint(H, 0.26)} 100%)`,
          },
        ],
      };

    case "banner:stage": {
      // Top right to bottom left, and from the colour into its cooler
      // neighbour on the way down — a sky going out.
      const cool = mute(shiftHue(H, -34), 0.25);
      return {
        base: GROUND,
        layers: [
          {
            backgroundImage: `linear-gradient(215deg, ${tint(M, 0.28)} 0%, ${tint(cool, 0.16)} 60%, transparent 100%)`,
          },
        ],
      };
    }

    case "banner:halo":
      // Left to right, out of nothing and into the colour along the right
      // edge — the left kept plain for the crest to sit in.
      return {
        base: GROUND,
        layers: [
          {
            backgroundImage: `linear-gradient(90deg, transparent 30%, ${tint(M, 0.14)} 60%, ${tint(H, 0.28)} 100%)`,
          },
        ],
      };

    default:
      // Bare, and anything the catalog does not know: a plain strip in no
      // colour at all. The icons still go across it, so it is bare, not blank.
      return {
        base: { backgroundColor: "rgba(255, 255, 255, 0.035)" },
        layers: [],
      };
  }
};

/**
 * How the tag is drawn.
 *
 * The ring is an inset box-shadow rather than a border, which keeps the badge
 * exactly the size it was — a real border would nudge every name on the
 * leaderboard sideways by two pixels the moment a guild bought one.
 */
export const frameStyle = (frameId: string, hex: string): CSSProperties => {
  const colour = safe(hex);

  switch (frameId) {
    case "frame:ring":
      return { color: colour, boxShadow: `inset 0 0 0 1px ${tint(hex, 0.45)}` };
    case "frame:double":
      // Two rings a pixel apart, the gap painted in the page's own black so
      // it reads as a gap whatever the badge is sitting on.
      return {
        color: colour,
        boxShadow: `inset 0 0 0 1px ${tint(hex, 0.6)}, inset 0 0 0 2px #09090b, inset 0 0 0 3px ${tint(hex, 0.4)}`,
      };
    case "frame:plate":
      return { color: colour, backgroundColor: tint(hex, 0.16) };
    case "frame:heavy":
      return {
        color: colour,
        backgroundColor: tint(hex, 0.18),
        boxShadow: `inset 0 0 0 1px ${tint(hex, 0.55)}`,
      };
    case "frame:solid":
      // The one frame where the letters are not the colour: a block of it
      // with the tag cut out in the page's black, the way the primary button
      // is drawn.
      return { color: "#09090b", backgroundColor: colour };
    case "frame:pill":
      return {
        color: colour,
        backgroundColor: tint(hex, 0.16),
        borderRadius: 9999,
      };
    case "frame:sunken":
      // Darker than any row it sits on, so it reads as a slot cut into the
      // row rather than a chip laid on it.
      return { color: colour, backgroundColor: "rgba(0, 0, 0, 0.45)" };
    case "frame:brackets":
      return {
        color: colour,
        backgroundColor: tint(hex, 0.08),
        boxShadow: `inset 2px 0 0 0 ${colour}, inset -2px 0 0 0 ${colour}`,
      };
    case "frame:dot":
      // The dot is painted into the background and the text pushed past it,
      // so the badge stays one span and one line of markup wherever it lands.
      return {
        color: colour,
        backgroundImage: `radial-gradient(circle at 7px 50%, ${colour} 0 2px, transparent 2.75px)`,
        paddingLeft: 14,
      };
    default:
      return { color: colour };
  }
};

/**
 * The crest's square, tinted to the guild rather than to "mine / not mine".
 *
 * The tint is a gradient layer rather than the background colour, so it lands
 * on top of whatever solid colour the crest's class gives it. The crest hangs
 * half over the banner, and a translucent square there would show the banner
 * straight through the guild's initials.
 */
export const crestStyle = (hex: string): CSSProperties => ({
  backgroundImage: `linear-gradient(${tint(hex, 0.18)}, ${tint(hex, 0.18)})`,
  color: safe(hex),
});
