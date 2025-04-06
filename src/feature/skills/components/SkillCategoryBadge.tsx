import { cn } from "assets/lib/utils";
import { SKILL_CATEGORY_TEXT_COLORS } from "feature/skills/constants/skillColors";

interface SkillCategoryBadgeProps {
  category: string;
  icon: React.ComponentType<any>;
  level: number;
  availablePoints?: number;
  totalLevels?: number;
}

export const SkillCategoryBadge = ({
  category,
  icon: Icon,
  level,
  availablePoints = 0,
}: SkillCategoryBadgeProps) => {
  const getCategoryColors = () => {
    switch (category) {
      case "technique":
        return {
          text: "text-red-300",
          bg: "bg-red-900/40",
          border: "border-red-600",
        };
      case "theory":
        return {
          text: "text-blue-300",
          bg: "bg-blue-900/40",
          border: "border-blue-600",
        };
      case "hearing":
        return {
          text: "text-emerald-300",
          bg: "bg-emerald-900/40",
          border: "border-emerald-600",
        };
      case "creativity":
        return {
          text: "text-purple-300",
          bg: "bg-purple-900/40",
          border: "border-purple-600",
        };
      default:
        return {
          text: "text-gray-300",
          bg: "bg-gray-900/40",
          border: "border-gray-600",
        };
    }
  };

  const colors = getCategoryColors();

  return (
    <div className='absolute left-1/2 top-0 flex h-16 w-16 -translate-x-1/2 -translate-y-1/3 transform items-center justify-center'>
      <div className='relative flex h-16 w-16 items-center justify-center rounded-full bg-black/80 shadow-lg'>
        <Icon
          className={cn(
            "h-8 w-8",
            SKILL_CATEGORY_TEXT_COLORS[
              category as keyof typeof SKILL_CATEGORY_TEXT_COLORS
            ]
          )}
          size='large'
        />

        <div
          className={cn(
            "absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-black shadow-md",
            colors.border
          )}>
          <span
            className={cn(
              "text-xs font-bold",
              SKILL_CATEGORY_TEXT_COLORS[
                category as keyof typeof SKILL_CATEGORY_TEXT_COLORS
              ]
            )}>
            {level}
          </span>
        </div>

        {availablePoints > 0 && (
          <div
            className={cn(
              "absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/40 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white/90 shadow-lg"
            )}>
            <span className='text-sm font-medium text-white drop-shadow-sm'>
              +{availablePoints}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
