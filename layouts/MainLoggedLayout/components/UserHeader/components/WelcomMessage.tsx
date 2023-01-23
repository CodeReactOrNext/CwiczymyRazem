import { useTranslation } from "react-i18next";
import { FaCheck, FaTimes } from "react-icons/fa";
import { checkIsPracticeToday } from "utils/gameLogic/checkIsPracticeToday";
interface WelocmeMessageProps {
  userName: string;
  lastReportDate: string;
  points: number;
}
const WelcomeMessage = ({
  userName,
  points,
  lastReportDate,
}: WelocmeMessageProps) => {
  const { t } = useTranslation("common");
  const isPracticeToday = checkIsPracticeToday(new Date(lastReportDate));

  return (
    <div className='text:xs xxs:text-base sm:text-2xl md:text-base lg:text-xl xl:text-2xl '>
      <p className=' xs:text-lg md:text-xl lg:text-2xl xl:text-3xl  '>
        {t("header.hey")} <span className='text-mainText'>{userName}!</span>
      </p>
      <p>
        {t("header.earned_points")}{" "}
        <span className='text-mainText'>{points}</span>
      </p>
      <div className='flex flex-row items-center gap-2'>
        <p>{t("header.practice_today")}</p>
        {isPracticeToday ? (
          <FaCheck className='text-green-300' />
        ) : (
          <FaTimes className='text-red-300' />
        )}
      </div>
    </div>
  );
};

export default WelcomeMessage;
