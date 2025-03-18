import { cn } from "assets/lib/utils";
import { SKILL_CATEGORY_TEXT_COLORS } from "feature/skills/constants/skillColors";

interface SkillCategoryBadgeProps {
  category: string;
  icon: React.ComponentType<any>;
  level: number;
}

export const SkillCategoryBadge = ({
  category,
  icon: Icon,
  level,
}: SkillCategoryBadgeProps) => (
  <div className='absolute left-1/2 top-0 flex h-16 w-16 -translate-x-1/2 -translate-y-1/3 transform items-center justify-center rounded-full bg-black/80 shadow-lg'>
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
      className='absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-black'
      style={{ borderColor: `var(--${category}-color)` }}>
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
  </div>
);
