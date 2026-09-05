import { achievementsData } from "feature/achievements/data/achievementsData";
import type { AchievementContext, AchievementList } from "feature/achievements/types";

export class AchievementManager {
  /**
   * Meta achievements (`medal`) count the badges the user already owns, so a
   * badge unlocked in this very report can be what pushes them over the line.
   * A single pass evaluated everything against the pre-report list and left
   * those a whole session behind, so the registry is re-run until a pass adds
   * nothing new.
   */
  static getNewlyEarned(ctx: AchievementContext): AchievementList[] {
    const earned = new Set<AchievementList>(ctx.statistics.achievements);
    const newlyEarned: AchievementList[] = [];

    let foundInPass = true;
    while (foundInPass) {
      foundInPass = false;
      const passCtx: AchievementContext = {
        ...ctx,
        statistics: { ...ctx.statistics, achievements: [...earned] },
      };

      for (const def of achievementsData) {
        if (earned.has(def.id) || !def.check(passCtx)) continue;
        earned.add(def.id);
        newlyEarned.push(def.id);
        foundInPass = true;
      }
    }

    return newlyEarned;
  }
}
