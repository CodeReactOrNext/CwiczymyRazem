import { cn } from "assets/lib/utils";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { SKILL_CATEGORY_ICONS } from "feature/skills/constants/skillIcons";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Gem, Diamond, Crown, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaStar, FaPlus } from "react-icons/fa";

interface SkillCategoryAccordionProps {
  category: CategoryKeys;
  skills: GuitarSkill[];
  userSkills: UserSkills;
  onSkillUpgrade?: (skillId: string) => void;
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
        bg: "from-red-950/30 to-red-900/20 border-red-700/30",
        text: "text-red-300",
        badge: "bg-red-900/50 border-red-600/50 text-red-200",
        currency: "text-red-400",
        progress: "bg-red-600/70",
      };
    case "theory":
      return {
        bg: "from-blue-950/30 to-blue-900/20 border-blue-700/30",
        text: "text-blue-300",
        badge: "bg-blue-900/50 border-blue-600/50 text-blue-200",
        currency: "text-blue-400",
        progress: "bg-blue-600/70",
      };
    case "hearing":
      return {
        bg: "from-emerald-950/30 to-emerald-900/20 border-emerald-700/30",
        text: "text-emerald-300",
        badge: "bg-emerald-900/50 border-emerald-600/50 text-emerald-200",
        currency: "text-emerald-400",
        progress: "bg-emerald-600/70",
      };
    case "creativity":
      return {
        bg: "from-purple-950/30 to-purple-900/20 border-purple-700/30",
        text: "text-purple-300",
        badge: "bg-purple-900/50 border-purple-600/50 text-purple-200",
        currency: "text-purple-400",
        progress: "bg-purple-600/70",
      };
    default:
      return {
        bg: "from-zinc-950/30 to-zinc-900/20 border-zinc-700/30",
        text: "text-zinc-300",
        badge: "bg-zinc-900/50 border-zinc-600/50 text-zinc-200",
        currency: "text-zinc-400",
        progress: "bg-zinc-600/70",
      };
  }
};

