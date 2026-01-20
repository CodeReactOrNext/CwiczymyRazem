import type { IconType } from "react-icons/lib";

import type { AchievementCheck, AchievementList, AchievementsDataInterface } from "../types";

export const achivFactor = (
  id: AchievementList,
  Icon: IconType,
  rarity: "common" | "rare" | "veryRare" | "epic",
  check: AchievementCheck,
  getProgress?: (ctx: any) => { current: number; max: number }
): AchievementsDataInterface => ({
  id,
  Icon,
  rarity,
  name: `${id}.title` as any,
  description: `${id}.description` as any,
  check,
  getProgress,
});
