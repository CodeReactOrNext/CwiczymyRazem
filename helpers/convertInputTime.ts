import { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";

const hoursToMs = (hours: number) => hours * 3600000;
const minutesToMs = (minutes: number) => minutes * 60000;

export const convertInputTime = (data: ReportFormikInterface) => {
  const techniqueTime =
    hoursToMs(+data.techniqueHours) + minutesToMs(+data.techniqueMinutes);
  const theoryTime =
    hoursToMs(+data.theoryHours) + minutesToMs(+data.theoryMinutes);
  const hearingTime =
    hoursToMs(+data.hearingHours) + minutesToMs(+data.hearingMinutes);
  const creativityTime =
    hoursToMs(+data.creativityHours) + minutesToMs(+data.creativityMinutes);
  const sumTime = techniqueTime + theoryTime + hearingTime + creativityTime;

  return {
    techniqueTime: techniqueTime,
    theoryTime: theoryTime,
    hearingTime: hearingTime,
    creativityTime: creativityTime,
    sumTime: sumTime,
  };
};
