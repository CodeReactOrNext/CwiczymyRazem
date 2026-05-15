import { cn } from "assets/lib/utils";
import type { CategoryKeys } from "components/Charts/ActivityChart";
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
}: SkillCategoryCardProps) => {
  const { t } = useTranslation();

  const CategoryIcon = SKILL_CATEGORY_ICONS[category as keyof typeof SKILL_CATEGORY_ICONS];
  
  // Only get unlocked skills
  const unlockedSkills = skills.filter(
    (skill) => (userSkills.unlockedSkills[skill.id] || 0) > 0
  );

  const getCategoryColors = () => {
    switch (category) {
      case "technique": return "text-red-400 bg-red-400/10 shadow-[0_0_10px_rgba(248,113,113,0.1)] border border-red-500/10";
      case "theory": return "text-blue-400 bg-blue-400/10 shadow-[0_0_10px_rgba(96,165,250,0.1)] border border-blue-500/10";
      case "hearing": return "text-emerald-400 bg-emerald-400/10 shadow-[0_0_10px_rgba(52,211,153,0.1)] border border-emerald-500/10";
      case "creativity": return "text-purple-400 bg-purple-400/10 shadow-[0_0_10px_rgba(192,132,252,0.1)] border border-purple-500/10";
      default: return "text-zinc-400 bg-zinc-400/10 shadow-[0_0_10px_rgba(161,161,170,0.1)] border border-zinc-500/10";
    }
  };

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className="relative rounded-lg border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/10 hover:bg-zinc-900/60"
    >
      <div className="flex flex-col h-full gap-6">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-white/5 pb-5">
          <div className={cn("rounded-lg p-2.5 flex items-center justify-center", getCategoryColors())}>
            <CategoryIcon className="h-5 w-5" />
          </div>
          <h3 className="text-xs font-bold capitalize tracking-widest text-zinc-100">
            {t(`skills:categories.${category}` as any)}
          </h3>
        </div>

        {/* Minimal Unlocked Skills List */}
        <div className="flex-1">
          {unlockedSkills.length > 0 ? (
            <div className="flex flex-col gap-2">
              {unlockedSkills.map((skill) => {
                const level = userSkills.unlockedSkills[skill.id] || 0;
                return (
                  <div
                    key={skill.id}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 rounded-lg bg-zinc-800/40 border border-white/5 transition-colors hover:border-white/10 group"
                  >
                    <div className="flex items-center gap-2">
                      {skill.icon && <skill.icon className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />}
                      <span className="text-[11px] capitalize tracking-wider font-semibold text-zinc-400 group-hover:text-zinc-300 transition-colors">
                        {t(`skills:skills.${skill.id}.name` as any)}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 tabular-nums bg-white/5 px-2 py-0.5 rounded-sm shrink-0">
                      LVL {level}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-zinc-600 font-semibold tracking-wide flex items-center h-full">
              No skills unlocked yet.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
