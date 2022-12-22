import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import { achievements } from "data/achievements";
import { User } from "firebase/auth";
import { calcExperience } from "helpers/calcExperience";

import { toast } from "react-toastify";
import {
  firebaseCreateAccountWithEmail,
  firebaseCreateUserDocumentFromAuth,
  firebaseGetUserData,
  firebaseGetUserName,
  firebaseLogUserOut,
  firebaseSetUserExerciseRaprot,
  firebaseSignInWithEmail,
  firebaseSignInWithGooglePopup,
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
import { signUpCredentials } from "../view/SingupView/SingupView";
import { getUserLvl } from "./helpers/getUserLvl";
import {
  createAccountErrorHandler,
  loginViaEmailErrorHandler,
  loginViaGoogleErrorHandler,
} from "./userErrorsHandling";

export interface userSliceInitialState {
  userAuth: string | null;
  userInfo: { displayName: string } | null;
  userData: StatisticsDataInterface | null;
  isFetching: "google" | "email" | "createAccount" | "updateData" | null;
}
const initialState: userSliceInitialState = {
  userInfo: null,
  userAuth: null,
  userData: null,
  isFetching: null,
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
      displayName: await firebaseGetUserName(userAuth),
    };
    const userData = await firebaseGetUserData(userAuth);
    const userName = userWithDisplayName.displayName;
    return { userInfo: { displayName: userName }, userAuth, userData };
  }
);

export const createAccount = createAsyncThunk(
  "user/createAccount",
  async ({ login, email, password }: signUpCredentials) => {
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
      lvl,
      lastReportDate,
      actualDayWithoutBreak,
      dayWithoutBreak,
      achievements,
    } = userData;

    const userLastReportDate = new Date(lastReportDate);
    const didPracticeToday = checkIsPracticeToday(userLastReportDate);

    const updatedActualDayWithoutBreak = didPracticeToday
      ? actualDayWithoutBreak
      : actualDayWithoutBreak + 1;

    const updatedUserData: StatisticsDataInterface = {
      time: {
        technique: time.technique + techniqueTime,
        theory: time.theory + theoryTime,
        hearing: time.hearing + hearingTime,
        creativity: time.creativity + creativeTime,
        longestSession:
          time.longestSession < sumTime ? sumTime : time.longestSession,
      },
      points: points + raiting.basePoints,
      lvl: getUserLvl(lvl, points + raiting.basePoints),
      sessionCount: didPracticeToday ? sessionCount : sessionCount + 1,
      habitsCount: habitsCount + raiting.bonusPoints.habitsCount,
      dayWithoutBreak:
        dayWithoutBreak < updatedActualDayWithoutBreak
          ? updatedActualDayWithoutBreak
          : dayWithoutBreak,
      maxPoints:
        maxPoints < raiting.basePoints ? raiting.basePoints : maxPoints,
      actualDayWithoutBreak: updatedActualDayWithoutBreak,
      achievements: achievements,
      lastReportDate: new Date().toISOString(),
    };

    const fetchAchievements = () =>
      fetch("/api/achievement", {
        method: "POST",
        body: JSON.stringify({
          statistics: updatedUserData,
          raiting,
          inputData,
        }),
      });

    const achievementCheck = async () => {
      const response = await fetchAchievements();
      const data = await response.json();
      return JSON.parse(data);
    };
    const newAchievements = await achievementCheck();

    const updatedUserDataWithAchievements: StatisticsDataInterface = {
      ...updatedUserData,
      achievements: [...newAchievements, ...updatedUserData.achievements],
    };

    firebaseSetUserExerciseRaprot(userAuth, raiting, new Date());
    firebaseUpdateUserStats(userAuth, updatedUserDataWithAchievements);

    return {
      updatedData: updatedUserDataWithAchievements,
      oldStatistic: userData,
    };
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
      .addCase(updateUserDataViaReport.rejected, (state) => {
        state.isFetching = null;
        toast.error("Nie udało się zaktualizować danych. Spróbuj jeszcze raz.");
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
        state.userData = payload.updatedData;
      })
      .addCase(logUserOff.fulfilled, (state) => {
        state.userAuth = null;
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
