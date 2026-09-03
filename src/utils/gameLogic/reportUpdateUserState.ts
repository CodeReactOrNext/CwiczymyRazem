import { STREAK_REMINDER_LOCAL_HOUR } from "constants/streakReminder";
import type { ArsenalSummary } from "feature/arsenal/data/arsenalSummary";
import { EMPTY_ARSENAL_SUMMARY } from "feature/arsenal/data/arsenalSummary";
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
import { getReminderHourUtc, isValidTimeZone } from "./localDay";

interface updateUserStatsProps {
  currentUserStats: StatisticsDataInterface;
  inputData: ReportFormikInterface;
  currentUserSongLists: SongListInterface;
  /**
   * Flat gear facts the gear achievements read. Absent means "no arsenal to
   * speak of" rather than an error, so a caller that predates the Arsenal
   * simply earns none of them.
   */
  arsenalSummary?: ArsenalSummary;
}
export const reportUpdateUserStats = ({
  currentUserStats,
  inputData,
  currentUserSongLists,
  arsenalSummary = EMPTY_ARSENAL_SUMMARY
}: updateUserStatsProps) => {
  // Parse client's local date as UTC midnight to avoid timezone drift.
  // New format: "YYYY-MM-DD" (local date string from client).
  // Old format: full ISO timestamp (backward compat — normalize to UTC midnight).
  const parseClientDate = (iso: string): Date => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      return new Date(iso + "T00:00:00Z");
    }
    const d = new Date(iso);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  };
  const clientToday = inputData.clientTodayISO ? parseClientDate(inputData.clientTodayISO) : new Date();
  // Real client instant (with time-of-day) — used as the base for the stored
  // reportDate so its calendar day stays correct in every timezone (charts/summary
  // render in the viewer's local time). Falls back to the server clock if absent.
  const clientNow =
    inputData.clientNowISO && !isNaN(new Date(inputData.clientNowISO).getTime())
      ? new Date(inputData.clientNowISO)
      : new Date();
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
      d1.getUTCDate() === d2.getUTCDate() &&
      d1.getUTCMonth() === d2.getUTCMonth() &&
      d1.getUTCFullYear() === d2.getUTCFullYear();

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

  const finalLastReportDate = isDateBackReport
    ? backDateLastReport
    : clientToday.toISOString();

  // `lastReportDate` is UTC-midnight of the reporter's *local* day, so its date
  // part already IS that local day — no offset maths, nothing to re-interpret.
  const lastPracticeLocalDay = finalLastReportDate.slice(0, 10);

  // The stored counter can be pinned to the wrong calendar day by a single past
  // timezone slip and never recovers; the client sends the streak it derived
  // from the local-time activity log, which self-heals and is exactly what the
  // UI renders (see getReconciledStreak). Persisting it lets the reminder cron
  // and the Discord feed quote the app's number without loading any logs.
  // Back-dated reports are excluded: the client's log predates the entry being
  // filed, so its walk would miss the very day this report adds.
  const clientStreak = inputData.clientDisplayStreak;
  const streakDays =
    !isDateBackReport &&
    typeof clientStreak === "number" &&
    Number.isInteger(clientStreak) &&
    clientStreak >= 0
      ? clientStreak
      : finalStreak;

  const timeZone = isValidTimeZone(inputData.clientTimeZone)
    ? inputData.clientTimeZone
    : null;

  const raiting = {
    ...(isDateBackReport
      ? makeRatingData(inputData, sumTime, 1, clientNow)
      : makeRatingData(inputData, sumTime, updatedActualDayWithoutBreak, clientNow)),
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
    lastReportDate: finalLastReportDate,
    streakDays,
    lastPracticeLocalDay,
    // Absent zone leaves whatever was stored before untouched (spread above) —
    // one browser that won't resolve `Intl` must not un-schedule the user.
    ...(timeZone && {
      timeZone,
      reminderHourUtc: getReminderHourUtc(
        timeZone,
        STREAK_REMINDER_LOCAL_HOUR,
        clientNow
      ),
    }),
    guitarStartDate: null
  };

  const newAchievements = AchievementManager.getNewlyEarned({
    statistics: updatedUserData,
    sessionResults: raiting,
    inputData,
    songLists: currentUserSongLists,
    arsenal: arsenalSummary
  });
  const updatedUserDataWithAchievements: StatisticsDataInterface = {
    ...updatedUserData,
    achievements: [...newAchievements, ...updatedUserData.achievements],
  };
  const dateToReport = isDateBackReport
    ? getDateFromPast(isDateBackReport, clientNow)
    : clientNow;

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
