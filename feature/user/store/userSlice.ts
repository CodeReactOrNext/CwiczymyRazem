import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { User } from "firebase/auth";
import Router from "next/router";
import { toast } from "react-toastify";
import {
  createUserDocumentFromAuth,
  getUserData,
  signInWithGooglePopup,
} from "utils/firebase/firebase.utils";
import { statisticsDataInterface } from "utils/firebase/userStatisticsInitialData";
import { RootState } from "../../../store/store";

const initialState: {
  userAuth: string | null;
  userInfo: User | null;
  userData: statisticsDataInterface | null;
  isFetching: boolean;
  error: string | null;
} = {
  userInfo: null,
  userAuth: null,
  userData: null,
  isFetching: false,
  error: null,
};

export const logInViaGoogle = createAsyncThunk(
  "user/logInViaGoogle",
  async (parameters, thunkAPI) => {
    const { user } = await signInWithGooglePopup();
    const userAuth = await createUserDocumentFromAuth(user);
    const userData = await getUserData(userAuth);
    return { user, userAuth, userData };
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
        state.isFetching = true;
      })
      .addCase(logInViaGoogle.fulfilled, (state, action) => {
        state.isFetching = false;
        state.userInfo = action.payload.user;
        state.userData = action.payload.userData;
        state.userAuth = action.payload.userAuth;
        Router.push("/");
        
      })
      .addCase(logInViaGoogle.rejected, (state, { error }) => {
        state.isFetching = false;
        if (error.code === "auth/popup-closed-by-user") {
          toast.error("Nie udało się zalogować - zamknięto okno logowania ");
          return;
        }
        if (error.code === "auth/timeout") {
          toast.error("Nie udało się zalogować - błąd połączenia");
          return;
        }
        toast.error("Nie udało się zalogować");
      });
  },
});

export const selectUserAuth = (state: RootState) => state.user.userAuth;
export const selectUserData = (state: RootState) => state.user.userData;
export const selectIsFetching = (state: RootState) => state.user.isFetching;
export const selectUserName = (state: RootState) =>
  state.user.userInfo!.displayName;
export const { logOut, addUserAuth, addUserData } = userSlice.actions;

export default userSlice.reducer;
