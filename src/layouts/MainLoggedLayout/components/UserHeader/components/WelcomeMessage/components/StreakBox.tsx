import { cn } from "assets/lib/utils";
import { FaFire } from "react-icons/fa";
import { addDays, isSameDay, startOfWeek } from "date-fns";
import { useAppSelector } from "store/hooks";
import { selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { checkIsPracticeToday, getUpdatedActualDayWithoutBreak } from "utils/gameLogic";

export const StreakBox = () => {
  const userAuth = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);
  const { reportList } = useActivityLog(userAuth || "");

  const lastReportDate = userStats?.lastReportDate || "";
  const actualDayWithoutBreak = userStats?.actualDayWithoutBreak || 0;

  const userLastReportDate = new Date(lastReportDate);
  const didPracticeToday = checkIsPracticeToday(userLastReportDate);
  const isStreak = getUpdatedActualDayWithoutBreak(
    actualDayWithoutBreak,
    userLastReportDate,
    didPracticeToday
  );
  
  const dayWithoutBreak = isStreak === 1 && !didPracticeToday ? 0 : actualDayWithoutBreak;

  return (
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
          const start = startOfWeek(today, { weekStartsOn: 1 });
          const dayDate = addDays(start, index);
          
          const hasReport = reportList?.some((report: { date: Date | string }) => 
            isSameDay(new Date(report.date), dayDate)
          );
          
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
  );
};
