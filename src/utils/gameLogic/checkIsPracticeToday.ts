export const checkIsPracticeToday = (date: Date, baseDate?: Date) => {
  const today = baseDate || new Date();
  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return true;
  }
  return false;
};
