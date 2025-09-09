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
      {/* Today's Practice Status - Enhanced */}
      <div
        className={`flex h-16 items-center gap-3 rounded-xl border px-4 py-2.5 shadow-sm backdrop-blur-sm transition-all duration-300 ${
          didPracticeToday
            ? "border-green-500/30 bg-green-500/10 hover:bg-green-500/15"
            : "border-red-500/30 bg-red-500/10 hover:bg-red-500/15"
        }`}>
        <div className='flex flex-col items-center gap-1'>
          <span className='text-xs font-medium text-zinc-300'>Today</span>
          {didPracticeToday ? (
            <FaCheck className='text-green-400' />
          ) : (
            <FaTimes className='text-red-400' />
          )}
        </div>
        <div className='text-center'>
          <div
            className={`text-sm font-bold ${
              didPracticeToday ? "text-green-300" : "text-red-300"
            }`}>
            {didPracticeToday ? "Done" : "Pending"}
          </div>
          <div className='text-xs text-zinc-500'>Practice</div>
        </div>
      </div>

      {/* Weekly Streak Box - Enhanced */}
      <div className='h-16 rounded-xl border border-cyan-500/30 bg-cyan-500/10 shadow-sm backdrop-blur-sm'>
        <WeeklyStreakBox dayWithoutBreak={dayWithoutBreak} />
      </div>

      {/* Points - Enhanced Card */}
      <div className='hidden h-16 items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-yellow-500/15 sm:flex'>
        <div className='flex flex-col items-center gap-1'>
          <FaTrophy className='text-yellow-400' />
          <span className='text-xs font-medium text-zinc-300'>Points</span>
        </div>
        <div className='text-center'>
          <div className='text-sm font-bold text-yellow-300'>
            {points.toLocaleString()}
          </div>
          <div className='text-xs text-zinc-500'>Total</div>
        </div>
      </div>

      {/* Time - Enhanced Card */}
      <div className='hidden h-16 items-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-cyan-500/15 lg:flex'>
        <div className='flex flex-col items-center gap-1'>
          <FaClock className='text-cyan-400' />
          <span className='text-xs font-medium text-zinc-300'>Time</span>
        </div>
        <div className='text-center'>
          <div className='font-mono text-sm font-bold text-cyan-300'>
            {totalPracticeTime}
          </div>
          <div className='text-xs text-zinc-500'>Practice</div>
        </div>
      </div>
    </div>
  );
};
