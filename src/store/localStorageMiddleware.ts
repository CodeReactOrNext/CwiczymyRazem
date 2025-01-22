import type { Middleware } from "@reduxjs/toolkit";

export const localStorageMiddleware: Middleware =
  (store) => (next) => (action) => {
    const result = next(action) as any; // yes,yes I know...
    if (
      result.type.startsWith("user/updateTimerTime") ||
      result.type.startsWith("user/updateUserStats/fulfilled") ||
      result.type.startsWith("user/changeTheme")
    ) {
      const timer = store.getState().user.timer;
      localStorage.setItem("userSlice.timer", JSON.stringify(timer));
    }
    if (result.type.startsWith("user/changeTheme")) {
      const theme = store.getState().user.theme;
      localStorage.setItem("userSlice.theme", JSON.stringify(theme));
    }
    return result;
  };
