import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import usersSlice from "../feature/user/store/userSlice";

export const store = configureStore({
  reducer: { user: usersSlice },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
