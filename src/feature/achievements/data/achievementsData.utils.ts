import type { IconType } from "react-icons/lib";

import type { AchievementCheck, AchievementList, AchievementsDataInterface } from "../types";

/**
 * A definition as its category file writes it. The `category` itself is stamped
 * on in `achievementsData`, where the files are combined — that is the one place
 * that knows which file a definition came from.
 */
export type AchievementDraft = Omit<AchievementsDataInterface, "category">;

export const achivFactor = (
  id: AchievementList,
  Icon: IconType,
  rarity: "common" | "rare" | "veryRare" | "epic",
  check: AchievementCheck,
  getProgress?: (ctx: any) => { current: number; max: number }
): AchievementDraft => ({
  id,
  Icon,
  rarity,
  name: `${id}.title` as any,
  description: `${id}.description` as any,
  check,
  getProgress,
});
