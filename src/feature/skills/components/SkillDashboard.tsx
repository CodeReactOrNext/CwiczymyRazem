import { Button } from "assets/components/ui/button";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { Brain, ChevronRight, Ear, Guitar, Target, Zap } from "lucide-react";
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
  const totalXP = Object.values(userSkills.unlockedSkills).reduce((sum, val) => sum + val, 0);

  return (
    <div className="w-full pb-24">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
            {/* Refined Hero Banner */}
            <div className="mb-12 pt-6">
              <div className="bg-white rounded-lg p-6 md:p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-48 h-48 bg-zinc-100 rounded-full blur-2xl -mr-24 -mt-24 pointer-events-none" />

                <div className="absolute right-1/4 top-1/2 -translate-y-1/2 pointer-events-none hidden md:flex items-center gap-6 opacity-[0.04]">
                  <Target size={80} strokeWidth={0.8} className="text-black -rotate-12" />
                  <Guitar size={100} strokeWidth={0.6} className="text-black rotate-6" />
                  <Brain size={70} strokeWidth={0.8} className="text-black -rotate-6" />
                  <Ear size={60} strokeWidth={0.8} className="text-black rotate-12" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight leading-none">
                      Skills overview
                    </h1>
                    <p className="text-zinc-400 text-sm mt-2 max-w-md">
                      Complete challenges to earn XP and level up your skills.
                    </p>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="flex flex-col items-end">
                      <span className="text-black text-2xl font-bold tabular-nums leading-none">{totalXP}</span>
                      <span className="text-zinc-400 text-xs font-medium mt-0.5">XP total</span>
                    </div>

                    <div className="w-px h-8 bg-zinc-200" />

                    <Button 
                      size="lg"
                      className="bg-black hover:bg-zinc-800 text-white border-none rounded-lg h-10 px-5 text-sm font-bold transition-all"
                      onClick={() => router.push('/timer/challenges')}
                    >
                      <span>Challenges</span>
                      <ChevronRight size={16} className="ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
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
