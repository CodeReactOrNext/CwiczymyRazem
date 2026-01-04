import { AchievementList, achievementsData, AchievementCard, useAchievementContext } from "feature/achievements";

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
                showProgress={true}
              />
            )}
            {!isUnlocked && (
              <AchievementCard 
                id={id} 
                data={achievementsData[index]} 
                context={context} 
                isUnlocked={false}
                showProgress={true}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AchievementsMap;
