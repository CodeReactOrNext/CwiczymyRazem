import { AchievementCard, AchievementList, useAchievementContext } from "feature/achievements";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card } from "assets/components/ui/card";

interface AchievementsDisplayProps {
  achievements: AchievementList[];
}

export const AchievementsDisplay = ({ achievements }: AchievementsDisplayProps) => {
  const { t } = useTranslation(["report"]);
  const context = useAchievementContext();

  if (achievements.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.2 }}>
      <Card className='border-amber-500/20 bg-amber-500/5 backdrop-blur-sm'>
        <div className='p-4'>
          <h3 className='mb-4 text-sm font-semibold text-white/80 uppercase tracking-wider'>
            {t("report:rating_popup.new_achievements")}
          </h3>
          <div className='flex flex-wrap gap-4'>
            {achievements.map((id) => (
              <div key={id} className="w-12 h-12">
                <AchievementCard id={id} context={context} isUnlocked={true} />
              </div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
