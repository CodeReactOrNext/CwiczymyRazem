import axios from "axios";
import type { User } from "firebase/auth";
import type {
  FetchedReportDataInterface,
  updateReprotInterface,
  UserDataInterface,
} from "types/api.types";

export const fetchUserData = async (user: User) =>
  axios
    .post<UserDataInterface>("/api/user/getUserData", {
      user,
    })
    .then((response) => response.data);

export const fetchReport = ({ token, inputData }: updateReprotInterface) =>
  axios
    .post<FetchedReportDataInterface>("/api/user/report", {
      token,
      inputData,
    })
    .then((response) => response.data);
