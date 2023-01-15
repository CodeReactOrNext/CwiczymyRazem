import axios from "axios";
import { User } from "firebase/auth";

import { updateReprotInterface } from "../userSlice.types";
import { StatisticsDataInterface } from "constants/userStatisticsInitialData";
import { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";

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
    .then((response) => response.data)
    .catch((error) => error);

export const fetchReport = ({ token, inputData }: updateReprotInterface) =>
  axios
    .post<fetchedReportDataInterface>("/api/user/report", {
      token,
      inputData,
    })
    .then((response) => response.data)
    .catch((error) => error);
