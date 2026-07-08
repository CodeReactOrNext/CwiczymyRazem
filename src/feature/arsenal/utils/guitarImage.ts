export type RankBadgeSize = "small" | "medium" | "large";

/**
 * Rank badge images (guitars in `/static/images/rank/special/`) ship in three
 * sizes. Non-special images (plain level badges under `/static/images/rank/`)
 * only exist in one size, so the size suffix is skipped for those.
 */
export const getRankBadgeSrc = (imageId: string | number, size: RankBadgeSize = "small") => {
  const isSpecialGuitar = typeof imageId === "string" && imageId.includes("special/");
  const suffix = isSpecialGuitar && size !== "large" ? `-${size}` : "";
  return `/static/images/rank/${imageId}${suffix}.webp`;
};
