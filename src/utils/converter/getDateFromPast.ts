export const getDateFromPast = (days: number) => {
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - days);
  return pastDate;
};
