import { NextApiRequest, NextApiResponse } from "next";

import { StatisticsDataInterface } from "types/api.types";
import { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";

import { getUserLvl } from "utils/gameLogic/getUserLvl";
import { auth } from "utils/firebase/api/firebase.config";
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
import { getUpdatedActualDayWithoutBreak } from "utils/gameLogic/getUpdatedActualDayWithoutBreak";

interface updateUserStatsProps {
  userUid: string;
  inputData: ReportFormikInterface;
}
const reportHandler = async ({ userUid, inputData }: updateUserStatsProps) => {
  const currentUserStats = (await firebaseGetUserData(
    userUid
  )) as StatisticsDataInterface;

  const timeSumary = inputTimeConverter(inputData);
  const { techniqueTime, theoryTime, hearingTime, creativityTime, sumTime } =
    timeSumary;

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

  const userLastReportDate = new Date(lastReportDate!);
  const didPracticeToday = checkIsPracticeToday(userLastReportDate);
  const updatedActualDayWithoutBreak = getUpdatedActualDayWithoutBreak(
    actualDayWithoutBreak,
    userLastReportDate,
    didPracticeToday
  );
  const raiting = makeRatingData(
    inputData,
    sumTime,
    updatedActualDayWithoutBreak
  );
  const level = getUserLvl(lvl, points + raiting.totalPoints);
  const isNewLevel = level > lvl;

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

  await firebaseSetUserExerciseRaprot(
    userUid,
    raiting,
    new Date(),
    inputData.reportTitle,
    timeSumary
  );
  await firebaseUpdateUserStats(userUid, updatedUserDataWithAchievements);
  await firebaseAddLogReport(
    userUid,
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
    if (!req.body.token) {
      return res.status(401).json("Please include id token");
    }
    const { uid } = await auth.verifyIdToken(req.body.token.token);
    const userUid = uid;
    const { inputData } = req.body;
    const report = await reportHandler({ userUid, inputData });
    res.status(200).json(report);
  }
  res.status(400);
}
