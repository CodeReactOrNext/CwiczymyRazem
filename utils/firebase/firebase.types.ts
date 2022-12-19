import { Timestamp } from "firebase/firestore";
import { StatisticsDataInterface } from "./userStatisticsInitialData";

export interface FirebaseUserDataInterface {
  createdAt: Timestamp;
  displayName: string;
  statistics: StatisticsDataInterface;
}
