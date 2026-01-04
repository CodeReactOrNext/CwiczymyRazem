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
  const {
    time,
    habitsCount,
    maxPoints,
    sessionCount,
    points,
    lvl,
    lastReportDate,
    actualDayWithoutBreak,
    dayWithoutBreak,
    achievements,
    availablePoints,
  } = currentUserStats;
  const isDateBackReport = inputData.countBackDays;
  const timeSummary = inputTimeConverter(inputData);
  const userLastReportDate = new Date(lastReportDate!);
  const { techniqueTime, theoryTime, hearingTime, creativityTime, sumTime } =
    timeSummary;
  const didPracticeToday = isDateBackReport
    ? false
    : checkIsPracticeToday(userLastReportDate);

  const updatedActualDayWithoutBreak = getUpdatedActualDayWithoutBreak(
    actualDayWithoutBreak,
    userLastReportDate,
    didPracticeToday
  );
  const raiting = {
    ...(isDateBackReport
      ? makeRatingData(inputData, sumTime, 1)
      : makeRatingData(inputData, sumTime, updatedActualDayWithoutBreak)),
    skillPointsGained: {
      technique: 0,
      theory: 0,
      hearing: 0,
      creativity: 0,
    },
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
    availablePoints: availablePoints,
    points: points + raiting.totalPoints,
    lvl: updatedLevel,
    currentLevelMaxPoints: getPointsToLvlUp(updatedLevel + 1),
    sessionCount: didPracticeToday ? sessionCount : sessionCount + 1,
    habitsCount: habitsCount + raiting.bonusPoints.habitsCount,
    dayWithoutBreak: dayWithoutBreak < updatedActualDayWithoutBreak
      ? updatedActualDayWithoutBreak
      : dayWithoutBreak,
    maxPoints: maxPoints < raiting.totalPoints ? raiting.totalPoints : maxPoints,
    actualDayWithoutBreak: isDateBackReport
      ? actualDayWithoutBreak
      : updatedActualDayWithoutBreak,
    achievements: achievements,
    lastReportDate: isDateBackReport
      ? lastReportDate
      : new Date().toISOString(),
    guitarStartDate: null
  };

  const newAchievements = AchievementManager.getNewlyEarned({
    statistics: updatedUserData,
    reportData: raiting,
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


  return {
    currentUserStats: updatedUserDataWithAchievements,
    previousUserStats: currentUserStats,
    raitingData: raiting,
    reportDate: dateToReport,
    isDateBackReport,
    timeSummary,
    newAchievements,
    isNewLevel,
  };
};
