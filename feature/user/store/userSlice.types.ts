import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";
import {
  ReportDataInterface,
  ReportFormikInterface,
} from "../view/ReportView/ReportView.types";
import { SignUpCredentials } from "../view/SingupView/SingupView";

export type SkillsType = "technique" | "hearing" | "theory" | "creativity";
export interface UserSliceProviderData {
  providerId: string | null;
  uid: string | null;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
}

export interface userSliceInitialState {
  userAuth: string | null;
  userInfo: { displayName?: string; avatar?: string } | null;
  timer: {
    technique: number;
    theory: number;
    hearing: number;
    creativity: number;
  };
  currentUserStats: StatisticsDataInterface | null;
  previousUserStats: StatisticsDataInterface | null;
  raitingData: ReportDataInterface | null;
  isFetching: "google" | "email" | "createAccount" | "updateData" | null;
  providerData: UserSliceProviderData;
}

export interface updateUserInterface extends SignUpCredentials {
  newEmail?: string;
  newPassword?: string;
}

export interface updateUserStatsProps {
  userAuth: string;
  inputData: ReportFormikInterface;
}
