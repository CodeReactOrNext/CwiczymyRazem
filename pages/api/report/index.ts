import { getUserLvl } from "../report/utils/getUserLvl";
import { checkIsPracticeToday } from "../report/utils/checkIsPracticeToday";
import { convertInputTime } from "../report/utils/convertInputTime";
import { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import {
  firebaseGetUserData,
  firebaseSetUserExerciseRaprot,
  firebaseUpdateUserStats,
  firebaseAddLogReport,
  firebaseGetUserName,
} from "utils/firebase/firebase.utils";
import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";

import { NextApiRequest, NextApiResponse } from "next";
import { makeRatingData } from "./utils/makeRatingData";
import { checkAchievement } from "./achievement";
import { calcExperience } from "./utils/calcExperience";

interface updateUserStatsProps {
  userAuth: string;
  inputData: ReportFormikInterface;
}
const reportHandler = async ({ userAuth, inputData }: updateUserStatsProps) => {
  const currentUserStats = (await firebaseGetUserData(
    userAuth
  )) as StatisticsDataInterface;
  const userName = await firebaseGetUserName(userAuth);
  const { techniqueTime, theoryTime, hearingTime, creativityTime, sumTime } =
    convertInputTime(inputData);
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

  const raiting = makeRatingData(inputData, sumTime);
  const userLastReportDate = new Date(lastReportDate!);
  const didPracticeToday = checkIsPracticeToday(userLastReportDate);

  const level = getUserLvl(lvl, points + raiting.basePoints);
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
    points: points + raiting.basePoints,
    lvl: level,
    pointsToNextLvl: calcExperience(level + 1),
    sessionCount: didPracticeToday ? sessionCount : sessionCount + 1,
    habitsCount: habitsCount + raiting.bonusPoints.habitsCount,
    dayWithoutBreak:
      dayWithoutBreak < updatedActualDayWithoutBreak
        ? updatedActualDayWithoutBreak
        : dayWithoutBreak,
    maxPoints: maxPoints < raiting.basePoints ? raiting.basePoints : maxPoints,
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
    raiting.basePoints,
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
    const { userAuth, inputData } = JSON.parse(req.body);
    const report = await reportHandler({ userAuth, inputData });
    res.status(200).json(JSON.stringify(report));
  }
  res.status(400);
}
