import { statisticsInitial } from "constants/userStatisticsInitialData";
import {
  ReportDataInterface,
  ReportFormikInterface,
} from "feature/user/view/ReportView/ReportView.types";
import { StatisticsDataInterface } from "types/api.types";
import { describe, expect, it } from "vitest";
import { checkAchievement } from "../checkAchievement";

describe("checkAchievement", () => {
  const emptyReportData: ReportDataInterface = {
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
  const emptyInputData: ReportFormikInterface = {
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

  it("returns the empty array (don' give you any achievements) if you have empty stats", () => {
    const statistics = statisticsInitial;
    const achievement = checkAchievement(
      statistics,
      emptyReportData,
      emptyInputData
    );

    expect(achievement).toEqual([]);
  });

  it("returns achievements id's in array  if you meet the conditions ", () => {
    const statistics: StatisticsDataInterface = {
      ...statisticsInitial,
      points: 10000,
    };
    const achievement = checkAchievement(
      statistics,
      emptyReportData,
      emptyInputData
    );

    expect(achievement).toEqual(["points_1", "points_2", "points_3"]);
  });

  it("returns only id's achievements that you don't own ", () => {
    const statistics: StatisticsDataInterface = {
      ...statisticsInitial,
      points: 10000,
      achievements: ["points_1", "points_2"],
    };
    const achievement = checkAchievement(
      statistics,
      emptyReportData,
      emptyInputData
    );

    expect(achievement).toEqual(["points_3"]);
  });
});
