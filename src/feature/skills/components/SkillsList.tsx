import { cn } from "assets/lib/utils";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { useTranslation } from "react-i18next";
import { FaStar } from "react-icons/fa";

interface SkillsListProps {
  skills: GuitarSkill[];
  userSkills: UserSkills;
  category: CategoryKeys;
  onSkillUpgrade: (skillId: string) => void;
}

export const SkillsList = ({
  skills,
  userSkills,
  category,
}: SkillsListProps) => {
  const { t } = useTranslation("skills");

  const unlockedSkills = skills.filter(
    (skill) => (userSkills.unlockedSkills[skill.id] || 0) > 0
  );


  const getCategoryColor = () => {
    switch (category) {
      case "technique":
        return "red";
      case "theory":
        return "blue";
      case "hearing":
        return "emerald";
      case "creativity":
        return "purple";
      default:
        return "gray";
    }
  };

  const categoryColor = getCategoryColor();

  const getEnhancedGradient = (hasPoints: boolean) => {
    if (category === "technique") {
      return hasPoints
        ? "bg-gradient-to-br from-red-950/40 to-red-900/30 border-red-700/40"
        : "bg-gradient-to-br from-second-800/30 to-second-900/20 border-gray-800";
    } else if (category === "theory") {
      return hasPoints
        ? "bg-gradient-to-br from-blue-950/40 to-blue-900/30 border-blue-700/40"
        : "bg-gradient-to-br from-second-800/30 to-second-900/20 border-gray-800";
    } else if (category === "hearing") {
      return hasPoints
        ? "bg-gradient-to-br from-emerald-950/40 to-emerald-900/30 border-emerald-700/40"
        : "bg-gradient-to-br from-second-800/30 to-second-900/20 border-gray-800";
    } else if (category === "creativity") {
      return hasPoints
        ? "bg-gradient-to-br from-purple-950/40 to-purple-900/30 border-purple-700/40"
        : "bg-gradient-to-br from-second-800/30 to-second-900/20 border-gray-800";
    }
    return hasPoints
      ? "bg-gradient-to-br from-gray-800/50 to-gray-900/30 border-gray-700"
      : "bg-gradient-to-br from-second-800/30 to-second-900/20 border-gray-800";
  };

  const getBadgeStyles = (hasPoints: boolean) => {
    if (!hasPoints) return "text-gray-500 border border-gray-800";
    if (category === "technique")
      return "text-red-300 border border-red-800/50";
    if (category === "theory") return "text-blue-300 border border-blue-800/50";
    if (category === "hearing")
      return "text-emerald-300 border border-emerald-800/50";
    if (category === "creativity")
      return "text-purple-300 border border-purple-800/50";
    return "text-gray-300 border border-gray-700";
  };

  return (
    <div className='space-y-1.5'>
      {unlockedSkills.map((skill) => {
        const level = userSkills.unlockedSkills[skill.id] || 0;
        const isMaxed = level >= 15;
        const hasPoints = level > 0;

        return (
          <div
            key={skill.id}
            className={cn(
              "group flex items-center justify-between gap-2 rounded border p-1.5 shadow-sm",
              getEnhancedGradient(hasPoints)
            )}>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-1.5'>
                {skill.icon && (
                  <skill.icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      hasPoints ? `text-${categoryColor}-400` : "text-white/50"
                    )}
                  />
                )}
                <span
                  className={cn(
                    "text-xs font-medium tracking-wide",
                    hasPoints ? "text-white" : "text-gray-400"
                  )}>
                  {t(`skills:skills.${skill.id}.name` as any)}
                </span>
              </div>
            </div>

            <div className='flex-shrink-0'>
              <span
                className={cn(
                  "flex h-5 min-w-[1.5rem] items-center justify-center rounded bg-black/20 px-1.5 text-[10px] font-medium",
                  getBadgeStyles(hasPoints)
                )}>
                {isMaxed && (
                  <FaStar className='mr-0.5 h-2.5 w-2.5 text-yellow-400' />
                )}
                {level}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
