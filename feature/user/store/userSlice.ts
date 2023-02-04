import Router from "next/router";
import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "store/store";
import { statisticsInitial } from "constants/userStatisticsInitialData";
import {
  avatarErrorHandler,
  createAccountErrorHandler,
  loginViaEmailErrorHandler,
  loginViaGoogleErrorHandler,
  udpateDataErrorHandler,
} from "./userSlice.errorsHandling";
import {
  SkillsType,
  TimerInterface,
  userSliceInitialState,
} from "./userSlice.types";
import {
  logOutInfo,
  reportSuccess,
  restartInfo,
  updateDisplayNameSuccess,
  updateUserAvatarSuccess,
  updateUserEmailSuccess,
  updateUserPasswordSuccess,
} from "./userSlice.toast";
import {
  autoLogIn,
  changeUserDisplayName,
  createAccount,
  getUserProvider,
  logInViaDiscord,
  logInViaEmail,
  logInViaGoogle,
  logUserOff,
  restartUserStats,
  updateUserEmail,
  updateUserPassword,
  updateUserStats,
  uploadUserAvatar,
} from "./userSlice.asyncThunk";

const initialState: userSliceInitialState = {
  userInfo: null,
  userAuth: null,
  currentUserStats: null,
  previousUserStats: null,
  raitingData: null,
  isFetching: null,
  timer: { creativity: 0, hearing: 0, technique: 0, theory: 0 },
  theme: "default-theme",
  providerData: {
    providerId: null,
    uid: null,
    displayName: null,
    email: null,
    phoneNumber: null,
    photoURL: null,
  },
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    addUserAuth: (state, action) => {
      state.userAuth = action.payload;
    },
    addUserData: (state, action) => {
      state.currentUserStats = action.payload;
    },
    addPracticeData: (state, action) => {
      state.currentUserStats = action.payload;
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
      .addCase(uploadUserAvatar.rejected, (state) => {
        state.isFetching = null;
        avatarErrorHandler();
      })
      .addCase(logInViaEmail.rejected, (state, { error }) => {
        state.isFetching = null;
        loginViaEmailErrorHandler(error);
      })
      .addCase(logInViaGoogle.rejected, (state, { error }) => {
        state.isFetching = null;
        loginViaGoogleErrorHandler(error);
      })
      .addCase(createAccount.rejected, (state, { error }) => {
        state.isFetching = null;
        createAccountErrorHandler(error);
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
        reportSuccess();
      })
      .addCase(restartUserStats.fulfilled, (state) => {
        state.currentUserStats = statisticsInitial;
        state.isFetching = null;
        state.previousUserStats = null;
        state.raitingData = null;
        state.timer = { creativity: 0, hearing: 0, technique: 0, theory: 0 };
        restartInfo();
      })
      .addCase(logUserOff.fulfilled, (state) => {
        state.userAuth = null;
        state.userInfo = null;
        state.currentUserStats = null;
        state.previousUserStats = null;
        state.raitingData = null;
        state.timer = { creativity: 0, hearing: 0, technique: 0, theory: 0 };
        Router.push("/");
        logOutInfo();
      })
      .addCase(getUserProvider.fulfilled, (state, action) => {
        state.isFetching = null;
        state.providerData = action.payload;
      })
      .addCase(updateUserEmail.fulfilled, (state) => {
        state.isFetching = null;
        updateUserEmailSuccess();
      })
      .addCase(updateUserPassword.fulfilled, (state) => {
        state.isFetching = null;
        updateUserPasswordSuccess();
      })
      .addCase(changeUserDisplayName.fulfilled, (state, { payload }) => {
        state.isFetching = null;
        state.userInfo = {
          ...state.userInfo,
          displayName: payload,
        };
        updateDisplayNameSuccess();
      })
      .addCase(uploadUserAvatar.fulfilled, (state, action) => {
        state.isFetching = null;
        state.userInfo = { ...state.userInfo, ...action.payload.avatar };
        updateUserAvatarSuccess();
      })
      .addMatcher(
        isAnyOf(
          updateUserStats.pending,
          uploadUserAvatar.pending,
          restartUserStats.pending,
          changeUserDisplayName.pending,
          updateUserPassword.pending,
          updateUserEmail.pending
        ),
        (state) => {
          state.isFetching = "updateData";
        }
      )
      .addMatcher(
        isAnyOf(
          updateUserStats.rejected,
          restartUserStats.rejected,
          changeUserDisplayName.rejected,
          updateUserPassword.rejected,
          updateUserEmail.rejected
        ),
        (state, { error }) => {
          state.isFetching = null;
          udpateDataErrorHandler(error);
        }
      )
      .addMatcher(
        isAnyOf(
          // logInViaDiscord.fulfilled,
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
export const selectUserAvatar = (state: RootState) =>
  state.user.userInfo?.avatar;

export default userSlice.reducer;
