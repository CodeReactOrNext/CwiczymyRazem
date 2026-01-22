import type { CategoryKeys } from "components/Charts/ActivityChart";
import { SkillCategoryCard } from "feature/skills/components/SkillCategoryCard";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Activity, Book, Lightbulb, Music } from "lucide-react";

interface SkillTreeProps {
  userSkills: UserSkills;
  onSkillUpgrade?: (skillId: string) => void;
  isUserProfile: boolean;
}

interface CategoryInfo {
  icon: React.ReactNode;
  colorClass: string;
  progressColorClass: string;
}

export const SkillTreeCards = ({
  userSkills,
  onSkillUpgrade,
  isUserProfile,
}: SkillTreeProps) => {
  const { t } = useTranslation("skills");

  const categorizedSkills = guitarSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, GuitarSkill[]>);

  const categoryTotals = Object.entries(categorizedSkills).reduce(
    (acc, [category, skills]) => {
      const totalLevels = skills.reduce((sum, skill) => {
        return sum + (userSkills.unlockedSkills[skill.id] || 0);
      }, 0);

      acc[category] = {
        totalLevels,
      };
      return acc;
    },
    {} as Record<string, { totalLevels: number }>
  );

  const categoryInfo: Record<string, CategoryInfo> = {
    technique: {
      icon: <Activity className='h-6 w-6' />,
      colorClass: "from-red-800/15 to-red-950/10 border-red-700/15",
      progressColorClass: "bg-red-600/70",
    },
    theory: {
      icon: <Book className='h-6 w-6' />,
      colorClass: "from-blue-800/15 to-blue-950/10 border-blue-700/15",
      progressColorClass: "bg-blue-600/70",
    },
    hearing: {
      icon: <Music className='h-6 w-6' />,
      colorClass: "from-emerald-800/15 to-emerald-950/10 border-emerald-700/15",
      progressColorClass: "bg-emerald-600/70",
    },
    creativity: {
      icon: <Lightbulb className='h-6 w-6' />,
      colorClass: "from-purple-800/15 to-purple-950/10 border-purple-700/15",
      progressColorClass: "bg-purple-600/70",
    },
  };
  return (
    <div className='mb-12 font-openSans'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-white'>
          {t("skill_categories")}
        </h2>
        {!isUserProfile && (
          <p className='text-xs text-gray-400'>{t("categories_description")}</p>
        )}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {Object.entries(categorizedSkills).map(([category, skills], index) => {
          const stats = categoryTotals[category];
          const info = categoryInfo[category] || {};
          return (
            <SkillCategoryCard
              key={category}
              category={category as CategoryKeys}
              skills={skills}
              userSkills={userSkills}
              index={index}
              totalLevels={stats.totalLevels}
              colorClass={info.colorClass}
              progressColorClass={info.progressColorClass}
              onSkillUpgrade={onSkillUpgrade}
            />
          );
        })}
      </motion.div>
    </div>
  );
};
