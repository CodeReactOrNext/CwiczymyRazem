import { AchievementsInterface } from "data/achievements";
import { useTranslation } from "react-i18next";
import { FaMedal } from "react-icons/fa";
import Achievement from "components/Achievement";
import { AchievementsRarityType } from "data/achievementsRarity";

export interface AchievementBoxProps extends AchievementsRarityType {
  achievment: AchievementsInterface[];
}

export default function AchievementBox({
  achievment,
  rarity,
}: AchievementBoxProps) {
  const { t } = useTranslation("achievements");

  return (
    <div className='relative right-2 mt-4 flex flex-row'>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center bg-main sm:h-10 sm:w-10 `}>
        <FaMedal className='text-mainText' />
      </div>
      <div className='mx-2 self-center '>
        <p className=' mb-2 text-sm text-main-opposed-700'>{t(rarity)}</p>
        <div className='flex w-full max-w-[20rem] flex-row flex-wrap gap-4'>
          {achievment.length === 0 ? (
            <p>Brak</p>
          ) : (
            achievment.map(({ Icon, description, rarity, name }, index) => (
              <div key={index} className='flex flex-col items-center'>
                <Achievement
                  Icon={Icon}
                  description={description}
                  rarity={rarity}
                />
                <p className='py-2 text-xs font-light'>{name}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}