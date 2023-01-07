import axios from "axios";
import { UserDataInterface } from "../userSlice.types";
import { User } from "firebase/auth";

export const getUserData = async (user: User) =>
  axios
    .post<UserDataInterface>("/api/user/getUserData", {
      user,
    })
    .then((response) => response.data);

