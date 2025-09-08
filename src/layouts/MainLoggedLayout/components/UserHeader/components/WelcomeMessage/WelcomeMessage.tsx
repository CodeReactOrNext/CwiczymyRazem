import { useTranslation } from "react-i18next";
import { FaCheck, FaTimes } from "react-icons/fa";
import {
  checkIsPracticeToday,
  getUpdatedActualDayWithoutBreak,
} from "utils/gameLogic";

import StreakDisplay from "./components/StreakDisplay";

interface WelcomeMessageProps {
  userName: string;
  lastReportDate: string;
  points: number;
  actualDayWithoutBreak: number;
  totalPracticeTime: string;
}

export const WelcomeMessage = ({
  points,
  lastReportDate,
  actualDayWithoutBreak,
  totalPracticeTime,
}: WelcomeMessageProps) => {
  const { t } = useTranslation("common");

  const userLastReportDate = new Date(lastReportDate);
  const didPracticeToday = checkIsPracticeToday(userLastReportDate);
  const isStreak = getUpdatedActualDayWithoutBreak(
    actualDayWithoutBreak,
    userLastReportDate,
    didPracticeToday
  );
  const dayWithoutBreak =
    (isStreak === 1 ? 0 : actualDayWithoutBreak) + +didPracticeToday;

  return (
    <div className='flex items-center gap-4'>
      <div className='flex items-center gap-2'>
        <div className='flex items-center gap-1'>
          <span className='text-xs text-zinc-400'>
            {t("header.practice_today")}
          </span>
          {didPracticeToday ? (
            <FaCheck className='text-xs text-green-500' />
          ) : (
            <FaTimes className='text-xs text-red-500' />
          )}
        </div>
      </div>

      <div className='flex items-center gap-2 border-l border-zinc-600/30 pl-4'>
        <StreakDisplay dayWithoutBreak={dayWithoutBreak} />
      </div>

      <div className='hidden items-center gap-2 border-l border-zinc-600/30 pl-4 sm:flex'>
        <span className='text-xs text-zinc-400'>
          {t("header.earned_points")}
        </span>
        <span className='text-sm font-bold text-white'>{points}</span>
      </div>

      <div className='hidden items-center gap-2 border-l border-zinc-600/30 pl-4 lg:flex'>
        <span className='text-xs text-zinc-400'>
          {t("header.total_practice_time")}
        </span>
        <span className='text-sm font-bold text-white'>
          {totalPracticeTime}
        </span>
      </div>
    </div>
  );
};
