import { StatisticsDataInterface } from "constants/userStatisticsInitialData";
import { Timestamp } from "firebase/firestore";

export interface ProfileInterface {
  displayName: string;
  avatar: string;
  soundCloudLink?: string;
  youTubeLink?: string;
  band?: string;
  userAuth: string;
  statistics: StatisticsDataInterface;
  createdAt: Timestamp;
}
