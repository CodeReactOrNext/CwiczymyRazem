export const getUpdatedActualDayWithoutBreak = (
  actualDayWithoutBreak: number,
  userLastReportDate: Date,
  didPracticeToday: boolean
) => {
  const isNewDayStreak =
    new Date().getDate() - userLastReportDate.getDate() === 1 &&
    !didPracticeToday;

  if (didPracticeToday) {
    return actualDayWithoutBreak;
  }
  if (isNewDayStreak) {
    return actualDayWithoutBreak + 1;
  }
  return 1;
};
