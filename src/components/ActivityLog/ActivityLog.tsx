import CalendarWrapperSquare from "components/ActivityLog/components/CalendarWrapperSquare";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaSpinner } from "react-icons/fa";

import { useActivityLog } from "./hooks/useActivityLog";

const ActivityLog = ({ userAuth }: { userAuth: string }) => {
  const { t } = useTranslation("common");
  const { reportList, year, setYear, datasWithReports } =
    useActivityLog(userAuth);

  const yearButtons = useMemo(() => {
    const startYear = 2023;
    const currentYear = new Date().getFullYear();
    const years = [];

    for (let y = startYear; y <= currentYear; y++) {
      years.push(y);
    }

    return years;
  }, []);

  if (!reportList.length) {
    return (
      <div className='flex h-40 w-full items-center justify-center'>
        <FaSpinner className='animate-spin text-2xl text-second' />
      </div>
    );
  }

  return (
    <div className='content-box relative w-full overflow-x-scroll p-3 font-openSans scrollbar-thin scrollbar-thumb-second-200'>
      <div className='flex items-center gap-2'>
        <div className='mb-4 flex gap-2 rounded-md bg-second-400 p-1'>
          {yearButtons.map((yearValue) => (
            <button
              key={`year-btn-${yearValue}`}
              role='tab'
              onClick={() => setYear(yearValue)}
              className={`tab rounded-md text-[12px] font-medium transition-colors hover:text-white ${
                year === yearValue ? "bg-second text-white" : ""
              }`}>
              {yearValue}
            </button>
          ))}
        </div>
      </div>

      <div className='flex flex-col gap-4'>
        <div className='grid grid-flow-col grid-rows-7 p-2 text-xs'>
          <p className='row-span-3 mr-3'>{t("calendar.monday")}</p>
          <p className='row-span-3 mr-3'>{t("calendar.thursday")}</p>
          <p>{t("calendar.sunday")}</p>

          {datasWithReports.map((dateItem, index) =>
            dateItem ? (
              <CalendarWrapperSquare
                key={`activity-item-${index}`}
                date={dateItem.date}
                report={dateItem.report}
              />
            ) : (
              <div
                key={`empty-slot-${index}`}
                data-tip
                data-for={index.toString()}
                className='m-[0.2rem] rounded-[1px] bg-second-600 p-[0.3rem]'
              />
            )
          )}

          <div className='p-2' />
        </div>

        <div className='flex flex-col gap-2 p-2 text-xs'>
          <div className='flex flex-wrap gap-4'>
            <div className='flex items-center gap-2'>
              <div
                className='relative h-3 w-3'
                style={{ backgroundColor: "#EF4444" }}>
                <div className='absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white' />
              </div>
              <span>{t("calendar.hasTitle")}</span>
            </div>
            <div className='flex items-center gap-2'>
              <div
                className='relative h-3 w-3'
                style={{ backgroundColor: "#EF4444" }}>
                <div className='absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white' />
              </div>
              <span>{t("calendar.backDate")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
