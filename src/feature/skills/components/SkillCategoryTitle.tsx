import { cn } from "assets/lib/utils";
import { SKILL_CATEGORY_TEXT_COLORS } from "feature/skills/constants/skillColors";

interface SkillCategoryTitleProps {
  category: string;
  title: string;
}

export const SkillCategoryTitle = ({
  category,
  title,
}: SkillCategoryTitleProps) => (
  <h3
    className={cn(
      "mb-6 text-center text-lg font-bold uppercase tracking-wide",
      SKILL_CATEGORY_TEXT_COLORS[
        category as keyof typeof SKILL_CATEGORY_TEXT_COLORS
      ]
    )}>
    <span className='relative'>
      {title}
      <span
        className='absolute -bottom-2 left-0 h-0.5 w-full opacity-70'
        style={{ backgroundColor: `var(--${category}-color)` }}
      />
    </span>
  </h3>
);
