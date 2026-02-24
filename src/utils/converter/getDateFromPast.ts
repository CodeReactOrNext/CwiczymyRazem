export const getDateFromPast = (days: number, baseDate?: Date) => {
  const today = baseDate || new Date();
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - days);
  return pastDate;
};
