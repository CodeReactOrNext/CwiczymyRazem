import {
  CUSTOM_IMAGE_PREFIX,
  customGuitarImageSrc,
} from "feature/guitarBuilder/utils/customGuitar";

export type RankBadgeSize = "small" | "medium" | "large";

/**
 * Rank badge images (guitars in `/static/images/rank/special/`) ship in three
 * sizes. Non-special images (plain level badges under `/static/images/rank/`)
 * only exist in one size, so the size suffix is skipped for those.
 */
/**
 * Whether an image id is a guitar (a case model or a Builder build) rather than
 * a plain level badge — what avatars and profile banners decide what to hang by.
 */
export const isGuitarImageId = (imageId: unknown): imageId is string =>
  typeof imageId === "string" &&
  (imageId.includes("special/") || imageId.startsWith(CUSTOM_IMAGE_PREFIX));

export const getRankBadgeSrc = (imageId: string | number, size: RankBadgeSize = "small") => {
  // A Guitar Builder build: one render in Storage, used at every size.
  if (typeof imageId === "string" && imageId.startsWith(CUSTOM_IMAGE_PREFIX)) {
    // custom/<rarity>/<token> — the token is the last segment
    return customGuitarImageSrc(imageId.split("/").pop() ?? "");
  }
  const isSpecialGuitar = typeof imageId === "string" && imageId.includes("special/");
  const suffix = isSpecialGuitar && size !== "large" ? `-${size}` : "";
  return `/static/images/rank/${imageId}${suffix}.webp`;
};
