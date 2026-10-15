import {
  firebaseGetUserRaprotsLogs,
  peekUserRaprotsLogs,
} from "feature/logs/services/getUserRaprotsLogs.service";
import { useEffect, useState } from "react";

import type { ReportListInterfaceWithTimeSumary } from "../activityLog.types";
import { processRawReports } from "../activityLog.utils";

export const useActivityLogReports = (
  userAuth: string,
  year: number | "all",
  refreshNonce = 0
) => {
  // Seeded from the service's memory cache: coming back to the dashboard renders
  // the calendar straight away instead of dimming it while the cache answers.
  const [reportList, setReportList] = useState<
    ReportListInterfaceWithTimeSumary[] | null
  >(() => {
    const cached = userAuth ? peekUserRaprotsLogs(userAuth, year) : null;
    return cached ? processRawReports(cached) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchUserReports = async () => {
      if (!userAuth) return;

      setIsLoading(true);
      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Activity logs fetch timeout")), 15000)
        );
        const response = await Promise.race([
          firebaseGetUserRaprotsLogs(userAuth, year),
          timeout,
        ]);
        if (!cancelled) {
          const processedReports = processRawReports(response);
          setReportList(processedReports);
        }
      } catch (error) {
        console.error("Failed to load activity logs:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchUserReports();

    return () => {
      cancelled = true;
    };
  }, [userAuth, year, refreshNonce]);

  // "Loading" only while there is nothing to show — a refresh after a new report
  // swaps the data in place rather than greying out what is already on screen.
  return { reportList, isLoading: isLoading && reportList === null };
};