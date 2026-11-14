import {
  firebaseGetUserRaprotsLogs,
  invalidateActivityLogsCache,
  peekUserRaprotsLogs,
} from "feature/logs/services/getUserRaprotsLogs.service";
import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";
import { useCallback, useEffect, useState } from "react";

import type { PracticeLogSession } from "../types/practiceLog.types";
import { mapLogToSession } from "../utils/practiceLog.utils";

const toSessions = (logs: FirebaseUserExceriseLog[]) =>
  logs
    .map(mapLogToSession)
    .filter((session): session is PracticeLogSession => session !== null)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

export const usePracticeLogSessions = (userAuth: string) => {
  // Seeded from the service's memory cache: coming back to a page that lists
  // sessions draws them on the first frame instead of flashing a skeleton
  // while the (instant) cached promise resolves.
  const [sessions, setSessions] = useState<PracticeLogSession[] | null>(() => {
    const cached = userAuth ? peekUserRaprotsLogs(userAuth, "all") : null;
    return cached ? toSessions(cached) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchSessions = async () => {
      if (!userAuth) return;

      setIsLoading(true);
      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Practice log fetch timeout")),
            15000
          )
        );
        const response = await Promise.race([
          firebaseGetUserRaprotsLogs(userAuth, "all"),
          timeout,
        ]);
        if (!cancelled) setSessions(toSessions(response));
      } catch (error) {
        console.error("Failed to load practice log:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchSessions();

    return () => {
      cancelled = true;
    };
  }, [userAuth, refreshNonce]);

  const refresh = useCallback(() => {
    if (userAuth) invalidateActivityLogsCache(userAuth);
    setRefreshNonce((nonce) => nonce + 1);
  }, [userAuth]);

  // "Loading" only while there is nothing to show — a refresh after an edit
  // swaps the list in place rather than blanking what is already on screen.
  return { sessions, isLoading: isLoading && sessions === null, refresh };
};
