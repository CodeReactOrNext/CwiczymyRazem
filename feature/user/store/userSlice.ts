import Router from "next/router";
import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "store/store";

import {
  StatisticsDataInterface,
  statisticsInitial,
} from "constants/userStatisticsInitialData";
import { TimerInterface, userSliceInitialState } from "./userSlice.types";
import {
  autoLogIn,
  changeUserDisplayName,
  createAccount,
  getUserProvider,
  logInViaEmail,
  logInViaGoogle,
  logUserOff,
  restartUserStats,
  updateUserEmail,
  updateUserPassword,
  updateUserStats,
  uploadUserAvatar,
  uploadUserSocialData,
} from "./userSlice.asyncThunk";
import { SkillsType } from "types/skillsTypes";

const initialState: userSliceInitialState = {
  userInfo: null,
  userAuth: null,
  currentUserStats: null,
  previousUserStats: null,
  raitingData: null,
  isFetching: null,
  isLoggedOut: null,
  timer: { creativity: 0, hearing: 0, technique: 0, theory: 0 },
  theme: "default-theme",
  providerData: {
    providerId: null,
    uid: null,
    displayName: null,
    email: null,
    photoURL: null,
  },
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    addUserAuth: (state, { payload }: PayloadAction<"string">) => {
      state.userAuth = payload;
    },
    addUserData: (
      state,
      { payload }: PayloadAction<StatisticsDataInterface>
    ) => {
      state.currentUserStats = payload;
    },
    addPracticeData: (
      state,
      { payload }: PayloadAction<StatisticsDataInterface>
    ) => {
      state.currentUserStats = payload;
    },

    changeTheme: (
      state,
      { payload }: PayloadAction<"dark-theme" | "default-theme" | undefined>
    ) => {
      if (payload) {
        state.theme = payload;
        return;
      }
      state.theme =
        state.theme === "default-theme" ? "dark-theme" : "default-theme";
    },

    updateLocalTimer: (state, { payload }: PayloadAction<TimerInterface>) => {
      if (!payload) {
        return;
      }
      state.timer = payload;
    },

    updateTimerTime: (
      state,
      { payload }: PayloadAction<{ type: SkillsType; time: number }>
    ) => {
      if (payload.type === "technique") {
        state.timer.technique = payload.time;
      }
      if (payload.type === "creativity") {
        state.timer.creativity = payload.time;
      }
      if (payload.type === "hearing") {
        state.timer.hearing = payload.time;
      }
      if (payload.type === "theory") {
        state.timer.theory = payload.time;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logInViaGoogle.pending, (state) => {
        state.isFetching = "google";
      })
      .addCase(logInViaEmail.pending, (state) => {
        state.isFetching = "email";
      })
      .addCase(createAccount.pending, (state) => {
        state.isFetching = "createAccount";
      })
      .addCase(updateUserStats.fulfilled, (state, { payload }) => {
        state.timer.technique = 0;
        state.timer.creativity = 0;
        state.timer.hearing = 0;
        state.timer.theory = 0;
        state.currentUserStats = payload.currentUserStats;
        state.previousUserStats = payload.previousUserStats;
        state.raitingData = payload.raitingData;
        state.isFetching = null;
      })
      .addCase(restartUserStats.fulfilled, (state) => {
        state.currentUserStats = statisticsInitial;
        state.isFetching = null;
        state.previousUserStats = null;
        state.raitingData = null;
        state.timer = { creativity: 0, hearing: 0, technique: 0, theory: 0 };
      })
      .addCase(logUserOff.fulfilled, (state) => {
        state.isLoggedOut = true;
        state.userAuth = null;
        state.userInfo = null;
        state.currentUserStats = null;
        state.previousUserStats = null;
        state.raitingData = null;
        state.timer = { creativity: 0, hearing: 0, technique: 0, theory: 0 };
        Router.push("/");
      })
      .addCase(getUserProvider.fulfilled, (state, action) => {
        state.isFetching = null;
        state.providerData = action.payload;
      })
      .addCase(changeUserDisplayName.fulfilled, (state, { payload }) => {
        state.isFetching = null;
        state.userInfo = {
          ...state.userInfo,
          displayName: payload,
        };
      })
      .addCase(uploadUserAvatar.fulfilled, (state, action) => {
        state.isFetching = null;
        state.userInfo = { ...state.userInfo, ...action.payload.avatar };
      })
      .addMatcher(
        isAnyOf(
          updateUserStats.pending,
          uploadUserAvatar.pending,
          restartUserStats.pending,
          changeUserDisplayName.pending,
          updateUserPassword.pending,
          updateUserEmail.pending,
          uploadUserSocialData.pending
        ),
        (state) => {
          state.isFetching = "updateData";
        }
      )
      .addMatcher(
        isAnyOf(
          updateUserEmail.fulfilled,
          updateUserPassword.fulfilled,
          uploadUserSocialData.fulfilled,
          uploadUserSocialData.fulfilled,
          updateUserStats.rejected,
          restartUserStats.rejected,
          changeUserDisplayName.rejected,
          updateUserPassword.rejected,
          updateUserEmail.rejected,
          uploadUserAvatar.rejected,
          logInViaEmail.rejected,
          logInViaGoogle.rejected,
          createAccount.rejected,
          uploadUserSocialData.rejected
        ),
        (state) => {
          state.isFetching = null;
        }
      )
      .addMatcher(
        isAnyOf(
          logInViaGoogle.fulfilled,
          logInViaEmail.fulfilled,
          createAccount.fulfilled,
          autoLogIn.fulfilled
        ),
        (state, action) => {
          state.isFetching = null;
          state.userInfo = action.payload.userInfo;
          state.currentUserStats = action.payload.currentUserStats;
          state.userAuth = action.payload.userAuth;
        }
      );
  },
});

export const {
  addUserAuth,
  addUserData,
  updateTimerTime,
  updateLocalTimer,
  changeTheme,
} = userSlice.actions;

export const selectUserAuth = (state: RootState) => state.user.userAuth;
export const selectLayoutMode = (state: RootState) => state.user.theme;
export const selectCurrentUserStats = (state: RootState) =>
  state.user.currentUserStats;
export const selectPreviousUserStats = (state: RootState) =>
  state.user.previousUserStats;
export const selectIsFetching = (state: RootState) => state.user.isFetching;
export const selectRaitingData = (state: RootState) => state.user.raitingData;
export const selectTimerData = (state: RootState) => state.user.timer;
export const selectUserName = (state: RootState) =>
  state.user.userInfo?.displayName;
export const selectUserInfo = (state: RootState) => state.user.userInfo;
export const selectUserAvatar = (state: RootState) =>
  state.user.userInfo?.avatar;
export const selectIsLoggedOut = (state: RootState) => state.user.isLoggedOut;

export default userSlice.reducer;
