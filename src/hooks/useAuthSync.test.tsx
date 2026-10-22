// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook, waitFor } from "@testing-library/react";
import userReducer from "feature/user/store/userSlice";
import { readUserSnapshot, writeUserSnapshot } from "feature/user/store/userSnapshot";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import type { StatisticsDataInterface } from "types/api.types";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signOut = vi.fn();
const firebaseGetCurrentUser = vi.fn();
const fetchUserData = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "uid-1" } }, status: "authenticated" }),
  signOut: (...args: unknown[]) => signOut(...args),
  signIn: vi.fn(),
}));

vi.mock("utils/firebase/client/firebase.utils", () => ({
  firebaseGetCurrentUser: (...args: unknown[]) => firebaseGetCurrentUser(...args),
}));

vi.mock("feature/user/store/services/userServices", () => ({
  fetchUserData: (...args: unknown[]) => fetchUserData(...args),
  fetchReport: vi.fn(),
  isAuthRefusal: (error: { refused?: boolean } | null) => error?.refused === true,
}));

// Initializes Firebase Auth at import time; none of it runs here.
vi.mock("feature/settings/services/settings.service", () => ({}));

vi.mock("feature/user/store/userSlice.questActions", () => ({
  initializeDailyQuestAction: () => ({ type: "test/initializeDailyQuest" }),
}));

import useAuthSync from "./useAuthSync";

// The first try plus the immediate retries before the hook waits for the network.
const MAX_QUICK_ATTEMPTS = 2;

const stats = (points: number) =>
  ({ points, lvl: 1 }) as unknown as StatisticsDataInterface;

const setup = () => {
  const store = configureStore({
    reducer: { user: userReducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false }),
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  renderHook(() => useAuthSync(), { wrapper });
  return store;
};

describe("useAuthSync with a saved profile", () => {
  beforeEach(() => {
    window.localStorage.clear();
    signOut.mockReset();
    firebaseGetCurrentUser.mockReset();
    fetchUserData.mockReset();
  });

  it("shows the saved copy at once, then replaces it with the fresh profile", async () => {
    writeUserSnapshot({ userAuth: "uid-1", userInfo: { displayName: "Old" }, currentUserStats: stats(10) });

    let resolveUser: (user: unknown) => void = () => {};
    firebaseGetCurrentUser.mockReturnValue(new Promise((resolve) => (resolveUser = resolve)));
    fetchUserData.mockResolvedValue({
      userAuth: "uid-1",
      userInfo: { displayName: "Fresh" },
      currentUserStats: stats(50),
    });

    const store = setup();

    // Restored before Firebase has answered.
    expect(store.getState().user.userAuth).toBe("uid-1");
    expect(store.getState().user.currentUserStats?.points).toBe(10);
    expect(store.getState().user.isUserSnapshot).toBe(true);

    await act(async () => resolveUser({ uid: "uid-1" }));

    await waitFor(() => expect(store.getState().user.isUserSnapshot).toBe(false));
    expect(store.getState().user.currentUserStats?.points).toBe(50);
    expect(store.getState().user.userInfo?.displayName).toBe("Fresh");
    expect(signOut).not.toHaveBeenCalled();
  });

  it("signs out and forgets the copy when Firebase no longer knows the player", async () => {
    writeUserSnapshot({ userAuth: "uid-1", userInfo: null, currentUserStats: stats(10) });
    firebaseGetCurrentUser.mockResolvedValue(null);

    setup();

    await waitFor(() => expect(signOut).toHaveBeenCalled());
    expect(readUserSnapshot("uid-1")).toBeNull();
    expect(fetchUserData).not.toHaveBeenCalled();
  });

  it("keeps the player in when the network is down, and retries once it is back", async () => {
    writeUserSnapshot({ userAuth: "uid-1", userInfo: null, currentUserStats: stats(10) });
    firebaseGetCurrentUser.mockResolvedValue({ uid: "uid-1" });
    fetchUserData.mockRejectedValue(new Error("Network Error"));

    const store = setup();

    // Both quick retries spent.
    await waitFor(() => expect(fetchUserData).toHaveBeenCalledTimes(MAX_QUICK_ATTEMPTS));
    expect(signOut).not.toHaveBeenCalled();
    expect(store.getState().user.currentUserStats?.points).toBe(10);
    expect(store.getState().user.autoLogInFailed).toBeFalsy();
    expect(readUserSnapshot("uid-1")).not.toBeNull();

    fetchUserData.mockResolvedValue({
      userAuth: "uid-1",
      userInfo: { displayName: "Fresh" },
      currentUserStats: stats(50),
    });
    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() => expect(store.getState().user.isUserSnapshot).toBe(false));
    expect(store.getState().user.currentUserStats?.points).toBe(50);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("signs out at once when the server refuses the session", async () => {
    writeUserSnapshot({ userAuth: "uid-1", userInfo: null, currentUserStats: stats(10) });
    firebaseGetCurrentUser.mockResolvedValue({ uid: "uid-1" });
    fetchUserData.mockRejectedValue({ refused: true });

    const store = setup();

    await waitFor(() => expect(signOut).toHaveBeenCalled());
    expect(fetchUserData).toHaveBeenCalledTimes(1);
    expect(readUserSnapshot("uid-1")).toBeNull();
    expect(store.getState().user.userAuth).toBeNull();
  });

  it("ignores a copy saved for someone else", () => {
    writeUserSnapshot({ userAuth: "uid-2", userInfo: null, currentUserStats: stats(10) });
    firebaseGetCurrentUser.mockReturnValue(new Promise(() => {}));

    const store = setup();

    expect(store.getState().user.userAuth).toBeNull();
  });

  it("saves the confirmed profile for the next visit", async () => {
    firebaseGetCurrentUser.mockResolvedValue({ uid: "uid-1" });
    fetchUserData.mockResolvedValue({
      userAuth: "uid-1",
      userInfo: { displayName: "Fresh" },
      currentUserStats: stats(50),
    });

    setup();

    await waitFor(() => expect(readUserSnapshot("uid-1")?.currentUserStats.points).toBe(50), {
      timeout: 3000,
    });
  });
});
