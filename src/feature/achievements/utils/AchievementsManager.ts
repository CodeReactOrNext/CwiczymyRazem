import { achievementsData } from "feature/achievements/data/achievementsData";
import type { AchievementContext } from "feature/achievements/types";

export class AchievementManager {
  static getNewlyEarned(ctx: AchievementContext) {
    return achievementsData
      .filter((def) => !ctx.statistics.achievements.includes(def.id))
      .filter((def) => def.check(ctx))
      .map((def) => def.id);
  }
}
