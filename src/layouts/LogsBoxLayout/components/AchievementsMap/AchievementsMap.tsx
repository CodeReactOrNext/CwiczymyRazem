import type { AchievementList } from "feature/achievements/types";
import { achievementsData } from "feature/achievements/data/achievementsData";
import { AchievementCard } from "feature/achievements/components/Card/AchievementCard";
import { useAchievementContext } from "feature/achievements/hooks/useAchievementContext";

interface AchievementsMapProps {
  userAchievements: AchievementList[];
}

const AchievementsMap = ({ userAchievements }: AchievementsMapProps) => {
  const context = useAchievementContext();

  return (
    <div className='mt-4 flex h-full flex-row flex-wrap items-center justify-center gap-5 '>
      {achievementsData.map(({ Icon, id, name, description }, index) => {
        const isUnlocked = userAchievements?.includes(id);

        return (
          <div
            key={id}
            className={`mb-4 rounded-xl p-3 ${
              isUnlocked ? "" : "bg-second-600 opacity-50 grayscale"
            }`}>
            {isUnlocked && (
              <AchievementCard 
                id={id} 
                data={achievementsData[index]} 
                isUnlocked={true} 
              />
            )}
            {!isUnlocked && (
              <AchievementCard 
                id={id} 
                data={achievementsData[index]} 
                context={context} 
                isUnlocked={false}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AchievementsMap;
