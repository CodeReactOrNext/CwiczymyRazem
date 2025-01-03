import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ToolTip } from "components/UI";

import {
  AchievementList,
  achievementsData,
} from "assets/achievements/achievementsData";
import AchievementCard from "layouts/ProfileLayout/components/Achievement/AchievementCard";

interface AchievementsMapProps {
  userAchievements: AchievementList[];
}

const AchievementsMap = ({ userAchievements }: AchievementsMapProps) => {
  return (
    <div className='mt-4 flex flex-row flex-wrap items-center justify-center gap-5'>
      <ToolTip />
      {achievementsData.map(({ Icon, id }, index) => {
        const isUnlocked = userAchievements?.includes(id);

        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.1, delay: index * 0.01 }}
            className={`rounded-xl p-3 ${isUnlocked ? "" : "bg-second-600"}`}>
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
