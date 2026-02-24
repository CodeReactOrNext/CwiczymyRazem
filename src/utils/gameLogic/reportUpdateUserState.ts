import type { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import type { SongListInterface } from "src/pages/api/user/report";
import type { StatisticsDataInterface } from "types/api.types";
import { getDateFromPast, inputTimeConverter } from "utils/converter";

import {
  AchievementManager,
  checkIsPracticeToday,
  getPointsToLvlUp,
  getUpdatedActualDayWithoutBreak,
  levelUpUser,
  makeRatingData,
} from "./index";

interface updateUserStatsProps {
  currentUserStats: StatisticsDataInterface;
  inputData: ReportFormikInterface;
  currentUserSongLists: SongListInterface;
}
export const reportUpdateUserStats = ({
  currentUserStats,
  inputData,
  currentUserSongLists
}: updateUserStatsProps) => {
  const clientToday = inputData.clientTodayISO ? new Date(inputData.clientTodayISO) : new Date();
  const {
    time = { technique: 0, theory: 0, hearing: 0, creativity: 0, longestSession: 0 },
    habitsCount = 0,
    maxPoints = 0,
    sessionCount = 0,
    points = 0,
    lvl = 1,
    lastReportDate = clientToday.toISOString(),
    actualDayWithoutBreak = 0,
    dayWithoutBreak = 0,
    achievements = [],
  } = currentUserStats || {};
  const isDateBackReport = inputData.countBackDays;
  const timeSummary = inputTimeConverter(inputData);
  const userLastReportDate = new Date(lastReportDate!);
  const {
    techniqueTime = 0,
    theoryTime = 0,
    hearingTime = 0,
    creativityTime = 0,
    sumTime = 0
  } = timeSummary || {};
  const didPracticeToday = isDateBackReport
    ? false
    : checkIsPracticeToday(userLastReportDate, clientToday);

  const updatedActualDayWithoutBreak = getUpdatedActualDayWithoutBreak(
    actualDayWithoutBreak,
    userLastReportDate,
    didPracticeToday,
    clientToday
  );

  // Handle back-dated reports: update streak and lastReportDate when appropriate
  let backDateStreak = actualDayWithoutBreak;
  let backDateLastReport = lastReportDate!;

  if (isDateBackReport) {
    const reportDate = getDateFromPast(isDateBackReport, clientToday);
    const lastReport = new Date(lastReportDate!);

    // Calculate the day just before the current streak started
    const streakStart = new Date(lastReport);
    streakStart.setDate(streakStart.getDate() - (actualDayWithoutBreak - 1));
    const dayBeforeStreak = new Date(streakStart);
    dayBeforeStreak.setDate(dayBeforeStreak.getDate() - 1);

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    const dayAfterLastReport = new Date(lastReport);
    dayAfterLastReport.setDate(dayAfterLastReport.getDate() + 1);

    if (isSameDay(reportDate, dayBeforeStreak) || isSameDay(reportDate, dayAfterLastReport)) {
      backDateStreak = actualDayWithoutBreak + 1;
    }

    // Update lastReportDate if the back-dated report is more recent
    if (reportDate.getTime() > lastReport.getTime()) {
      backDateLastReport = reportDate.toISOString();
    }
  }

  const finalStreak = isDateBackReport ? backDateStreak : updatedActualDayWithoutBreak;

  const raiting = {
    ...(isDateBackReport
      ? makeRatingData(inputData, sumTime, 1)
      : makeRatingData(inputData, sumTime, updatedActualDayWithoutBreak)),
  };
  const updatedLevel = levelUpUser(lvl, points + raiting.totalPoints);
  const isNewLevel = updatedLevel > lvl;

  const updatedUserData: StatisticsDataInterface = {
    ...currentUserStats,
    time: {
      technique: time.technique + techniqueTime,
      theory: time.theory + theoryTime,
      hearing: time.hearing + hearingTime,
      creativity: time.creativity + creativityTime,
      longestSession: time.longestSession < sumTime ? sumTime : time.longestSession,
    },
    skills: {
      ...currentUserStats.skills,
      unlockedSkills: {
        ...(currentUserStats.skills?.unlockedSkills || {}),
        ...(inputData.skillPointsGained ? Object.entries(inputData.skillPointsGained).reduce((acc, [skillId, pointsGained]) => {
          const currentPoints = (currentUserStats.skills?.unlockedSkills?.[skillId] || 0);
          acc[skillId] = currentPoints + pointsGained;
          return acc;
        }, {} as Record<string, number>) : {})
      }
    },
    points: points + raiting.totalPoints,
    lvl: updatedLevel,
    currentLevelMaxPoints: getPointsToLvlUp(updatedLevel + 1),
    sessionCount: didPracticeToday ? sessionCount : sessionCount + 1,
    habitsCount: habitsCount + raiting.bonusPoints.habitsCount,
    dayWithoutBreak: dayWithoutBreak < finalStreak
      ? finalStreak
      : dayWithoutBreak,
    maxPoints: maxPoints < raiting.totalPoints ? raiting.totalPoints : maxPoints,
    actualDayWithoutBreak: finalStreak,
    achievements: achievements,
    lastReportDate: isDateBackReport
      ? backDateLastReport
      : clientToday.toISOString(),
    guitarStartDate: null
  };

  const newAchievements = AchievementManager.getNewlyEarned({
    statistics: updatedUserData,
    sessionResults: raiting,
    inputData,
    songLists: currentUserSongLists
  });
  const updatedUserDataWithAchievements: StatisticsDataInterface = {
    ...updatedUserData,
    achievements: [...newAchievements, ...updatedUserData.achievements],
  };
  const dateToReport = isDateBackReport
    ? getDateFromPast(isDateBackReport)
    : new Date();

  const newRecords = {
    maxPoints: raiting.totalPoints > maxPoints,
    longestSession: sumTime > time.longestSession,
    maxStreak: finalStreak > dayWithoutBreak,
    newLevel: isNewLevel,
  };

  return {
    currentUserStats: updatedUserDataWithAchievements,
    previousUserStats: currentUserStats,
    raitingData: raiting,
    reportDate: dateToReport,
    isDateBackReport,
    timeSummary,
    newAchievements,
    isNewLevel,
    newRecords,
  };
};
