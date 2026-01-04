import type { IconType } from "react-icons/lib";
import type { AchievementCheck, AchievementList, AchievementsDataInterface } from "../types";

export const achivFactor = (
  id: AchievementList,
  Icon: IconType,
  rarity: "common" | "rare" | "veryRare" | "epic",
  check: AchievementCheck
): AchievementsDataInterface => ({
  id,
  Icon,
  rarity,
  name: `${id}.title` as any,
  description: `${id}.description` as any,
  check,
});
