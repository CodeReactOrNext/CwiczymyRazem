import type { SerializedError } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { signIn, signOut } from "next-auth/react";
import { firebaseRestartUserStats, firebaseUpdateBand, firebaseUpdateSoundCloudLink, firebaseUpdateUserDisplayName, firebaseUpdateUserEmail, firebaseUpdateUserPassword, firebaseUpdateYouTubeLink, firebaseUploadAvatar } from "feature/settings/services/settings.service";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { challengesList } from "feature/challenges/data/challengesList";
import type { RootState } from "store/store";
import type { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import type {
  ActiveChallenge,
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




export const saveActiveChallenge = createAsyncThunk(
  "user/saveActiveChallenge",
  async (payload: { challenge: ActiveChallenge | null; quitId?: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const currentUserStats = state.user.currentUserStats;
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      let activeChallenges = [...(currentUserStats?.activeChallenges || [])];

      if (payload.quitId) {
        activeChallenges = activeChallenges.filter(c => c.challengeId !== payload.quitId);
      } else if (payload.challenge) {
        const index = activeChallenges.findIndex(c => c.challengeId === payload.challenge!.challengeId);
        if (index !== -1) {
          activeChallenges[index] = payload.challenge;
        } else {
          // Limit to 3 active challenges
          if (activeChallenges.length >= 3) {
            throw new Error("Maximum 3 active challenges allowed");
          }
          activeChallenges.push(payload.challenge);
        }
      }

      const userRef = doc(db, "users", userId);

      await updateDoc(userRef, {
        "statistics.activeChallenges": activeChallenges
      });

      return activeChallenges;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to save active challenge"
      );
    }
  }
);

export const checkAndSaveChallengeProgress = createAsyncThunk(
  "user/checkAndSaveChallengeProgress",
  async (planId: string | undefined, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const currentUserStats = state.user.currentUserStats;
      const userId = auth.currentUser?.uid;

      if (!userId || !currentUserStats?.activeChallenges || currentUserStats.activeChallenges.length === 0) {
        return;
      }

      // Find challenge that matches the planId
      const challengeToUpdate = planId
        ? currentUserStats.activeChallenges.find(c => c.challengeId === planId)
        : currentUserStats.activeChallenges[0]; // Fallback for safety, though planId should be provided

      if (!challengeToUpdate) return;

      const today = new Date().toISOString().split('T')[0];

      if (challengeToUpdate.lastCompletedDate && challengeToUpdate.lastCompletedDate === today) {
        return rejectWithValue("Already completed today");
      }

      const challenge = { ...challengeToUpdate, lastCompletedDate: today };
      let pointsToAdd = 0;
      let challengeFinished = false;

      if (challenge.currentDay >= challenge.totalDays) {
        const challengeData = challengesList.find(c => c.id === challenge.challengeId);
        const rewardPoints = parseInt(challengeData?.rewardDescription?.match(/\d+/)?.[0] || '0');
        if (rewardPoints > 0) {
          pointsToAdd = rewardPoints;
        }
        challengeFinished = true;
      } else {
        challenge.currentDay += 1;
      }

      const userRef = doc(db, "users", userId);
      const { increment, arrayUnion } = await import("firebase/firestore");
      const updates: any = {};

      const challengeData = challengesList.find(c => c.id === challenge.challengeId);

      if (challengeData?.rewardSkillId) {
        updates[`skills.unlockedSkills.${challengeData.rewardSkillId}`] = increment(1);
      }

      if (challengeFinished) {
        const remainingChallenges = currentUserStats.activeChallenges.filter(c => c.challengeId !== challenge.challengeId);
        updates["statistics.activeChallenges"] = remainingChallenges;
        updates["statistics.completedChallenges"] = arrayUnion(challenge.challengeId);

        if (pointsToAdd > 0) {
          updates["statistics.points"] = increment(pointsToAdd);
        }
      } else {
        const updatedChallenges = currentUserStats.activeChallenges.map(c =>
          c.challengeId === challenge.challengeId ? challenge : c
        );
        updates["statistics.activeChallenges"] = updatedChallenges;
      }

      await updateDoc(userRef, updates);

      return {
        challenge,
        challengeFinished,
        pointsToAdd,
        rewardSkillId: challengeData?.rewardSkillId,
        rewardLevel: challengeData?.rewardLevel
      };

    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update challenge progress"
      );
    }
  }
);

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
  async (payload: { type: DailyQuestTaskType; amount?: number }, { dispatch }) => {
    const { completeQuestTask } = await import("./userSlice");
    dispatch(completeQuestTask(payload));
    dispatch(saveDailyQuestAction());
  }
);

export const initializeDailyQuestAction = createAsyncThunk(
  "user/initializeDailyQuest",
  async (_, { dispatch }) => {
    const { generateDailyQuest } = await import("./userSlice");
    dispatch(generateDailyQuest());
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
