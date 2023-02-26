import { FaSpinner } from "react-icons/fa";
import { useEffect, useState } from "react";

import ToolTip from "components/UI/ToolTip";

import { convertMsToHM } from "utils/converter/timeConverter";
import { firebaseGetUserRaprotsLogs } from "utils/firebase/client/firebase.utils";
import { useTranslation } from "react-i18next";

interface ReportListInterface {
  points: number;
  date: Date;
  totalTime: number;
}
const Calendar = ({ userAuth }: { userAuth: string }) => {
  const { t } = useTranslation("common");
  const [reportList, setReportList] = useState<ReportListInterface[] | null>(
    null
  );
  const getEmptyFiled = (dayWhenYearStart: number) => {
    const numOfDayWhereUiStart = 6;
    const nullsToGenerateSapceForUi = new Array(
      numOfDayWhereUiStart - dayWhenYearStart
    ).fill(null);
    return nullsToGenerateSapceForUi;
  };

  let year = 2023;
  let datasWithReports: Array<{
    date: Date;
    report: ReportListInterface | undefined;
  }> = [];

  for (let month = 0; month < 12; month++) {
    for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) {
      let date = new Date(year, month, day);
      if (month === 0 && day === 1) {
        datasWithReports.push(...getEmptyFiled(date.getDay()));
      }

      let exceries = reportList?.find((report) => {
        const reportDate = new Date(report.date);
        return (
          reportDate.getFullYear() === date.getFullYear() &&
          reportDate.getMonth() === date.getMonth() &&
          reportDate.getDate() === date.getDate()
        );
      });
      datasWithReports.push({ date, report: exceries });
    }
  }
  const getPointRaitings = (
    datasWithReports: {
      date: Date;
      report: ReportListInterface | undefined;
    } | null
  ) => {
    if (datasWithReports === null) return null;
    if (datasWithReports.report === undefined) return;

    switch (true) {
      case datasWithReports.report.points > 30:
        return "super";
      case datasWithReports.report.points > 20:
        return "great";
      case datasWithReports.report.points > 10:
        return "nice";
      case datasWithReports.report.points ||
        datasWithReports.report.points === 0:
        return "ok";
      case datasWithReports.report.points === 0:
        return "zero";
      default:
        return null;
    }
  };
  useEffect(() => {
    if (userAuth && reportList === null) {
      firebaseGetUserRaprotsLogs(userAuth).then((response) => {
        const reducedReportsList = response.reduce(
          (previousValue, exceriesLog) => {
            const indexOfRepeted = previousValue.findIndex(({ date }) => {
              const reportDate = new Date(
                exceriesLog.reportDate.seconds * 1000
              );
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
          },
          [] as { points: number; date: Date; totalTime: number }[]
        );

        setReportList(reducedReportsList);
      });
    }
  }, [userAuth, reportList]);

  return reportList ? (
    <div className=' overflow-y-scroll  border-2 border-second-400/60 bg-second-600  p-3 font-openSans  scrollbar-thin scrollbar-thumb-second-200 radius-default'>
      <p className='pb-2 text-sm font-bold'>
        {t("calendar.title")}: {year}
      </p>
      <div className=' grid grid-flow-col grid-rows-7 p-2 text-xs  '>
        <p className='row-span-3 mr-3'> {t("calendar.monday")}</p>
        <p className='row-span-3 mr-3'>{t("calendar.thursday")}</p>
        <p>{t("calendar.sunday")}</p>
        {datasWithReports.map((date, index) => {
          const raiting = getPointRaitings(date);

          return date ? (
            <div
              key={index}
              className={` m-[0.2rem] rounded-[1px] p-[0.3rem]
            ${raiting === "super" ? "bg-main-calendar" : ""}
            ${raiting === "great" ? "bg-main-calendar/80" : ""}
            ${raiting === "nice" ? "bg-main-calendar/70" : ""}
            ${raiting === "ok" ? "bg-main-calendar/60" : ""}
            ${raiting === "zero" ? "bg-main-calendar/20" : ""}
            ${raiting ? "" : " bg-slate-600/50"}
            `}
              data-tip={`${
                date.report
                  ? `${t("calendar.points")}: ${
                      date.report.points
                    } | ${convertMsToHM(date.report.totalTime)}h | `
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
        <div className='p-2'></div>
        <ToolTip />
      </div>
    </div>
  ) : (
    <FaSpinner />
  );
};

export default Calendar;
