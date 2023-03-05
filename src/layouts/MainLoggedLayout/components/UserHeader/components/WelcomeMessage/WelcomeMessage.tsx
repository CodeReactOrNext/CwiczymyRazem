import { useTranslation } from "react-i18next";
import { FaCheck, FaTimes } from "react-icons/fa";

import { checkIsPracticeToday } from "utils/gameLogic/checkIsPracticeToday";
import { getUpdatedActualDayWithoutBreak } from "utils/gameLogic/getUpdatedActualDayWithoutBreak";
interface WelocmeMessageProps {
  userName: string;
  lastReportDate: string;
  points: number;
  actualDayWithoutBreak: number;
}
const WelcomeMessage = ({
  userName,
  points,
  lastReportDate,
  actualDayWithoutBreak,
}: WelocmeMessageProps) => {
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
    <div className='text:xs tracking-wide xxs:text-base sm:text-2xl md:text-base lg:text-xl 2xl:w-[650px]'>
      <p className='py-2 xs:text-lg md:text-xl lg:text-2xl xl:text-3xl '>
        {t("header.hey")} <span className='text-mainText'>{userName}!</span>
      </p>
      <div className='flex flex-col gap-2 2xl:flex-row 2xl:gap-8'>
        <p>
          {t("header.earned_points")}{" "}
          <span className='text-mainText'>{points}</span>
        </p>
        <div className='flex flex-row items-center gap-2'>
          <p>{t("header.practice_today")}</p>
          {didPracticeToday ? (
            <FaCheck className='text-green-300' />
          ) : (
            <FaTimes className='text-red-300' />
          )}
        </div>
        <p className='flex flex-row items-center  gap-1'>
          {t("day_since.actual_streak")}
          <span
            className={`item-center flex h-7 min-w-[28px] justify-center  text-center  font-extrabold text-mainText radius-default
          ${dayWithoutBreak ? "bg-main-400/90 " : "bg-slate-600"}`}>
            {dayWithoutBreak}
          </span>
        </p>
      </div>
    </div>
  );
};

export default WelcomeMessage;
