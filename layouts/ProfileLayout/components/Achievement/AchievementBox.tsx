import { useTranslation } from "react-i18next";
import { FaMedal } from "react-icons/fa";

import IconBox from "components/IconBox";
import AchievementCard from "layouts/ProfileLayout/components/Achievement/AchievementCard";

import { AchievementsDataInterface } from "assets/achievements/achievementsData";
import { AchievementsRarityType } from "assets/achievements/achievementsRarity";

export interface AchievementBoxProps extends AchievementsRarityType {
  achievment: AchievementsDataInterface[];
}

const AchievementBox = ({ achievment, rarity }: AchievementBoxProps) => {
  const { t } = useTranslation("achievements");

  return (
    <div className=' mb-4 m-2 flex flex-row border-2 border-second-400 bg-second-600 p-2 font-openSans text-sm font-bold'>
      <IconBox Icon={FaMedal} />
      <div className='mx-2 self-center '>
        <p className=' mb-2  text-mainText '>{t(rarity)}</p>
        <div className='flex w-full  flex-row flex-wrap gap-4'>
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
