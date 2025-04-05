import { useTranslation } from "react-i18next";
import { FaFire } from "react-icons/fa";

interface StreakDisplayProps {
  dayWithoutBreak: number;
}

const StreakDisplay = ({ dayWithoutBreak }: StreakDisplayProps) => {
  const { t } = useTranslation("common");

  const getStreakColor = () => {
    if (dayWithoutBreak >= 30) return "text-yellow-400";
    if (dayWithoutBreak >= 20) return "text-amber-400"; 
    if (dayWithoutBreak >= 11) return "text-orange-400";
    if (dayWithoutBreak >= 5) return "text-blue-500";
    if (dayWithoutBreak >= 4) return "text-blue-400";
    if (dayWithoutBreak >= 1) return "text-gray-300";
    return "";
  };

  return (
    <div className='flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2'>
      <div className='stat-title whitespace-nowrap text-[11px] text-secondText sm:text-[12px]'>
        {t("day_since.actual_streak")}
      </div>
      <div className='relative flex items-center'>
        <div className={`stat-value font-sans text-xl sm:text-2xl ${getStreakColor()}`}>
          {dayWithoutBreak}
        </div>

        {dayWithoutBreak >= 1 && (
          <div className='ml-1 sm:ml-2'>
            <FaFire
              className={`text-lg sm:text-xl ${getStreakColor()}`}
              aria-label='Streak badge'
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakDisplay;
