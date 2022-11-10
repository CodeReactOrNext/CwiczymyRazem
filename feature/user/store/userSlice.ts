import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../../store/store";

const initialState = {
  userAuth: null,
  userName: null,
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
    addUserName: (state, action) => {
      state.userName = action.payload;
    },
  },
});

export const selectUserAuth = (state: RootState) => state.user.userAuth;
export const selectUserName = (state: RootState) => state.user.userName;
export const { logOut, addUserAuth, addUserName } = userSlice.actions;

export default userSlice.reducer;
