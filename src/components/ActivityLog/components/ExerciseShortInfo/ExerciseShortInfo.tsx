import { IconBox } from "components/IconBox/IconBox";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { useTranslation } from "react-i18next";
import { FaClock, FaRegCalendarAlt, FaStar } from "react-icons/fa";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
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
    <div className={`z-40 flex flex-col justify-center gap-3 ${isModal ? 'w-full' : 'min-w-[300px]'} ${className || ''}`}>
       <div className='flex flex-row justification-around gap-3 border-b border-white/10 pb-3'>
        <div className='flex flex-row items-center gap-2'>
          <IconBox Icon={FaRegCalendarAlt} small />
          <p className="text-sm">{date.toLocaleDateString()}</p>
        </div>
        <div className='flex flex-row items-center gap-2'>
          <IconBox Icon={FaStar} small />
          <p className='text-sm font-bold'>{report.points}</p>
        </div>
        <div className='flex flex-row items-center gap-2'>
          <IconBox Icon={FaClock} small />
           <p className="text-sm">{convertMsToHM(report.totalTime) + "h"}</p>
        </div>
      </div>

       {report.activities && report.activities.length > 0 ? (
        <div className={`flex w-full flex-col gap-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 ${isModal ? 'max-h-[400px]' : 'max-h-[250px]'}`}>
          {report.activities.map((activity, index) => {
             const activityPlan = activity.planId ? defaultPlans.find(p => p.id === activity.planId) : null;
             const activityTitle = activityPlan ? (typeof activityPlan.title === 'string' ? activityPlan.title : activityPlan.title[currentLang]) : activity.title;

             return (
               <div key={index} className="flex flex-col rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10">
                  <div className="flex items-start justify-between gap-2">
                       <span className="text-xs font-semibold text-white/90 line-clamp-2">{activityTitle}</span>
                       {activityPlan && (
                           <span className="shrink-0 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-400 border border-cyan-500/30">Plan</span>
                       )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1"><FaStar className="text-yellow-500/70" size={10} /> {activity.points}</span>
                      <span className="flex items-center gap-1"><FaClock className="text-blue-400/70" size={10} /> {convertMsToHM(activity.time)}h</span>
                  </div>
               </div>
             )
          })}
        </div>
      ) : displayTitle ? (
        <div className='relative m-auto max-w-[280px] text-center'>
          <p className='text-sm font-bold text-white'>
            {displayTitle}
          </p>
          {plan && (
             <span className="mt-1 inline-block text-[10px] uppercase tracking-widest text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
               PLAN
             </span>
          )}
        </div>
      ) : null}

      {report.timeSumary && (
        <div className='rounded-lg bg-black/20 p-2'>
          <div className='flex flex-row justify-between gap-1'>
            <div className='content-box flex flex-1 flex-col items-center !border-transparent text-xs'>
              <p className='text-xs font-bold text-white/80'>
                {convertMsToHM(report.timeSumary.techniqueTime)}h
              </p>
              <p className="text-[10px] text-white/50">{t("common:calendar.technique") as string}</p>
            </div>

            <div className='content-box flex flex-1 flex-col items-center !border-transparent text-xs'>
              <p className='text-xs font-bold text-white/80'>
                {convertMsToHM(report.timeSumary.theoryTime)}h
              </p>
              <p className="text-[10px] text-white/50">{t("common:calendar.theory") as string}</p>
            </div>

            <div className='content-box flex flex-1 flex-col items-center !border-transparent text-xs'>
              <p className='text-xs font-bold text-white/80'>
                {convertMsToHM(report.timeSumary.hearingTime)}h
              </p>
              <p className="text-[10px] text-white/50">{t("common:calendar.hearing") as string}</p>
            </div>

            <div className='content-box flex flex-1 flex-col items-center !border-transparent text-xs'>
              <p className='text-xs font-bold text-white/80'>
                {convertMsToHM(report.timeSumary.creativityTime)}h
              </p>
              <p className="text-[10px] text-white/50">{t("common:calendar.creativity") as string}</p>
            </div>
          </div>
        </div>
      )}

      {isModal && report.timeSumary && (
         <div className="h-[250px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                { subject: t("common:calendar.technique"), A: report.timeSumary.techniqueTime, fullMark: 150 },
                { subject: t("common:calendar.theory"), A: report.timeSumary.theoryTime, fullMark: 150 },
                { subject: t("common:calendar.hearing"), A: report.timeSumary.hearingTime, fullMark: 150 },
                { subject: t("common:calendar.creativity"), A: report.timeSumary.creativityTime, fullMark: 150 },
              ]}>
                <PolarGrid stroke="#3f3f46" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar
                  name="Time"
                  dataKey="A"
                  stroke="#0891B2"
                  fill="#06B6D4"
                />
              </RadarChart>
            </ResponsiveContainer>
         </div>
      )}
    </div>
  );
};

export default ExerciseShortInfo;
