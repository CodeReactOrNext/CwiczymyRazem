import axios from "axios";
import { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";

import { User } from "firebase/auth";
import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";
import { updateReprotInterface } from "../userSlice.types";

export interface UserDataInterface {
  userInfo: { displayName: string };
  userAuth: string;
  currentUserStats: StatisticsDataInterface;
}
export interface fetchedReportDataInterface {
  currentUserStats: StatisticsDataInterface;
  previousUserStats: StatisticsDataInterface;
  raitingData: ReportDataInterface;
}

export const fetchUserData = async (user: User) =>
  axios
    .post<UserDataInterface>("/api/user/getUserData", {
      user,
    })
    .then((response) => response.data);

export const fetchReport = ({ userAuth, inputData }: updateReprotInterface) =>
  axios
    .post<fetchedReportDataInterface>("/api/user/report", {
      userAuth,
      inputData,
    })
    .then((response) => response.data)
    .catch((error) => error);
