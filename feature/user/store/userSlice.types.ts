import { IdTokenResult } from "firebase/auth";
import {
  ReportDataInterface,
  ReportFormikInterface,
} from "../view/ReportView/ReportView.types";
import { SignUpCredentials } from "../view/SingupView/SingupView";

import { StatisticsDataInterface } from "constants/userStatisticsInitialData";
import { MediaType } from "../components/settings/MediaLinks/MediaLinks";
import { Timestamp } from "firebase/firestore";

export interface TimerInterface {
  technique: number;
  theory: number;
  hearing: number;
  creativity: number;
}
export interface UserSliceProviderData {
  providerId: string | null;
  uid: string | null;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}
export interface userSliceInitialState {
  userAuth: string | null;
  userInfo: {
    displayName?: string;
    avatar?: string;
    createdAt?: Timestamp;
    soundCloudLink?: string;
    youTubeLink?: string;
    band?: string;
  } | null;
  theme: "default-theme" | "dark-theme";
  timer: TimerInterface;
  isLoggedOut: true | null;
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

export interface updateReprotInterface {
  token: IdTokenResult;
  inputData: ReportFormikInterface;
}

export interface updateSocialInterface {
  value: string;
  type: MediaType;
}
