import { Timestamp } from "firebase/firestore";
import { achievementList } from "assets/achievements/achievementsData";
import { StatisticsDataInterface } from "constants/userStatisticsInitialData";

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
  newAchievements: achievementList[];
  newLevel: {
    isNewLevel: boolean;
    level: number;
  };
  points: number;
}
