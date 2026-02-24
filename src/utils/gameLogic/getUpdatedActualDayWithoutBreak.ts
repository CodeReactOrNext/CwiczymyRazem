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
  const yesterday = new Date(today);
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
