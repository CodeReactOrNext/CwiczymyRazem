import type { Middleware } from "@reduxjs/toolkit";

export const localStorageMiddleware: Middleware =
  (store) => (next) => (action) => {
    const result = next(action) as any; // yes,yes I know...
    if (
      result.type.startsWith("user/updateTimerTime") ||
      result.type.startsWith("user/updateUserStats/fulfilled")
    ) {
      const timer = store.getState().user.timer;
      localStorage.setItem("userSlice.timer", JSON.stringify(timer));
    }
  
    return result;
  };
