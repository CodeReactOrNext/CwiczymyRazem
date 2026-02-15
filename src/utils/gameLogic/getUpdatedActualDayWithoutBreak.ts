export const getUpdatedActualDayWithoutBreak = (
  actualDayWithoutBreak: number,
  userLastReportDate: Date,
  didPracticeToday: boolean
) => {
  if (didPracticeToday) {
    return actualDayWithoutBreak;
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isYesterday =
    userLastReportDate.getDate() === yesterday.getDate() &&
    userLastReportDate.getMonth() === yesterday.getMonth() &&
    userLastReportDate.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return actualDayWithoutBreak + 1;
  }
  return 1;
};
