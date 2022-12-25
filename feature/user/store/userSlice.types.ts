import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";
import { ReportDataInterface, ReportFormikInterface } from "../view/ReportView/ReportView.types";
import { SignUpCredentials } from "../view/SingupView/SingupView";

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
  userInfo: { displayName: string } | null;
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
