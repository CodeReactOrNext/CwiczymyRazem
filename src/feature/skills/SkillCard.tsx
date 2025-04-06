import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface SkillCardProps {
  skill: GuitarSkill;
  userSkills: UserSkills;
  canUpgrade: boolean;
  onUpgrade: () => void;
}

export const SkillCard = ({
  skill,
  userSkills,
  canUpgrade,
  onUpgrade,
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
    onUpgrade();

    setTimeout(() => {
      setIsUpgraded(false);
    }, 400);
  };

  return (
    <div
      className={cn(
        "group relative rounded-md border p-3",
        "bg-gradient-to-br backdrop-blur-sm transition-all duration-200",
        getEnhancedGradient(),
        isUpgraded && `animate-skill-upgraded shadow-lg ${getGlowColor()}`
      )}>
      <div className='flex flex-col gap-1.5'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-2'>
            {skill.icon && (
              <skill.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform duration-300",
                  isUpgraded && "scale-125",
                  hasPoints
                    ? `text-${
                        skill.category === "hearing"
                          ? "emerald"
                          : skill.category
                      }-300`
                    : "text-white/60"
                )}
              />
            )}
            <div>
              <h3 className='text-sm font-medium leading-tight tracking-wide text-white'>
                {t(`skills:skills.${skill.id}.name` as any)}
              </h3>
            </div>
          </div>

          <div className='flex-shrink-0'>
            <Badge
              variant='outline'
              className={cn(
                "px-2 py-0.5 text-xs font-medium shadow-sm transition-all duration-300",
                isUpgraded && "scale-110 font-bold",
                getBadgeColors()
              )}>
              {t("skills:level" as any)} {currentLevel}
            </Badge>
          </div>
        </div>

        {canUpgrade && (
          <div className='mt-1.5 flex justify-end'>
            <Button
              size='sm'
              onClick={handleUpgrade}
              title={t("skills:upgrade_skill" as any)}
              className={cn(
                "h-6 rounded-md border px-2.5 py-0 text-[11px]",
                "font-medium shadow-sm transition-colors duration-200",
                getButtonColors()
              )}>
              <Plus className='mr-1 h-2.5 w-2.5' />
              {t("skills:upgrade" as any)}
            </Button>
          </div>
        )}
      </div>

      {isUpgraded && (
        <>
          <div className='absolute inset-0 animate-ping-slow rounded-md border-2 border-white/20 opacity-30'></div>
          <div className='absolute right-1 top-1'>
            <Sparkles
              className={cn(
                "h-6 w-6 animate-pulse",
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
