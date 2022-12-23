import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import { User } from "firebase/auth";
import Router from "next/router";
import { toast } from "react-toastify";
import {
  auth,
  firebaseCreateAccountWithEmail,
  firebaseCreateUserDocumentFromAuth,
  firebaseGetUserData,
  firebaseGetUserName,
  firebaseGetUserProviderData,
  firebaseLogUserOut,
  firebaseReauthenticateUser,
  firebaseSetUserExceriseRaprot,
  firebaseSignInWithEmail,
  firebaseSignInWithGooglePopup,
  firebaseUpdateUserDisplayName,
  firebaseUpdateUserEmail,
  firebaseUpdateUserPassword,
  firebaseUpdateUserStats,
} from "utils/firebase/firebase.utils";
import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";
import { RootState } from "../../../store/store";
import { checkIsPracticeToday } from "../view/ReportView/helpers/checkIsPracticeToday";
import { convertInputTime } from "../view/ReportView/helpers/convertInputTime";
import {
  ReportDataInterface,
  ReportFormikInterface,
} from "../view/ReportView/ReportView.types";
import { signUpCredentials as SignUpCredentials } from "../view/SingupView/SingupView";
import {
  createAccountErrorHandler,
  loginViaEmailErrorHandler,
  loginViaGoogleErrorHandler,
} from "./userErrorsHandling";

export interface providerData {
  providerId: string | null;
  uid: string | null;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
}

export interface userSliceInitialState {
  userAuth: string | null;
  userInfo: { displayName: string } | null;
  userData: StatisticsDataInterface | null;
  isFetching: "google" | "email" | "createAccount" | "updateData" | null;
  providerData: providerData;
}
const initialState: userSliceInitialState = {
  userInfo: null,
  userAuth: null,
  userData: null,
  isFetching: null,
  providerData: {
    providerId: null,
    uid: null,
    displayName: null,
    email: null,
    phoneNumber: null,
    photoURL: null,
  },
};

export const logInViaGoogle = createAsyncThunk(
  "user/logInViaGoogle",
  async (parameters, thunkAPI) => {
    const { user } = await firebaseSignInWithGooglePopup();
    const userAuth = await firebaseCreateUserDocumentFromAuth(user);
    const userData = await firebaseGetUserData(userAuth);
    const userName = user.displayName!;
    return { userInfo: { displayName: userName }, userAuth, userData };
  }
);

export const logInViaEmail = createAsyncThunk(
  "user/loginViaEmail",
  async ({ email, password }: { email: string; password: string }) => {
    const { user } = await firebaseSignInWithEmail(email, password);
    const userAuth = await firebaseCreateUserDocumentFromAuth(user);
    const userData = await firebaseGetUserData(userAuth);
    const userName = user.displayName!;
    return { userInfo: { displayName: userName }, userAuth, userData };
  }
);

export const autoLogIn = createAsyncThunk(
  "user/autoLogin",
  async (user: User) => {
    const userAuth = await firebaseCreateUserDocumentFromAuth(user);
    const userWithDisplayName = {
      ...user,
      displayName: await firebaseGetUserName(),
    };
    const userData = await firebaseGetUserData(userAuth);
    const userName = userWithDisplayName.displayName;
    return { userInfo: { displayName: userName }, userAuth, userData };
  }
);

export const createAccount = createAsyncThunk(
  "user/createAccount",
  async ({ login, email, password }: SignUpCredentials) => {
    const { user } = await firebaseCreateAccountWithEmail(email, password);
    const userWithDisplayName = { ...user, displayName: login };
    const userAuth = await firebaseCreateUserDocumentFromAuth(
      userWithDisplayName
    );
    const userData = await firebaseGetUserData(userAuth);
    const userName = userWithDisplayName.displayName;
    return { userInfo: { displayName: userName }, userAuth, userData };
  }
);

export const updateDisplayName = createAsyncThunk(
  "user/updateAccount",
  async ({ login }: SignUpCredentials) => {
    const userAuth = await firebaseCreateUserDocumentFromAuth(
      auth.currentUser!
    );

    if (login && login.length > 0) {
      await firebaseUpdateUserDisplayName(userAuth, login);
    }

    const userData = await firebaseGetUserData(userAuth);
    return { userInfo: { displayName: login }, userAuth, userData };
  }
);

export interface updateUserInterface extends SignUpCredentials {
  newEmail?: string;
  newPassword?: string;
}