export const SkillCategoryAccordion = ({
  category,
  skills,
  userSkills,
  onSkillUpgrade,
}: SkillCategoryAccordionProps) => {
  const { t } = useTranslation("skills");
  const [isExpanded, setIsExpanded] = useState(false);
  const [upgradingSkill, setUpgradingSkill] = useState<string | null>(null);
  const [showPlusOne, setShowPlusOne] = useState<string | null>(null);

  const CategoryIcon =
    SKILL_CATEGORY_ICONS[category as keyof typeof SKILL_CATEGORY_ICONS];
  const colors = getCategoryColors(category);
  const currencyIcon = getCurrencyIcon(category);

  // Calculate stats
  const totalLevels = skills.reduce(
    (sum, skill) => sum + (userSkills.unlockedSkills[skill.id] || 0),
    0
  );
  const categoryLevel = Math.floor(totalLevels / 10);
  const progressToNextLevel = totalLevels % 10;
  const availablePoints = userSkills.availablePoints[category] || 0;

  // Show all skills, not just those with points
  const allSkills = skills;

  const canUpgradeSkills = skills.filter((skill) => {
    const hasPoints = availablePoints > 0;
    return hasPoints && (userSkills.unlockedSkills[skill.id] || 0) > 0;
  });

  const handleSkillUpgrade = async (skillId: string) => {
    console.log(
      "SkillCategoryAccordion: handleSkillUpgrade called with:",
      skillId
    );

    // Start upgrade animation
    setUpgradingSkill(skillId);
    setShowPlusOne(skillId);

    // Call the upgrade function
    if (onSkillUpgrade) {
      onSkillUpgrade(skillId);
    }

    // Reset animations after delay
    setTimeout(() => {
      setUpgradingSkill(null);
    }, 300);

    setTimeout(() => {
      setShowPlusOne(null);
    }, 1000);
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-gradient-to-br backdrop-blur-sm transition-all duration-300",
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
        className='w-full p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500/50 hover:bg-white/5'
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
                <div className='flex h-6 min-w-[1.5rem] items-center justify-center rounded border border-zinc-600 bg-zinc-700 px-2 text-xs font-medium text-zinc-200'>
                  {categoryLevel}
                </div>

                {/* Total Points Display */}
                <div className='flex items-center gap-1 text-xs text-zinc-400'>
                  <span className='font-medium'>{totalLevels}</span>
                  <span className='opacity-60'>pts total</span>
                </div>
              </div>

              {/* Enhanced Progress Bar */}
              <div className='mt-2 flex items-center gap-3'>
                <div className='h-1 w-24 rounded bg-zinc-800'>
                  <div
                    className='h-full rounded bg-zinc-600 transition-all duration-300'
                    style={{ width: `${(progressToNextLevel / 10) * 100}%` }}
                  />
                </div>
                <span className='text-xs text-zinc-500'>
                  {progressToNextLevel}/10
                </span>
              </div>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            {/* Available Points - Simple */}
            {availablePoints > 0 && (
              <div className='flex items-center gap-1 rounded border border-emerald-600 bg-emerald-900/30 px-2 py-1 text-xs'>
                <span className='text-emerald-300'>{availablePoints}</span>
                <span className='text-emerald-400'>pts</span>
              </div>
            )}

            {/* Skills Count - Simple */}
            <div className='text-xs text-zinc-500'>
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
                "h-4 w-4 text-zinc-500 transition-transform duration-200",
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
            <div className='border-t border-white/10 p-4'>
              <div className='grid gap-3 sm:grid-cols-2'>
                {allSkills.map((skill) => {
                  const level = userSkills.unlockedSkills[skill.id] || 0;
                  const canUpgrade = availablePoints > 0;
                  const hasPoints = level > 0;

                  return (
                    <div
                      key={skill.id}
                      className={cn(
                        "group rounded-lg border p-3 transition-colors duration-200",
                        hasPoints
                          ? "border-zinc-700/50 bg-zinc-900/50 hover:bg-zinc-800/60"
                          : "border-zinc-800/30 bg-zinc-950/30 hover:bg-zinc-900/40",
                        canUpgrade && "border-l-2 border-l-emerald-500/60"
                      )}>
                      {/* Skill Content */}
                      <div className='flex items-center justify-between'>
                        <div className='flex min-w-0 flex-1 items-center gap-3'>
                          {/* Skill Icon - Larger */}
                          {skill.icon && (
                            <div className='rounded-md bg-zinc-800/40 p-2'>
                              <skill.icon
                                className={cn(
                                  "h-5 w-5",
                                  hasPoints ? colors.text : "text-zinc-500"
                                )}
                              />
                            </div>
                          )}

                          <div className='min-w-0 flex-1'>
                            <span
                              className={cn(
                                "block truncate text-sm font-medium",
                                hasPoints ? "text-white" : "text-zinc-400"
                              )}>
                              {t(`skills.${skill.id}.name`)}
                            </span>
                            <p
                              className={cn(
                                "mt-1 text-xs leading-relaxed",
                                hasPoints ? "text-zinc-400" : "text-zinc-500"
                              )}>
                              {t(`skills.${skill.id}.description`)}
                            </p>
                          </div>
                        </div>

                        <div className='flex items-center gap-2'>
                          {/* Level Badge - Simple */}
                          <div className='relative'>
                            <motion.div
                              key={`level-${skill.id}-${level}`}
                              initial={{ scale: 1 }}
                              animate={{
                                scale:
                                  upgradingSkill === skill.id ? [1, 1.2, 1] : 1,
                                backgroundColor:
                                  upgradingSkill === skill.id
                                    ? [
                                        "rgb(39 39 42)",
                                        "rgb(34 197 94)",
                                        "rgb(39 39 42)",
                                      ]
                                    : undefined,
                              }}
                              transition={{ duration: 0.3 }}
                              className={cn(
                                "flex h-7 min-w-[1.75rem] items-center justify-center rounded border px-2 text-xs font-medium",
                                hasPoints
                                  ? "border-zinc-600 bg-zinc-700 text-zinc-200"
                                  : "border-zinc-700 bg-zinc-800 text-zinc-400"
                              )}>
                              {level}
                            </motion.div>

                            {/* +1 Animation */}
                            <AnimatePresence>
                              {showPlusOne === skill.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, y: -20, scale: 1 }}
                                  exit={{ opacity: 0, y: -30, scale: 0.5 }}
                                  transition={{
                                    duration: 0.8,
                                    ease: "easeOut",
                                  }}
                                  className='pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2'>
                                  <span className='text-sm font-bold text-emerald-400 drop-shadow-lg'>
                                    +1
                                  </span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Upgrade Button */}
                          {canUpgrade && (
                            <motion.button
                              onClick={(e) => {
                                console.log(
                                  "Button clicked for skill:",
                                  skill.id
                                );
                                e.stopPropagation();
                                handleSkillUpgrade(skill.id);
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              animate={{
                                rotate:
                                  upgradingSkill === skill.id
                                    ? [0, -10, 10, 0]
                                    : 0,
                                scale:
                                  upgradingSkill === skill.id ? [1, 1.2, 1] : 1,
                              }}
                              transition={{ duration: 0.3 }}
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded border border-emerald-600 bg-emerald-900/50 text-emerald-200 transition-colors hover:bg-emerald-800/60",
                                upgradingSkill === skill.id &&
                                  "border-emerald-400 bg-emerald-600/70"
                              )}
                              title={t("upgrade_skill")}>
                              <motion.div
                                animate={{
                                  rotate: upgradingSkill === skill.id ? 180 : 0,
                                }}
                                transition={{ duration: 0.3 }}>
                                <FaPlus className='h-2.5 w-2.5' />
                              </motion.div>
                            </motion.button>
                          )}
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
