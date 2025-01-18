import { StatisticsDataInterface } from "types/api.types";
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
  
  songLists: {
    wantToLearn: string[];
    learned: string[];
    learning: string[];
  };
}
