import type { AchievementCategory,AchievementList,AchievementsDataInterface} from "../types";
import type { AchievementDraft } from "./achievementsData.utils";
import { habitAchievements } from "./categories/habitAchievements";
import { rigAchievements } from "./categories/rigAchievements";
import { songAchievements } from "./categories/songAchievements";
import { specialAchievements } from "./categories/specialAchievements";
import { statAchievements } from "./categories/statAchievements";
import { timeAchievements } from "./categories/timeAchievements";

/**
 * A category file is the category, so it is stamped here rather than repeated on
 * all 77 definitions. Typed on `AchievementCategory`, so a new category file
 * cannot be registered without naming itself.
 */
const withCategory = (
  category: AchievementCategory,
  drafts: AchievementDraft[]
): AchievementsDataInterface[] => drafts.map((draft) => ({ ...draft, category }));

export const achievementsData: AchievementsDataInterface[] = [
  ...withCategory("stat", statAchievements),
  ...withCategory("time", timeAchievements),
  ...withCategory("song", songAchievements),
  ...withCategory("special", specialAchievements),
  ...withCategory("habit", habitAchievements),
  ...withCategory("rig", rigAchievements),
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
