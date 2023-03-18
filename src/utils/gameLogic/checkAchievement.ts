import {
  ReportDataInterface,
  ReportFormikInterface,
} from "feature/user/view/ReportView/ReportView.types";
import { StatisticsDataInterface } from "types/api.types";

import {
  checkArtist,
  checkBalance,
  checkDay1,
  checkDay2,
  checkDay3,
  checkDiamond,
  checkDoctor,
  checkDumbbel,
  checkFire,
  checkHeadphones,
  checkHealthHabits,
  checkMedal,
  checkNinja,
  checkPath,
  checkPoints1,
  checkPoints2,
  checkPoints3,
  checkRecord,
  checkRightway,
  checkRing,
  checksBigear,
  checksBook,
  checkSession1,
  checkSession2,
  checkSession3,
  checksScientist,
  checksWizard,
  checkTired,
  checkVinyl,
  checkYolo,
  time1Check,
  time2Check,
  time3Check,
} from "./achievementMethods";
import { AchievementList } from "assets/achievements/achievementsData";

export const checkAchievement = (
  statistics: StatisticsDataInterface,
  reportData: ReportDataInterface,
  inputData: ReportFormikInterface
) => {
  const achievedAchievements: (AchievementList | undefined)[] = [
    checkFire(reportData),
    checkHealthHabits(reportData),
    time1Check(statistics),
    time2Check(statistics),
    time3Check(statistics),
    checkPoints1(statistics),
    checkPoints2(statistics),
    checkPoints3(statistics),
    checkDoctor(statistics),
    checkDiamond(statistics),
    checksScientist(statistics),
    checkArtist(statistics),
    checksBook(statistics),
    checksBigear(statistics),
    checksWizard(statistics),
    checkMedal(statistics),
    checkDay1(statistics),
    checkDay2(statistics),
    checkDay3(statistics),
    checkSession1(statistics),
    checkSession2(statistics),
    checkSession3(statistics),
    checkRing(statistics),
    checkHeadphones(statistics),
    checkNinja(statistics),
    checkTired(inputData),
    checkBalance(inputData),
    checkRecord(inputData),
    checkVinyl(inputData),
    checkRightway(inputData),
    checkYolo(inputData),
    checkPath(inputData),
    checkDumbbel(inputData, statistics),
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
