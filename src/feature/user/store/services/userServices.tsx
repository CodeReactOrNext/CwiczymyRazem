import axios from "axios";
import type { User } from "firebase/auth";
import type {
  FetchedReportDataInterface,
  updateReprotInterface,
  UserDataInterface,
} from "types/api.types";

export const fetchUserData = async (user: User) =>
  axios
    .post<UserDataInterface>(
      "/api/user/getUserData",
      { user },
      // Without a timeout a stalled request (regional network / cold serverless
      // start) leaves autoLogIn pending forever, which keeps the dashboard on
      // its loading spinner. Reject instead so autoLogIn.rejected can recover.
      { timeout: 15000 }
    )
    .then((response) => response.data);

export const fetchReport = ({ token, inputData }: updateReprotInterface) =>
  axios
    .post<FetchedReportDataInterface>("/api/user/report", {
      token,
      inputData,
    })
    .then((response) => response.data);
