import { firebaseGetUserRaprotsLogs } from "feature/logs/services/getUserRaprotsLogs.service";
import { useEffect, useState } from "react";
import type { ReportListInterface } from "types/api.types";

import { processRawReports } from "../activityLog.utils";

export const useActivityLogReports = (userAuth: string) => {
  const [reportList, setReportList] = useState<ReportListInterface[] | null>(
    null
  );

  useEffect(() => {
    const fetchUserReports = async () => {
      if (!userAuth || reportList !== null) return;

      const response = await firebaseGetUserRaprotsLogs(userAuth);
      const processedReports = processRawReports(response);
      setReportList(processedReports);
    };

    fetchUserReports();
  }, [userAuth, reportList]);

  return { reportList };
}; 