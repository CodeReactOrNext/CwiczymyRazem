import type { SerializedError } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
// Challenges removed
import { invalidateActivityLogsCache } from "feature/logs/services/getUserRaprotsLogs.service";
import { firebaseRestartUserStats, firebaseUpdateBand, firebaseUpdateProfileCustomization, firebaseUpdateSoundCloudLink, firebaseUpdateUserDisplayName, firebaseUpdateUserEmail, firebaseUpdateUserPassword, firebaseUpdateYouTubeLink, firebaseUploadAvatar } from "feature/settings/services/settings.service";
import type { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { signIn, signOut } from "next-auth/react";
import type { RootState } from "store/store";
import type {
  // Challenges removed
  DailyQuestTaskType,
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
  firebaseSignInWithCredential,
  firebaseSignInWithEmail,
  firebaseSignInWithGooglePopup,
} from "utils/firebase/client/firebase.utils";
import { firebaseGetCurrentUser } from "utils/firebase/client/firebase.utils";

import type { ReportFormikInterface } from "../view/ReportView/ReportView.types";
import type { SignUpCredentials } from "../view/SingupView/SingupView";
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
  async (user: User, { rejectWithValue }) => {
    try {
      const userData = await fetchUserData(user);
      return userData as UserDataInterface;
    } catch (error) {
      console.error("autoLogIn failed:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Auto login failed"
      );
    }
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

export const updateProfileCustomization = createAsyncThunk(
  "user/updateProfileCustomization",
  async ({ selectedFrame, selectedGuitar }: { selectedFrame?: number; selectedGuitar?: number }) => {
    try {
      await firebaseUpdateProfileCustomization(selectedFrame, selectedGuitar);
      return { selectedFrame, selectedGuitar };
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
    } catch {
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
    } catch (_error) {
      udpateDataErrorHandler(new Error());
      return Promise.reject();
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




// saveActiveChallenge removed

// checkAndSaveChallengeProgress removed

// resetChallenge removed

export const saveDailyQuestAction = createAsyncThunk(
  "user/saveDailyQuest",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const dailyQuest = state.user.currentUserStats?.dailyQuest;
      const userId = auth.currentUser?.uid;

      if (!userId || !dailyQuest) {
        return;
      }

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        "statistics.dailyQuest": dailyQuest
      });

      return dailyQuest;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to save daily quest"
      );
    }
  }
);

/**
 * Thunk to update quest progress and persist it to Firebase
 */
export const updateQuestProgress = createAsyncThunk(
  "user/updateQuestProgress",
  async (payload: { type: DailyQuestTaskType; amount?: number; exerciseId?: string }, { dispatch, getState }) => {
    const { completeQuestTask, claimQuestReward } = await import("./userSlice");
    dispatch(completeQuestTask(payload));

    // Check if everything is completed now
    const state = getState() as RootState;
    const quest = state.user.currentUserStats?.dailyQuest;
    if (quest && !quest.isRewardClaimed) {
      const allDone = quest.tasks.every(t => t.isCompleted);
      if (allDone) {
        const { firebaseAddQuestLog } = await import("../../logs/services/addQuestLog.service");
        const userId = state.user.userAuth;
        if (userId) {
          await firebaseAddQuestLog(userId);
        }
        dispatch(claimQuestReward());
      }
    }

    dispatch(saveDailyQuestAction());
  }
);

export const initializeDailyQuestAction = createAsyncThunk(
  "user/initializeDailyQuest",
  async (_, { dispatch }) => {
    const { generateDailyQuest } = await import("./userSlice");
    const { exercisesAgregat } = await import("../../exercisePlan/data/exercisesAgregat");

    // Select random exercise
    const randomExercise = exercisesAgregat[Math.floor(Math.random() * exercisesAgregat.length)];

    dispatch(generateDailyQuest({
      randomExercise: {
        id: randomExercise.id,
        title: randomExercise.title
      }
    }));
    dispatch(saveDailyQuestAction());
  }
);

export const claimQuestRewardAction = createAsyncThunk(
  "user/claimQuestReward",
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      const { claimQuestReward } = await import("./userSlice");
      dispatch(claimQuestReward());
      dispatch(saveDailyQuestAction());

      const state = getState() as RootState;
      const userId = auth.currentUser?.uid;
      if (userId && state.user.currentUserStats) {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          "statistics.points": state.user.currentUserStats.points
        });
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to claim reward");
    }
  }
);
