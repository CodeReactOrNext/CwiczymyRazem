import { IconBox } from "components/IconBox/IconBox";
import type { AchievementsDataInterface } from "feature/achievements/achievementsData";
import type { AchievementsRarityType } from "feature/achievements/achievementsRarity";
import AchievementCard from "layouts/ProfileLayout/components/Achievement/AchievementCard";
import { useTranslation } from "react-i18next";
import { FaMedal } from "react-icons/fa";

export interface AchievementBoxProps extends AchievementsRarityType {
  achievment: AchievementsDataInterface[];
  maxLenght: number;
}

const AchievementBox = ({
  achievment,
  rarity,
  maxLenght,
}: AchievementBoxProps) => {
  const { t } = useTranslation("achievements");

  return (
    <div className='flex'>
      <IconBox Icon={FaMedal} medium />
      <div className='mx-2 self-center '>
        <p className=' mb-2  text-secondText '>
          {t(rarity)}
          <span className='ml-1'>
            ({achievment.length}/{maxLenght})
          </span>
        </p>
        <div className='flex w-full  flex-row flex-wrap md:gap-4'>
          {achievment.length === 0 ? (
            <p>{t("empty")}</p>
          ) : (
            achievment.map(({ id }) => {
              return (
                <div
                  key={id}
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
