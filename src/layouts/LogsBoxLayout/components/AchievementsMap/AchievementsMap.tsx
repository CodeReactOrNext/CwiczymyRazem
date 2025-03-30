import type { AchievementList } from "feature/achievements/achievementsData";
import { achievementsData } from "feature/achievements/achievementsData";
import { AchievementCard } from "feature/achievements/components/AchievementCard";
import { motion } from "framer-motion";

interface AchievementsMapProps {
  userAchievements: AchievementList[];
}

const AchievementsMap = ({ userAchievements }: AchievementsMapProps) => {
  return (
    <div className='mt-4 flex h-full flex-row flex-wrap items-center justify-center gap-5 '>
      {achievementsData.map(({ Icon, id }, index) => {
        const isUnlocked = userAchievements?.includes(id);

        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.1, delay: index * 0.01 }}
            className={`mb-4 rounded-xl p-3 ${
              isUnlocked ? "" : "bg-second-600"
            }`}>
            {isUnlocked && <AchievementCard id={id} />}
            {!isUnlocked && (
              <Icon
                className={`text-3xl transition-all duration-300 ${"text-gray-600 grayscale"}`}
                data-tip={"Achievement Locked"}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default AchievementsMap;
