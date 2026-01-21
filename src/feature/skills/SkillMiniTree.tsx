import { Badge } from "assets/components/ui/badge";
import { cn } from "assets/lib/utils";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { selectUserAuth } from "feature/user/store/userSlice";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "hooks/useTranslation";
import { useAppSelector } from "store/hooks";

interface MiniSkillTreeProps {
  highlightCategories?: string[];
}

export const SkillMiniTree = ({
  highlightCategories = [],
}: MiniSkillTreeProps) => {
  const { t } = useTranslation(["skills", "common", "report"]);
  const userAuth = useAppSelector(selectUserAuth);
  const [userSkills, setUserSkillsLocal] = useState<UserSkills>();
  const [highlightedSkills, setHighlightedSkills] = useState<Set<string>>(
    new Set()
  );
  const [expandedCategories, setExpandedCategories] =
    useState<string[]>(highlightCategories);
  const [clickedCategory, setClickedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!userAuth) return;
    getUserSkills(userAuth).then((skills) => setUserSkillsLocal(skills));
  }, []);

  useEffect(() => {
    setExpandedCategories(highlightCategories);
  }, [highlightCategories]);

  const getCategoryColor = (category: string) => {
    const colors = {
      technique: {
        bg: "from-red-500/10 to-red-500/5 border-red-500/20",
        text: "text-red-400",
        badgeBg: "border-red-500/30 bg-red-500/10",
        badgeActiveBg: "border-red-500/50 bg-red-500/20",
        highlight: "ring-red-500/70",
        button: "bg-red-600 hover:bg-red-700",
        activeHeaderBg: "bg-red-500/20",
        glowColor: "rgba(239, 68, 68, 0.7)",
      },
      theory: {
        bg: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
        text: "text-blue-400",
        badgeBg: "border-blue-500/30 bg-blue-500/10",
        badgeActiveBg: "border-blue-500/50 bg-blue-500/20",
        highlight: "ring-blue-500/70",
        button: "bg-blue-600 hover:bg-blue-700",
        activeHeaderBg: "bg-blue-500/20",
        glowColor: "rgba(59, 130, 246, 0.7)",
      },
      hearing: {
        bg: "from-green-500/10 to-green-500/5 border-green-500/20",
        text: "text-green-400",
        badgeBg: "border-green-500/30 bg-green-500/10",
        badgeActiveBg: "border-green-500/50 bg-green-500/20",
        highlight: "ring-green-500/70",
        button: "bg-green-600 hover:bg-green-700",
        activeHeaderBg: "bg-green-500/20",
        glowColor: "rgba(34, 197, 94, 0.7)",
      },
      creativity: {
        bg: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
        text: "text-purple-400",
        badgeBg: "border-purple-500/30 bg-purple-500/10",
        badgeActiveBg: "border-purple-500/50 bg-purple-500/20",
        highlight: "ring-purple-500/70",
        button: "bg-purple-600 hover:bg-purple-700",
        activeHeaderBg: "bg-purple-500/20",
        glowColor: "rgba(168, 85, 247, 0.7)",
      },
    };
    return (
      colors[category as keyof typeof colors] || {
        bg: "",
        text: "",
        badgeBg: "",
        badgeActiveBg: "",
        highlight: "",
        button: "",
        activeHeaderBg: "",
        glowColor: "rgba(255, 255, 255, 0.7)",
      }
    );
  };

  const toggleCategory = (category: string) => {
    setClickedCategory(category);
    setTimeout(() => setClickedCategory(null), 300);

    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((cat) => cat !== category)
        : [...prev, category]
    );
  };


  // Particle animation component

  // Group skills by category
  const skillsByCategory = guitarSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, GuitarSkill[]>);

  // Filter categories to only show ones with available points or highlighted skills
  const relevantCategories = Object.keys(skillsByCategory).filter(
    (category): category is CategoryKeys =>
      highlightCategories.includes(category) ||
      skillsByCategory[category].some(
        (skill) => (userSkills?.unlockedSkills?.[skill.id] || 0) > 0
      )
  );

  if (relevantCategories.length === 0) return null;

  // Translate category names
  const getCategoryName = (category: string) => {
    return t(`report:skills.${category}` as any);
  };

  return (
    <>

      <div className='mb-4 space-y-3 font-openSans'>
        {relevantCategories.map((category) => {
          const isExpanded = expandedCategories.includes(category);
          const isClicked = clickedCategory === category;
          const categorySkills = skillsByCategory[category].filter(
            (skill) =>
              highlightCategories.includes(category) ||
              highlightedSkills.has(skill.id)
          );

          if (categorySkills.length === 0) return null;

          const categoryColors = getCategoryColor(category);

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0.8, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`overflow-hidden rounded-lg border shadow-sm ${categoryColors.bg}`}>
              <motion.div
                className={cn(
                  "flex cursor-pointer items-center justify-between p-3 transition-all duration-150",
                  isClicked
                    ? categoryColors.activeHeaderBg
                    : "hover:bg-second-400/20"
                )}
                onClick={() => toggleCategory(category)}
                whileTap={{ scale: 0.98 }}>
                <div className='flex items-center gap-2'>
                  <h4 className={`font-medium text-white`}>
                    {getCategoryName(category)}
                  </h4>
                </div>
                <motion.div
                  animate={{
                    rotate: isExpanded ? 90 : 0,
                    scale: isClicked ? 1.2 : 1,
                  }}
                  transition={{ duration: 0.2 }}>
                  <ChevronRight
                    className={cn(
                      "h-5 w-5",
                      isExpanded ? "text-white" : "text-gray-400"
                    )}
                  />
                </motion.div>
              </motion.div>

              {isExpanded && (
                <motion.div
                  className='px-3 pb-3'
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}>
                  <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                    {categorySkills.map((skill) => {
                      const currentLevel =
                        userSkills?.unlockedSkills?.[skill.id] || 0;
                      const isHighlighted = highlightedSkills.has(skill.id);

                      return (
                        <motion.div
                          key={skill.id}
                          className={cn(
                            "relative overflow-hidden rounded-md border p-3",
                            "bg-gradient-to-b from-second-400/20 to-second-400/5 backdrop-blur-sm",
                            isHighlighted &&
                              `ring-2 ${categoryColors.highlight}`
                          )}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                          }}
                          transition={{ duration: 0.2 }}
                          whileHover={{
                            scale: 1.02,
                            transition: { duration: 0.1 },
                          }}>
                          <div className='flex items-center justify-between gap-2'>
                            <div className='flex flex-col gap-1'>
                              <div className='flex items-center gap-2'>
                                {skill.icon && (
                                  <skill.icon
                                    className={`h-4 w-4 text-white`}
                                  />
                                )}
                                <span className='text-sm font-medium text-white'>
                                  {t(`skills:skills.${skill.id}.name` as any)}
                                </span>
                              </div>
                              <div className='flex items-center gap-2'>
                                <span className='text-xs text-gray-400'>
                                  {t("skills:level")} {currentLevel}
                                </span>
                                {isHighlighted && (
                                  <Badge className='bg-white/10 px-1 py-0.5 text-[10px]'>
                                    New
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </>
  );
};
