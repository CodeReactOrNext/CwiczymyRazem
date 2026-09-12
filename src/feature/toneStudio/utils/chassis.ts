import type { ToneAccent } from "feature/toneStudio/utils/chain";

/**
 * The materials Tone Studio's plugin window is built from.
 *
 * Tailwind classes cover flat surfaces, but a plugin chassis is lit, not
 * coloured: the body catches a light from above, the faceplate is a brushed
 * plate under it, and the selected module bleeds its accent onto that plate.
 * Those are gradients, so they live here as values rather than as three
 * copies of the same `style={{...}}` across the module panels.
 */

/** Accent in raw hex — knobs, LEDs and rings paint through inline styles and
 *  conic gradients, where a Tailwind colour class cannot reach. */
export const ACCENT_HEX: Record<ToneAccent, string> = {
  cyan: "#22d3ee",
  amber: "#fbbf24",
  emerald: "#34d399",
  orange: "#fb923c",
  purple: "#a855f7",
};

/** The plugin body — near-black, lit from above like a rack unit on a desk. */
export const CHASSIS_WASH =
  "radial-gradient(130% 100% at 50% -15%, #1c1c21 0%, #121215 45%, #070709 100%)";

/** The brushed plate the module's controls are bolted to. */
export const FACEPLATE_WASH =
  "linear-gradient(#1f1f24 0%, #17171b 45%, #0f0f12 100%)";

/** A darker plate for the rows that frame the faceplate (rack, status). */
export const RAIL_WASH =
  "linear-gradient(#141418 0%, #0e0e11 60%, #0a0a0c 100%)";

/** The selected module's light, spilling down over its faceplate. */
export const accentWash = (accent: ToneAccent) =>
  `radial-gradient(85% 130% at 50% 0%, ${ACCENT_HEX[accent]}22 0%, ${ACCENT_HEX[accent]}0a 35%, transparent 65%)`;

/** The soft halo a lit LED throws on the plate around it. */
export const ledGlow = (accent: ToneAccent) =>
  `0 0 6px ${ACCENT_HEX[accent]}, 0 0 14px ${ACCENT_HEX[accent]}66`;
