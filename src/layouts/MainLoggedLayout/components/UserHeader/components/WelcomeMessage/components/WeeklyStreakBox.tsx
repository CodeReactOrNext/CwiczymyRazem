import { useTranslation } from "hooks/useTranslation";

interface WeeklyStreakBoxProps {
  dayWithoutBreak: number;
}

const WeeklyStreakBox = ({ dayWithoutBreak }: WeeklyStreakBoxProps) => {
  const { t } = useTranslation("common");

  // Get days of week (Monday = 0, Sunday = 6)
  const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];

  // Calculate which days should be filled based on current streak
  const getFilledDays = () => {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayIndex = today === 0 ? 6 : today - 1; // Convert to Monday = 0 format

    const filledDays = new Array(7).fill(false);

    // Fill days based on streak length
    for (let i = 0; i < Math.min(dayWithoutBreak, 7); i++) {
      const dayIndex = (mondayIndex - i + 7) % 7;
      filledDays[dayIndex] = true;
    }

    return filledDays;
  };

  const filledDays = getFilledDays();

  return (
    <div className='flex h-full items-center gap-3 px-4 py-2.5'>
      {/* Streak info - Enhanced */}
      <div className='flex flex-col items-center gap-1'>
        <span className='text-xs font-medium text-zinc-300'>Streak</span>
        <div className='flex items-center gap-1'>
          <span className='text-lg font-bold text-cyan-300'>
            {dayWithoutBreak}
          </span>
          <span className='text-xs text-zinc-500'>days</span>
        </div>
      </div>

      {/* Week visualization - Enhanced */}
      <div className='flex items-center gap-2'>
        {daysOfWeek.map((day, index) => (
          <div key={index} className='flex flex-col items-center gap-1.5'>
            <span className='text-xs font-medium text-zinc-400'>{day}</span>
            <div
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                filledDays[index]
                  ? "scale-110 bg-cyan-400 shadow-lg shadow-cyan-400/50 ring-2 ring-cyan-400/20"
                  : "bg-zinc-600/50 hover:scale-105 hover:bg-zinc-500/50"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyStreakBox;
