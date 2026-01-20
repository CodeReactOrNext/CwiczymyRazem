import type { AchievementList,AchievementsDataInterface} from "../types";
import { habitAchievements } from "./categories/habitAchievements";
import { songAchievements } from "./categories/songAchievements";
import { specialAchievements } from "./categories/specialAchievements";
import { statAchievements } from "./categories/statAchievements";
import { timeAchievements } from "./categories/timeAchievements";

export const achievementsData: AchievementsDataInterface[] = [
  ...statAchievements,
  ...timeAchievements,
  ...songAchievements,
  ...specialAchievements,
  ...habitAchievements,
];

export const achievementsMap = new Map<AchievementList, AchievementsDataInterface>(
  achievementsData.map((a) => [a.id, a])
);

export const achievementsCounts = {
  common: achievementsData.filter((a) => a.rarity === "common").length,
  rare: achievementsData.filter((a) => a.rarity === "rare").length,
  veryRare: achievementsData.filter((a) => a.rarity === "veryRare").length,
  epic: achievementsData.filter((a) => a.rarity === "epic").length,
};
