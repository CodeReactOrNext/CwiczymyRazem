import { Sheet, SheetContent, SheetTitle } from "assets/components/ui/sheet";
import { Button } from "assets/components/ui/button";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { getAllBpmProgress, type BpmProgressData } from "feature/exercisePlan/services/bpmProgressService";
import { generateBpmStages } from "feature/exercisePlan/utils/generateBpmStages";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { selectUserAuth } from "feature/user/store/userSlice";
import { ChevronRight, Ear, Star, ChevronLeft, Mic, Trophy } from "lucide-react";

import { useRouter } from "next/router";
import { FaCheck } from "react-icons/fa";
import { useAppSelector } from "store/hooks";
import { useTranslation } from "hooks/useTranslation";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { SkillCategoryGroup } from "./SkillCategoryGroup";
import { useState, useMemo, useCallback, useEffect } from "react";
import { cn } from "assets/lib/utils";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { EarTrainingLeaderboardDialog } from "feature/exercisePlan/components/EarTrainingLeaderboardDialog";

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
  const [leaderboardExercise, setLeaderboardExercise] = useState<{ id: string; title: string } | null>(null);

  const { t } = useTranslation("skills");
  const userAuth = useAppSelector(selectUserAuth);
  const [progressMap, setProgressMap] = useState<Map<string, BpmProgressData>>(new Map());
  const [activeDifficulty, setActiveDifficulty] = useState<string | null>(null);

  useEffect(() => {
    if (!userAuth) return;
    getAllBpmProgress(userAuth).then(setProgressMap);
  }, [userAuth]);

  useEffect(() => {
    if (!router.isReady) return;
    
    const { exerciseId } = router.query;
    if (exerciseId && typeof exerciseId === "string") {
      const exercise = exercisesAgregat.find(e => e.id === exerciseId);
      if (exercise) {
        const skillId = exercise.relatedSkills[0] || 'general';
        const skillData = guitarSkills.find(s => s.id === skillId);
        const category = skillData?.category || (exercise.category !== 'mixed' ? exercise.category : 'technique');
        
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
        setSelectedChallenge(challengeLike);
      }
    }
  }, [router.isReady, router.query]);

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

  const currentDifficulty = activeDifficulty && uniqueDifficulties.includes(activeDifficulty)
    ? activeDifficulty
    : uniqueDifficulties[0] ?? null;

  useEffect(() => {
    setActiveDifficulty(null);
  }, [selectedSkillId]);

  const selectedSkillName = useMemo(() => {
    const skill = guitarSkills.find(s => s.id === selectedSkillId);
    if (!skill) return "Skill";
    return skill.name || t(`skills.${skill.id}.name` as any);
  }, [selectedSkillId, t]);

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
      <div className="w-full min-h-[600px] bg-second-800 rounded-3xl overflow-hidden border border-zinc-900 shadow-2xl relative">
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
    <div className="w-full pb-24 flex flex-col">
      
      <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full pt-12">
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

        <Sheet open={!!selectedSkillId} onOpenChange={(open) => !open && setSelectedSkillId(null)}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-xl p-0 bg-[#0a0a0a] border-zinc-900 flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 pt-8 pb-5 border-b border-zinc-900">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Exercises</span>
              <SheetTitle className="text-3xl font-bold text-white tracking-tight mt-1">
                {selectedSkillName}
              </SheetTitle>
              {uniqueDifficulties.length > 0 && (
                <p className="mt-1 text-sm text-zinc-500">
                  {Object.values(filteredTree)[0]?.[selectedSkillId!]?.length ?? 0} exercises available
                </p>
              )}
            </div>

            {uniqueDifficulties.length > 0 ? (
              <>
                {/* Difficulty tab buttons */}
                <div className="flex-shrink-0 px-6 pt-4 pb-0">
                  <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                    {uniqueDifficulties.map((d) => {
                      const isActive = currentDifficulty === d;
                      const label = d === 'easy' ? 'Easy' : d === 'medium' ? 'Medium' : 'Hard';
                      const count = filteredTree[Object.keys(filteredTree)[0]]?.[selectedSkillId!]?.filter(c => c.difficulty === d).length ?? 0;
                      const activeClass = d === 'easy'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : d === 'medium'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-rose-500/15 text-rose-400';
                      return (
                        <button
                          key={d}
                          onClick={() => setActiveDifficulty(d)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors",
                            isActive ? activeClass : "text-zinc-400 hover:text-zinc-200"
                          )}
                        >
                          {label}
                          <span className="text-xs opacity-50 font-normal">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Scrollable exercise list */}
                <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-6 py-4 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-500">
                  {(filteredTree[Object.keys(filteredTree)[0]]?.[selectedSkillId!]?.filter(c => c.difficulty === currentDifficulty) ?? []).map((challenge) => {
                    const exerciseDef = exercisesAgregat.find(e => e.id === challenge.id);
                    const progress = progressMap.get(challenge.id);
                    const bpmStages = exerciseDef?.metronomeSpeed ? generateBpmStages(exerciseDef.metronomeSpeed) : [];
                    const completedBpms = progress?.completedBpms || [];
                    const hasBpmProgress = bpmStages.length > 0 && completedBpms.length > 0;
                    const micHighScore = progress?.micHighScore;
                    const micAccuracy = progress?.micHighScoreAccuracy;
                    const earTrainingHighScore = progress?.earTrainingHighScore;
                    const hasLeaderboard = bpmStages.length > 0 || !!exerciseDef?.riddleConfig || (exerciseDef?.tablature && exerciseDef.tablature.length > 0);
                    const sp = currentDifficulty === 'easy' ? 1 : currentDifficulty === 'medium' ? 2 : 3;
                    const hasBeenAttempted = !!progress && (
                      completedBpms.length > 0 ||
                      (micHighScore != null && micHighScore > 0) ||
                      (earTrainingHighScore != null && earTrainingHighScore > 0)
                    );
                    const diffColor = currentDifficulty === 'easy'
                      ? { bar: "bg-emerald-500", badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" }
                      : currentDifficulty === 'medium'
                      ? { bar: "bg-amber-500", badge: "bg-amber-500/10 border-amber-500/20 text-amber-400" }
                      : { bar: "bg-rose-500", badge: "bg-rose-500/10 border-rose-500/20 text-rose-400" };

                    return (
                      <div
                        key={challenge.id}
                        className={cn(
                          "flex rounded-xl border overflow-hidden transition-all duration-200",
                          hasBeenAttempted
                            ? "border-zinc-700 bg-zinc-900/70 hover:bg-zinc-900"
                            : "border-zinc-800/60 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700"
                        )}
                      >
                        <div className={cn("w-1 flex-shrink-0", diffColor.bar)} />
                        <div className="flex-1 min-w-0 px-4 py-3 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white leading-snug">{challenge.title}</p>
                              {hasBeenAttempted && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 mt-1">
                                  <FaCheck className="h-2 w-2" />
                                  Practiced
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleStartChallenge(challenge)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-colors flex-shrink-0"
                            >
                              Start
                              <ChevronRight size={12} strokeWidth={3} />
                            </button>
                          </div>

                          {challenge.description && (
                            <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{challenge.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border", diffColor.badge)}>
                              +{sp} skill {sp === 1 ? 'point' : 'points'}
                            </span>
                            {hasBpmProgress && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
                                <FaCheck className="h-2.5 w-2.5 text-main-300" />
                                {completedBpms.length}/{bpmStages.length} BPM
                              </span>
                            )}
                            {micHighScore != null && micHighScore > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300">
                                <Mic className="h-2.5 w-2.5" />
                                {micHighScore.toLocaleString()} pts
                                {micAccuracy != null && <span className="text-amber-500 font-normal ml-0.5">({micAccuracy}%)</span>}
                              </span>
                            )}
                            {earTrainingHighScore != null && earTrainingHighScore > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-link/10 border border-link/20 text-link">
                                <Ear className="h-2.5 w-2.5" />
                                {earTrainingHighScore} pts
                              </span>
                            )}
                            {hasLeaderboard && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setLeaderboardExercise({ id: challenge.id, title: challenge.title as string }); }}
                                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md text-zinc-500 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 bg-transparent hover:bg-zinc-800/50 transition-colors"
                              >
                                <Trophy className="h-2.5 w-2.5" />
                                Leaderboard
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
                <Star size={32} className="mb-4 opacity-10" />
                <p className="text-sm font-semibold text-zinc-500">No exercises for this skill</p>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {leaderboardExercise && (
          <EarTrainingLeaderboardDialog
            isOpen={!!leaderboardExercise}
            onClose={() => setLeaderboardExercise(null)}
            exerciseId={leaderboardExercise.id}
            exerciseTitle={leaderboardExercise.title}
          />
        )}
    </div>
  );
};
