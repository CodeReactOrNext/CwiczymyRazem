const padTo2Digits = (number: number) => {
  return number.toString().padStart(2, "0");
};

/** Duration as "Xh Y min" ("Y min" under an hour, "Xh" on a full hour). */
export const convertMsToHM = (milliseconds: number) => {
  const totalMinutes = Math.max(0, Math.round(milliseconds / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes} min`;
};

export const formatMinutesDuration = (minutes: number) =>
  convertMsToHM(minutes * 60000);

export const convertMsToHMObject = (milliseconds: number) => {
  const totalMinutes = Math.floor(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    hours: padTo2Digits(hours),
    minutes: padTo2Digits(minutes),
    seconds: Math.floor((milliseconds % 60000) / 1000),
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
