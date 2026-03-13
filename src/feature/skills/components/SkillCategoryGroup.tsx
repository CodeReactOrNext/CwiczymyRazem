import { cn } from "assets/lib/utils";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { getSkillTheme } from "feature/skills/constants/skillTreeTheme";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { useTranslation } from "hooks/useTranslation";

import { SkillCard } from "./SkillCard";

interface SkillCategoryGroupProps {
  category: CategoryKeys;
  skills: GuitarSkill[];
  userSkills: UserSkills;
  onSkillClick: (skillId: string) => void;
}

export const SkillCategoryGroup = ({
  category,
  skills,
  userSkills,
  onSkillClick,
}: SkillCategoryGroupProps) => {
  const { t } = useTranslation("skills");
  const theme = getSkillTheme(category);

  return (
    <div className="mb-16 last:mb-0">
      <div className="flex items-center gap-3 mb-6">
         <div className={cn("w-1 h-5 rounded-full", theme.glow)} />
         <h2 className={cn("text-lg font-bold tracking-tight", theme.primary)}>
            {t(`categories.${category}` as any)}
         </h2>
         <div className="flex-1 h-px bg-zinc-800/50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          {skills.map((skill) => (
              <SkillCard
                 key={skill.id}
                 skill={skill}
                 currentPoints={userSkills.unlockedSkills[skill.id] || 0}
                 onSkillClick={() => onSkillClick(skill.id)}
              />
          ))}
      </div>
    </div>
  );
};
