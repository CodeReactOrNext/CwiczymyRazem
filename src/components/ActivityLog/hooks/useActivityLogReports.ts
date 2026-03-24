import { firebaseGetUserRaprotsLogs } from "feature/logs/services/getUserRaprotsLogs.service";
import { useEffect, useState } from "react";

import type { ReportListInterfaceWithTimeSumary } from "../activityLog.types";
import { processRawReports } from "../activityLog.utils";

export const useActivityLogReports = (userAuth: string, year: number) => {
  const [reportList, setReportList] = useState<
    ReportListInterfaceWithTimeSumary[] | null
  >(null);
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
  }, [userAuth, year]);

  return { reportList, isLoading };
};