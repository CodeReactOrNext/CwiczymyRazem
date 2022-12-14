import { AchievementsDataInterface } from "assets/achievements/achievementsData";
import { useTranslation } from "react-i18next";
import { FaMedal } from "react-icons/fa";
import Achievement from "components/Achievement";
import { AchievementsRarityType } from "assets/achievements/achievementsRarity";
import AchievementCard from "layouts/ProfileLayout/components/Achievement/AchievementCard";

export interface AchievementBoxProps extends AchievementsRarityType {
  achievment: AchievementsDataInterface[];
}

const AchievementBox = ({ achievment, rarity }: AchievementBoxProps) => {
  const { t } = useTranslation("achievements");

  return (
    <div className='relative right-2 mt-4 flex flex-row'>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center bg-main  sm:h-10 sm:w-10 `}>
        <FaMedal className='text-mainText' />
      </div>
      <div className='mx-2 self-center '>
        <p className=' mb-2 text-base text-mainText'>{t(rarity)}</p>
        <div className='flex w-full  flex-row flex-wrap gap-4'>
          {achievment.length === 0 ? (
            <p>{t("empty")}</p>
          ) : (
            achievment.map(({ id }, index) => {
              return (
                <div
                  key={index}
                  className='mb-2 flex w-[4rem] flex-col items-center text-center'>
                  <AchievementCard id={id} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
export default AchievementBox;
