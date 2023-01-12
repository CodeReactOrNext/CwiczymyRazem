export const isLastReportTimeExceeded = (
  lastReportDate: string,
  sumTime: number
) => {
  const currentDataTime = new Date().getTime();
  const timeFromLastReport = new Date(lastReportDate).getTime();
  if (timeFromLastReport + sumTime > currentDataTime) {
    return timeFromLastReport + sumTime - currentDataTime;
  }
  return false;
};
