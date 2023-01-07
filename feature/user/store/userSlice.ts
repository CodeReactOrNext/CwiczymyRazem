import {
  createAsyncThunk,
  createSlice,
  isAnyOf,
  PayloadAction,
} from "@reduxjs/toolkit";
import { User } from "firebase/auth";
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
import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";
import { RootState } from "../../../store/store";
import { SignUpCredentials } from "../view/SingupView/SingupView";
import { fetchReport, fetchUserData } from "./services/userServices";
import {
  avatarErrorHandler,
  createAccountErrorHandler,
  loginViaEmailErrorHandler,
  loginViaGoogleErrorHandler,
  udpateDataErrorHandler,
} from "./userSlice.errorsHandling";
import {
  SkillsType,
  updateUserInterface,
  updateReprotInterface,
  userSliceInitialState,
} from "./userSlice.types";
import {
  logOutInfo,
  newUserInfo,
  updateDisplayNameSuccess,
  updateUserAvatarSuccess,
  updateUserEmailSuccess,
  updateUserPasswordSuccess,
} from "./userSlice.toast";

const initialState: userSliceInitialState = {
  userInfo: null,
  userAuth: null,
  currentUserStats: null,
  previousUserStats: null,
  raitingData: null,
  isFetching: null,
  timer: { creativity: 0, hearing: 0, technique: 0, theory: 0 },
  providerData: {
    providerId: null,
    uid: null,
    displayName: null,
    email: null,
    phoneNumber: null,
    photoURL: null,
  },
};

export interface UserDataInterface {
  userInfo: { displayName: string };
  userAuth: string;
  currentUserStats: StatisticsDataInterface;
}

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
  return null;
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
    updateLocalTimer: (
      state,
      {
        payload,
      }: PayloadAction<{
        creativity: number;
        hearing: number;
        technique: number;
        theory: number;
      }>
    ) => {
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
      .addCase(updateUserStats.pending, (state) => {
        state.isFetching = "updateData";
      })
      .addCase(updateUserEmail.pending, (state) => {
        state.isFetching = "updateData";
      })
      .addCase(changeUserDisplayName.pending, (state) => {
        state.isFetching = "updateData";
      })
      .addCase(updateUserPassword.pending, (state) => {
        state.isFetching = "updateData";
      })
      .addCase(uploadUserAvatar.pending, (state) => {
        state.isFetching = "updateData";
      })
      .addCase(updateUserStats.rejected, (state, { error }) => {
        state.isFetching = null;
        udpateDataErrorHandler(error);
      })
      .addCase(changeUserDisplayName.rejected, (state, { error }) => {
        state.isFetching = null;
        udpateDataErrorHandler(error);
      })
      .addCase(uploadUserAvatar.rejected, (state) => {
        state.isFetching = null;
        avatarErrorHandler();
      })
      .addCase(updateUserEmail.rejected, (state, { error }) => {
        state.isFetching = null;
        loginViaEmailErrorHandler(error);
      })
      .addCase(updateUserPassword.rejected, (state, { error }) => {
        state.isFetching = null;
        loginViaEmailErrorHandler(error);
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
        state.isFetching = null;
        state.currentUserStats = payload.currentUserStats;
        state.previousUserStats = payload.previousUserStats;
        state.raitingData = payload.raitingData;
      })
      .addCase(logUserOff.fulfilled, (state) => {
        state.userAuth = null;
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
      .addCase(changeUserDisplayName.fulfilled, (state, action) => {
        state.isFetching = null;
        state.userInfo = {
          ...state.userInfo,
          displayName: action.payload,
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
          newUserInfo(action.payload.currentUserStats.points);
        }
      );
  },
});

export const { addUserAuth, addUserData, updateTimerTime, updateLocalTimer } =
  userSlice.actions;

export const selectUserAuth = (state: RootState) => state.user.userAuth;
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
