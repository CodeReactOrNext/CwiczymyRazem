import { useTranslation } from "react-i18next";

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
    <div className='flex items-center gap-3 rounded-xl border border-zinc-600/30 bg-zinc-800/50 p-3 backdrop-blur-sm'>
      {/* Streak info */}
      <div className='flex flex-col items-center'>
        <span className='text-xs font-medium text-zinc-400'>Streak</span>
        <span className='text-lg font-bold text-cyan-400'>
          {dayWithoutBreak}
        </span>
      </div>

      {/* Week visualization */}
      <div className='flex items-center gap-1.5'>
        {daysOfWeek.map((day, index) => (
          <div key={index} className='flex flex-col items-center gap-1'>
            <span className='text-xs font-medium text-zinc-500'>{day}</span>
            <div
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                filledDays[index]
                  ? "scale-110 bg-cyan-400 shadow-lg shadow-cyan-400/50"
                  : "bg-zinc-600/50 hover:bg-zinc-500/50"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyStreakBox;

