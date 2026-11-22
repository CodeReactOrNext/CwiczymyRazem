import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { useTranslation } from "hooks/useTranslation";
import { CalendarIcon, Clock, Star } from "lucide-react";
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

  // The hover card is a white tooltip; the day dialog stays a dark surface.
  const tone = isModal
    ? {
        text: "text-zinc-100",
        muted: "text-zinc-400",
        well: "bg-zinc-800/60",
        wellHover: "hover:bg-zinc-800",
        star: "text-amber-400",
        clock: "text-cyan-400",
        plan: "",
        planText: "text-cyan-300",
      }
    : {
        text: "",
        muted: "text-black/60",
        well: "bg-black/5",
        wellHover: "hover:bg-black/10",
        star: "text-amber-600",
        clock: "text-cyan-700",
        plan: "bg-cyan-500/10 text-cyan-700",
        planText: "text-cyan-700",
      };

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
      <div className='flex flex-row items-center justify-between gap-3'>
        <div className='flex flex-row items-center gap-2'>
          <CalendarIcon className={tone.muted} size={14} />
          <p className={cn("text-sm font-semibold", tone.text)}>
            {date.toLocaleDateString(currentLang, {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </p>
        </div>
        <div className='flex flex-row items-center gap-5'>
          <div className="flex flex-col items-end">
            <span className={cn("mb-0.5 text-xs font-bold", tone.muted)}>Points</span>
            <div className="flex flex-row items-center gap-1.5">
              <Star className={tone.star} size={12} />
              <p className={cn("text-[13px] font-bold", tone.text)}>{report.points}</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={cn("mb-0.5 text-xs font-bold", tone.muted)}>Total</span>
            <div className="flex flex-row items-center gap-1.5">
              <Clock className={tone.clock} size={12} />
              <p className={cn("text-[13px] font-bold", tone.text)}>{convertMsToHM(report.totalTime)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* List of activities */}
      {report.activities && report.activities.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <span className={cn("text-xs font-bold", tone.muted)}>Completed exercises</span>
          <div className={`flex w-full flex-col gap-2.5 ${isModal ? '' : 'overflow-y-auto max-h-[220px]'} pr-1.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-black/20`}>
          {report.activities.map((activity, index) => {
             const activityPlan = activity.planId ? defaultPlans.find(p => p.id === activity.planId) : null;
             const activityTitle = activityPlan ? (typeof activityPlan.title === 'string' ? activityPlan.title : activityPlan.title[currentLang]) : activity.title;

             return (
               <div key={index} className={cn("group flex flex-col rounded-lg p-3 transition-colors", tone.well, tone.wellHover)}>
                  <div className="flex items-start justify-between gap-3">
                       <span className={cn("text-[13px] font-semibold leading-snug", tone.text)}>{activityTitle}</span>
                       {activityPlan && (
                           <Chip color='cyan' size='sm' className={cn("shrink-0", tone.plan)}>Plan</Chip>
                       )}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs font-medium">
                      <span className={cn("flex items-center gap-1.5", tone.muted)}>
                        <Star className={tone.star} size={12} /> {activity.points}
                      </span>
                      <span className={cn("flex items-center gap-1.5", tone.muted)}>
                        <Clock className={tone.clock} size={12} /> {convertMsToHM(activity.time)}
                      </span>
                  </div>
               </div>
             )
          })}
          </div>
        </div>
      ) : displayTitle ? (
        <div className={cn("relative m-auto my-4 max-w-[280px] rounded-lg py-4 text-center", tone.well)}>
          <p className={cn("text-[15px] font-semibold", tone.text)}>
            {displayTitle}
          </p>
          {plan && (
             <span className={cn("mt-2 inline-block rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-bold", tone.planText)}>
               Plan
             </span>
          )}
        </div>
      ) : null}

      {/* Statistics summary by categories */}
      {report.timeSumary && (
        <div className="flex flex-col gap-1.5 mt-1">
          <span className={cn("text-xs font-bold", tone.muted)}>Time split</span>
          <div className='grid grid-cols-4 gap-2'>
          <div className={cn("flex flex-col items-center justify-center rounded-lg p-2 transition-colors", tone.well, tone.wellHover)}>
            <p className={cn("text-[13px] font-bold", tone.text)}>
              {convertMsToHM(report.timeSumary.techniqueTime)}
            </p>
            <p className={cn("mt-0.5 text-[11px] font-medium", tone.muted)}>{t("common:calendar.technique") as string}</p>
          </div>

          <div className={cn("flex flex-col items-center justify-center rounded-lg p-2 transition-colors", tone.well, tone.wellHover)}>
            <p className={cn("text-[13px] font-bold", tone.text)}>
              {convertMsToHM(report.timeSumary.theoryTime)}
            </p>
            <p className={cn("mt-0.5 text-[11px] font-medium", tone.muted)}>{t("common:calendar.theory") as string}</p>
          </div>

          <div className={cn("flex flex-col items-center justify-center rounded-lg p-2 transition-colors", tone.well, tone.wellHover)}>
            <p className={cn("text-[13px] font-bold", tone.text)}>
              {convertMsToHM(report.timeSumary.hearingTime)}
            </p>
            <p className={cn("mt-0.5 text-[11px] font-medium", tone.muted)}>{t("common:calendar.hearing") as string}</p>
          </div>

          <div className={cn("flex flex-col items-center justify-center rounded-lg p-2 transition-colors", tone.well, tone.wellHover)}>
            <p className={cn("text-[13px] font-bold", tone.text)}>
              {convertMsToHM(report.timeSumary.creativityTime)}
            </p>
            <p className={cn("mt-0.5 text-[11px] font-medium", tone.muted)}>{t("common:calendar.creativity") as string}</p>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseShortInfo;
