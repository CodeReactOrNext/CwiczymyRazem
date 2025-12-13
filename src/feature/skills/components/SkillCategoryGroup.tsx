import { cn } from "assets/lib/utils";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { getSkillTheme } from "feature/skills/constants/skillTreeTheme";
import type { GuitarSkill, GuitarSkillId, UserSkills } from "feature/skills/skills.types";
import { SkillCard } from "./SkillCard";
import { useTranslation } from "react-i18next";

interface SkillCategoryGroupProps {
  category: CategoryKeys;
  skills: GuitarSkill[];
  userSkills: UserSkills;
  onUpgrade: (skillId: GuitarSkillId, points: number) => void;
}

export const SkillCategoryGroup = ({
  category,
  skills,
  userSkills,
  onUpgrade,
}: SkillCategoryGroupProps) => {
  const { t } = useTranslation("skills");
  const theme = getSkillTheme(category);
  const availablePoints = userSkills.availablePoints[category] || 0;

  return (
    <div className="mb-12 last:mb-0">
      <div className="flex items-center justify-between mb-6 sticky top-0 z-20 bg-[#050505]/80 backdrop-blur-md py-4 border-b border-zinc-900">
         <div className="flex items-center gap-3">
             <div className={cn("w-2 h-8 rounded-full", theme.glow)} />
             <h2 className={cn("text-2xl font-bold uppercase tracking-wider", theme.primary)}>
                {t(`categories.${category}` as any)}
             </h2>
         </div>

         <div className="flex items-center gap-3 bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800">
             <span className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Points Available</span>
             <span className={cn("text-2xl font-bold", theme.primary)}>{availablePoints}</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {skills.map((skill) => (
             <SkillCard 
                key={skill.id}
                skill={skill}
                currentPoints={userSkills.unlockedSkills[skill.id] || 0}
                availableCategoryPoints={availablePoints}
                onUpgrade={onUpgrade}
             />
         ))}
      </div>
    </div>
  );
};
