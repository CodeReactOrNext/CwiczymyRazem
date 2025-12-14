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
      {/* Today's Practice Status - Compact */}
      <div className='flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-zinc-800/50 px-3 py-2 shadow-sm backdrop-blur-sm'>
        {didPracticeToday ? (
          <FaCheck className='text-xs text-white' />
        ) : (
          <FaTimes className='text-xs text-zinc-400' />
        )}
        <span className='text-xs font-semibold text-white'>
          {didPracticeToday ? "Done" : "Pending"}
        </span>
      </div>

      {/* Weekly Streak - Horizontal Days */}
      <div className='flex h-10 items-center gap-1 rounded-lg border border-white/10 bg-zinc-800/50 px-3 py-2 shadow-sm backdrop-blur-sm'>
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => {
          const isActive = index < dayWithoutBreak;
          return (
            <div
              key={index}
              className={`flex h-6 w-6 items-center justify-center rounded text-xs font-medium ${
                isActive
                  ? "bg-white text-zinc-800"
                  : "bg-zinc-700 text-zinc-400"
              }`}>
              {day}
            </div>
          );
        })}
        <span className='ml-2 text-xs font-semibold text-white'>
          {dayWithoutBreak}
        </span>
      </div>

      {/* Points - Compact Card */}
      <div className='hidden h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-zinc-800/50 px-3 py-2 shadow-sm backdrop-blur-sm sm:flex'>
        <FaTrophy className='text-xs text-white' />
        <span className='text-xs font-semibold text-white'>
          {points.toLocaleString()}
        </span>
      </div>

      {/* Time - Compact Card */}
      <div className='hidden h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-zinc-800/50 px-3 py-2 shadow-sm backdrop-blur-sm lg:flex'>
        <FaClock className='text-xs text-white' />
        <span className='font-mono text-xs font-semibold text-white'>
          {totalPracticeTime}
        </span>
      </div>
    </div>
  );
};
