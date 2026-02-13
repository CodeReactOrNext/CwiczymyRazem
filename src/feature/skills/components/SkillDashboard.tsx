import { Dialog, DialogContent, DialogHeader, DialogTitle } from "assets/components/ui/dialog";
import { Button } from "assets/components/ui/button";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { Brain, ChevronRight, Ear, Guitar, Target, Zap, Lock, Star, ChevronLeft } from "lucide-react";
import { useRouter } from "next/router";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { SkillCategoryGroup } from "./SkillCategoryGroup";
import { useState, useMemo, useCallback } from "react";
import { cn } from "assets/lib/utils";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";

interface DashboardExercise {
  id: string;
  title: string;
  description: string;
  category: string;
  requiredSkillId: string;
  requiredLevel: number;
  rewardDescription: string;
  exercises: any[];
  unlockDescription: string;
  streakDays: number;
  intensity: string;
  shortGoal: string;
  accentColor: string;
  difficulty: string;
}

interface SkillDashboardProps {
  userSkills: UserSkills;
}

const CATEGORIES: CategoryKeys[] = ["technique", "theory", "hearing", "creativity"];
const DIFFICULTY_ORDER = ["easy", "medium", "hard"];

export const SkillDashboard = ({
  userSkills,
}: SkillDashboardProps) => {
  const router = useRouter();
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<DashboardExercise | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const totalXP = Object.values(userSkills.unlockedSkills).reduce((sum: number, val: number) => sum + val, 0);

  const exercisesByCategory = useMemo(() => {
    return exercisesAgregat.reduce((acc, exercise) => {
      const skillId = exercise.relatedSkills[0] || 'general';
      const skillData = guitarSkills.find(s => s.id === skillId);
      const category = skillData?.category || (exercise.category !== 'mixed' ? exercise.category : 'technique');
      
      
      if (!acc[category]) acc[category] = {};
      if (!acc[category][skillId]) acc[category][skillId] = [];
      
      const challengeLike: DashboardExercise = {
          id: exercise.id,
          title: exercise.title as any,
          description: exercise.description as any,
          category: category as any,
          requiredSkillId: skillId,
          requiredLevel: exercise.difficulty === 'easy' ? 0 : exercise.difficulty === 'medium' ? 1 : 2,
          rewardDescription: 'Practice complete',
          exercises: [exercise],
          unlockDescription: "",
          streakDays: 0,
          intensity: "medium",
          shortGoal: "",
          accentColor: "#ffffff",
          difficulty: exercise.difficulty
      };
      
      acc[category][skillId].push(challengeLike);
      return acc;
    }, {} as Record<string, Record<string, DashboardExercise[]>>);
  }, []);

  const { filteredTree, uniqueDifficulties } = useMemo(() => {
    if (!selectedSkillId) return { filteredTree: {}, uniqueDifficulties: [] };
    const skillData = guitarSkills.find(s => s.id === selectedSkillId);
    if (!skillData) return { filteredTree: {}, uniqueDifficulties: [] };
    const category = skillData.category;
    
    const tree = {
      [category]: {
        [selectedSkillId]: exercisesByCategory[category]?.[selectedSkillId] || []
      }
    };

    const difficulties = Array.from(new Set(tree[category][selectedSkillId].map(c => c.difficulty as string)))
      .sort((a, b) => DIFFICULTY_ORDER.indexOf(a) - DIFFICULTY_ORDER.indexOf(b));

    return { filteredTree: tree, uniqueDifficulties: difficulties };
  }, [selectedSkillId, exercisesByCategory]);

  const selectedSkillName = useMemo(() => {
    return guitarSkills.find(s => s.id === selectedSkillId)?.name || "Skill";
  }, [selectedSkillId]);

  const handleStartChallenge = useCallback((challenge: DashboardExercise) => {
    setSelectedSkillId(null);
    setSelectedChallenge(challenge);
  }, []);

  const handleFinish = () => {
    setIsFinishing(true);
    router.push("/report");
  };

  if (selectedChallenge) {
    return (
      <div className="w-full min-h-[600px] bg-black rounded-3xl overflow-hidden border border-zinc-900 shadow-2xl relative">
        <div className="absolute top-6 left-6 z-[100]">
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedChallenge(null)}
            className="text-zinc-500 hover:text-white hover:bg-white/10"
           >
              <ChevronLeft size={16} className="mr-2" />
              Back to Skills
           </Button>
        </div>
        <PracticeSession
          plan={selectedChallenge as any}
          onFinish={handleFinish}
          isFinishing={isFinishing}
          onClose={() => setSelectedChallenge(null)}
          forceFullDuration={true}
        />
      </div>
    );
  }

  return (
    <div className="w-full pb-24">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="mb-12 pt-6">
              <div className="bg-white rounded-lg p-6 md:p-8 overflow-hidden relative border border-zinc-200 shadow-sm">
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
                    <p className="text-zinc-500 text-sm mt-2 max-w-md font-medium">
                      Practice exercises to earn XP and level up your skills.
                    </p>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="flex flex-col items-end">
                      <span className="text-black text-2xl font-bold tabular-nums leading-none">{totalXP}</span>
                      <span className="text-zinc-400 text-xs font-semibold mt-0.5 uppercase tracking-wider">XP total</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-12">
                {CATEGORIES.map((category) => {
                    const categorySkills = guitarSkills.filter(s => s.category === category);
                    if (categorySkills.length === 0) return null;

                    return (
                        <SkillCategoryGroup 
                          key={category}
                          category={category}
                          skills={categorySkills}
                          userSkills={userSkills}
                          onSkillClick={(id) => setSelectedSkillId(id)}
                        />
                    );
                })}
              </div>
            </div>
        </div>

        <Dialog open={!!selectedSkillId} onOpenChange={(open) => !open && setSelectedSkillId(null)}>
          <DialogContent className="max-w-[100dvw] sm:max-w-[700px] h-[100dvh] sm:h-auto sm:max-h-[85vh] overflow-y-auto bg-[#0a0a0a] border-zinc-900 p-0 sm:rounded-[2.5rem] shadow-3xl">
            <div className="p-6 md:p-10">
              <DialogHeader className="mb-10 text-left">
                <div className="flex flex-col gap-2">
                   <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-1 bg-white/20 rounded-full" />
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Mastery Progress</span>
                   </div>
                   <DialogTitle className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter text-left">
                      {selectedSkillName}
                   </DialogTitle>
                </div>
              </DialogHeader>
              
              <div className="flex flex-col gap-12">
                {uniqueDifficulties.length > 0 ? uniqueDifficulties.map((difficulty) => {
                  const category = Object.keys(filteredTree)[0];
                  const levelChallenges = filteredTree[category]?.[selectedSkillId!]?.filter(c => c.difficulty === difficulty) || [];
                  if (levelChallenges.length === 0) return null;

                  return (
                    <div key={difficulty} className="flex flex-col gap-5">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest",
                          difficulty === 'easy' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                          difficulty === 'medium' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                          "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        )}>
                           {difficulty}
                        </div>
                        <div className="flex-1 h-px bg-zinc-900" />
                      </div>

                      <div className="flex flex-col gap-3">
                        {levelChallenges.map((challenge) => {
                          const isRequirementMet = (userSkills.unlockedSkills[challenge.requiredSkillId] || 0) >= challenge.requiredLevel;
                          const isAvailable = isRequirementMet;
                          
                          return (
                            <div 
                              key={challenge.id}
                              className={cn(
                                "group relative p-6 rounded-3xl border transition-all duration-300",
                                isAvailable 
                                    ? "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80" 
                                    : "bg-zinc-950 border-zinc-900 opacity-60 grayscale"
                              )}
                            >
                              <div className="flex items-start justify-between gap-6">
                                <div className="flex flex-col gap-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 text-left">
                                     <h5 className="font-bold text-white text-lg tracking-tight truncate">{challenge.title}</h5>
                                  </div>
                                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed font-medium mb-4 text-left">
                                    {challenge.description}
                                  </p>

                                  <div className="flex items-center gap-2">
                                     <div className="bg-zinc-900 px-3 py-2 rounded-xl flex items-center gap-2 border border-zinc-800/50">
                                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Practice</span>
                                        <span className="text-xs font-black text-white">400 XP</span>
                                     </div>
                                  </div>
                                </div>

                                {isAvailable ? (
                                  <Button 
                                    size="sm"
                                    onClick={() => handleStartChallenge(challenge)}
                                    className={cn(
                                      "w-12 h-12 rounded-2xl transition-all flex-shrink-0 flex items-center justify-center",
                                      "bg-white hover:bg-zinc-200 text-black border-none shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
                                    )}
                                  >
                                    <ChevronRight size={20} strokeWidth={3} />
                                  </Button>
                                ) : (
                                  <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-950 border border-zinc-900/50 text-zinc-800 flex-shrink-0">
                                    <Lock size={18} />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
                    <Star size={32} className="mb-4 opacity-10" />
                    <p className="text-sm font-bold uppercase tracking-widest">Growth in progress</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
};
