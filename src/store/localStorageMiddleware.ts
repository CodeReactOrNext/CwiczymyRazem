import type { Middleware } from "@reduxjs/toolkit";

export const localStorageMiddleware: Middleware =
  (store) => (next) => (action) => {
    const result = next(action) as any; // yes,yes I know...
    if (
      // updateLocalTimer both hydrates the timer on login and zeroes it when the
      // player resets the Free Timer. Without it the reset lived in memory only,
      // and the next reload restored the time it was meant to clear.
      result.type.startsWith("user/updateLocalTimer") ||
      result.type.startsWith("user/updateTimerTime") ||
      result.type.startsWith("user/increaseTimerTime") ||
      result.type.startsWith("user/updateUserStats/fulfilled")
    ) {
      const timer = store.getState().user.timer;
      localStorage.setItem("userSlice.timer", JSON.stringify(timer));
    }

    return result;
  };
