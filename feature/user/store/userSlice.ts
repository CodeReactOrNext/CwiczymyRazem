import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import { User } from "firebase/auth";
import { toast } from "react-toastify";
import {
  auth,
  firebaseCreateAccountWithEmail,
  firebaseCreateUserDocumentFromAuth,
  firebaseGetUserData,
  firebaseGetUserDocument,
  firebaseGetUserName,
  firebaseGetUserProviderData,
  firebaseLogUserOut,
  firebaseReauthenticateUser,
  firebaseSignInWithEmail,
  firebaseSignInWithGooglePopup,
  firebaseUpdateUserDisplayName,
  firebaseUpdateUserEmail,
  firebaseUpdateUserPassword,
  firebaseUploadAvatar,
} from "utils/firebase/firebase.utils";
import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";
import { RootState } from "../../../store/store";
import { ReportDataInterface } from "../view/ReportView/ReportView.types";
import { SignUpCredentials } from "../view/SingupView/SingupView";
import {
  createAccountErrorHandler,
  loginViaEmailErrorHandler,
  loginViaGoogleErrorHandler,
} from "./userErrorsHandling";
import {
  updateUserInterface,
  updateUserStatsProps,
  userSliceInitialState,
} from "./userSlice.types";

const initialState: userSliceInitialState = {
  userInfo: null,
  userAuth: null,
  currentUserStats: null,
  previousUserStats: null,
  raitingData: null,
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
    const currentUserStats = await firebaseGetUserData(userAuth);
    const userName = user.displayName!;
    return { userInfo: { displayName: userName }, userAuth, currentUserStats };
  }
);

export const logInViaEmail = createAsyncThunk(
  "user/loginViaEmail",
  async ({ email, password }: { email: string; password: string }) => {
    const { user } = await firebaseSignInWithEmail(email, password);
    const userAuth = await firebaseCreateUserDocumentFromAuth(user);
    const currentUserStats = await firebaseGetUserData(userAuth);
    const userName = user.displayName!;
    return { userInfo: { displayName: userName }, userAuth, currentUserStats };
  }
);

export const autoLogIn = createAsyncThunk(
  "user/autoLogin",
  async (user: User) => {
    const userAuth = await firebaseCreateUserDocumentFromAuth(user);
    // const userWithDisplayName = {
    //   ...user,
    //   displayName: await firebaseGetUserName(userAuth),
    // };
    // const userName = userWithDisplayName.displayName;
    const currentUserStats = await firebaseGetUserData(userAuth);
    const userDoc = await firebaseGetUserDocument(auth.currentUser?.uid!);
    return {
      userInfo: { displayName: userDoc?.displayName, avatar: userDoc?.avatar },
      userAuth,
      currentUserStats,
    };
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
    const currentUserStats = await firebaseGetUserData(userAuth);
    const userName = userWithDisplayName.displayName;
    return { userInfo: { displayName: userName }, userAuth, currentUserStats };
  }
);

export const updateDisplayName = createAsyncThunk(
  "user/updateDisplayName",
  async ({ login }: SignUpCredentials) => {
    const userAuth = await firebaseCreateUserDocumentFromAuth(
      auth.currentUser!
    );

    if (login && login.length > 0) {
      await firebaseUpdateUserDisplayName(userAuth, login);
    }

    const currentUserStats = await firebaseGetUserData(userAuth);
    return { userInfo: { displayName: login }, userAuth, currentUserStats };
  }
);

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

export const updateUserStats = createAsyncThunk(
  "user/updateUserStats",
  async ({ userAuth, inputData }: updateUserStatsProps) => {
    const fetchReport = () =>
      fetch("/api/report", {
        method: "POST",
        body: JSON.stringify({ userAuth, inputData }),
      });
    const statistics = await (await fetchReport()).json();

    return JSON.parse(statistics) as {
      currentUserStats: StatisticsDataInterface;
      previousUserStats: StatisticsDataInterface;
      raitingData: ReportDataInterface;
    };
  }
);

export const uploadUserAvatar = createAsyncThunk(
  "user/uploadUserAvatar",
  async (avatar: Blob) => {
    const avatarUrl = await firebaseUploadAvatar(avatar);
    return { avatar: avatarUrl };
  }
);

// export const getUserAvatar = createAsyncThunk(
//   "user/updateUserAvatar",
//   async (imageFile: Blob) => {
//     const avatarUrl = await firebaseUploadAvatar(imageFile);
//     return { userInfo: { avatar: avatarUrl } };
//   }
// );

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
      .addCase(updateDisplayName.pending, (state) => {
        state.isFetching = "updateData";
      })
      .addCase(updateUserPassword.pending, (state) => {
        state.isFetching = "updateData";
      })
      .addCase(uploadUserAvatar.pending, (state) => {
        state.isFetching = "updateData";
      })
      .addCase(updateUserStats.rejected, (state) => {
        state.isFetching = null;
        toast.error("Nie udało się zaktualizować danych. Spróbuj jeszcze raz.");
      })
      .addCase(updateDisplayName.rejected, (state) => {
        state.isFetching = null;
        toast.error("Nie udało się zaktualizować danych. Spróbuj jeszcze raz.");
      })
      .addCase(uploadUserAvatar.rejected, (state) => {
        state.isFetching = null;
        toast.error("Awatar może mieć maksymalnie 250px na 250px.");
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
        state.isFetching = null;
        state.currentUserStats = payload.currentUserStats;
        state.previousUserStats = payload.previousUserStats;
        state.raitingData = payload.raitingData;
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
        state.userInfo = { ...state.userInfo, ...action.payload.userInfo };
        state.currentUserStats = action.payload.currentUserStats;
        state.userAuth = action.payload.userAuth;
      })
      .addCase(uploadUserAvatar.fulfilled, (state, action) => {
        state.isFetching = null;
        state.userInfo = { ...state.userInfo, ...action.payload.avatar };
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
        }
      );
  },
});

export const selectUserAuth = (state: RootState) => state.user.userAuth;
export const selectCurrentUserStats = (state: RootState) =>
  state.user.currentUserStats;
export const selectPreviousUserStats = (state: RootState) =>
  state.user.previousUserStats;
export const selectIsFetching = (state: RootState) => state.user.isFetching;
export const selectRaitingData = (state: RootState) => state.user.raitingData;
export const selectUserName = (state: RootState) =>
  state.user.userInfo?.displayName;
export const selectUserAvatar = (state: RootState) =>
  state.user.userInfo?.avatar;

export const { addUserAuth, addUserData } = userSlice.actions;

export default userSlice.reducer;
