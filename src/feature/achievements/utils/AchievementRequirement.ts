import { AchievementCheck } from "feature/achievements/types";
import { HabbitsType } from "feature/user/view/ReportView/ReportView.types";
import type { SongListInterface } from "src/pages/api/user/report";
import type { StatisticsDataInterface, StatisticsTime } from "types/api.types";

export class AchievementRequirement {
  static songCount = (listName: keyof SongListInterface, min: number): AchievementCheck =>
    (ctx) => ctx.songLists[listName].length >= min;

  static statThreshold = (path: keyof StatisticsDataInterface, min: number): AchievementCheck =>
    (ctx) => {
      const value = ctx.statistics[path];
      if (typeof value === "number") {
        return value >= min;
      }
      return false;
    };

  static statTimeThreshold = (path: keyof StatisticsTime, min: number): AchievementCheck =>
    (ctx) => ctx.statistics.time[path] >= min;

  static totalTimeThreshold = (minMs: number): AchievementCheck =>
    (ctx) => {
      const { time } = ctx.statistics;
      const total = time.technique + time.theory + time.hearing + time.creativity;
      return total >= minMs;
    };

  static habitPresent = (habit: HabbitsType): AchievementCheck =>
    (ctx) => ctx.inputData.habbits.includes(habit);
}
