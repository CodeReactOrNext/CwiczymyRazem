import { invalidateActivityLogsCache } from "feature/logs/services/getUserRaprotsLogs.service";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { db } from "utils/firebase/client/firebase.utils";

/** A tab switch is not worth a document read every time. */
const MIN_CHECK_INTERVAL = 30_000;

/**
 * Notices sessions reported from another device (phone, desktop app) while
 * this tab sat in the background, and returns a nonce that bumps when it does.
 *
 * User stats have no live listener, so a tab left open on the computer kept
 * showing today unticked after practicing on the phone until a full reload.
 * Coming back to the tab costs one user-document read; the activity log (one
 * read per report) is only refetched when `sessionCount` actually grew. That
 * counter moves on the first report of a day — exactly when today's tick and
 * the streak change.
 */
export const useRemoteSessionRefresh = (
  userAuth: string | null | undefined,
  localSessionCount: number
) => {
  const [nonce, setNonce] = useState(0);
  const knownSessionCount = useRef(localSessionCount);
  const lastCheckedAt = useRef(0);

  // A report sent from this tab already refreshes the log through the store;
  // remembering it keeps the next focus from refetching the same thing.
  useEffect(() => {
    knownSessionCount.current = Math.max(
      knownSessionCount.current,
      localSessionCount
    );
  }, [localSessionCount]);

  useEffect(() => {
    if (!userAuth) return undefined;
    let cancelled = false;

    const check = async () => {
      if (document.visibilityState !== "visible") return;

      const now = Date.now();
      if (now - lastCheckedAt.current < MIN_CHECK_INTERVAL) return;
      lastCheckedAt.current = now;

      try {
        const snapshot = await getDoc(doc(db, "users", userAuth));
        const remoteSessionCount = Number(
          snapshot.data()?.statistics?.sessionCount ?? 0
        );
        if (cancelled || remoteSessionCount <= knownSessionCount.current) {
          return;
        }
        knownSessionCount.current = remoteSessionCount;
        invalidateActivityLogsCache(userAuth);
        setNonce((value) => value + 1);
      } catch (error) {
        console.error("Failed to check for remote sessions:", error);
      }
    };

    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    window.addEventListener("online", check);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
      window.removeEventListener("online", check);
    };
  }, [userAuth]);

  return nonce;
};
