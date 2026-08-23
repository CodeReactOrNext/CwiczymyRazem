export type EffectImageSize = "small" | "medium" | "full";

/**
 * Pedal art (`/static/images/effects/`) ships in three sizes. `full` keeps the
 * original pixels — the pedalboard places pedals against their intrinsic size,
 * so the board and its read-only twin on a profile always ask for that one.
 * Everything else (cards, tiles, logs) renders far smaller and takes a variant.
 */
export const getEffectImageSrc = (
  imageId: string | number,
  size: EffectImageSize = "medium",
) => {
  const suffix = size === "full" ? "" : `-${size}`;
  return `/static/images/effects/${imageId}${suffix}.webp`;
};