export const updateUserEmail = createAsyncThunk(
  "user/updateUserEmail",
  async ({ email, password, newEmail }: updateUserInterface) => {
    // reauthenticateUser({ email, password } as SignUpCredentials);
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

interface updateUserDataViaReportProps {
  userAuth: string;
  inputData: ReportFormikInterface;
  raiting: ReportDataInterface;
}

export const updateUserDataViaReport = createAsyncThunk(
  "user/updateUserDataViaReport",
  async ({ userAuth, inputData, raiting }: updateUserDataViaReportProps) => {
    const userData = await firebaseGetUserData(userAuth);

    const { techniqueTime, theoryTime, hearingTime, creativeTime, sumTime } =
      convertInputTime(inputData);

    const {
      time,
      habitsCount,
      maxPoints,
      sessionCount,
      points,
      lastReportDate,
      actualDayWithoutBreak,
      dayWithoutBreak,
    } = userData;

    const userLastReportDate = new Date(lastReportDate);
    const didPracticeToday = checkIsPracticeToday(userLastReportDate);

    const updatedActualDayWithoutBreak = didPracticeToday
      ? actualDayWithoutBreak
      : actualDayWithoutBreak + 1;

    const updatedUserData = {
      time: {
        technique: time.technique + techniqueTime,
        theory: time.theory + theoryTime,
        hearing: time.hearing + hearingTime,
        creativity: time.creativity + creativeTime,
        longestSession:
          time.longestSession < sumTime ? sumTime : time.longestSession,
      },
      lvl: 1,
      points: points + raiting.basePoints,
      sessionCount: didPracticeToday ? sessionCount : sessionCount + 1,
      habitsCount: habitsCount + raiting.bonusPoints.habitsCount,
      dayWithoutBreak:
        dayWithoutBreak < updatedActualDayWithoutBreak
          ? updatedActualDayWithoutBreak
          : dayWithoutBreak,
      maxPoints:
        maxPoints < raiting.basePoints ? raiting.basePoints : maxPoints,
      achievements: [],
      actualDayWithoutBreak: updatedActualDayWithoutBreak,
      lastReportDate: new Date().toISOString(),
    };

    firebaseSetUserExceriseRaprot(userAuth, raiting, new Date());
    firebaseUpdateUserStats(userAuth, updatedUserData);
    return updatedUserData;
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
      state.userData = action.payload;
    },
    addPracticeData: (state, action) => {
      state.userData = action.payload;
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
      .addCase(updateUserDataViaReport.pending, (state) => {
        state.isFetching = "updateData";
      })
      .addCase(updateUserEmail.pending, (state) => {
        state.isFetching = "updateData";
      })
      .addCase(updateUserPassword.pending, (state) => {
        state.isFetching = "updateData";
      })
      .addCase(updateUserDataViaReport.rejected, (state) => {
        state.isFetching = null;
        toast.error("Nie udało się zaktualizować danych. Spróbuj jeszcze raz.");
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
      .addCase(updateUserDataViaReport.fulfilled, (state, { payload }) => {
        state.isFetching = null;
        state.userData = payload;
      })
      .addCase(logUserOff.fulfilled, (state) => {
        state.userAuth = null;
      })
      .addCase(getUserProvider.fulfilled, (state, action) => {
        state.isFetching = null;
        state.providerData = action.payload;
      })
      .addCase(updateUserEmail.fulfilled, (state) => {
        toast.success("Zmieniono email");
        state.isFetching = null;
      })
      .addCase(updateUserPassword.fulfilled, (state) => {
        toast.success("Zmieniono hasło");
        state.isFetching = null;
      })
      .addCase(updateDisplayName.fulfilled, (state, action) => {
        state.isFetching = null;
        state.userInfo = action.payload.userInfo;
        state.userData = action.payload.userData;
        state.userAuth = action.payload.userAuth;
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
          state.userData = action.payload.userData;
          state.userAuth = action.payload.userAuth;
        }
      );
  },
});

export const selectUserAuth = (state: RootState) => state.user.userAuth;
export const selectUserData = (state: RootState) => state.user.userData;
export const selectIsFetching = (state: RootState) => state.user.isFetching;
export const selectUserName = (state: RootState) =>
  state.user.userInfo?.displayName;
export const { addUserAuth, addUserData } = userSlice.actions;

export default userSlice.reducer;
