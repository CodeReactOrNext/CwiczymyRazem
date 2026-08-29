import type { CSSProperties } from "react";

/**
 * Turning an accent colour into the looks the other two slots are made of.
 *
 * Everything here is an inline style rather than a Tailwind class, on purpose.
 * Eight accents times six banners is forty-eight class strings that would have
 * to be written out in full for the JIT scanner to keep them — and then kept in
 * step by hand forever. One hex threaded through a gradient is the same move
 * `getChipCustomStyle` already makes for item rarities, and it means adding a
 * ninth colour is one line in the catalog rather than six new patterns.
 */

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * The colour at an opacity, as an eight-digit hex.
 *
 * Falls back to a plain grey rather than emitting `undefinedcc`: these strings
 * go straight into `background-image`, where one malformed stop takes the whole
 * gradient down with it and the card loses its backdrop entirely.
 */
export const tint = (hex: string, alpha: number): string => {
  const base = HEX.test(hex) ? hex : "#a1a1aa";
  const clamped = Math.min(1, Math.max(0, alpha));
  return `${base}${Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0")}`;
};

/** The backdrop for a guild card, or nothing at all for the bare one. */
export const bannerStyle = (
  bannerId: string,
  hex: string,
): CSSProperties | undefined => {
  switch (bannerId) {
    case "banner:wash":
      return {
        backgroundImage: `radial-gradient(120% 120% at 10% 0%, ${tint(hex, 0.14)}, transparent 62%)`,
      };
    case "banner:strings":
      return {
        backgroundImage: `repeating-linear-gradient(180deg, ${tint(hex, 0.16)} 0 1px, transparent 1px 16px)`,
      };
    case "banner:frets":
      return {
        backgroundImage: `repeating-linear-gradient(90deg, ${tint(hex, 0.14)} 0 2px, transparent 2px 34px)`,
      };
    case "banner:stack":
      return {
        backgroundImage: `repeating-linear-gradient(135deg, ${tint(hex, 0.1)} 0 6px, transparent 6px 18px)`,
      };
    case "banner:halo":
      return {
        backgroundImage: [
          `radial-gradient(90% 140% at 85% 0%, ${tint(hex, 0.22)}, transparent 65%)`,
          `radial-gradient(70% 120% at 0% 100%, ${tint(hex, 0.12)}, transparent 60%)`,
        ].join(", "),
      };
    default:
      return undefined;
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
  const colour = HEX.test(hex) ? hex : "#a1a1aa";

  switch (frameId) {
    case "frame:ring":
      return { color: colour, boxShadow: `inset 0 0 0 1px ${tint(hex, 0.45)}` };
    case "frame:plate":
      return { color: colour, backgroundColor: tint(hex, 0.16) };
    case "frame:heavy":
      return {
        color: colour,
        backgroundColor: tint(hex, 0.18),
        boxShadow: `inset 0 0 0 1px ${tint(hex, 0.55)}`,
      };
    default:
      return { color: colour };
  }
};

/** The crest's square, tinted to the guild rather than to "mine / not mine". */
export const crestStyle = (hex: string): CSSProperties => ({
  backgroundColor: tint(hex, 0.15),
  color: HEX.test(hex) ? hex : "#a1a1aa",
});
