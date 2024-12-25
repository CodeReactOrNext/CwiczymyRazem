import { FaSpinner } from "react-icons/fa";
import { useEffect, useState } from "react";

import { firebaseGetUserRaprotsLogs } from "utils/firebase/client/firebase.utils";
import { useTranslation } from "react-i18next";

import ExerciseShortInfo from "./components/ExerciseShortInfo";
import ReactTooltip from "react-tooltip";
import CalendarSquare from "./components/CalendarSquare/CalendarSquare";
import { ReportListInterface } from "types/api.types";
import CalendarWrapperSquare from "components/Calendar/components/CalendarWrapperSquare";

type PartiallyRequired<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

type ReportListInterfaceWithTimeSumary = PartiallyRequired<
  ReportListInterface,
  "timeSumary"
>;

const getEmptyFiled = (dayWhenYearStart: number) => {
  const numOfDayWhereUiStart = 6;
  const nullsToGenerateSapceForUi = new Array(
    numOfDayWhereUiStart - dayWhenYearStart
  ).fill(null);
  return nullsToGenerateSapceForUi;
};

const Calendar = ({ userAuth }: { userAuth: string }) => {
  const { t } = useTranslation("common");

  const [reportList, setReportList] = useState<ReportListInterface[] | null>(
    null
  );

  const [year, setYear] = useState(2024);

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
                      previousValue[indexOfRepeted].timeSumary.sumTime +
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
          [] as ReportListInterfaceWithTimeSumary[]
        );
        setReportList(reducedReportsList);
      });
    }
  }, [userAuth, reportList]);

  return reportList ? (
    <div className='content-box relative  overflow-x-scroll p-3  font-openSans  scrollbar-thin scrollbar-thumb-second-200'>
      <div className='flex items-center gap-2'>
        <p className='pb-2 text-sm font-bold'>{t("calendar.title")}:</p>
        <div role='tablist' className='tabs-lifted tabs'>
          <button
            role='tab'
            onClick={() => setYear(2023)}
            className={`tab ${year === 2023 ? "tab-active" : ""}`}>
            2023
          </button>
          <button
            role='tab'
            className={`tab ${year === 2024 ? "tab-active" : ""}`}
            onClick={() => setYear(2024)}>
            2024
          </button>
          <button
            role='tab'
            className={`tab ${year === 2025 ? "tab-active" : ""}`}
            onClick={() => setYear(2025)}>
            2025
          </button>
        </div>
      </div>

      <div className=' grid  grid-flow-col grid-rows-7 p-2 text-xs'>
        <p className='row-span-3 mr-3'> {t("calendar.monday")}</p>
        <p className='row-span-3 mr-3'>{t("calendar.thursday")}</p>
        <p>{t("calendar.sunday")}</p>
        {datasWithReports.map((date, index) => {
          return date ? (
            <CalendarWrapperSquare
              date={date.date}
              index={index}
              report={date.report}
            />
          ) : (
            <div
              key={index}
              data-tip
              data-for={index.toString()}
              className={`m-[0.2rem] rounded-[1px] bg-second-600 p-[0.3rem]`}></div>
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
