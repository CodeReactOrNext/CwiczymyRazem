import type { AchievementList,AchievementsDataInterface} from "../types";
import { habitAchievements } from "./categories/habitAchievements";
import { rigAchievements } from "./categories/rigAchievements";
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
  ...rigAchievements,
];

export const achievementsMap = new Map<AchievementList, AchievementsDataInterface>(
  achievementsData.map((a) => [a.id, a])
);

