export const getYearsOfPlaying = (startDate: Date): number => {
  const today = new Date();
  const years = today.getFullYear() - startDate.getFullYear();
  const monthDifference = today.getMonth() - startDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < startDate.getDate())
  ) {
    return years - 1;
  }

  return years;
};
