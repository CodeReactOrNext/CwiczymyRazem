import type { StatisticsDataInterface, userSliceInitialState } from "types/api.types";

/**
 * The last profile this browser loaded, kept so a returning player lands in the
 * app straight away instead of behind the loading shell.
 *
 * A full page load used to wait for two things in a row before rendering
 * anything: Firebase restoring its user from IndexedDB (a network token refresh
 * once the ID token is over an hour old), then `/api/user/getUserData` — a
 * serverless round trip, cold start included. Both still run; the app just no
 * longer waits for them. `useAuthSync` restores this copy as soon as the NextAuth
 * session names the same uid, then swaps in the fresh profile, or signs the
 * player out if Firebase no longer knows them.
 *
 * Keyed to the uid it was saved for: a copy belonging to someone else is never
 * shown, and signing out deletes it.
 */

const STORAGE_KEY = "rq:user-snapshot";
// Bump when the stored shape changes, so an old copy is ignored, not misread.
const VERSION = 1;
// Past this the copy is old enough to mislead (streaks, level) more than it helps.
export const USER_SNAPSHOT_MAX_AGE = 14 * 24 * 60 * 60 * 1000;

export interface UserSnapshot {
  userAuth: string;
  userInfo: userSliceInitialState["userInfo"];
  currentUserStats: StatisticsDataInterface;
}

interface StoredUserSnapshot extends UserSnapshot {
  v: number;
  savedAt: number;
}

export const readUserSnapshot = (
  uid: string,
  now = Date.now(),
): UserSnapshot | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as Partial<StoredUserSnapshot>;
    if (
      stored.v !== VERSION ||
      stored.userAuth !== uid ||
      !stored.currentUserStats ||
      typeof stored.savedAt !== "number" ||
      now - stored.savedAt > USER_SNAPSHOT_MAX_AGE
    ) {
      return null;
    }

    return {
      userAuth: stored.userAuth,
      userInfo: stored.userInfo ?? null,
      currentUserStats: stored.currentUserStats,
    };
  } catch {
    return null;
  }
};

export const writeUserSnapshot = (snapshot: UserSnapshot, now = Date.now()) => {
  try {
    const stored: StoredUserSnapshot = { ...snapshot, v: VERSION, savedAt: now };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage full or blocked (private window): the next load just waits as before.
  }
};

export const clearUserSnapshot = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored that could be shown.
  }
};
