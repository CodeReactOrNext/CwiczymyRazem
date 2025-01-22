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
    });
    expect(deafultExpectedDate).toStrictEqual(result);
  });

  it("should return the correct updated statistics when the user adds a backdated report", () => {
    const inputData: ReportFormikInterface = {
      ...emptyInputData,
      countBackDays: 3,
    };
    const expectedDate = {
      ...deafultExpectedDate,
      currentUserStats: {
        ...updatedUserStats,
        actualDayWithoutBreak: 0,
        lastReportDate: "",
      },
      reportDate: new Date(1998, 11, 16),
      isDateBackReport: 3,
    };

    const result = reportUpdateUserStats({
      currentUserStats,
      inputData,
    });
    expect(expectedDate).toStrictEqual(result);
  });
});
