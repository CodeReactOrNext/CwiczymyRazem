import { cn } from "assets/lib/utils";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { addDays, isSameDay,startOfWeek } from "date-fns";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "react-i18next";
import { FaClock, FaFire, FaTrophy } from "react-icons/fa";
import { useAppSelector } from "store/hooks";
import {
  checkIsPracticeToday,
  getUpdatedActualDayWithoutBreak,
} from "utils/gameLogic";


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
  const userAuth = useAppSelector(selectUserAuth);
  const { reportList } = useActivityLog(userAuth || "");

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
            {["M", "T", "W", "T", "F", "S", "S"].map((dayLabel, index) => {
                const today = new Date();
                // Get start of current week (Monday)
                const start = startOfWeek(today, { weekStartsOn: 1 });
                // Get the date for the current index (0 = Monday, etc.)
                const dayDate = addDays(start, index);
                
                // Check if we have a report for this specific day
                const hasReport = reportList?.some((report: { date: Date | string }) => 
                    isSameDay(new Date(report.date), dayDate)
                );
                
                // Allow highlighting today if we just practiced (optimistic update via props if reportList is stale)
                const isToday = isSameDay(dayDate, today);
                const isActive = hasReport || (isToday && didPracticeToday);

                return (
                    <div
                        key={index}
                        className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-[4px] text-[9px] font-bold transition-all duration-300",
                            isActive
                                ? "bg-white text-zinc-900 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                : "bg-zinc-800 text-zinc-600"
                        )}
                        title={dayDate.toDateString()}
                    >
                        {dayLabel}
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
