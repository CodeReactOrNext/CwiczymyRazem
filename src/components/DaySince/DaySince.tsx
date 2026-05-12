import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";

const daysSince = (date: Date) => {
  const currentDate = new Date();
  
  // Set times to 00:00:00 to compare full days accurately
  const d1 = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const d2 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const timeDiff = d1.getTime() - d2.getTime();
  const diffDays = Math.floor(timeDiff / (1000 * 3600 * 24));
  return diffDays;
};

export const DaySinceMessage = ({ date }: { date: Date }) => {
  const { t } = useTranslation("common");

  const daysSinceNumber = daysSince(date);

  const getStatusColor = () => {
    if (daysSinceNumber === 0) return "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]";
    if (daysSinceNumber === 1) return "bg-cyan-400/40"; // Visible but less than today
    if (daysSinceNumber < 7) return "bg-zinc-500";
    return "bg-zinc-800";
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", getStatusColor())} />
      
      <p className={cn(
        'font-medium text-[0.6rem] xs:text-[0.65rem] sm:text-xs',
        daysSinceNumber === 0 ? "text-cyan-400" : 
        daysSinceNumber === 1 ? "text-zinc-200" : "text-zinc-500"
      )}>
        {daysSinceNumber === 0 && t("day_since.practice_last_24")}
        {daysSinceNumber === 1 && t("day_since.practice_yesterday")}
        {daysSinceNumber > 1 &&
          t("day_since.practice_day", {
            days: daysSinceNumber,
          })}
        {isNaN(daysSinceNumber) && t("day_since.no_practice")}
      </p>
    </div>
  );
};
