import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { useTranslation } from "hooks/useTranslation";
import { Plus, Sparkles } from "lucide-react";
import { useState } from "react";

interface SkillCardProps {
  skill: GuitarSkill;
  userSkills: UserSkills;
}

export const SkillCard = ({
  skill,
  userSkills,
}: SkillCardProps) => {
  const { t } = useTranslation();
  const currentLevel = userSkills.unlockedSkills[skill.id] || 0;
  const hasPoints = currentLevel > 0;
  const [isUpgraded, setIsUpgraded] = useState(false);

  const getEnhancedGradient = () => {
    switch (skill.category) {
      case "technique":
        return hasPoints
          ? "from-red-950/40 to-red-900/30 border-red-700/40 shadow-md"
          : "from-second-600/25 to-second-700/20 border-second-400/20";
      case "theory":
        return hasPoints
          ? "from-blue-950/40 to-blue-900/30 border-blue-700/40 shadow-md"
          : "from-second-600/25 to-second-700/20 border-second-400/20";
      case "hearing":
        return hasPoints
          ? "from-emerald-950/40 to-emerald-900/30 border-emerald-700/40 shadow-md"
          : "from-second-600/25 to-second-700/20 border-second-400/20";
      case "creativity":
        return hasPoints
          ? "from-purple-950/40 to-purple-900/30 border-purple-700/40 shadow-md"
          : "from-second-600/25 to-second-700/20 border-second-400/20";
      default:
        return hasPoints
          ? "from-slate-950/40 to-slate-900/30 border-slate-700/40 shadow-md"
          : "from-second-600/25 to-second-700/20 border-second-400/20";
    }
  };

  const getBadgeColors = () => {
    switch (skill.category) {
      case "technique":
        return hasPoints
          ? "bg-red-900/40 text-red-200/90 border-red-700/30"
          : "bg-second-600/30 text-white/70 border-second-400/20";
      case "theory":
        return hasPoints
          ? "bg-blue-900/40 text-blue-200/90 border-blue-700/30"
          : "bg-second-600/30 text-white/70 border-second-400/20";
      case "hearing":
        return hasPoints
          ? "bg-emerald-900/40 text-emerald-200/90 border-emerald-700/30"
          : "bg-second-600/30 text-white/70 border-second-400/20";
      case "creativity":
        return hasPoints
          ? "bg-purple-900/40 text-purple-200/90 border-purple-700/30"
          : "bg-second-600/30 text-white/70 border-second-400/20";
      default:
        return hasPoints
          ? "bg-slate-900/40 text-slate-200/90 border-slate-700/30"
          : "bg-second-600/30 text-white/70 border-second-400/20";
    }
  };

  const getButtonColors = () => {
    switch (skill.category) {
      case "technique":
        return "bg-red-900/30 hover:bg-red-800/40 border-red-700/40 text-red-300";
      case "theory":
        return "bg-blue-900/30 hover:bg-blue-800/40 border-blue-700/40 text-blue-300";
      case "hearing":
        return "bg-emerald-900/30 hover:bg-emerald-800/40 border-emerald-700/40 text-emerald-300";
      case "creativity":
        return "bg-purple-900/30 hover:bg-purple-800/40 border-purple-700/40 text-purple-300";
      default:
        return "bg-gray-900/30 hover:bg-gray-800/40 border-gray-700/40 text-gray-300";
    }
  };

  const getGlowColor = () => {
    switch (skill.category) {
      case "technique":
        return "shadow-red-500/50";
      case "theory":
        return "shadow-blue-500/50";
      case "hearing":
        return "shadow-emerald-500/50";
      case "creativity":
        return "shadow-purple-500/50";
      default:
        return "shadow-gray-500/50";
    }
  };

  const handleUpgrade = () => {
    setIsUpgraded(true);

    setTimeout(() => {
      setIsUpgraded(false);
    }, 400);
  };

  return (
    <div
      className={cn(
        "group relative rounded-lg border p-4 transition-all duration-300 hover:scale-[1.02]",
        "bg-gradient-to-br shadow-sm backdrop-blur-sm hover:shadow-md",
        getEnhancedGradient(),
        isUpgraded && `animate-skill-upgraded shadow-lg ${getGlowColor()}`
      )}>
      <div className='flex flex-col gap-3'>
        {/* Header Section */}
        <div className='flex items-start justify-between'>
          <div className='flex flex-1 items-center gap-3'>
            {skill.icon && (
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300",
                  isUpgraded && "scale-125",
                  hasPoints
                    ? cn(
                        skill.category === "technique" &&
                          "border border-red-500/30 bg-red-500/20",
                        skill.category === "theory" &&
                          "border border-blue-500/30 bg-blue-500/20",
                        skill.category === "hearing" &&
                          "border border-emerald-500/30 bg-emerald-500/20",
                        skill.category === "creativity" &&
                          "border border-purple-500/30 bg-purple-500/20"
                      )
                    : "border border-zinc-700/30 bg-zinc-800/50"
                )}>
                <skill.icon
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    hasPoints
                      ? cn(
                          skill.category === "technique" && "text-red-300",
                          skill.category === "theory" && "text-blue-300",
                          skill.category === "hearing" && "text-emerald-300",
                          skill.category === "creativity" && "text-purple-300"
                        )
                      : "text-zinc-500"
                  )}
                />
              </div>
            )}
            <div className='flex-1'>
              <h3 className='mb-1 text-sm font-semibold leading-tight text-white'>
                {t(`skills:skills.${skill.id}.name` as any)}
              </h3>
              <p className='text-xs leading-relaxed text-zinc-400'>
                {t(`skills:skills.${skill.id}.description` as any)}
              </p>
            </div>
          </div>

          <div className='ml-3 flex-shrink-0'>
            <Badge
              variant='outline'
              className={cn(
                "border px-3 py-1 text-xs font-semibold shadow-sm transition-all duration-300",
                isUpgraded && "scale-110 font-bold",
                getBadgeColors()
              )}>
              Lvl {currentLevel}
            </Badge>
          </div>
        </div>

      </div>

      {/* Upgrade Animation Effects */}
      {isUpgraded && (
        <>
          <div className='absolute inset-0 animate-ping-slow rounded-lg border-2 border-white/20 opacity-30'></div>
          <div className='absolute right-2 top-2'>
            <Sparkles
              className={cn(
                "h-5 w-5 animate-pulse",
                skill.category === "technique" && "text-red-400",
                skill.category === "theory" && "text-blue-400",
                skill.category === "hearing" && "text-emerald-400",
                skill.category === "creativity" && "text-purple-400"
              )}
            />
          </div>
        </>
      )}
    </div>
  );
};
