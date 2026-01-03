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
    const fetchUserReports = async () => {
      if (!userAuth) return;

      setIsLoading(true);
      try {
        const response = await firebaseGetUserRaprotsLogs(userAuth, year);
        const processedReports = processRawReports(response);
        setReportList(processedReports);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserReports();
  }, [userAuth, year]);

  return { reportList, isLoading };
};