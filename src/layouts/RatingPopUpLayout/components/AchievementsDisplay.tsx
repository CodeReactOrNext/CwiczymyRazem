import Achievement from "feature/achievements/components/Achievement";
import type { AchievementList } from "feature/achievements/achievementsData";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card } from "assets/components/ui/card";

interface AchievementsDisplayProps {
  achievements: AchievementList[];
}

export const AchievementsDisplay = ({ achievements }: AchievementsDisplayProps) => {
  const { t } = useTranslation(["report"]);

  if (achievements.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.2 }}>
      <Card className='border-yellow-500/20 bg-yellow-500/5 backdrop-blur-sm'>
        <div className='p-3'>
          <h3 className='mb-2 text-sm font-semibold text-white'>
            {t("report:rating_popup.new_achievements")}
          </h3>
          <div className='flex flex-wrap gap-2'>
            {achievements.map((id) => (
              <Achievement key={id} id={id} />
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
