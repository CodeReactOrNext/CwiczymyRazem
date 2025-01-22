import type { AchievementsDataInterface } from "assets/achievements/achievementsData";
import type { AchievementsRarityType } from "assets/achievements/achievementsRarity";
import IconBox from "components/IconBox";
import AchievementCard from "layouts/ProfileLayout/components/Achievement/AchievementCard";
import { useTranslation } from "react-i18next";
import { FaMedal } from "react-icons/fa";

export interface AchievementBoxProps extends AchievementsRarityType {
  achievment: AchievementsDataInterface[];
}

const AchievementBox = ({ achievment, rarity }: AchievementBoxProps) => {
  const { t } = useTranslation("achievements");

  return (
    <div className='content-box mb-4 flex flex-row font-openSans text-sm '>
      <IconBox Icon={FaMedal} medium />
      <div className='mx-2 self-center '>
        <p className='text- mb-2  text-secondText '>{t(rarity)}</p>
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
