import { useEffect, useState } from "react";

import type { DateWithReport, ReportListInterfaceWithTimeSumary } from "../activityLog.types";
import { formatDateKey, getEmptySlots } from "../activityLog.utils";

export const useActivityLogData = (
  reportList: ReportListInterfaceWithTimeSumary[] | null,
  year: number
) => {
  const [activityData, setActivityData] = useState<DateWithReport[]>([]);

  useEffect(() => {
    if (!reportList) return;

    const reportMap = new Map<string, ReportListInterfaceWithTimeSumary[]>();
    reportList.forEach((report) => {
      const reportDate = new Date(report.date);
      const key = reportDate.toISOString().split("T")[0];

      if (!reportMap.has(key)) {
        reportMap.set(key, []);
      }
      reportMap.get(key)?.push(report);
    });

    const newActivityData: DateWithReport[] = [];

    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);

        if (month === 0 && day === 1) {
          newActivityData.push(...getEmptySlots(date.getDay()));
        }

        const key = formatDateKey(year, month, day);
        const reportsForDate = reportMap.get(key) || [];
        const exercise =
          reportsForDate.length > 0 ? reportsForDate[0] : undefined;

        newActivityData.push({ date, report: exercise });
      }
    }

    setActivityData(newActivityData);
  }, [reportList, year]);

  return { activityData };
}; 