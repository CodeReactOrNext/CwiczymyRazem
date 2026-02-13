import { cn } from "assets/lib/utils";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { SkillCategoryTitle } from "feature/skills/components/SkillCategoryTitle";
import { SkillsList } from "feature/skills/components/SkillsList";
import { SKILL_CATEGORY_ICONS } from "feature/skills/constants/skillIcons";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";

interface SkillCategoryCardProps {
  category: CategoryKeys;
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

  const getCategoryColors = () => {
    switch (category) {
      case "technique":
        return {
          border: "border-red-500/20",
          iconBg: "bg-red-500/10",
          iconText: "text-red-400",
          progress: "bg-red-500",
          glow: "from-red-500/5",
        };
      case "theory":
        return {
          border: "border-blue-500/20",
          iconBg: "bg-blue-500/10",
          iconText: "text-blue-400",
          progress: "bg-blue-500",
          glow: "from-blue-500/5",
        };
      case "hearing":
        return {
          border: "border-emerald-500/20",
          iconBg: "bg-emerald-500/10",
          iconText: "text-emerald-400",
          progress: "bg-emerald-500",
          glow: "from-emerald-500/5",
        };
      case "creativity":
        return {
          border: "border-purple-500/20",
          iconBg: "bg-purple-500/10",
          iconText: "text-purple-400",
          progress: "bg-purple-500",
          glow: "from-purple-500/5",
        };
      default:
        return {
          border: "border-zinc-500/20",
          iconBg: "bg-zinc-500/10",
          iconText: "text-zinc-400",
          progress: "bg-zinc-500",
          glow: "from-zinc-500/5",
        };
    }
  };

  const colors = getCategoryColors();
  const progressColor = progressColorClass || colors.progress;

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative rounded-2xl border bg-zinc-900/40 p-6 backdrop-blur-sm transition-all duration-300",
        "hover:border-white/10",
        colors.border
      )}>
      <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br opacity-50", colors.glow, "to-transparent")}></div>

      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between">
          <div className={cn("rounded-xl p-3", colors.iconBg)}>
            <CategoryIcon className={cn("h-6 w-6", colors.iconText)} />
          </div>

          <div className="flex items-center gap-2">
       
            <div className={cn("rounded-lg border px-3 py-1", colors.border, colors.iconBg)}>
              <span className={cn("text-sm font-bold", colors.iconText)}>
                {categoryLevel}
              </span>
            </div>
          </div>
        </div>

        <SkillCategoryTitle
          category={category}
          title={t(`skills:categories.${category}` as any)}
        />

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">{t("skills:progress" as any)}</span>
            <span className="font-medium text-white">
              {displayTotalLevels % POINTS_PER_LEVEL} / {POINTS_PER_LEVEL}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/40">
            <div
              className={cn("h-full rounded-full transition-all duration-500", progressColor)}
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
      </div>
    </motion.div>
  );
};
