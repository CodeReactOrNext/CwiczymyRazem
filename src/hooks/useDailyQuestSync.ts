import { selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import { ensureQuestForToday, syncDailyQuestAction } from "feature/user/store/userSlice.questActions";
import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { getMsUntilNextLocalDay } from "utils/gameLogic/localDay";

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
 *
 * It also arms the clock the rollover was missing. Every trigger the quest had
 * was an event the player caused — logging in, mounting the dashboard widget,
 * refocusing the tab, reporting a session — so a window left open *and focused*
 * across the player's midnight fired none of them and went on showing
 * yesterday's set, completed and claimed, until something happened to it. That
 * is the "it doesn't reset at local time" report: the day key itself was right,
 * nothing ever re-read it.
 */
const useDailyQuestSync = () => {
  const dispatch = useAppDispatch();
  const userAuth = useAppSelector(selectUserAuth);
  // The quest day is resolved in the zone stored on the profile, so the
  // midnight to wake up at is that zone's, not the device's (see `questDay`).
  const timeZone = useAppSelector(selectCurrentUserStats)?.timeZone;
  const lastSyncedAt = useRef(0);

  useEffect(() => {
    if (!userAuth) return;

    const sync = () => {
      if (document.visibilityState !== "visible") return;

      const now = Date.now();
      if (now - lastSyncedAt.current < MIN_SYNC_INTERVAL) return;
      lastSyncedAt.current = now;

      dispatch(syncDailyQuestAction());
      // A tab that has been open across the quest-day boundary is still
      // showing yesterday's set — until now only mounting the dashboard widget
      // drew the new one. This is a no-op on a quest that is already current.
      dispatch(ensureQuestForToday());
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

  useEffect(() => {
    if (!userAuth) return;

    let timer: ReturnType<typeof setTimeout>;

    // Re-armed on every fire rather than left on an interval: the gap to the
    // next boundary has to be recomputed anyway (DST, a zone arriving with the
    // profile, a machine that slept through the deadline and wakes up past it),
    // and `ensureQuestForToday` writes nothing when the quest is already
    // current, so an early wake-up costs one read at most.
    const arm = () => {
      timer = setTimeout(() => {
        // A second past midnight, not on it — a timer that fires a hair early
        // would read the old day key and roll over a day late.
        dispatch(ensureQuestForToday());
        arm();
      }, getMsUntilNextLocalDay(new Date(), timeZone) + 1000);
    };

    arm();

    return () => clearTimeout(timer);
  }, [userAuth, timeZone, dispatch]);
};

export default useDailyQuestSync;
