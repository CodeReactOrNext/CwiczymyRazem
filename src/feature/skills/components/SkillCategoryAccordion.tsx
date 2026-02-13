import { cn } from "assets/lib/utils";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { SKILL_CATEGORY_ICONS } from "feature/skills/constants/skillIcons";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { AnimatePresence,motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { ChevronDown, Crown, Diamond, Gem, Sparkles } from "lucide-react";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";

interface SkillCategoryAccordionProps {
  category: CategoryKeys;
  skills: GuitarSkill[];
  userSkills: UserSkills;
}

// RPG-style currency icons for each category
const getCurrencyIcon = (category: CategoryKeys) => {
  switch (category) {
    case "technique":
      return <Gem className='h-3 w-3' />; // Ruby for technique
    case "theory":
      return <Diamond className='h-3 w-3' />; // Crystal for theory
    case "hearing":
      return <Crown className='h-3 w-3' />; // Pearl for hearing
    case "creativity":
      return <Sparkles className='h-3 w-3' />; // Star for creativity
    default:
      return <Gem className='h-3 w-3' />;
  }
};

const getCategoryColors = (category: CategoryKeys) => {
  switch (category) {
    case "technique":
      return {
        bg: "bg-slate-800/40 border-red-600/30",
        text: "text-red-300",
        badge: "bg-slate-800/60 border-red-600/50 text-red-300",
        currency: "text-red-400",
        progress: "bg-red-600/70",
      };
    case "theory":
      return {
        bg: "bg-slate-800/40 border-blue-600/30",
        text: "text-blue-300",
        badge: "bg-slate-800/60 border-blue-600/50 text-blue-300",
        currency: "text-blue-400",
        progress: "bg-blue-600/70",
      };
    case "hearing":
      return {
        bg: "bg-slate-800/40 border-emerald-600/30",
        text: "text-emerald-300",
        badge: "bg-slate-800/60 border-emerald-600/50 text-emerald-300",
        currency: "text-emerald-400",
        progress: "bg-emerald-600/70",
      };
    case "creativity":
      return {
        bg: "bg-slate-800/40 border-purple-600/30",
        text: "text-purple-300",
        badge: "bg-slate-800/60 border-purple-600/50 text-purple-300",
        currency: "text-purple-400",
        progress: "bg-purple-600/70",
      };
    default:
      return {
        bg: "bg-slate-800/40 border-slate-700/30",
        text: "text-slate-300",
        badge: "bg-slate-800/60 border-slate-600/50 text-slate-300",
        currency: "text-slate-400",
        progress: "bg-slate-600/70",
      };
  }
};

export const SkillCategoryAccordion = ({
  category,
  skills,
  userSkills,
}: SkillCategoryAccordionProps) => {
  const { t } = useTranslation("skills");
  const [isExpanded, setIsExpanded] = useState(false);

  const CategoryIcon =
    SKILL_CATEGORY_ICONS[category as keyof typeof SKILL_CATEGORY_ICONS];
  const colors = getCategoryColors(category);
  const _currencyIcon = getCurrencyIcon(category);

  // Calculate stats
  const totalLevels = skills.reduce(
    (sum, skill) => sum + (userSkills.unlockedSkills[skill.id] || 0),
    0
  );
  const categoryLevel = Math.floor(totalLevels / 10);
  const progressToNextLevel = totalLevels % 10;

  // Show all skills
  const allSkills = skills;


  return (
    <div
      className={cn(
        "rounded-lg border backdrop-blur-sm transition-all duration-300",
        colors.bg,
        isExpanded ? "shadow-lg" : "shadow-sm hover:shadow-md"
      )}>
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        className='w-full p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500/50 hover:bg-slate-700/20'
        aria-expanded={isExpanded}
        aria-controls={`skills-${category}`}>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            {/* Category Icon - Larger and more prominent */}
            <div
              className={cn(
                "relative rounded-xl p-3 shadow-lg transition-all duration-300 hover:scale-105",
                colors.badge,
                "ring-1 ring-white/10"
              )}>
              <CategoryIcon className='h-8 w-8' size='large' />
              {/* Glow effect */}
              <div
                className={cn(
                  "absolute inset-0 rounded-xl opacity-20 blur-sm",
                  colors.badge
                )}
              />
            </div>

            {/* Category Info */}
            <div className='flex-1'>
              <div className='flex items-center gap-3'>
                <h3
                  className={cn(
                    "text-lg font-bold tracking-wide",
                    colors.text
                  )}>
                  {t(`categories.${category}`)}
                </h3>
                {/* Simple Level Badge */}
                <div className='flex h-6 min-w-[1.5rem] items-center justify-center rounded border border-slate-600 bg-slate-700 px-2 text-xs font-medium text-slate-200'>
                  {categoryLevel}
                </div>

                {/* Total Points Display */}
                <div className='flex items-center gap-1 text-xs text-slate-400'>
                  <span className='font-medium'>{totalLevels}</span>
                  <span className='opacity-60'>pts total</span>
                </div>
              </div>

              {/* Enhanced Progress Bar */}
              <div className='mt-2 flex items-center gap-3'>
                <div className='h-1 w-24 rounded bg-slate-800'>
                  <div
                    className='h-full rounded bg-slate-600 transition-all duration-300'
                    style={{ width: `${(progressToNextLevel / 10) * 100}%` }}
                  />
                </div>
                <span className='text-xs text-slate-500'>
                  {progressToNextLevel}/10
                </span>
              </div>
            </div>
          </div>

          <div className='flex items-center gap-4'>

            {/* Skills Count - Simple */}
            <div className='text-xs text-slate-500'>
              {
                allSkills.filter(
                  (skill) => (userSkills.unlockedSkills[skill.id] || 0) > 0
                ).length
              }
              /{skills.length} skills
            </div>

            {/* Expand Arrow - Simple */}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-500 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className='overflow-hidden'
            id={`skills-${category}`}>
            <div className='border-t border-slate-700/30 p-4'>
              <div className='grid gap-3 sm:grid-cols-2'>
                {allSkills.map((skill) => {
                  const level = userSkills.unlockedSkills[skill.id] || 0;
                  const hasPoints = level > 0;

                  return (
                    <div
                      key={skill.id}
                      className={cn(
                        "group rounded-lg border p-3 transition-colors duration-200",
                        hasPoints
                          ? "border-slate-700/50 bg-slate-900/50 hover:bg-slate-800/60"
                          : "border-slate-800/30 bg-slate-950/30 hover:bg-slate-900/40"
                      )}>
                      {/* Skill Content */}
                      <div className='flex items-center justify-between'>
                        <div className='flex min-w-0 flex-1 items-center gap-3'>
                          {/* Skill Icon - Larger */}
                          {skill.icon && (
                            <div className='rounded-md bg-slate-800/40 p-2'>
                              <skill.icon
                                className={cn(
                                  "h-5 w-5",
                                  hasPoints ? colors.text : "text-slate-500"
                                )}
                              />
                            </div>
                          )}

                          <div className='min-w-0 flex-1'>
                            <span
                              className={cn(
                                "block truncate text-sm font-medium",
                                hasPoints ? "text-white" : "text-slate-400"
                              )}>
                              {t(`skills.${skill.id}.name` as any)}
                            </span>
                            <p
                              className={cn(
                                "mt-1 text-xs leading-relaxed",
                                hasPoints ? "text-slate-400" : "text-slate-500"
                              )}>
                              {t(`skills.${skill.id}.description` as any)}
                            </p>
                          </div>
                        </div>

                        <div className='flex items-center gap-2'>
                          {/* Level Badge - Simple */}
                          <div className={cn(
                            "flex h-7 min-w-[1.75rem] items-center justify-center rounded border px-2 text-xs font-medium",
                            hasPoints
                              ? "border-slate-600 bg-slate-700 text-slate-200"
                              : "border-slate-700 bg-slate-800 text-slate-400"
                          )}>
                            {level}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
