import { useEffect, useState } from "react";
import type { ReportListInterface } from "types/api.types";
import { firebaseGetUserRaprotsLogs } from "utils/firebase/client/firebase.utils";

type PartiallyRequired<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

type ReportListInterfaceWithTimeSumary = PartiallyRequired<
  ReportListInterface,
  "timeSumary"
>;

export const useCalendar = (userAuth: string) => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [reportList, setReportList] = useState<ReportListInterface[] | null>(
    null
  );
  const [datasWithReports, setDatasWithReports] = useState<
    Array<{
      date: Date;
      report: ReportListInterface | undefined;
    }>
  >([]);

  useEffect(() => {
    if (!reportList) return;

    const reportMap = new Map();
    reportList.forEach((report) => {
      const reportDate = new Date(report.date);

      const key = reportDate.toISOString().split("T")[0];

      if (!reportMap.has(key)) {
        reportMap.set(key, []);
      }
      reportMap.get(key).push(report);
    });

    const getKey = (year: number, month: number, day: number) => {
      const m = month + 1;
      return `${year}-${m.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
    };

    console.time("Create Datas With Reports");
    const newDatasWithReports = [];
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);

        if (month === 0 && day === 1) {
          newDatasWithReports.push(...getEmptyFiled(date.getDay()));
        }

        const key = getKey(year, month, day);
        const reportsForDate = reportMap.get(key) || [];
        const exercise = reportsForDate.length > 0 ? reportsForDate[0] : null;

        newDatasWithReports.push({ date, report: exercise });
      }
    }

    setDatasWithReports(newDatasWithReports);

    console.timeEnd("Total Processing Time");
  }, [reportList, year, getEmptyFiled]);

  useEffect(() => {
    if (userAuth && reportList === null) {
      firebaseGetUserRaprotsLogs(userAuth).then((response) => {
        const reducedReportsList = response.reduce(
          (previousValue, exerciseLog) => {
            const indexOfRepeted = previousValue.findIndex(({ date }) => {
              const reportDate = new Date(
                exerciseLog.reportDate.seconds * 1000
              );
              return (
                reportDate.getUTCFullYear() === date.getFullYear() &&
                reportDate.getUTCMonth() === date.getMonth() &&
                reportDate.getUTCDate() === date.getDate()
              );
            });
            if (indexOfRepeted != -1) {
              previousValue[indexOfRepeted].points =
                previousValue[indexOfRepeted].points + exerciseLog.totalPoints;
              previousValue[indexOfRepeted].totalTime =
                previousValue[indexOfRepeted].totalTime +
                exerciseLog.bonusPoints.time;

              if (previousValue[indexOfRepeted].exceriseTitle) {
                previousValue[indexOfRepeted].exceriseTitle =
                  exerciseLog.exceriseTitle +
                  "  " +
                  previousValue[indexOfRepeted].exceriseTitle;
              }

              if (exerciseLog.timeSumary) {
                if (!previousValue[indexOfRepeted].timeSumary) {
                  previousValue[indexOfRepeted].timeSumary =
                    exerciseLog.timeSumary;
                } else {
                  previousValue[indexOfRepeted].timeSumary = {
                    techniqueTime:
                      previousValue[indexOfRepeted].timeSumary.techniqueTime +
                      exerciseLog.timeSumary.techniqueTime,
                    theoryTime:
                      previousValue[indexOfRepeted].timeSumary.theoryTime +
                      exerciseLog.timeSumary.theoryTime,
                    hearingTime:
                      previousValue[indexOfRepeted].timeSumary.hearingTime +
                      exerciseLog.timeSumary.hearingTime,
                    creativityTime:
                      previousValue[indexOfRepeted].timeSumary.creativityTime +
                      exerciseLog.timeSumary.creativityTime,
                    sumTime:
                      previousValue[indexOfRepeted].timeSumary.sumTime +
                      exerciseLog.timeSumary.sumTime,
                  };
                }
              }
              return previousValue;
            }
            previousValue.push({
              points: exerciseLog.totalPoints,
              date: new Date(exerciseLog.reportDate.seconds * 1000),
              totalTime: exerciseLog.bonusPoints.time,
              isDateBackReport: exerciseLog.isDateBackReport,
              exceriseTitle: exerciseLog.exceriseTitle,
              timeSumary: exerciseLog.timeSumary,
            });
            return previousValue;
          },
          [] as ReportListInterfaceWithTimeSumary[]
        );
        setReportList(reducedReportsList);
      });
    }
  }, [userAuth, reportList]);

  return {
    reportList: reportList?.map(report => ({
      date: report.date,
      techniqueTime: report.timeSumary?.techniqueTime || 0,
      theoryTime: report.timeSumary?.theoryTime || 0,
      hearingTime: report.timeSumary?.hearingTime || 0,
      creativityTime: report.timeSumary?.creativityTime || 0,
    })) || [],
    setYear,
    year,
    datasWithReports,
  };
};

const getEmptyFiled = (dayWhenYearStart: number) => {
  const numOfDayWhereUiStart = 6;
  const nullsToGenerateSapceForUi = new Array(
    numOfDayWhereUiStart - dayWhenYearStart
  ).fill(null);
  return nullsToGenerateSapceForUi;
};
