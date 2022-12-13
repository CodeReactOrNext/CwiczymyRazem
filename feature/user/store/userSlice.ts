import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import Router from "next/router";
import {
  createAccountWithEmail,
  createUserDocumentFromAuth,
  getUserData,
  signInWithEmail,
  signInWithGooglePopup,
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
    const { user } = await signInWithGooglePopup();
    const userAuth = await createUserDocumentFromAuth(user);
    const userData = await getUserData(userAuth);
    const userName = user.displayName!;
    return { userInfo: { displayName: userName }, userAuth, userData };
  }
);

export const logInViaEmail = createAsyncThunk(
  "user/loginViaEmail",
  async ({ email, password }: { email: string; password: string }) => {
    const { user } = await signInWithEmail(email, password);
    const userAuth = await createUserDocumentFromAuth(user);
    const userData = await getUserData(userAuth);
    const userName = user.displayName!;
    return { userInfo: { displayName: userName }, userAuth, userData };
  }
);

export const createAccount = createAsyncThunk(
  "user/createAccount",
  async ({ login, email, password }: signUpCredentials) => {
    const { user } = await createAccountWithEmail(email, password);
    const userWithDisplayName = { ...user, displayName: login };
    const userAuth = await createUserDocumentFromAuth(userWithDisplayName);
    const userData = await getUserData(userAuth);
    const userName = userWithDisplayName.displayName;
    return { userInfo: { displayName: userName }, userAuth, userData };
  }
);

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logOut: (state) => {
      state.userAuth = null;
    },
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
      .addMatcher(
        isAnyOf(
          logInViaGoogle.fulfilled,
          logInViaEmail.fulfilled,
          createAccount.fulfilled
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
export const { logOut, addUserAuth, addUserData } = userSlice.actions;

export default userSlice.reducer;
