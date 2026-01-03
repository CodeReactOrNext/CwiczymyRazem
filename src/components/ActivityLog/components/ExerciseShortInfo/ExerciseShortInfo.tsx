import { IconBox } from "components/IconBox/IconBox";
import { useTranslation } from "react-i18next";
import { FaClock, FaRegCalendarAlt, FaStar } from "react-icons/fa";
import type { ReportListInterface } from "types/api.types";
import { convertMsToHM } from "utils/converter";

import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";

const ExerciseShortInfo = ({
  date,
  report,
}: {
  date: Date;
  report: ReportListInterface;
}) => {
  const { t, i18n } = useTranslation(["common", "exercises"]);

  const plan = report.planId 
    ? defaultPlans.find(p => p.id === report.planId) 
    : null;

  const currentLang = (i18n.language === 'pl' || i18n.language === 'en') ? i18n.language : 'en';

  const displayTitle = plan 
    ? (typeof plan.title === 'string' ? plan.title : plan.title[currentLang]) 
    : report.exceriseTitle;

  return (
    <div className='z-40 flex flex-col justify-center'>
      {displayTitle ? (
        <div className='relative -top-4 m-auto max-w-[280px] text-center'>
          <p className='text-sm font-bold text-white'>
            {displayTitle}
          </p>
          {plan && (
             <span className="text-[10px] uppercase tracking-widest text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
               PLAN
             </span>
          )}
        </div>
      ) : null}

      <div className='flex flex-row justify-around gap-3 '>
        <div className='flex flex-row items-center'>
          <IconBox Icon={FaRegCalendarAlt} small />
          <p>{date.toLocaleDateString()}</p>
        </div>
        <div className='flex flex-row items-center'>
          <IconBox Icon={FaStar} small />
          <p className='font-bold'>{report.points}</p>
        </div>
        <div className='flex flex-row items-center'>
          <IconBox Icon={FaClock} small />
          {convertMsToHM(report.totalTime) + "h"}
        </div>
      </div>

      {report.timeSumary && (
        <div className='p-2'>
          <div className='flex flex-row gap-1'>
            <div className='content-box flex flex-col items-center !border-transparent  text-xs'>
              <p className='text-sm font-bold'>
                {convertMsToHM(report.timeSumary.techniqueTime) + "h"}
              </p>
              <p>{t("common:calendar.technique") as string}</p>
            </div>

            <div className='content-box flex flex-col items-center  !border-transparent'>
              <p className='text-sm font-bold'>
                {convertMsToHM(report.timeSumary.theoryTime) + "h"}
              </p>
              <p>{t("common:calendar.theory") as string}</p>
            </div>

            <div className='content-box flex flex-col items-center  !border-transparent'>
              <p className='text-sm font-bold'>
                {convertMsToHM(report.timeSumary.hearingTime) + "h"}
              </p>
              <p>{t("common:calendar.hearing") as string}</p>
            </div>

            <div className='content-box flex flex-col items-center  !border-transparent'>
              <p className='text-sm font-bold'>
                {convertMsToHM(report.timeSumary.creativityTime) + "h"}
              </p>
              <p>{t("common:calendar.creativity") as string}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseShortInfo;
