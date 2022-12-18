import { ReportFormikInterface } from "../ReportView.types";

const hoursToMs = (hours: number) => hours * 3600000;
const minutesToMs = (minutes: number) => minutes * 60000;

export const convertInputTime = (data: ReportFormikInterface) => {
  const techniqueTime =
    hoursToMs(+data.techniqueHours) + minutesToMs(+data.techniqueMinutes);
  const theoryTime =
    hoursToMs(+data.theoryHours) + minutesToMs(+data.theoryMinutes);
  const hearingTime =
    hoursToMs(+data.hearingHours) + minutesToMs(+data.hearingMinutes);
  const creativeTime =
    hoursToMs(+data.creativeHours) + minutesToMs(+data.creativeMinutes);
  const sumTime = techniqueTime + theoryTime + hearingTime + creativeTime;

  return {
    techniqueTime: techniqueTime,
    theoryTime: theoryTime,
    hearingTime: hearingTime,
    creativeTime: creativeTime,
    sumTime: sumTime,
  };
};
