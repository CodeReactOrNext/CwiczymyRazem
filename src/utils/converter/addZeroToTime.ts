export const addZeroToTime = (time: number) => {
  if (time.toString().length === 1) {
    return "0" + time.toString();
  }
  return time.toString();
};
