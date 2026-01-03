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

export const convertMsToHMObject = (milliseconds: number) => {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  seconds = seconds % 60;
  minutes = seconds >= 30 ? minutes + 1 : minutes;
  minutes = minutes % 60;
  return {
    hours: padTo2Digits(hours),
    minutes: padTo2Digits(minutes),
    seconds: seconds,
  };
};

export const convertMsToHMS = (ms: number): string => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  const hoursStr = hours > 0 ? `${hours}:` : "";
  const minutesStr = minutes.toString().padStart(2, "0");
  const secondsStr = seconds.toString().padStart(2, "0");

  return `${hoursStr}${minutesStr}:${secondsStr}`;
};
