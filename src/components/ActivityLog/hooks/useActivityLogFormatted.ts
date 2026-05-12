import { useMemo } from "react";
import type { ReportListInterfaceWithTimeSumary } from "../activityLog.types";

export const useActivityLogFormatted = (reportList: ReportListInterfaceWithTimeSumary[] | null) => {
  const formattedReports = useMemo(() => {
    return (
      reportList?.map((report) => ({
        date: report.date,
        techniqueTime: report.timeSumary?.techniqueTime || 0,
        theoryTime: report.timeSumary?.theoryTime || 0,
        hearingTime: report.timeSumary?.hearingTime || 0,
        creativityTime: report.timeSumary?.creativityTime || 0,
        exceriseTitle: report.exceriseTitle,
        totalTime: report.totalTime,
        activities: report.activities,
      })) || []
    );
  }, [reportList]);

  return { formattedReports };
}; 