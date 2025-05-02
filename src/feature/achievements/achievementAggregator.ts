import type { AchievementList } from "feature/achievements/achievementsData";
import { checkLearned1, checkLearned3, checkLearned5, checkLearned10, checkLearned20, checkLearned30, checkLearned50, checkLearned100,checkLearning1, checkLearning3, checkLearning5, checkLearning10, checkWannaLearn3, checkWannaLearn5, checkWannaLearn10, checkWannaLearn30 } from "feature/achievements/categories/songsAchievements";
import { checkWannaLearn1 } from "feature/achievements/categories/songsAchievements";
import type {
  ReportDataInterface,
  ReportFormikInterface,
} from "feature/user/view/ReportView/ReportView.types";
import type { SongListInterface } from "src/pages/api/user/report";
import type { StatisticsDataInterface } from "types/api.types";

import { 
  checkBalance, 
  checkPath, 
  checkRing 
} from "./categories/balanceAchievements";
import { 
  checkBatteryHearth, 
  checkDoctor, 
  checkHealthHabits, 
  checkRecord, 
  checkRightway, 
  checkVinyl, 
  checkYolo 
} from "./categories/habitAchievements";
import { 
  checkFire, 
  checkPoints1, 
  checkPoints2, 
  checkPoints3, 
  checkShort 
} from "./categories/pointsAchievements";
import { 
  checkArtist, 
  checkBigear, 
  checkBook, 
  checkDiamond, 
  checkFireSession, 
  checkHeadphones, 
  checkLvl100, 
  checkMedal, 
  checkNinja, 
  checkScientist, 
  checkWizard 
} from "./categories/specialistAchievements";
import { 
  checkBomb,
  checkDay1, 
  checkDay2, 
  checkDay3, 
  checkDumbbel, 
  checkSession1, 
  checkSession2, 
  checkSession3 
} from "./categories/streakAchievements";
import { 
  check100days,
  checkTime1, 
  checkTime2, 
  checkTime3, 
  checkTired 
} from "./categories/timeAchievements";

export const checkAchievements = (
  statistics: StatisticsDataInterface,
  reportData: ReportDataInterface,
  inputData: ReportFormikInterface,
  currentUserSongLists: SongListInterface
) => {
  const achievedAchievements: (AchievementList | undefined)[] = [
    // Time achievements
    checkTime1(statistics),
    checkTime2(statistics),
    checkTime3(statistics),
    checkTired(inputData),
    check100days(statistics),
    
    // Points achievements
    checkFire(reportData),
    checkPoints1(statistics),
    checkPoints2(statistics),
    checkPoints3(statistics),
    checkShort(statistics),
    
    // Balance achievements
    checkBalance(inputData),
    checkRing(statistics),
    checkPath(inputData),
    
    // Specialist achievements
    checkDiamond(statistics),
    checkScientist(statistics),
    checkBigear(statistics),
    checkWizard(statistics),
    checkBook(statistics),
    checkArtist(statistics),
    checkHeadphones(statistics),
    checkNinja(statistics),
    checkMedal(statistics),
    checkLvl100(statistics),
    checkFireSession(inputData),

    
    // Streak & Session achievements
    checkDay1(statistics),
    checkDay2(statistics),
    checkDay3(statistics),
    checkSession1(statistics),
    checkSession2(statistics),
    checkSession3(statistics),
    checkDumbbel(inputData, statistics),
    checkBomb(inputData, statistics),
    
    // Habit achievements
    checkHealthHabits(reportData),
    checkDoctor(statistics),
    checkRecord(inputData),
    checkVinyl(inputData),
    checkRightway(inputData),
    checkYolo(inputData),
    checkBatteryHearth(statistics),

    // Songs achievements
    checkWannaLearn1(currentUserSongLists),
    checkWannaLearn3(currentUserSongLists),
    checkWannaLearn5(currentUserSongLists),
    checkWannaLearn10(currentUserSongLists),
    checkWannaLearn30(currentUserSongLists),
    checkLearning1(currentUserSongLists),       
    checkLearning3(currentUserSongLists),
    checkLearning5(currentUserSongLists),
    checkLearning10(currentUserSongLists),
    checkLearned1(currentUserSongLists),
    checkLearned3(currentUserSongLists),
    checkLearned5(currentUserSongLists),  
    checkLearned10(currentUserSongLists),
    checkLearned20(currentUserSongLists),
    checkLearned30(currentUserSongLists),
    checkLearned50(currentUserSongLists),
    checkLearned100(currentUserSongLists),

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