import { statisticsInitial } from "constants/userStatisticsInitialData";
import {
  ReportDataInterface,
  ReportFormikInterface,
} from "feature/user/view/ReportView/ReportView.types";
import { StatisticsDataInterface } from "types/api.types";
import { describe, expect, it } from "vitest";
import { checkAchievement } from "../checkAchievement";

describe("checkAchievement", () => {
  it("returns the empty array (don' give you any achievements) if you have empty stats", () => {
    const statistics = statisticsInitial;
    const reportData: ReportDataInterface = {
      reportDate: new Date(),
      totalPoints: 0,
      bonusPoints: {
        multiplier: 0,
        habitsCount: 0,
        additionalPoints: 0,
        time: 0,
        timePoints: 0,
      },
    };
    const inputData: ReportFormikInterface = {
      techniqueHours: "0",
      techniqueMinutes: " 0",
      theoryHours: "0",
      theoryMinutes: "0",
      hearingHours: "0",
      hearingMinutes: "0",
      creativityHours: "0",
      creativityMinutes: "0",
      countBackDays: 0,
      reportTitle: "0",
      habbits: [],
    };

    const achievement = checkAchievement(statistics, reportData, inputData);
    expect(achievement).toEqual([]);
  });

  it("returns same achievements if you don't make any progress ", () => {
    const statistics: StatisticsDataInterface = {
      ...statisticsInitial,
      achievements: ["event", "artist", "doctor"],
    };

    const reportData: ReportDataInterface = {
      reportDate: new Date(),
      totalPoints: 0,
      bonusPoints: {
        multiplier: 0,
        habitsCount: 0,
        additionalPoints: 0,
        time: 0,
        timePoints: 0,
      },
    };
    const inputData: ReportFormikInterface = {
      techniqueHours: "0",
      techniqueMinutes: " 0",
      theoryHours: "0",
      theoryMinutes: "0",
      hearingHours: "0",
      hearingMinutes: "0",
      creativityHours: "0",
      creativityMinutes: "0",
      countBackDays: 0,
      reportTitle: "0",
      habbits: [],
    };

    const achievement = checkAchievement(statistics, reportData, inputData);
    expect(achievement).toEqual(["event", "artist", "doctor"]);
  });
});
