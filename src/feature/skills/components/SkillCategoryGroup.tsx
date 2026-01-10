import { cn } from "assets/lib/utils";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { getSkillTheme } from "feature/skills/constants/skillTreeTheme";
import type { GuitarSkill, GuitarSkillId, UserSkills } from "feature/skills/skills.types";
import { SkillCard } from "./SkillCard";
import { SkillRadarChart } from "./SkillRadarChart";
import { useTranslation } from "react-i18next";

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
    <div className="mb-12 last:mb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sticky top-[-1px] z-20 bg-second-600/95 backdrop-blur-md py-4 -mx-4 px-4 lg:-mx-8 lg:px-8">
         <div className="flex items-center gap-3">
             <div className={cn("w-2 h-8 rounded-full", theme.glow)} />
             <h2 className={cn("text-xl sm:text-2xl font-bold  tracking-wider", theme.primary)}>
                {t(`categories.${category}` as any)}
             </h2>
         </div>

      </div>

      <div className="flex flex-col xl:flex-row gap-8">
         <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
             {skills.map((skill) => (
                 <SkillCard 
                    key={skill.id}
                    skill={skill}
                    currentPoints={userSkills.unlockedSkills[skill.id] || 0}
                 />
             ))}
         </div>
         <div className="w-full xl:w-5/12 flex items-start justify-center">
            <div className="bg-zinc-900/10 rounded-2xl p-4 w-full backdrop-blur-sm sticky top-24">
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
