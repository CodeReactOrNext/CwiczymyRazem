import { useTranslation } from "react-i18next";
import { FaClock, FaStar } from "react-icons/fa";
import { FaCheck, FaTimes } from "react-icons/fa";
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

const WelcomeMessage = ({
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
    <div className='flex flex-col '>
      <div className='stats bg-second'>
        <div className='stat min-w-[180px] !p-3 font-openSans text-white'>
          <div className='flex flex-row items-center gap-2'>
            <div className='stat-title text-[12px] text-secondText'>
              {t("header.practice_today")}
            </div>
            {didPracticeToday ? (
              <FaCheck className='text-green-300' />
            ) : (
              <FaTimes className='text-red-300' />
            )}
          </div>
        </div>

        <div className='stat hidden min-w-[180px] !p-3 font-openSans text-white xl:block'>
          <div className='flex flex-row items-center gap-2'>
            <div className='stat-title text-[12px] text-secondText'>
              {t("day_since.actual_streak")}
            </div>
            <div className='stat-value font-sans text-2xl'>
              {dayWithoutBreak}
            </div>
          </div>
        </div>
      </div>

      <div className='stats bg-second'>
        <div className='stat min-w-[180px] !p-3 font-openSans text-white'>
          <div className='stat-title text-[12px] text-secondText'>
            {t("header.earned_points")}
          </div>
          <div className='stat-value font-sans text-2xl'>{points}</div>
        </div>

        <div className='stat hidden min-w-[180px] !p-3 font-openSans text-white xl:block'>
          <div className='stat-title text-[12px] text-secondText'>
            {t("header.total_practice_time")}
          </div>
          <div className='stat-value font-sans text-2xl'>
            {totalPracticeTime}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeMessage;
