import {
  firebaseGetUserRaprotsLogs,
  invalidateActivityLogsCache,
} from "feature/logs/services/getUserRaprotsLogs.service";
import { useCallback, useEffect, useState } from "react";

import type { PracticeLogSession } from "../types/practiceLog.types";
import { mapLogToSession } from "../utils/practiceLog.utils";

export const usePracticeLogSessions = (userAuth: string) => {
  const [sessions, setSessions] = useState<PracticeLogSession[] | null>(null);
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
        if (!cancelled) {
          const mapped = response
            .map(mapLogToSession)
            .filter(
              (session): session is PracticeLogSession => session !== null
            )
            .sort((a, b) => b.date.getTime() - a.date.getTime());
          setSessions(mapped);
        }
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

  return { sessions, isLoading, refresh };
};
