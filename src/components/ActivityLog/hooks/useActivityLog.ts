import { useActivityLogData } from "./useActivityLogData";
import { useActivityLogFormatted } from "./useActivityLogFormatted";
import { useActivityLogReports } from "./useActivityLogReports";
import { useActivityLogYear } from "./useActivityLogYear";

export const useActivityLog = (userAuth: string, refreshNonce = 0) => {
  const { year, setYear } = useActivityLogYear();
  const { reportList, isLoading } = useActivityLogReports(
    userAuth,
    "all",
    refreshNonce
  );
  const { activityData } = useActivityLogData(reportList, year);
  const { formattedReports } = useActivityLogFormatted(reportList);

  return {
    reportList: formattedReports,
    setYear,
    year,
    datasWithReports: activityData,
    isLoading,
  };
};