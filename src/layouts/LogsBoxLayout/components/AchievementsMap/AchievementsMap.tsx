import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ToolTip } from "components/UI";

import {
  AchievementList,
  achievementsData,
} from "assets/achievements/achievementsData";
import { achievementsRarity } from "assets/achievements/achievementsRarity";

interface AchievementsMapProps {
  userAchievements: AchievementList[];
}

const AchievementsMap = ({ userAchievements }: AchievementsMapProps) => {
  const { t } = useTranslation("achievements");

  return (
    <div className='flex flex-row flex-wrap justify-center items-center gap-5 p-4 bg-gray-900/30 rounded-lg shadow-lg'>
      <ToolTip />
      {achievementsData.map(({ Icon, id, rarity, description }, index) => {
        const isUnlocked = userAchievements?.includes(id);
        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.1, delay: index * 0.01 }}
            whileHover={{ scale: 1.1 }}
            className={`p-3 rounded-full ${
              isUnlocked 
                ? 'bg-gray-800/50 shadow-lg hover:shadow-xl transition-shadow'
                : 'bg-gray-900/30'
            }`}
          >
            <Icon
              className={`text-4xl transition-all duration-300 ${
                isUnlocked 
                  ? 'drop-shadow-glow' 
                  : 'text-gray-600 grayscale'
              }`}
              color={isUnlocked ? achievementsRarity[rarity].color : ""}
              data-tip={isUnlocked ? t(description) : "Achievement Locked"}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default AchievementsMap;
