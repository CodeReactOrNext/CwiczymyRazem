import {
  createAsyncThunk,
} from "@reduxjs/toolkit";
import { User } from "firebase/auth";

import { SignUpCredentials } from "../view/SingupView/SingupView";


import { fetchReport, fetchUserData } from "./services/userServices";
import {
  auth,
  firebaseCheckUsersNameIsNotUnique,
  firebaseCreateAccountWithEmail,
  firebaseGetUserProviderData,
  firebaseLogUserOut,
  firebaseReauthenticateUser,
  firebaseRestartUserStats,
  firebaseSignInWithEmail,
  firebaseUpdateUserDisplayName,
  firebaseSignInWithGooglePopup,
  firebaseUpdateUserEmail,
  firebaseUpdateUserPassword,
  firebaseUploadAvatar,
} from "utils/firebase/firebase.utils";
import {
  updateUserInterface,
  updateReprotInterface,
} from "./userSlice.types";

export const logInViaGoogle = createAsyncThunk(
  "user/logInViaGoogle",
  async () => {
    const { user } = await firebaseSignInWithGooglePopup();
    const userData = await fetchUserData(user);
    return userData;
  }
);

export const logInViaEmail = createAsyncThunk(
  "user/loginViaEmail",
  async ({ email, password }: { email: string; password: string }) => {
    const { user } = await firebaseSignInWithEmail(email, password);
    const userData = await fetchUserData(user);
    return userData;
  }
);

export const autoLogIn = createAsyncThunk(
  "user/autoLogin",
  async (user: User) => {
    const userData = await fetchUserData(user);
    return userData;
  }
);

export const createAccount = createAsyncThunk(
  "user/createAccount",
  async ({ login, email, password }: SignUpCredentials) => {
    if (await firebaseCheckUsersNameIsNotUnique(login)) {
      throw new Error("nick-alredy-in-use");
    }
    const { user } = await firebaseCreateAccountWithEmail(email, password);
    const userWithDisplayName = { ...user, displayName: login };
    const userData = await fetchUserData(userWithDisplayName);
    return userData;
  }
);

export const changeUserDisplayName = createAsyncThunk(
  "user/updateDisplayName",
  async (newDisplayName: string) => {
    if (await firebaseCheckUsersNameIsNotUnique(newDisplayName)) {
      throw new Error("nick-alredy-in-use");
    }
    if (!newDisplayName && newDisplayName.length === 0) {
      throw new Error();
    }
    if (newDisplayName && newDisplayName.length > 0 && auth.currentUser) {
      await firebaseUpdateUserDisplayName(auth.currentUser.uid, newDisplayName);
      return newDisplayName;
    }
  }
);

export const updateUserEmail = createAsyncThunk(
  "user/updateUserEmail",
  async ({ email, password, newEmail }: updateUserInterface) => {
    const authState = await firebaseReauthenticateUser({ email, password });

    if (newEmail && newEmail.length > 0 && authState) {
      await firebaseUpdateUserEmail(newEmail);
    }
    const userInfo = await firebaseGetUserProviderData();
    return { userInfo };
  }
);
export const updateUserPassword = createAsyncThunk(
  "user/updateUserPassword",
  async ({ email, password, newPassword }: updateUserInterface) => {
    const authState = await firebaseReauthenticateUser({ email, password });

    if (newPassword && newPassword.length > 0 && authState) {
      await firebaseUpdateUserPassword(newPassword);
    }
    const userInfo = await firebaseGetUserProviderData();
    return { userInfo };
  }
);

export const getUserProvider = createAsyncThunk(
  "user/getUserProvider",
  async () => {
    const providerData = await firebaseGetUserProviderData();
    return providerData;
  }
);

export const logUserOff = createAsyncThunk("user/logUserOff", async () => {
  await firebaseLogUserOut();
});

export const restartUserStats = createAsyncThunk(
  "user/restartUserStats",
  async () => {
    await firebaseRestartUserStats();
  }
);

export const updateUserStats = createAsyncThunk(
  "user/updateUserStats",
  async ({ userAuth, inputData }: updateReprotInterface) => {
    const statistics = fetchReport({ userAuth, inputData });
    return statistics;
  }
);

export const uploadUserAvatar = createAsyncThunk(
  "user/uploadUserAvatar",
  async (avatar: Blob) => {
    const avatarUrl = await firebaseUploadAvatar(avatar);
    return { avatar: avatarUrl };
  }
);
