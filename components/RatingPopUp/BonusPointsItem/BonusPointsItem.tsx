import { convertMsToHM } from "helpers/timeConverter";
import { useTranslation } from "react-i18next";
import { BonusPointsInterface } from "../RatingPopUp";

interface BonusPointsItemProps {
  bonusPoints: BonusPointsInterface;
}

const BonusPointsItem = ({
  bonusPoints,
}: {
  bonusPoints: BonusPointsInterface;
}) => {
  const { t } = useTranslation(["common", "report"]);
  const {
    timePoints,
    additionalPoints,
    streak,
    habitsCount,
    time,
    multiplier,
  } = bonusPoints;
  return (
    <ul className='relative -mt-[10%] md:-ml-[20%]'>
      <li className='flex items-center gap-3 md:first:-translate-x-[5%] md:last:translate-x-[5%]'>
        <p className='text-2xl text-main-500 sm:text-4xl'>x{multiplier}</p>
        <p className='xs:text-xl md:text-2xl'>
          {t("report:rating_popup.regularity")}
        </p>
        <p className='text-base md:text-lg'>
          {streak} {t("report:rating_popup.streak")}
        </p>
      </li>
      <li className='flex items-center gap-3 md:first:-translate-x-[5%] md:last:translate-x-[5%]'>
        <p className='text-2xl text-main-500 sm:text-4xl'>
          +{additionalPoints}
        </p>
        <p className='xs:text-xl md:text-2xl'>
          {t("report:rating_popup.habits")}
        </p>
        <p className='text-base md:text-lg'>
          {t("report:rating_popup.habitsWithCount", { count: habitsCount })}
        </p>
      </li>
      <li className='flex items-center gap-3 md:first:-translate-x-[5%] md:last:translate-x-[5%]'>
        <p className='text-2xl text-main-500 sm:text-4xl'>+{timePoints}</p>
        <p className='xs:text-xl md:text-2xl'>
          {t("report:rating_popup.time")}
        </p>
        <p className='text-base md:text-lg'>
          {t("report:rating_popup.time_amount")} {convertMsToHM(time)}
        </p>
      </li>
    </ul>
  );
};

export default BonusPointsItem;
