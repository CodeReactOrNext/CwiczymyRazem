import type { SerializedError } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { signIn, signOut } from "next-auth/react";
import { firebaseRestartUserStats, firebaseUpdateBand, firebaseUpdateSoundCloudLink, firebaseUpdateUserDisplayName, firebaseUpdateUserEmail, firebaseUpdateUserPassword, firebaseUpdateYouTubeLink, firebaseUploadAvatar } from "feature/settings/services/settings.service";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import type {
  FetchedReportDataInterface,
  updateSocialInterface,
  updateUserInterface,
  UserDataInterface,
} from "types/api.types";
import {
  auth,
  db,
  firebaseCheckUsersNameIsNotUnique,
  firebaseCreateAccountWithEmail,
  firebaseGetUserProviderData,
  firebaseLogUserOut,
  firebaseReauthenticateUser,
  firebaseSignInWithEmail,
  firebaseSignInWithGooglePopup,
  firebaseSignInWithCredential,
} from "utils/firebase/client/firebase.utils";
import { firebaseGetCurrentUser } from "utils/firebase/client/firebase.utils";

import type { ReportFormikInterface } from "../view/ReportView/ReportView.types";
import type { SignUpCredentials } from "../view/SingupView/SingupView";
import { invalidateActivityLogsCache } from "feature/logs/services/getUserRaprotsLogs.service";
import { fetchReport, fetchUserData } from "./services/userServices";
import {
  avatarErrorHandler,
  createAccountErrorHandler,
  loginViaEmailErrorHandler,
  loginViaGoogleErrorHandler,
  udpateDataErrorHandler,
} from "./userSlice.errorsHandling";
import {
  logOutInfo,
  reportSuccess,
  restartInfo,
  signUpSuccess,
  updateDisplayNameSuccess,
  updateUserAvatarSuccess,
  updateUserDataSuccess,
  updateUserEmailSuccess,
  updateUserPasswordSuccess,
} from "./userSlice.toast";

export const logInViaGoogle = createAsyncThunk(
  "user/logInViaGoogle",
  async () => {
    try {
      const { user } = await firebaseSignInWithGooglePopup();
      const token = await user.getIdToken();
      await signIn("credentials", { idToken: token, callbackUrl: "/dashboard" });
      const userData = await fetchUserData(user);
      return userData as UserDataInterface;
    } catch (error) {
      loginViaGoogleErrorHandler(error as FirebaseError);
      return Promise.reject();
    }
  }
);

export const logInViaGoogleCredential = createAsyncThunk(
  "user/logInViaGoogleCredential",
  async (credentialId: string) => {
    try {
      const credential = GoogleAuthProvider.credential(credentialId);
      const { user } = await firebaseSignInWithCredential(credential);
      const token = await user.getIdToken();
      await signIn("credentials", { idToken: token, callbackUrl: "/dashboard" });
      const userData = await fetchUserData(user);
      return userData as UserDataInterface;
    } catch (error) {
      loginViaGoogleErrorHandler(error as FirebaseError);
      return Promise.reject();
    }
  }
);

export const logInViaEmail = createAsyncThunk(
  "user/loginViaEmail",
  async ({ email, password }: { email: string; password: string }) => {
    try {
      const { user } = await firebaseSignInWithEmail(email, password);
      const token = await user.getIdToken();
      await signIn("credentials", { idToken: token, callbackUrl: "/dashboard" });
      const userData = await fetchUserData(user);
      return userData as UserDataInterface;
    } catch (error) {
      loginViaEmailErrorHandler(error as FirebaseError);
      return Promise.reject();
    }
  }
);

export const autoLogIn = createAsyncThunk(
  "user/autoLogin",
  async (user: User) => {
    const userData = await fetchUserData(user);
    return userData as UserDataInterface;
  }
);

export const createAccount = createAsyncThunk(
  "user/createAccount",
  async ({ login, email, password }: SignUpCredentials) => {
    try {
      if (await firebaseCheckUsersNameIsNotUnique(login)) {
        throw new Error("nick-alredy-in-use");
      }
      const { user } = await firebaseCreateAccountWithEmail(email, password);
      const token = await user.getIdToken();
      await signIn("credentials", { idToken: token, redirect: false });
      const userWithDisplayName = { ...user, displayName: login };
      const userData = await fetchUserData(userWithDisplayName);
      signUpSuccess();
      return userData as UserDataInterface;
    } catch (error) {
      createAccountErrorHandler(error as SerializedError);
      return Promise.reject();
    }
  }
);

export const changeUserDisplayName = createAsyncThunk(
  "user/updateDisplayName",
  async (newDisplayName: string) => {
    try {
      if (await firebaseCheckUsersNameIsNotUnique(newDisplayName)) {
        throw new Error("nick-alredy-in-use");
      }
      if (!newDisplayName && newDisplayName.length === 0) {
        throw new Error();
      }
      if (newDisplayName && newDisplayName.length > 0 && auth.currentUser) {
        await firebaseUpdateUserDisplayName(
          auth.currentUser.uid,
          newDisplayName
        );
        updateDisplayNameSuccess();
        return newDisplayName;
      }
    } catch (error) {
      udpateDataErrorHandler(error as SerializedError);
      return Promise.reject();
    }
  }
);

