import { cn } from "assets/lib/utils";
import { SkillCategoryBadge } from "feature/skills/components/SkillCategoryBadge";
import { SkillCategoryTitle } from "feature/skills/components/SkillCategoryTitle";
import { SkillsList } from "feature/skills/components/SkillsList";
import { SKILL_CATEGORY_ICONS } from "feature/skills/constants/skillIcons";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface SkillCategoryCardProps {
  category: string;
  skills: GuitarSkill[];
  userSkills: UserSkills;
  index: number;
  totalLevels?: number;
  maxPossibleLevels?: number;
  percentage?: number;
  colorClass?: string;
  progressColorClass?: string;
  onSkillUpgrade?: (skillId: string) => void;
}

export const SkillCategoryCard = ({
  category,
  skills,
  userSkills,
  index,
  totalLevels,
  progressColorClass,
  onSkillUpgrade,
}: SkillCategoryCardProps) => {
  const { t } = useTranslation();
  const POINTS_PER_LEVEL = 10;

  const CategoryIcon =
    SKILL_CATEGORY_ICONS[category as keyof typeof SKILL_CATEGORY_ICONS];

  const calculatedTotalPoints = skills.reduce(
    (sum, skill) => sum + (userSkills.unlockedSkills[skill.id] || 0),
    0
  );
  const displayTotalLevels = totalLevels ?? calculatedTotalPoints;

  const categoryLevel = Math.floor(displayTotalLevels / POINTS_PER_LEVEL);

  const availablePoints =
    userSkills.availablePoints[
      category as keyof typeof userSkills.availablePoints
    ] || 0;

  const getEnhancedGradient = () => {
    switch (category) {
      case "technique":
        return "from-red-950/25 to-red-900/20 border-red-700/20";
      case "theory":
        return "from-blue-950/25 to-blue-900/20 border-blue-700/20";
      case "hearing":
        return "from-emerald-950/25 to-emerald-900/20 border-emerald-700/20";
      case "creativity":
        return "from-purple-950/25 to-purple-900/20 border-purple-700/20";
      default:
        return "from-slate-950/25 to-slate-900/20 border-slate-700/20";
    }
  };

  const getProgressColor = () => {
    switch (category) {
      case "technique":
        return "bg-red-600/60";
      case "theory":
        return "bg-blue-600/60";
      case "hearing":
        return "bg-emerald-600/60";
      case "creativity":
        return "bg-purple-600/60";
      default:
        return "bg-gray-600/60";
    }
  };

  const enhancedGradient = getEnhancedGradient();
  const progressColor = progressColorClass || getProgressColor();

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative mt-5 rounded-md border p-4 pt-12",
        "bg-gradient-to-br backdrop-blur-sm transition-all duration-300",
        "hover:bg-second-500/10",
        enhancedGradient
      )}>
      <SkillCategoryBadge
        category={category}
        icon={CategoryIcon}
        level={categoryLevel}
        availablePoints={availablePoints}
        totalLevels={displayTotalLevels}
      />
      <SkillCategoryTitle
        category={category}
        title={t(`skills:categories.${category}` as any)}
      />

      <div className='mb-3 mt-3'>
        <div className='mb-1 flex justify-between text-xs'>
          <span className='text-white/70'>{t("skills:progress" as any)}</span>
          <span className='font-medium text-white/80'>
            {displayTotalLevels % POINTS_PER_LEVEL} / {POINTS_PER_LEVEL}
          </span>
        </div>
        <div className='h-1 overflow-hidden rounded-full bg-black/10'>
          <div
            className={`h-full ${progressColor} rounded-full`}
            style={{
              width: `${
                (displayTotalLevels % POINTS_PER_LEVEL) *
                (100 / POINTS_PER_LEVEL)
              }%`,
            }}></div>
        </div>
      </div>

      <SkillsList
        skills={skills}
        userSkills={userSkills}
        category={category}
        onSkillUpgrade={onSkillUpgrade || (() => {})}
      />
    </motion.div>
  );
};
