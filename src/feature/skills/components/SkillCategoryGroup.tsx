import { cn } from "assets/lib/utils";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { getSkillTheme } from "feature/skills/constants/skillTreeTheme";
import type { GuitarSkill, UserSkills } from "feature/skills/skills.types";
import { useTranslation } from "hooks/useTranslation";

import { SkillCard } from "./SkillCard";
import { SkillRadarChart } from "./SkillRadarChart";

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

      <div className="flex flex-col xl:flex-row gap-8 items-start">
         <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
             {skills.map((skill, index) => (
                 <SkillCard 
                    key={skill.id}
                    skill={skill}
                    currentPoints={userSkills.unlockedSkills[skill.id] || 0}
                    onSkillClick={() => onSkillClick(skill.id)}
                 />
             ))}
         </div>
         <div className="w-full xl:w-[540px] flex-shrink-0 sticky top-28">
             <div className="relative bg-zinc-950/50 rounded-lg p-5 border border-zinc-800/30 overflow-hidden">
                 <div className="flex items-center justify-between mb-4">
                     <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Category Analysis</span>
                 </div>
                 <SkillRadarChart 
                     category={category}
                     skills={skills}
                     userSkills={userSkills}
                 />
             </div>
          </div>
      </div>
    </div>
  );
};
