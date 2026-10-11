import {
  CUSTOM_IMAGE_PREFIX,
  customGuitarImageSrc,
} from "feature/guitarBuilder/utils/customGuitar";

export type RankBadgeSize = "small" | "medium" | "large";

/**
 * Whether an image id is a guitar (a case model or a Builder build) — what
 * profile banners decide what to hang by.
 */
export const isGuitarImageId = (imageId: unknown): imageId is string =>
  typeof imageId === "string" &&
  (imageId.includes("special/") || imageId.startsWith(CUSTOM_IMAGE_PREFIX));

/** Case guitars (`/static/images/rank/special/`) ship in three sizes. */
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
