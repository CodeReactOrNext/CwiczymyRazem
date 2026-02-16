import { statisticsInitial } from "constants/userStatisticsInitialData";
import type { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import type { StatisticsDataInterface } from "types/api.types";
import { reportUpdateUserStats } from "utils/gameLogic/reportUpdateUserState";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getPointsToLvlUp } from "../getPointsToLvlUp";

describe("reportHandler", () => {
  const currentUserStats: StatisticsDataInterface = statisticsInitial;

  const updatedUserStats: StatisticsDataInterface = {
    ...statisticsInitial,
    currentLevelMaxPoints: getPointsToLvlUp(2),
    dayWithoutBreak: 1,
    lastReportDate: new Date(1998, 11, 19).toISOString(),
    actualDayWithoutBreak: 1,
    sessionCount: 1,
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
    avatarUrl: null,
  };
  const raitingData = {
    totalPoints: 0,
    reportDate: new Date(1998, 11, 19),
    bonusPoints: {
      streak: 1,
      multiplier: 0,
      habitsCount: 0,
      additionalPoints: 0,
      time: 0,
      timePoints: 0,
    },
  };

  const deafultExpectedDate = {
    currentUserStats: updatedUserStats,
    previousUserStats: currentUserStats,
    raitingData: raitingData,
    reportDate: new Date(1998, 11, 19),
    isDateBackReport: 0,
    timeSummary: {
      techniqueTime: 0,
      theoryTime: 0,
      hearingTime: 0,
      creativityTime: 0,
      sumTime: 0,
    },
    newAchievements: [],
    isNewLevel: false,
  };

  beforeEach(() => {
    const date = new Date(1998, 11, 19);
    vi.useFakeTimers();
    vi.setSystemTime(date);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should count session number, date, streak and not add nothing new if is not provided in InputData. ", () => {
    const result = reportUpdateUserStats({
      currentUserStats,
      inputData: emptyInputData,
      currentUserSongLists: {
        wantToLearn: [],
        learned: [],
        learning: [],
      }
    });
    expect(result.currentUserStats.actualDayWithoutBreak).toBe(1);
    expect(result.currentUserStats.dayWithoutBreak).toBe(1);
    expect(result.currentUserStats.sessionCount).toBe(1);
    expect(result.currentUserStats.lastReportDate).toBe(new Date(1998, 11, 19).toISOString());
    expect(result.currentUserStats.points).toBe(0);
    expect(result.currentUserStats.lvl).toBe(1);
    expect(result.isDateBackReport).toBe(0);
    expect(result.isNewLevel).toBe(false);
    expect(result.newAchievements).toEqual([]);
    expect(result.raitingData.totalPoints).toBe(0);
    expect(result.raitingData.bonusPoints.streak).toBe(1);
  });

  it("should return the correct updated statistics when the user adds a backdated report", () => {
    const inputData: ReportFormikInterface = {
      ...emptyInputData,
      countBackDays: 3,
    };
    const result = reportUpdateUserStats({
      currentUserStats,
      inputData,
      currentUserSongLists: {
        wantToLearn: [],
        learned: [],
        learning: [],
      }
    });

    // Back-dated reports should not create a streak record from a fresh account
    expect(result.currentUserStats.actualDayWithoutBreak).toBe(0);
    expect(result.currentUserStats.dayWithoutBreak).toBe(0);
    expect(result.currentUserStats.lastReportDate).toBe("");
    expect(result.isDateBackReport).toBe(3);
    expect(result.currentUserStats.sessionCount).toBe(1);
  });
});
