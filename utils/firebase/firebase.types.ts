import { AchievementList } from "assets/achievements/achievementsData";
import { Timestamp } from "firebase/firestore";
import { StatisticsDataInterface } from "../../constants/userStatisticsInitialData";

export interface FirebaseUserDataInterface {
  profileId: string;
  createdAt: Timestamp;
  displayName: string;
  avatar?: string;
  statistics: StatisticsDataInterface;
}

export interface FirebaseLogsInterface {
  data: string;
  userName: string;
  newAchievements: AchievementList[];
  newLevel: {
    isNewLevel: boolean;
    level: number;
  };
  points: number;
}
