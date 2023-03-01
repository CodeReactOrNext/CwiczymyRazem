import axios from "axios";
import { User } from "firebase/auth";

import {
  FetchedReportDataInterface,
  UserDataInterface,
  updateReprotInterface,
} from "types/api.types";

export const fetchUserData = async (user: User) =>
  axios
    .post<UserDataInterface>("/api/user/getUserData", {
      user,
    })
    .then((response) => response.data)
    .catch((error) => error);

export const fetchReport = ({ token, inputData }: updateReprotInterface) =>
  axios
    .post<FetchedReportDataInterface>("/api/user/report", {
      token,
      inputData,
    })
    .then((response) => response.data)
    .catch((error) => error);
