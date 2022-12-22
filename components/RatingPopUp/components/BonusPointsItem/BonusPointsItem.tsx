import Achievement from "components/Achievement";
import { AchievementList } from "data/achievements";
import { convertMsToHM } from "helpers/timeConverter";
import { useTranslation } from "react-i18next";
import { BonusPointsInterface } from "../../RatingPopUp";

interface BonusPointsItemProps {
  bonusPoints: BonusPointsInterface;
  actualDayWithoutBreak: number;
  achievements: AchievementList[];
  isGetNewLevel: boolean;
}

const BonusPointsItem = ({
  bonusPoints,
  actualDayWithoutBreak,
  achievements,
  isGetNewLevel,
}: BonusPointsItemProps) => {
  const { t } = useTranslation(["common", "report"]);
  const { timePoints, additionalPoints, habitsCount, time, multiplier } =
    bonusPoints;

  return (
    <ul className='relative -mt-[10%] md:-ml-[20%]'>
      <li>
        <ul className='mb-5'>
          {isGetNewLevel && (
            <li className=' flex items-center '>
              <p className='text-2xl text-tertiary sm:text-4xl'>
                {t("report:rating_popup.new_level")}
              </p>
            </li>
          )}
          {achievements.length > 0 && (
            <li className=' flex items-center '>
              <p className='text-2xl text-tertiary sm:text-2xl'>
                {t("report:rating_popup.new_achievements")}
              </p>
              <p className='flex gap-3 p-2'>
                {achievements.map((id, index) => (
                  <Achievement key={index} id={id} />
                ))}
              </p>
            </li>
          )}
        </ul>
      </li>

      <li className='flex items-center gap-3 '>
        <p className='text-2xl text-main-500 sm:text-4xl'>x{multiplier}</p>
        <p className='xs:text-xl md:text-2xl'>
          {t("report:rating_popup.regularity")}
        </p>
        <p className='text-base md:text-lg'>
          {actualDayWithoutBreak} {t("report:rating_popup.streak")}
        </p>
      </li>
      {additionalPoints ? (
        <li className='ml-5 flex items-center gap-3 '>
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
      ) : (
        ""
      )}
      <li className='ml-10 flex items-center gap-3 '>
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
