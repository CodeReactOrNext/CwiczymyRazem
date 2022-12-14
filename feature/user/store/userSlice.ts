import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import { User } from "firebase/auth";
import Router from "next/router";
import {
  firebaseCreateAccountWithEmail,
  firebaseCreateUserDocumentFromAuth,
  firebaseGetUserData,
  firebaseGetUserName,
  firebaseLogUserOut,
  firebaseSignInWithEmail,
  firebaseSignInWithGooglePopup,
} from "utils/firebase/firebase.utils";
import { statisticsDataInterface } from "utils/firebase/userStatisticsInitialData";
import { RootState } from "../../../store/store";
import { signUpCredentials } from "../view/SingupView/SingupView";
import {
  createAccountErrorHandler,
  loginViaEmailErrorHandler,
  loginViaGoogleErrorHandler,
} from "./userErrorsHandling";

export interface userSliceInitialState {
  userAuth: string | null;
  userInfo: { displayName: string } | null;
  userData: statisticsDataInterface | null;
  isFetching: "google" | "email" | "createAccount" | null;
  error: string | null;
}
const initialState: userSliceInitialState = {
  userInfo: null,
  userAuth: null,
  userData: null,
  isFetching: null,
  error: null,
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
          Router.push("/");
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
