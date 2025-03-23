import { useMemo } from "react";
import type { ReportListInterface } from "types/api.types";


export const useActivityLogFormatted = (reportList: ReportListInterface[] | null) => {
  const formattedReports = useMemo(() => {
    return (
      reportList?.map((report) => ({
        date: report.date,
        techniqueTime: report.timeSumary?.techniqueTime || 0,
        theoryTime: report.timeSumary?.theoryTime || 0,
        hearingTime: report.timeSumary?.hearingTime || 0,
        creativityTime: report.timeSumary?.creativityTime || 0,
      })) || []
    );
  }, [reportList]);

  return { formattedReports };
}; 