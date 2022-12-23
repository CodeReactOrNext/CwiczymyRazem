import {
  ReportDataInterface,
  ReportFormikInterface,
} from "feature/user/view/ReportView/ReportView.types";
import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  checkBalance,
  checkFire,
  checkHealthHabits,
  time1Check,
  time2Check,
  time3Check,
} from "./utils/achievementMethods";
import { AchievementList } from "data/achievements";

export const checkAchievement = (
  statistics: StatisticsDataInterface,
  reportData: ReportDataInterface,
  inputData: ReportFormikInterface
) => {
  const achievedAchievements: (AchievementList | undefined)[] = [
    time1Check(statistics),
    time2Check(statistics),
    time3Check(statistics),
    checkBalance(inputData),
    checkFire(reportData),
    checkHealthHabits(reportData),
  ];

  const isAchievements = (
    item: AchievementList | undefined
  ): item is AchievementList => {
    return !!item;
  };

  const userAchievedAchievements = achievedAchievements
    .filter(isAchievements)
    .filter((item) => !statistics.achievements.includes(item));

  return userAchievedAchievements;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { statistics, raiting, inputData } = JSON.parse(req.body);
  const achievement = checkAchievement(statistics, raiting, inputData);

  res.status(200).json(JSON.stringify(achievement));
}
