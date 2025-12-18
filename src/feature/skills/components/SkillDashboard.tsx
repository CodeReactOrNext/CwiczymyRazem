import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkillId, UserSkills } from "feature/skills/skills.types";
import { SkillCategoryGroup } from "./SkillCategoryGroup";
import type { CategoryKeys } from "components/Charts/ActivityChart";

interface SkillDashboardProps {
  userSkills: UserSkills;
  onSkillUpgrade: (skillId: GuitarSkillId, points: number) => void;
}

const CATEGORIES: CategoryKeys[] = ["technique", "theory", "hearing", "creativity"];

export const SkillDashboard = ({
  userSkills,
  onSkillUpgrade,
}: SkillDashboardProps) => {
  return (
    <div className="w-full p-4 lg:p-8 pb-24">
        <div className="max-w-7xl mx-auto">
             <div className="mb-12">
                  <p className="text-zinc-400">Manage your abilities and spend points to progress.</p>
             </div>

             {CATEGORIES.map((category) => {
                 const categorySkills = guitarSkills.filter(s => s.category === category);
                 if (categorySkills.length === 0) return null;

                 return (
                     <SkillCategoryGroup 
                        key={category}
                        category={category}
                        skills={categorySkills}
                        userSkills={userSkills}
                        onUpgrade={onSkillUpgrade}
                     />
                 );
             })}
        </div>
    </div>
  );
};
