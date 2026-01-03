import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkillId, UserSkills } from "feature/skills/skills.types";
import { SkillCategoryGroup } from "./SkillCategoryGroup";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { useRouter } from "next/router";
import { Trophy, ChevronRight, Flame } from "lucide-react";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";

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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-zinc-800/50 pb-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">
                        Skill <span className="text-main">Evolution</span>
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium">
                        Master techniques and unlock new paths by completing daily streak challenges.
                    </p>
                </div>

                <Button 
                    onClick={() => router.push('/timer/challenges')}
                    className="group bg-main text-white hover:bg-main-600 px-6 py-6 rounded-2xl shadow-lg shadow-main/10 font-black uppercase tracking-[0.1em] italic text-xs flex items-center gap-3 active:scale-[0.98] transition-all"
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
