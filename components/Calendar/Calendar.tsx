import { selectUserAuth } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";
import { firebaseGetUserRaprotsLogs } from "utils/firebase/client/firebase.utils";
import { FirebaseUserExceriseLog } from "utils/firebase/client/firebase.types";
import { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import ToolTip from "components/ToolTip";
import { convertMsToHM } from "utils/converter/timeConverter";

const Calendar = () => {
  const [state, setState] = useState<
    { points: number; date: Date; totalTime: number }[] | null
  >(null);
  const userAuth = useAppSelector(selectUserAuth);

  useEffect(() => {
    if (userAuth && state === null) {
      firebaseGetUserRaprotsLogs(userAuth).then((r) => {
        const newR = r.reduce((previousValue, exceriesLog) => {
          const indexOfRepeted = previousValue.findIndex(({ date }) => {
            const reportDate = new Date(exceriesLog.reportDate.seconds * 1000);
            return (
              reportDate.getUTCFullYear() === date.getFullYear() &&
              reportDate.getUTCMonth() === date.getMonth() &&
              reportDate.getUTCDate() === date.getDate()
            );
          });
          if (indexOfRepeted != -1) {
            previousValue[indexOfRepeted].points =
              previousValue[indexOfRepeted].points + exceriesLog.totalPoints;
            previousValue[indexOfRepeted].totalTime =
              previousValue[indexOfRepeted].totalTime +
              exceriesLog.bonusPoints.time;
            return previousValue;
          }
          previousValue.push({
            points: exceriesLog.totalPoints,
            date: new Date(exceriesLog.reportDate.seconds * 1000),
            totalTime: exceriesLog.bonusPoints.time,
          });
          return previousValue;
        }, [] as { points: number; date: Date; totalTime: number }[]);

        setState(newR);
      });
    }
  }, [userAuth, state]);

  const getNullToCorrectDaysStartInUi = (dayWhenYearStart: number) => {
    const numOfDayWhereUiStart = 6;
    const nullsToGenerateSapceForUi = new Array(
      numOfDayWhereUiStart - dayWhenYearStart
    ).fill(null);
    return nullsToGenerateSapceForUi;
  };

  let year = 2023;
  let dates: Array<{
    date: Date;
    report: { points: number; date: Date; totalTime: number } | undefined;
  }> = [];
  for (let month = 0; month < 12; month++) {
    for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) {
      let date = new Date(year, month, day);
      if (month === 0 && day === 1) {
        dates.push(...getNullToCorrectDaysStartInUi(date.getDay()));
      }

      let exceries = state?.find((state) => {
        const reportDate = new Date(state.date);

        return (
          reportDate.getFullYear() === date.getFullYear() &&
          reportDate.getMonth() === date.getMonth() &&
          reportDate.getDate() === date.getDate()
        );
      });

      dates.push({ date, report: exceries });
    }
  }
  const getPointRaitings = (
    date: {
      date: Date;
      report: { points: number; date: Date; totalTime: number } | undefined;
    } | null
  ) => {
    if (date === null) return null;
    if (date.report === undefined) return;
    if (date.report.points > 30) {
      return "super";
    }
    if (date.report.points > 20) {
      return "great";
    }
    if (date.report.points > 10) {
      return "nice";
    }
    if (date.report.points) {
      return "ok";
    }
  };

  return state ? (
    <div className='grid grid-flow-col grid-rows-7 overflow-y-scroll border-2 border-second-400 bg-second-600 p-5 text-xs  scrollbar-thin scrollbar-track-main-opposed-800 scrollbar-thumb-second-100 radius-default'>
      <ToolTip />
      <p className='mr-3'>Pon</p>
      <p></p>
      <p></p>
      <p>Czw</p>
      <p></p>
      <p></p>
      <p>Nied</p>
      {dates.map((date, index) => {
        const raiting = getPointRaitings(date);

        return date ? (
          <div
            key={index}
            className={`\ m-[0.2rem] rounded-[1px] p-[0.3rem]
            ${raiting === "super" ? "bg-main-calendar" : ""}
            ${raiting === "great" ? "bg-main-calendar/60" : ""}
            ${raiting === "nice" ? "bg-main-calendar/40" : ""}
            ${raiting === "ok" ? "bg-main-calendar/20" : ""}}
            ${raiting ? "" : " bg-slate-600/40"}
            `}
            data-tip={`${
              date.report
                ? "Punktów " +
                  date.report.points +
                  " | " +
                  convertMsToHM(date.report.totalTime) +
                  "h" +
                  " | "
                : ""
            }  
            ${date.date.toLocaleDateString()}  
             `}></div>
        ) : (
          <div
            key={index}
            className={`m-[0.2rem] rounded-[1px] bg-second-600 p-[0.3rem]`}></div>
        );
      })}
    </div>
  ) : (
    <FaSpinner />
  );
};

export default Calendar;
