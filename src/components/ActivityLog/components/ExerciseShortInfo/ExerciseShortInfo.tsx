import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { useTranslation } from "hooks/useTranslation";
import { FaClock, FaRegCalendarAlt, FaStar } from "react-icons/fa";
import { convertMsToHM } from "utils/converter";

import type { ReportListInterfaceWithTimeSumary } from "../../activityLog.types";

const ExerciseShortInfo = ({
  date,
  report,
  isModal = false,
  className,
}: {
  date: Date;
  report: ReportListInterfaceWithTimeSumary;
  isModal?: boolean;
  className?: string;
}) => {
  const { t, i18n } = useTranslation(["common", "exercises"]);

  const currentLang = (i18n.language === 'pl' || i18n.language === 'en') ? i18n.language : 'en';

  const plan = report.planId 
    ? defaultPlans.find(p => p.id === report.planId) 
    : null;

  const displayTitle = plan 
    ? (typeof plan.title === 'string' ? plan.title : plan.title[currentLang]) 
    : report.exceriseTitle;

  return (
    <div className={`z-40 flex flex-col gap-4 ${isModal ? 'w-full' : 'min-w-[320px] max-w-[360px]'} ${className || ''}`}>
      {/* Header section with Date, Stars, and Time */}
      <div className='flex flex-row items-center justify-between gap-3 border-b border-[#e8e4db] pb-3'>
        <div className='flex flex-row items-center gap-2'>
          <FaRegCalendarAlt className="text-stone-500" size={14} />
          <p className="text-sm font-semibold tracking-wide text-stone-900">
            {date.toLocaleDateString(currentLang, {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </p>
        </div>
        <div className='flex flex-row items-center gap-5'>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold tracking-wider text-stone-500 mb-0.5">Points</span>
            <div className="flex flex-row items-center gap-1.5">
              <FaStar className="text-yellow-500" size={12} />
              <p className='text-[13px] font-bold text-stone-900'>{report.points}</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold tracking-wider text-stone-500 mb-0.5">Total</span>
            <div className="flex flex-row items-center gap-1.5">
              <FaClock className="text-cyan-600" size={12} />
              <p className="text-[13px] font-bold text-stone-900">{convertMsToHM(report.totalTime)}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* List of activities */}
      {report.activities && report.activities.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-wider text-stone-400">Completed exercises</span>
          <div className={`flex w-full flex-col gap-2.5 ${isModal ? '' : 'overflow-y-auto max-h-[220px]'} pr-1.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-black/10`}>
          {report.activities.map((activity, index) => {
             const activityPlan = activity.planId ? defaultPlans.find(p => p.id === activity.planId) : null;
             const activityTitle = activityPlan ? (typeof activityPlan.title === 'string' ? activityPlan.title : activityPlan.title[currentLang]) : activity.title;

             return (
               <div key={index} className="group flex flex-col rounded-xl bg-black/[0.03] border border-transparent p-3 transition-colors hover:bg-black/[0.06] hover:border-[#e8e4db]">
                  <div className="flex items-start justify-between gap-3">
                       <span className="text-[13px] font-semibold tracking-tight text-stone-900 leading-snug">{activityTitle}</span>
                       {activityPlan && (
                           <span className="shrink-0 rounded bg-[#e8f6f8] px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[#087f8c] border border-[rgba(8,127,140,0.2)]">Plan</span>
                       )}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-stone-600">
                        <FaStar className="text-yellow-500" size={12} /> {activity.points}
                      </span>
                      <span className="flex items-center gap-1.5 text-stone-600">
                        <FaClock className="text-cyan-600" size={12} /> {convertMsToHM(activity.time)}h
                      </span>
                  </div>
               </div>
             )
          })}
          </div>
        </div>
      ) : displayTitle ? (
        <div className='relative m-auto max-w-[280px] text-center my-4 py-4 rounded-xl bg-black/[0.03] border border-black/5'>
          <p className='text-[15px] font-semibold text-stone-900'>
            {displayTitle}
          </p>
          {plan && (
             <span className="mt-2 inline-block text-[10px] font-bold tracking-widest text-[#087f8c] bg-[#e8f6f8] px-2.5 py-1 rounded-full border border-[rgba(8,127,140,0.2)]">
               Plan
             </span>
          )}
        </div>
      ) : null}

      {/* Statistics summary by categories */}
      {report.timeSumary && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-[#e8e4db] mt-1">
          <span className="text-[11px] font-bold tracking-wider text-stone-400">Time split</span>
          <div className='grid grid-cols-4 gap-2'>
          <div className='flex flex-col items-center justify-center rounded-lg bg-black/[0.03] p-2 border border-transparent transition-colors hover:bg-black/[0.06] hover:border-[#e8e4db]'>
            <p className='text-[13px] font-bold tracking-tight text-stone-900'>
              {convertMsToHM(report.timeSumary.techniqueTime)}h
            </p>
            <p className="text-[10px] font-medium tracking-wider text-stone-500 mt-0.5">{t("common:calendar.technique") as string}</p>
          </div>

          <div className='flex flex-col items-center justify-center rounded-lg bg-black/[0.03] p-2 border border-transparent transition-colors hover:bg-black/[0.06] hover:border-[#e8e4db]'>
            <p className='text-[13px] font-bold tracking-tight text-stone-900'>
              {convertMsToHM(report.timeSumary.theoryTime)}h
            </p>
            <p className="text-[10px] font-medium tracking-wider text-stone-500 mt-0.5">{t("common:calendar.theory") as string}</p>
          </div>

          <div className='flex flex-col items-center justify-center rounded-lg bg-black/[0.03] p-2 border border-transparent transition-colors hover:bg-black/[0.06] hover:border-[#e8e4db]'>
            <p className='text-[13px] font-bold tracking-tight text-stone-900'>
              {convertMsToHM(report.timeSumary.hearingTime)}h
            </p>
            <p className="text-[10px] font-medium tracking-wider text-stone-500 mt-0.5">{t("common:calendar.hearing") as string}</p>
          </div>

          <div className='flex flex-col items-center justify-center rounded-lg bg-black/[0.03] p-2 border border-transparent transition-colors hover:bg-black/[0.06] hover:border-[#e8e4db]'>
            <p className='text-[13px] font-bold tracking-tight text-stone-900'>
              {convertMsToHM(report.timeSumary.creativityTime)}h
            </p>
            <p className="text-[10px] font-medium tracking-wider text-stone-500 mt-0.5">{t("common:calendar.creativity") as string}</p>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseShortInfo;
