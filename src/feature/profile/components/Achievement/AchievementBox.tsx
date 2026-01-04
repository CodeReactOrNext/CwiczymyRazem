import { IconBox } from "components/IconBox/IconBox";
import { 
  AchievementContext, 
  AchievementsDataInterface, 
  AchievementCard,
  AchievementsRarityType 
} from "feature/achievements";
import { useTranslation } from "react-i18next";
import { FaMedal } from "react-icons/fa";

export interface AchievementBoxProps extends AchievementsRarityType {
  achievment: AchievementsDataInterface[];
  maxLenght: number;
  context?: AchievementContext | null;
}

export const AchievementBox = ({
  achievment,
  rarity,
  maxLenght,
  context,
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
           {achievment.map((item) => {
              return (
                <div
                  key={item.id}
                  className='mb-2 flex w-[4rem] flex-col items-center text-center'>
                  <AchievementCard id={item.id} data={item} context={context} isUnlocked={true} />
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
