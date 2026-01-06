import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkillId, UserSkills } from "feature/skills/skills.types";
import { SkillCategoryGroup } from "./SkillCategoryGroup";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { useRouter } from "next/router";
import { Trophy, ChevronRight } from "lucide-react";
import { Button } from "assets/components/ui/button";

interface SkillDashboardProps {
  userSkills: UserSkills;
}

const CATEGORIES: CategoryKeys[] = ["technique", "theory", "hearing", "creativity"];

export const SkillDashboard = ({
  userSkills,
}: SkillDashboardProps) => {
  const router = useRouter();

  return (
    <div className="w-full p-4 pl-16 md:pl-20 lg:p-8 pb-24">
        <div className="max-w-7xl mx-auto">
            {/* Header with Navigation */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">
                        Your <span className="text-main">Skills</span>
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium">
                        Complete challenges to earn points and level up your techniques.
                    </p>
                </div>

                <Button 
                    onClick={() => router.push('/timer/challenges')}
                >
                    <Trophy size={18} fill="currentColor" />
                    <span>Go to Challenges</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Button>
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
                     />
                 );
             })}
        </div>
    </div>
  );
};
