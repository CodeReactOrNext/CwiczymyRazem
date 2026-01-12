import { AchievementCard, AchievementList, useAchievementContext } from "feature/achievements";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card } from "assets/components/ui/card";
import { Trophy } from "lucide-react";

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
      transition={{ duration: 0.5, delay: 1.2 }}
      className="h-full"
    >
      <Card className='border-none bg-amber-500/5 backdrop-blur-xl rounded-lg h-full'>
        <div className='p-8'>
          <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-amber-500" />
              </div>
              <h3 className='text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/80'>
                {t("report:rating_popup.new_achievements")}
              </h3>
          </div>
          <div className='flex flex-wrap gap-6'>
            {achievements.map((id) => (
              <motion.div 
                key={id} 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-16 h-16 grayscale-0 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all"
              >
                <AchievementCard id={id} context={context} isUnlocked={true} />
              </motion.div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
