import { NextApiRequest, NextApiResponse } from "next";

import { StatisticsDataInterface } from "constants/userStatisticsInitialData";
import { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";

import { getUserLvl } from "utils/gameLogic/getUserLvl";
import { makeRatingData } from "utils/gameLogic/makeRatingData";
import { checkAchievement } from "utils/gameLogic/checkAvievement";
import { getPointsToLvlUp } from "utils/gameLogic/getPointsToLvlUp";
import { inputTimeConverter } from "utils/converter/InputTimeConverter";
import { checkIsPracticeToday } from "utils/gameLogic/checkIsPracticeToday";
import {
  firebaseGetUserData,
  firebaseUpdateUserStats,
  firebaseSetUserExerciseRaprot,
  firebaseAddLogReport,
} from "utils/firebase/api/firebase.utils";

interface updateUserStatsProps {
  userAuth: string;
  inputData: ReportFormikInterface;
}
const reportHandler = async ({ userAuth, inputData }: updateUserStatsProps) => {
  const currentUserStats = (await firebaseGetUserData(
    userAuth
  )) as StatisticsDataInterface;
  const { techniqueTime, theoryTime, hearingTime, creativityTime, sumTime } =
    inputTimeConverter(inputData);
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
  } = currentUserStats;

  const raiting = makeRatingData(inputData, sumTime, actualDayWithoutBreak);
  const userLastReportDate = new Date(lastReportDate!);
  const didPracticeToday = checkIsPracticeToday(userLastReportDate);
  const level = getUserLvl(lvl, points + raiting.totalPoints);
  const isNewLevel = level > lvl;
  const updatedActualDayWithoutBreak = didPracticeToday
    ? actualDayWithoutBreak
    : actualDayWithoutBreak + 1;
  const updatedUserData: StatisticsDataInterface = {
    time: {
      technique: time.technique + techniqueTime,
      theory: time.theory + theoryTime,
      hearing: time.hearing + hearingTime,
      creativity: time.creativity + creativityTime,
      longestSession:
        time.longestSession < sumTime ? sumTime : time.longestSession,
    },
    points: points + raiting.totalPoints,
    lvl: level,
    currentLevelMaxPoints: getPointsToLvlUp(level + 1),
    sessionCount: didPracticeToday ? sessionCount : sessionCount + 1,
    habitsCount: habitsCount + raiting.bonusPoints.habitsCount,
    dayWithoutBreak:
      dayWithoutBreak < updatedActualDayWithoutBreak
        ? updatedActualDayWithoutBreak
        : dayWithoutBreak,
    maxPoints:
      maxPoints < raiting.totalPoints ? raiting.totalPoints : maxPoints,
    actualDayWithoutBreak: updatedActualDayWithoutBreak,
    achievements: achievements,
    lastReportDate: new Date().toISOString(),
  };

  const newAchievements = checkAchievement(updatedUserData, raiting, inputData);

  const updatedUserDataWithAchievements: StatisticsDataInterface = {
    ...updatedUserData,
    achievements: [...newAchievements, ...updatedUserData.achievements],
  };

  await firebaseSetUserExerciseRaprot(userAuth, raiting, new Date());
  await firebaseUpdateUserStats(userAuth, updatedUserDataWithAchievements);
  await firebaseAddLogReport(
    userAuth,
    updatedUserData.lastReportDate,
    raiting.totalPoints,
    newAchievements,
    {
      isNewLevel,
      level,
    }
  );

  return {
    currentUserStats: updatedUserDataWithAchievements,
    previousUserStats: currentUserStats,
    raitingData: raiting,
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { userAuth, inputData } = req.body;
    const report = await reportHandler({ userAuth, inputData });
    res.status(200).json(report);
  }
  res.status(400);
}
