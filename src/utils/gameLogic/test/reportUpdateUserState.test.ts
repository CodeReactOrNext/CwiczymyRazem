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
    expect(result.newRecords).toEqual({
      maxPoints: false,
      longestSession: false,
      maxStreak: true, // streak goes 0 → 1, which exceeds previous dayWithoutBreak of 0
      newLevel: false,
    });
  });

  it("should detect new records when user beats previous stats", () => {
    const statsWithHistory: StatisticsDataInterface = {
      ...statisticsInitial,
      maxPoints: 5,
      time: {
        technique: 0,
        theory: 0,
        hearing: 0,
        creativity: 0,
        longestSession: 60000, // 1 minute
      },
      dayWithoutBreak: 2,
      actualDayWithoutBreak: 2,
      lastReportDate: new Date(1998, 11, 18).toISOString(), // yesterday
    };

    const inputWithTime: ReportFormikInterface = {
      ...emptyInputData,
      techniqueHours: "1",
      techniqueMinutes: "30",
      habbits: ["exercise_plan", "warmup", "metronome"],
    };

    const result = reportUpdateUserStats({
      currentUserStats: statsWithHistory,
      inputData: inputWithTime,
      currentUserSongLists: {
        wantToLearn: [],
        learned: [],
        learning: [],
      }
    });

    // Session time is 90min = 5400000ms > longestSession 60000ms
    expect(result.newRecords.longestSession).toBe(true);
    // Points from 1.5h technique + 3 habits should exceed maxPoints of 5
    expect(result.newRecords.maxPoints).toBe(true);
    // Streak should go from 2 to 3, exceeding dayWithoutBreak of 2
    expect(result.newRecords.maxStreak).toBe(true);
  });

  it("should not detect records when user does not beat previous stats", () => {
    const statsWithHighRecords: StatisticsDataInterface = {
      ...statisticsInitial,
      maxPoints: 999,
      time: {
        technique: 0,
        theory: 0,
        hearing: 0,
        creativity: 0,
        longestSession: 999999999,
      },
      dayWithoutBreak: 999,
      lastReportDate: new Date(1998, 11, 18).toISOString(),
    };

    const result = reportUpdateUserStats({
      currentUserStats: statsWithHighRecords,
      inputData: emptyInputData,
      currentUserSongLists: {
        wantToLearn: [],
        learned: [],
        learning: [],
      }
    });

    expect(result.newRecords.maxPoints).toBe(false);
    expect(result.newRecords.longestSession).toBe(false);
    expect(result.newRecords.maxStreak).toBe(false);
    expect(result.newRecords.newLevel).toBe(false);
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
