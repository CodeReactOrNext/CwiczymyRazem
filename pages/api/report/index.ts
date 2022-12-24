import { getUserLvl } from "../report/utils/getUserLvl";
import { checkIsPracticeToday } from "../report/utils/checkIsPracticeToday";
import { convertInputTime } from "../report/utils/convertInputTime";
import { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import {
  firebaseGetUserData,
  firebaseSetUserExerciseRaprot,
  firebaseUpdateUserStats,
} from "utils/firebase/firebase.utils";
import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";

import { NextApiRequest, NextApiResponse } from "next";
import { makeRatingData } from "./utils/makeRatingData";
import { checkAchievement } from "./achievement";

interface updateUserStatsProps {
  userAuth: string;
  inputData: ReportFormikInterface;
}
const reportHandler = async ({ userAuth, inputData }: updateUserStatsProps) => {
  const currentUserStats = (await firebaseGetUserData(
    userAuth
  )) as StatisticsDataInterface;

  const { techniqueTime, theoryTime, hearingTime, creativeTime, sumTime } =
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

  const updatedActualDayWithoutBreak = didPracticeToday
    ? actualDayWithoutBreak
    : actualDayWithoutBreak + 1;

  const updatedUserData: StatisticsDataInterface = {
    time: {
      technique: time.technique + techniqueTime,
      theory: time.theory + theoryTime,
      hearing: time.hearing + hearingTime,
      creativity: time.creativity + creativeTime,
      longestSession:
        time.longestSession < sumTime ? sumTime : time.longestSession,
    },
    points: points + raiting.basePoints,
    lvl: getUserLvl(lvl, points + raiting.basePoints),
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

  return {
    currentUserStats: updatedUserDataWithAchievements,
    previousUserStats: currentUserStats,
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