export const updateUserEmail = createAsyncThunk(
  "user/updateUserEmail",
  async ({ email, password, newEmail }: updateUserInterface) => {
    try {
      const authState = await firebaseReauthenticateUser({ email, password });
      if (newEmail && newEmail.length > 0 && authState) {
        await firebaseUpdateUserEmail(newEmail);
      }
      const userInfo = await firebaseGetUserProviderData();
      updateUserEmailSuccess();
      return { userInfo };
    } catch (error) {
      udpateDataErrorHandler(error as SerializedError);
      return Promise.reject();
    }
  }
);
export const updateUserPassword = createAsyncThunk(
  "user/updateUserPassword",
  async ({ email, password, newPassword }: updateUserInterface) => {
    try {
      const authState = await firebaseReauthenticateUser({ email, password });

      if (newPassword && newPassword.length > 0 && authState) {
        await firebaseUpdateUserPassword(newPassword);
      }
      const userInfo = await firebaseGetUserProviderData();
      updateUserPasswordSuccess();
      return { userInfo };
    } catch (error) {
      udpateDataErrorHandler(error as SerializedError);
      return Promise.reject();
    }
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
  try {
    await signOut({ redirect: false });
    await firebaseLogUserOut();
    logOutInfo();
    // Use hard redirect to home to clear all memory and stop loaders
    window.location.href = "/";
  } catch (error) {
    udpateDataErrorHandler(error as SerializedError);
    return Promise.reject();
  }
});

export const restartUserStats = createAsyncThunk(
  "user/restartUserStats",
  async () => {
    try {
      await firebaseRestartUserStats();
      restartInfo();
    } catch (error) {
      udpateDataErrorHandler(error as SerializedError);
      return Promise.reject();
    }
  }
);

export const updateUserStats = createAsyncThunk(
  "user/updateUserStats",
  async ({ inputData }: { inputData: ReportFormikInterface }) => {
    try {
      const user = await firebaseGetCurrentUser();
      const token = await user!.getIdTokenResult();
      const statistics = await fetchReport({ token, inputData });
      if (user?.uid) {
        invalidateActivityLogsCache(user.uid);
      }
      reportSuccess();
      return statistics as FetchedReportDataInterface;
    } catch (error) {
      udpateDataErrorHandler(error as SerializedError);
      return Promise.reject();
    }
  }
);

export const uploadUserAvatar = createAsyncThunk(
  "user/uploadUserAvatar",
  async (avatar: Blob) => {
    try {
      const avatarUrl = await firebaseUploadAvatar(avatar);
      updateUserAvatarSuccess();
      return { avatar: avatarUrl };
    } catch (error) {
      avatarErrorHandler();
      return Promise.reject();
    }
  }
);

export const uploadUserSocialData = createAsyncThunk(
  "user/uploadUserYouTube",
  async ({ value, type }: updateSocialInterface) => {
    try {
      switch (type) {
        case "band":
          firebaseUpdateBand(value);
          break;
        case "youTubeLink":
          firebaseUpdateYouTubeLink(value);
          break;
        case "soundCloudLink":
          firebaseUpdateSoundCloudLink(value);
          break;
        default:
          break;
      }
      updateUserDataSuccess();
    } catch (error) {
      udpateDataErrorHandler(new Error());
      return Promise.reject();
    }
  }
);

export const upgradeSkill = createAsyncThunk(
  "user/upgradeSkill",
  async ({ skillId }: { skillId: string }, { rejectWithValue }) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error("User document not found");
      }

      const userData = userDoc.data();
      const currentSkills = userData.skills?.unlockedSkills || {};
      const currentPoints = userData.statistics?.availablePoints || {};

      // Get the skill category from your skills data
      const skillData = guitarSkills.find((skill) => skill.id === skillId);
      if (!skillData) {
        throw new Error("Skill not found");
      }

      // Check if user has enough points
      if (
        !currentPoints[skillData.category] ||
        currentPoints[skillData.category] <= 0
      ) {
        throw new Error("Not enough skill points");
      }

      // Update the unlocked skills and decrease available points
      await updateDoc(userRef, {
        "skills.unlockedSkills": {
          ...currentSkills,
          [skillId]: true,
        },
        "statistics.availablePoints": {
          ...currentPoints,
          [skillData.category]: currentPoints[skillData.category] - 1,
        },
      });

      // Return the updated skills data
      return {
        unlockedSkills: {
          ...currentSkills,
          [skillId]: true,
        },
        availablePoints: {
          ...currentPoints,
          [skillData.category]: currentPoints[skillData.category] - 1,
        },
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to upgrade skill"
      );
    }
  }
);

export interface RateSongPayload {
  songId: string;
  rating: number;
  title: string;
  artist: string;
  avatarUrl?: string;
  isNewRating?: boolean;
  tier?: string;
}

export const rateSong = createAsyncThunk(
  "user/rateSong",
  async (payload: RateSongPayload, { rejectWithValue }) => {
    try {
      const user = await firebaseGetCurrentUser();
      if (!user) throw new Error("User not authenticated");
      const token = await user.getIdTokenResult();

      const response = await axios.post("/api/songs/rate", {
        ...payload,
        token,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);



