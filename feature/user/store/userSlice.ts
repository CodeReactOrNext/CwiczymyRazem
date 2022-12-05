import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { User } from "firebase/auth";
import Router from "next/router";
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
} = {
  userInfo: null,
  userAuth: null,
  userData: null,
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
        //Loadgin Screen
      })
      .addCase(logInViaGoogle.fulfilled, (state, action) => {
        state.userInfo = action.payload.user;
        state.userData = action.payload.userData;
        state.userAuth = action.payload.userAuth;
        Router.push("/");
      })
      .addCase(logInViaGoogle.rejected, (state, action) => {
        //errorr handling
        console.log(action.payload);
      });
  },
});

export const selectUserAuth = (state: RootState) => state.user.userAuth;
export const selectUserData = (state: RootState) => state.user.userData;
export const { logOut, addUserAuth, addUserData } = userSlice.actions;

export default userSlice.reducer;
