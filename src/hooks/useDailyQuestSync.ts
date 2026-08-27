import { selectUserAuth } from "feature/user/store/userSlice";
import { syncDailyQuestAction } from "feature/user/store/userSlice.questActions";
import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

/** A tab switch is not worth a document read every time. */
const MIN_SYNC_INTERVAL = 30_000;

/**
 * Reconciles the daily quest with the server whenever a client comes back to
 * life: a tab returning to the foreground, a window regaining focus, a device
 * coming back online.
 *
 * A client that has been sitting in the background for hours holds a quest from
 * whenever it was last used. Without this, the first thing it does on the way
 * back — completing a task, mounting the widget — is publish that stale copy,
 * which is how tasks completed elsewhere ended up "reset". The sync merges both
 * directions, so the store catches up before anything is written.
 */
const useDailyQuestSync = () => {
  const dispatch = useAppDispatch();
  const userAuth = useAppSelector(selectUserAuth);
  const lastSyncedAt = useRef(0);

  useEffect(() => {
    if (!userAuth) return;

    const sync = () => {
      if (document.visibilityState !== "visible") return;

      const now = Date.now();
      if (now - lastSyncedAt.current < MIN_SYNC_INTERVAL) return;
      lastSyncedAt.current = now;

      dispatch(syncDailyQuestAction());
    };

    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("online", sync);

    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("online", sync);
    };
  }, [userAuth, dispatch]);
};

export default useDailyQuestSync;
