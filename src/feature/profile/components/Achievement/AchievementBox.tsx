import type { 
  AchievementContext, 
  AchievementsDataInterface,
  AchievementsRarityType 
} from "feature/achievements";
import { 
  AchievementCard 
} from "feature/achievements";
import { useTranslation } from "hooks/useTranslation";

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
      <div className='self-center '>
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
