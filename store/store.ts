import {
  configureStore,
  ThunkAction,
  Action,
  getDefaultMiddleware,
} from "@reduxjs/toolkit";
import usersSlice from "../feature/user/store/userSlice";

export const store = configureStore({
  reducer: { user: usersSlice },
  // middleware: getDefaultMiddleware({
  //   serializableCheck: false,
  // }),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

// middleware: getDefaultMiddleware({
//   serializableCheck: {
//       ignoredActions: [actionTypes.LOGIN]
//   }
