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
}

export const SkillCategoryGroup = ({
  category,
  skills,
  userSkills,
}: SkillCategoryGroupProps) => {
  const { t } = useTranslation("skills");
  const theme = getSkillTheme(category);

  return (
    <div className="mb-16 last:mb-0">
      <div className="flex flex-col mb-6 sticky top-[-1px] z-20 bg-[#0a0a0a]/80 backdrop-blur-xl py-4 -mx-4 px-4 lg:-mx-6 lg:px-6 border-b border-zinc-900/50">
         <div className="flex items-center justify-between">
           <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Category</span>
              <h2 className={cn("text-xl sm:text-2xl font-bold tracking-tight", theme.primary)}>
                 {t(`categories.${category}` as any)}
              </h2>
           </div>
           
           <div className="hidden sm:flex items-center gap-4">
              <div className="flex flex-col items-end">
                 <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Skills In Group</span>
                 <span className="text-xs text-zinc-400 font-medium">{skills.length} Mastery Nodes</span>
              </div>
           </div>
         </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-start">
         <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
             {skills.map((skill, index) => (
                 <SkillCard 
                    key={skill.id}
                    skill={skill}
                    currentPoints={userSkills.unlockedSkills[skill.id] || 0}
                 />
             ))}
         </div>
         <div className="w-full xl:w-80 flex-shrink-0 sticky top-28">
            <div className="relative group">
                <div className={cn(
                  "absolute -inset-0.5 rounded-lg opacity-10 blur-xl",
                  theme.glow
                )} />
                <div className="relative bg-[#0d0d0d] rounded-lg p-5 backdrop-blur-sm overflow-hidden shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Category Analysis</span>
                        <div className={cn("w-1.5 h-1.5 rounded-full", theme.glow)} />
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
    </div>
  );
};
