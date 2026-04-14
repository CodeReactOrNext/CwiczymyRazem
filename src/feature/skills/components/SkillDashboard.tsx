import { Sheet, SheetContent, SheetTitle } from "assets/components/ui/sheet";
import { Button } from "assets/components/ui/button";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { getAllBpmProgress, type BpmProgressData } from "feature/exercisePlan/services/bpmProgressService";
import { generateBpmStages } from "feature/exercisePlan/utils/generateBpmStages";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { ChevronRight, Ear, Star, ChevronLeft, Mic, Trophy, Lock } from "lucide-react";
import { UpgradeModal } from "feature/premium/components/UpgradeModal";

import { useRouter } from "next/router";
import { FaCheck } from "react-icons/fa";
import { useAppSelector } from "store/hooks";
import { useTranslation } from "hooks/useTranslation";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { SkillCategoryGroup } from "./SkillCategoryGroup";
import { useState, useMemo, useCallback, useEffect } from "react";
import { cn } from "assets/lib/utils";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { TablaturePreview } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/components/TablaturePreview";
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
  tablature?: import("feature/exercisePlan/types/exercise.types").TablatureMeasure[];
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
  const userInfo = useAppSelector(selectUserInfo);
  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
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
            difficulty: exercise.difficulty,
            tablature: exercise.tablature,
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
          difficulty: exercise.difficulty,
          tablature: exercise.tablature,
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
            <div className="flex-shrink-0 px-6 pt-5 pb-3 border-b border-zinc-900">
              <SheetTitle className="text-2xl font-bold text-white tracking-tight">
                {selectedSkillName}
              </SheetTitle>
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
                <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-6 py-6 pb-16 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-500">
                  {(filteredTree[Object.keys(filteredTree)[0]]?.[selectedSkillId!]?.filter(c => c.difficulty === currentDifficulty) ?? []).map((challenge) => {
                    const exerciseDef = exercisesAgregat.find(e => e.id === challenge.id);
                    const isLocked = !!exerciseDef?.premium && !isPremium;
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
                      ? { bar: "bg-emerald-500", text: "text-emerald-400", badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" }
                      : currentDifficulty === 'medium'
                      ? { bar: "bg-amber-500", text: "text-amber-400", badge: "bg-amber-500/10 border-amber-500/20 text-amber-400" }
                      : { bar: "bg-rose-500", text: "text-rose-400", badge: "bg-rose-500/10 border-rose-500/20 text-rose-400" };

                    if (isLocked) {
                      return (
                        <div
                          key={challenge.id}
                          onClick={() => setShowUpgradeModal(true)}
                          className="group flex rounded-2xl border border-amber-500/20 bg-zinc-900/30 overflow-hidden transition-all duration-300 cursor-pointer hover:border-amber-500/50 hover:bg-zinc-900/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] relative"
                        >
                          <div className="flex-1 min-w-0 px-5 py-4 flex flex-col gap-2.5">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-[15px] font-bold text-zinc-500 group-hover:text-zinc-400 leading-snug flex-1 transition-colors">{challenge.title}</p>
                              <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 ring-1 ring-amber-500/25 flex-shrink-0">
                                <Lock className="h-3 w-3 text-amber-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pro</span>
                              </div>
                            </div>
                            {challenge.description && (
                              <p className="text-[13px] text-zinc-600 leading-relaxed line-clamp-2">{challenge.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                        <div
                          key={challenge.id}
                          className={cn(
                            "group flex rounded-2xl border overflow-hidden transition-all duration-300 relative",
                            hasBeenAttempted
                              ? "border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-500 shadow-md shadow-black/40"
                              : "border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700 shadow-sm shadow-black/20"
                          )}
                        >
                          <div className="flex-1 min-w-0 px-5 py-4 flex flex-col gap-2.5 relative z-10">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0 flex items-center gap-2.5 flex-wrap">
                              <p className={cn("text-[16px] font-bold leading-snug transition-colors", hasBeenAttempted ? "text-white" : "text-zinc-300 group-hover:text-zinc-100")}>{challenge.title}</p>
                              {hasBeenAttempted && (
                                <div className="flex items-center justify-center flex-shrink-0 bg-emerald-500/10 rounded-full h-5 w-5 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]" title="Practiced">
                                  <FaCheck className="h-2.5 w-2.5 text-emerald-400" />
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleStartChallenge(challenge)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all flex-shrink-0 scale-95 group-hover:scale-100"
                            >
                              <ChevronRight size={14} strokeWidth={2.5} />
                              Start
                            </button>
                          </div>

                          {challenge.description && (
                            <p className="text-[13px] text-zinc-500 leading-relaxed line-clamp-2">{challenge.description}</p>
                          )}

                          {challenge.tablature && challenge.tablature.length > 0 && (
                            <div className="pt-1 overflow-hidden opacity-90 group-hover:opacity-100 transition-opacity">
                              <TablaturePreview measures={challenge.tablature} />
                            </div>
                          )}

                          {/* Metrics row */}
                          {(hasBpmProgress || (micHighScore != null && micHighScore > 0) || (earTrainingHighScore != null && earTrainingHighScore > 0) || hasLeaderboard) && (
                            <div className="flex flex-wrap items-center gap-5 pt-3.5 mt-3 border-t border-zinc-800/40">
                              {hasBpmProgress && (
                                <div className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-zinc-300">
                                  <FaCheck className="h-3.5 w-3.5 text-main-400" />
                                  {completedBpms.length}/{bpmStages.length} BPM
                                </div>
                              )}
                              
                              {micHighScore != null && micHighScore > 0 && (
                                <div className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-amber-400">
                                  <Mic className="h-4 w-4 text-amber-500/80" />
                                  <span>{micHighScore.toLocaleString()} PTS</span>
                                  {micAccuracy != null && <span className="text-amber-500/60 font-medium">({micAccuracy}%)</span>}
                                </div>
                              )}

                              {earTrainingHighScore != null && earTrainingHighScore > 0 && (
                                <div className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-cyan-400">
                                  <Ear className="h-4 w-4 text-cyan-400/80" />
                                  <span>{earTrainingHighScore} PTS</span>
                                </div>
                              )}

                              {hasLeaderboard && (
                                <div className="flex-1 flex justify-end">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setLeaderboardExercise({ id: challenge.id, title: challenge.title as string }); }}
                                    className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/40 text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-zinc-700/80 transition-all shadow-sm"
                                  >
                                    <Trophy className="h-4 w-4" />
                                    <span className={cn(hasBeenAttempted ? "" : "opacity-0 invisible w-0")}>Leaderboard</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
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

        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
};
