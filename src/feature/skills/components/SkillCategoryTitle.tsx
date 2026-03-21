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
      "mb-6 text-center text-lg font-bold uppercase tracking-widest text-white"
    )}>
    <span className='relative'>
      {title}
    </span>
  </h3>
);
