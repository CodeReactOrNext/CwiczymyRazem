import { Middleware } from "@reduxjs/toolkit";

export const localStorageMiddleware: Middleware =
  (store) => (next) => (action) => {
    const result = next(action);
    console.log(result);
    if (
      result.type.startsWith("user/updateTimerTime") ||
      result.type.startsWith("user/updateUserStats/fulfilled")
    ) {
      const state = store.getState().user.timer;
      localStorage.setItem("userSlice.timer", JSON.stringify(state));
    }
    return result;
  };
