import { useTranslation } from "react-i18next";
import { FaCheck, FaTimes, FaClock, FaTrophy } from "react-icons/fa";
import {
  checkIsPracticeToday,
  getUpdatedActualDayWithoutBreak,
} from "utils/gameLogic";

import WeeklyStreakBox from "./components/WeeklyStreakBox";

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
      {/* Today's Practice Status */}
      <div className='flex items-center gap-2 rounded-lg border border-zinc-600/30 bg-zinc-800/50 px-3 py-2'>
        <span className='text-xs font-medium text-zinc-400'>Today</span>
        {didPracticeToday ? (
          <FaCheck className='text-sm text-green-400' />
        ) : (
          <FaTimes className='text-sm text-red-400' />
        )}
      </div>

      {/* Weekly Streak Box */}
      <WeeklyStreakBox dayWithoutBreak={dayWithoutBreak} />

      {/* Points - Icon Based */}
      <div className='hidden items-center gap-2 rounded-lg border border-zinc-600/30 bg-zinc-800/50 px-3 py-2 sm:flex'>
        <FaTrophy className='text-sm text-yellow-400' />
        <span className='text-sm font-bold text-white'>
          {points.toLocaleString()}
        </span>
      </div>

      {/* Time - Icon Based */}
      <div className='hidden items-center gap-2 rounded-lg border border-zinc-600/30 bg-zinc-800/50 px-3 py-2 lg:flex'>
        <FaClock className='text-sm text-cyan-400' />
        <span className='text-sm font-bold text-white'>
          {totalPracticeTime}
        </span>
      </div>
    </div>
  );
};
