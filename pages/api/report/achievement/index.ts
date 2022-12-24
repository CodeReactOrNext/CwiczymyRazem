import {
  ReportDataInterface,
  ReportFormikInterface,
} from "feature/user/view/ReportView/ReportView.types";
import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";

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
