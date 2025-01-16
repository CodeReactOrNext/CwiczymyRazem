import { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import { StatisticsDataInterface } from "types/api.types";
import { getDateFromPast, inputTimeConverter } from "utils/converter";
import {
  checkAchievement,
  checkIsPracticeToday,
  getPointsToLvlUp,
  getUpdatedActualDayWithoutBreak,
  levelUpUser,
  makeRatingData,
} from "utils/gameLogic";

interface updateUserStatsProps {
  currentUserStats: StatisticsDataInterface;
  inputData: ReportFormikInterface;
}
export const reportUpdateUserStats = ({
  currentUserStats,
  inputData,
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
      technique: techniqueTime > 0 ? 1 : 0,
      theory: theoryTime > 0 ? 1 : 0,
      hearing: hearingTime > 0 ? 1 : 0,
      creativity: creativityTime > 0 ? 1 : 0,
    },
  };
  const updatedLevel = levelUpUser(lvl, points + raiting.totalPoints);
  const isNewLevel = updatedLevel > lvl;

  const updatedUserData: StatisticsDataInterface = {
    time: {
      technique: time.technique + techniqueTime,
      theory: time.theory + theoryTime,
      hearing: time.hearing + hearingTime,
      creativity: time.creativity + creativityTime,
      longestSession:
        time.longestSession < sumTime ? sumTime : time.longestSession,
    },
    availablePoints: availablePoints,
    points: points + raiting.totalPoints,
    lvl: updatedLevel,
    currentLevelMaxPoints: getPointsToLvlUp(updatedLevel + 1),
    sessionCount: didPracticeToday ? sessionCount : sessionCount + 1,
    habitsCount: habitsCount + raiting.bonusPoints.habitsCount,
    dayWithoutBreak:
      dayWithoutBreak < updatedActualDayWithoutBreak
        ? updatedActualDayWithoutBreak
        : dayWithoutBreak,
    maxPoints:
      maxPoints < raiting.totalPoints ? raiting.totalPoints : maxPoints,
    actualDayWithoutBreak: isDateBackReport
      ? actualDayWithoutBreak
      : updatedActualDayWithoutBreak,
    achievements: achievements,
    lastReportDate: isDateBackReport
      ? lastReportDate
      : new Date().toISOString(),
  };

  const newAchievements = checkAchievement(updatedUserData, raiting, inputData);
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
