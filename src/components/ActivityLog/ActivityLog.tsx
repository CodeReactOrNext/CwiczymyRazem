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
    <div className='relative w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-900/70 p-6 shadow-lg backdrop-blur-xl'>
      {/* Background effects */}
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-800/20 via-transparent to-zinc-800/20'></div>

      <div className='relative'>
        <div className='mb-6 flex items-center justify-between'>
          <h3 className='text-lg font-bold text-white'>Activity Log</h3>
          <div className='flex gap-1 rounded-lg bg-white/10 p-1'>
            {yearButtons.map((yearValue) => (
              <button
                key={`year-btn-${yearValue}`}
                role='tab'
                onClick={() => setYear(yearValue)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  year === yearValue
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}>
                {yearValue}
              </button>
            ))}
          </div>
        </div>

        <div className='overflow-x-auto'>
          <div className='grid grid-flow-col grid-rows-7 gap-1 p-2 text-xs text-white/70'>
            <p className='row-span-3 mr-3'>{t("calendar.monday")}</p>
            <p className='row-span-3 mr-3'>{t("calendar.thursday")}</p>
            <p>{t("calendar.sunday")}</p>

            {datasWithReports.map((dateItem, index) =>
              dateItem ? (
                <CalendarWrapperSquare
                  key={`activity-item-${index}`}
                  date={dateItem.report?.date ?? dateItem.date}
                  report={dateItem.report}
                />
              ) : (
                <div
                  key={`empty-slot-${index}`}
                  data-tip
                  data-for={index.toString()}
                  className='m-[0.2rem] rounded-[1px] bg-white/10 p-[0.3rem]'
                />
              )
            )}

            <div className='p-2' />
          </div>
        </div>

        <div className='mt-4 flex flex-wrap gap-4 text-xs text-white/70'>
          <div className='flex items-center gap-2'>
            <div className='relative h-3 w-3 rounded-sm bg-red-500'>
              <div className='absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white' />
            </div>
            <span>{t("calendar.hasTitle")}</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='relative h-3 w-3 rounded-sm bg-red-500'>
              <div className='absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white' />
            </div>
            <span>{t("calendar.backDate")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
