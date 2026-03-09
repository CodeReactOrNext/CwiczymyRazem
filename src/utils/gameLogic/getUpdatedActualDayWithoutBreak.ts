export const getUpdatedActualDayWithoutBreak = (
  actualDayWithoutBreak: number,
  userLastReportDate: Date,
  didPracticeToday: boolean,
  baseDate?: Date
) => {
  if (didPracticeToday) {
    return actualDayWithoutBreak;
  }

  const today = baseDate || new Date();
  const yesterday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1));

  const isYesterday =
    userLastReportDate.getUTCDate() === yesterday.getUTCDate() &&
    userLastReportDate.getUTCMonth() === yesterday.getUTCMonth() &&
    userLastReportDate.getUTCFullYear() === yesterday.getUTCFullYear();

  if (isYesterday) {
    return actualDayWithoutBreak + 1;
  }

  return 1;
};
