import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../../store/store";

const initialState = {
  userAuth: null,
  userData: null,
};

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
});

export const selectUserAuth = (state: RootState) => state.user.userAuth;
export const selectUserData = (state: RootState) => state.user.userData;
export const { logOut, addUserAuth, addUserData } = userSlice.actions;

export default userSlice.reducer;
