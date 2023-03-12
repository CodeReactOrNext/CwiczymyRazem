import { FaClock, FaRegCalendarAlt, FaSpinner, FaStar } from "react-icons/fa";
import { useEffect, useState } from "react";

import { firebaseGetUserRaprotsLogs } from "utils/firebase/client/firebase.utils";
import { useTranslation } from "react-i18next";

import ExerciseShortInfo from "./components/ExerciseShortInfo";
import ReactTooltip from "react-tooltip";

interface ReportListInterface {
  points: number;
  date: Date;
  totalTime: number;
  exceriseTitle?: string;
  isDateBackReport: string;
  timeSumary?: {
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
    sumTime: number;
  };
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
      case !!datasWithReports.report.isDateBackReport !== false:
        return "backDate";
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

              if (previousValue[indexOfRepeted].exceriseTitle) {
                previousValue[indexOfRepeted].exceriseTitle =
                  exceriesLog.exceriseTitle +
                  "  " +
                  previousValue[indexOfRepeted].exceriseTitle;
              }

              if (exceriesLog.timeSumary) {
                if (!previousValue[indexOfRepeted].timeSumary) {
                  previousValue[indexOfRepeted].timeSumary =
                    exceriesLog.timeSumary;
                } else {
                  previousValue[indexOfRepeted].timeSumary = {
                    techniqueTime:
                      previousValue[indexOfRepeted].timeSumary.techniqueTime +
                      exceriesLog.timeSumary.techniqueTime,
                    theoryTime:
                      previousValue[indexOfRepeted].timeSumary.theoryTime +
                      exceriesLog.timeSumary.theoryTime,
                    hearingTime:
                      previousValue[indexOfRepeted].timeSumary.hearingTime +
                      exceriesLog.timeSumary.hearingTime,
                    creativityTime:
                      previousValue[indexOfRepeted].timeSumary.creativityTime +
                      exceriesLog.timeSumary.creativityTime,
                    sumTime:
                      previousValue[indexOfRepeted].timeSumary?.sumTime +
                      exceriesLog.timeSumary.sumTime,
                  };
                }
              }

              return previousValue;
            }

            previousValue.push({
              points: exceriesLog.totalPoints,
              date: new Date(exceriesLog.reportDate.seconds * 1000),
              totalTime: exceriesLog.bonusPoints.time,
              isDateBackReport: exceriesLog.isDateBackReport,
              exceriseTitle: exceriesLog.exceriseTitle,
              timeSumary: exceriesLog.timeSumary,
            });
            return previousValue;
          },
          [] as {
            points: number;
            date: Date;
            totalTime: number;
            exceriseTitle: string;
            isDateBackReport: string;
            timeSumary: {
              techniqueTime: number;
              theoryTime: number;
              hearingTime: number;
              creativityTime: number;
              sumTime: number;
            };
          }[]
        );

        setReportList(reducedReportsList);
      });
    }
  }, [userAuth, reportList]);

  return reportList ? (
    <div className='content-box relative  overflow-x-scroll p-3  font-openSans  scrollbar-thin scrollbar-thumb-second-200 '>
      <p className='pb-2 text-sm font-bold'>
        {t("calendar.title")}: {year}
      </p>
      <div className=' grid cursor-pointer grid-flow-col grid-rows-7   p-2 text-xs  '>
        <p className='row-span-3 mr-3'> {t("calendar.monday")}</p>
        <p className='row-span-3 mr-3'>{t("calendar.thursday")}</p>
        <p>{t("calendar.sunday")}</p>
        {datasWithReports.map((date, index) => {
          const raiting = getPointRaitings(date);
          return date ? (
            <div
              key={index + date.date.toISOString()}
              data-tip
              data-for={index.toString()}>
              <ReactTooltip id={index.toString()}>
                {date.report ? (
                  <ExerciseShortInfo date={date} />
                ) : (
                  <p className='p-1'>{date.date.toLocaleDateString()}</p>
                )}
              </ReactTooltip>

              <div
                className={`m-[0.2rem] rounded-[1px] p-[0.3rem]
                ${raiting === "backDate" ? "bg-blue-400" : null}
            ${raiting === "super" ? "bg-main-calendar" : null}
            ${raiting === "great" ? "bg-main-calendar/80" : null}
            ${raiting === "nice" ? "bg-main-calendar/70" : null}
            ${raiting === "ok" ? "bg-main-calendar/60" : null}
            ${raiting === "zero" ? "bg-main-calendar/20" : null}
            ${raiting ? "" : "bg-slate-600/50"}
            `}></div>
            </div>
          ) : (
            <>
              <div
                key={index}
                data-tip
                data-for={index.toString()}
                className={`m-[0.2rem] rounded-[1px] bg-second-600 p-[0.3rem]`}></div>
            </>
          );
        })}
        <div className='p-2'></div>
      </div>
    </div>
  ) : (
    <FaSpinner />
  );
};

export default Calendar;
