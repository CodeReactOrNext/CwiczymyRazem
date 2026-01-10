import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { SkillCategoryGroup } from "./SkillCategoryGroup";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { useRouter } from "next/router";
import {  ChevronRight } from "lucide-react";
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
    <div className="w-full p-4  lg:p-8 pb-24">
        <div className="max-w-7xl mx-auto">
            {/* Header with Navigation */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-8">
                <div>
                   
    
                    <p className="text-zinc-500 text-sm font-medium">
                        Complete challenges to earn points and level up your techniques.
                    </p>
                </div>

                <Button 
                    onClick={() => router.push('/timer/challenges')}
                >
       
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
