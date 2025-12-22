import { useTranslation } from "react-i18next";
import { FaCheck, FaTimes, FaClock, FaTrophy, FaFire } from "react-icons/fa";
import {
  checkIsPracticeToday,
  getUpdatedActualDayWithoutBreak,
} from "utils/gameLogic";
import { cn } from "assets/lib/utils";

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
      {/* Today's Practice Status - Redesigned */}
      <div className={cn(
        "flex h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 shadow-sm backdrop-blur-sm transition-all duration-500",
        didPracticeToday 
            ? "bg-emerald-500/10 text-emerald-400" 
            : "bg-zinc-800/40 text-zinc-400"
      )}>
        {didPracticeToday ? (
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                <FaCheck />
            </div>
            <span className='text-[10px] font-bold uppercase tracking-wider'>
              Goal met
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-[10px] text-zinc-400">
                <FaTimes />
            </div>
            <span className='text-[10px] font-bold uppercase tracking-wider opacity-60'>
              Todays goal
            </span>
          </div>
        )}
      </div>

      {/* Flame Streak & Weekly Progress Combined */}
      <div className='flex h-10 items-center gap-3 rounded-lg bg-zinc-800/40 px-3 py-2 shadow-sm backdrop-blur-sm'>
        <div className="flex items-center gap-1.5 shrink-0 px-1">
            <FaFire className={cn(
                "text-xl transition-all duration-500",
                dayWithoutBreak > 0 
                    ? "text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
                    : "text-zinc-700 opacity-50"
            )} />
            {dayWithoutBreak > 0 && (
                <span className="text-sm font-black text-white">
                    {dayWithoutBreak}
                </span>
            )}
        </div>

        <div className='flex items-center gap-1 border-l border-white/5 pl-2'>
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => {
                const isActive = index < dayWithoutBreak;
                return (
                    <div
                        key={index}
                        className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-[4px] text-[9px] font-bold transition-all duration-300",
                            isActive
                                ? "bg-white text-zinc-900 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                : "bg-zinc-800 text-zinc-600"
                        )}
                    >
                        {day}
                    </div>
                );
            })}
        </div>
      </div>

      {/* Points - Compact Card */}
      <div className='hidden h-10 items-center justify-center gap-2 rounded-lg bg-zinc-800/40 px-3 py-2 shadow-sm backdrop-blur-sm sm:flex'>
        <FaTrophy className='text-xs text-yellow-500/80' />
        <span className='text-xs font-semibold text-white'>
          {points.toLocaleString()}
        </span>
      </div>

      {/* Time - Compact Card */}
      <div className='hidden h-10 items-center justify-center gap-2 rounded-lg bg-zinc-800/40 px-3 py-2 shadow-sm backdrop-blur-sm lg:flex'>
        <FaClock className='text-xs text-zinc-400' />
        <span className='font-mono text-xs font-semibold text-white'>
          {totalPracticeTime}
        </span>
      </div>
    </div>
  );
};
