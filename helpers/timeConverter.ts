export const padTo2Digits = (number: number) => {
  return number.toString().padStart(2, "0");
};

export const convertMsToHM = (milliseconds: number) => {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  seconds = seconds % 60;
  minutes = seconds >= 30 ? minutes + 1 : minutes;
  minutes = minutes % 60;
  return `${padTo2Digits(hours)}:${padTo2Digits(minutes)}`;
};
