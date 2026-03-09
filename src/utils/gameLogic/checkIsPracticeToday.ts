export const checkIsPracticeToday = (date: Date, baseDate?: Date) => {
  const today = baseDate || new Date();
  if (
    date.getUTCDate() === today.getUTCDate() &&
    date.getUTCMonth() === today.getUTCMonth() &&
    date.getUTCFullYear() === today.getUTCFullYear()
  ) {
    return true;
  }
  return false;
};
