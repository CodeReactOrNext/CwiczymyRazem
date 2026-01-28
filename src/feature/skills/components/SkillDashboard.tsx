import { Button } from "assets/components/ui/button";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { ChevronRight, Target, TrendingUp } from "lucide-react";
import { useRouter } from "next/router";

import { SkillCategoryGroup } from "./SkillCategoryGroup";

interface SkillDashboardProps {
  userSkills: UserSkills;
}

const CATEGORIES: CategoryKeys[] = ["technique", "theory", "hearing", "creativity"];

export const SkillDashboard = ({
  userSkills,
}: SkillDashboardProps) => {
  const router = useRouter();

  return (
    <div className="w-full pb-24">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
            {/* Refined Hero Banner */}
            <div className="mb-12 pt-6">
              <div className="bg-white rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-zinc-100 rounded-full blur-2xl -mr-24 -mt-24 pointer-events-none" />
                
                <div className="relative z-10 flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest">
                      Mastery Path
                    </div>
                    <div className="flex items-center gap-1 text-zinc-400 text-[9px] font-bold uppercase tracking-widest">
                      <TrendingUp size={10} />
                      Keep Growing
                    </div>
                  </div>
                  
                  <h1 className="text-3xl md:text-4xl font-bold text-black tracking-tight mb-3 leading-none">
                    Refine your skills
                  </h1>
                  
                  <p className="text-zinc-500 text-sm max-w-sm font-medium leading-relaxed">
                    Personalized practice path to master your guitar technique.
                  </p>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                       <span className="text-black font-bold text-lg leading-none">{Object.keys(userSkills.unlockedSkills).length}</span>
                       <span className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest mt-1">Skills</span>
                    </div>
                    <div className="w-px h-6 bg-zinc-200" />
                    <div className="flex flex-col">
                       <span className="text-black font-bold text-lg leading-none">
                         {Object.values(userSkills.unlockedSkills).reduce((acc, curr) => acc + curr, 0)}
                       </span>
                       <span className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest mt-1">XP Total</span>
                    </div>
                  </div>

                  <Button 
                    size="lg"
                    className="bg-black hover:bg-zinc-800 text-white border-none rounded-lg h-12 px-6 text-sm font-bold transition-all shadow-lg w-full md:w-auto"
                    onClick={() => router.push('/timer/challenges')}
                  >
                    <span>Challenges</span>
                    <ChevronRight size={16} className="ml-2" />
                  </Button>
                </div>

                {/* Smaller Icon Decoration */}
                <div className="absolute right-8 bottom-0 opacity-[0.02] pointer-events-none transform translate-y-1/4">
                  <Target size={200} strokeWidth={1} className="text-black" />
                </div>
              </div>
            </div>

            {/* Content Sidebar Layout */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                  Skill Categories
                </h2>
              </div>
              
              <div className="grid grid-cols-1 gap-10">
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
        </div>
    </div>
  );
};
