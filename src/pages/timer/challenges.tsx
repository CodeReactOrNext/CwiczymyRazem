import { useRouter } from "next/router";
import { cn } from "assets/lib/utils";
import AppLayout from "layouts/AppLayout";
import { withAuth } from "utils/auth/serverAuth";
import { useState, useEffect, ReactElement } from "react";
import MainContainer from "components/MainContainer";
import { useAppSelector } from "store/hooks";
import { selectUserAuth, selectCurrentUserStats } from "feature/user/store/userSlice";
import { saveActiveChallenge, checkAndSaveChallengeProgress } from "feature/user/store/userSlice.asyncThunk";
import { useAppDispatch } from "store/hooks";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import { UserSkills } from "feature/skills/skills.types";
import { challengesList } from "feature/challenges/data/challengesList";
import { ChallengeCard } from "feature/challenges/components/ChallengeCard";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { Challenge } from "feature/challenges/challenges.types";
import { ArrowLeft, Info, Trophy, XCircle, Calendar, Flame, ChevronRight } from "lucide-react";
import type { NextPageWithLayout } from "types/page";

const ChallengesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userAuth = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);
  const [userSkills, setUserSkills] = useState<UserSkills | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const activeChallenge = userStats?.activeChallenge;
  const activeChallengeData = activeChallenge 
    ? challengesList.find(c => c.id === activeChallenge.challengeId) 
    : null;

  useEffect(() => {
    if (userAuth) {
      getUserSkills(userAuth).then(setUserSkills);
    }
  }, [userAuth]);

  useEffect(() => {
    if (router.query.start) {
        const challengeId = router.query.start as string;
        const challengeToStart = challengesList.find(c => c.id === challengeId);
        if (challengeToStart) {
            setSelectedChallenge(challengeToStart);
        }
    }
  }, [router.query.start]);

  const handleStartChallenge = (challenge: Challenge) => {
    const today = new Date().toISOString();
    dispatch(saveActiveChallenge({
        challengeId: challenge.id,
        startDate: today,
        lastCompletedDate: null,
        currentDay: 1,
        totalDays: challenge.streakDays
    })).unwrap().then(() => {
        setSelectedChallenge(challenge);
    });
  };

  const handleQuitChallenge = () => {
    if (confirm("Are you sure you want to quit current challenge? All progress will be lost.")) {
      dispatch(saveActiveChallenge(null));
    }
  };

  const handleFinish = () => {
    setIsFinishing(true);
    router.push("/report");
  };

  const handleBack = () => {
    if (selectedChallenge) {
      setSelectedChallenge(null);
    } else {
      router.push("/timer");
    }
  };

  if (selectedChallenge) {
    return (
      <MainContainer>
        <PracticeSession 
          plan={selectedChallenge as any} 
          onFinish={handleFinish} 
          isFinishing={isFinishing} 
        />
      </MainContainer>
    );
  }

  const formatSkillName = (skillId: string) => {
    return skillId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const challengesByCategory = challengesList.reduce((acc, challenge) => {
    const category = challenge.category;
    if (!acc[category]) acc[category] = {};
    
    const skillId = challenge.requiredSkillId;
    if (!acc[category][skillId]) acc[category][skillId] = [];
    
    acc[category][skillId].push(challenge);
    return acc;
  }, {} as Record<string, Record<string, Challenge[]>>);

  const sortedSkills = (categoryDict: Record<string, Challenge[]>) => {
    return Object.entries(categoryDict).sort((a, b) => b[1].length - a[1].length);
  };

  const getSortedChallengesInSkill = (challenges: Challenge[]) => {
    const sorted: Challenge[] = [];
    const remaining = [...challenges];
    
    const visited = new Set<string>();
    
    while (remaining.length > 0) {
      const nextIndex = remaining.findIndex(c => !c.dependsOn || visited.has(c.dependsOn));
      if (nextIndex !== -1) {
        const next = remaining.splice(nextIndex, 1)[0];
        sorted.push(next);
        visited.add(next.id);
      } else {
        sorted.push(...remaining.splice(0));
      }
    }
    return sorted;
  };

  return (
    <MainContainer>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        
        <div className="flex flex-col gap-6 mb-10">
          <button 
            onClick={handleBack}
            className="group w-fit flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">
                Challenge <span className="text-main">Map</span>
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-zinc-500">
              Your musical evolution starts here. Follow the paths, master new techniques, and unlock advanced skills.
            </p>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/profile/skills')}
                className="group flex items-center gap-4 px-6 py-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-main/50 transition-all shadow-2xl backdrop-blur-sm active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-main/10 flex items-center justify-center text-main group-hover:scale-110 transition-transform">
                   <Flame size={20} />
                </div>
                <div className="flex flex-col items-start leading-none gap-1">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500">View Progress</span>
                  <span className="text-sm font-black text-white uppercase italic flex items-center gap-2">
                    Your Skills <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>
            </div>

          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
            <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              <span className="text-blue-400 font-bold uppercase tracking-wider block mb-1">Concept Mode</span>
              These challenges focus on specific guitar techniques and theoretical concepts. They do not provide fixed exercises—instead, they define the area of focus. <strong>You are responsible for choosing or creating specific exercises</strong> that fit the challenge goals.
            </p>
          </div>
          </div>

          {activeChallenge && activeChallengeData && (
             <div className="mt-4 overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl shadow-2xl relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-main/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="p-5 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                  <div className="flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
                    <div className="relative">
                        <div className="w-20 h-20 bg-zinc-950 rounded-2xl border border-white/10 flex items-center justify-center text-main shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            <Trophy size={36} fill="currentColor" className="opacity-80" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-main text-black flex items-center justify-center font-black text-xs shadow-lg">
                            {activeChallenge.currentDay}
                        </div>
                    </div>
                    
                    <div>
                        <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                            <span className="px-2 py-0.5 rounded bg-main/10 text-main text-[9px] font-black uppercase tracking-widest">Active Quest</span>
                            <span className="h-[1px] w-8 bg-zinc-800" />
                            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-tight">
                                Day {activeChallenge.currentDay} of {activeChallenge.totalDays}
                            </span>
                        </div>
                        
                        <h3 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter leading-none mb-3">
                          {typeof activeChallengeData.title === 'string' ? activeChallengeData.title : (activeChallengeData.title as any)['en']}
                        </h3>
                        
                        <div className="flex items-center justify-center sm:justify-start gap-4">
                           <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-zinc-600" />
                              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Ends in {activeChallenge.totalDays - activeChallenge.currentDay + 1} Days</span>
                           </div>
                           <div className="w-32 h-1.5 bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
                              <div 
                                className="h-full bg-main shadow-[0_0_10px_rgba(var(--main-rgb),0.5)] transition-all duration-1000" 
                                style={{ width: `${(activeChallenge.currentDay / activeChallenge.totalDays) * 100}%` }} 
                              />
                           </div>
                        </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                        onClick={handleQuitChallenge}
                        className="px-5 py-3 rounded-xl bg-zinc-950 border border-white/5 text-zinc-600 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 group/btn"
                    >
                        <XCircle size={16} className="group-hover/btn:rotate-90 transition-transform" />
                        Abandon
                    </button>
                  </div>
                </div>
             </div>
          )}
        </div>

        <div className="space-y-16">
          {Object.entries(challengesByCategory).map(([category, skills]) => (
            <div key={category} className="relative">
              <div className="flex items-baseline gap-4 mb-8">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter opacity-20">
                  {category}
                </h2>
                <div className="h-[2px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>

              {/* Background Grid for the Map Section */}
              <div className="absolute inset-0 top-16 -z-10 opacity-[0.03] pointer-events-none" 
                   style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

              <div className="grid grid-cols-1 gap-12">
                {sortedSkills(skills).map(([skillId, unsortedChallenges]) => {
                  const sorted = getSortedChallengesInSkill(unsortedChallenges);
                  
                  return (
                    <div key={skillId} className="relative pl-12">
                      {/* Technical vertical line connecting skill to category line */}
                      <div className="absolute left-6 top-[-24px] bottom-0 w-[2px] bg-gradient-to-b from-zinc-800 to-transparent" />
                      <div className="absolute left-5 top-4 w-4 h-4 rounded-full border-2 border-zinc-800 bg-zinc-950 flex items-center justify-center">
                         <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                      </div>

                      <div className="mb-4 flex items-center gap-4">
                        <div className="px-3 py-1 rounded-full bg-zinc-800 border border-white/5 relative">
                           <h3 className="text-xs font-black text-zinc-300 uppercase tracking-[0.2em]">
                             {formatSkillName(skillId)}
                           </h3>
                        </div>
                        <div className="h-[1px] flex-1 bg-zinc-900" />
                      </div>

                      <div className="relative flex flex-col md:flex-row gap-8 overflow-x-auto pb-8 scrollbar-hide snap-x px-4">
                        {sorted.map((challenge, index) => {
                          const currentLevel = userSkills?.unlockedSkills[challenge.requiredSkillId] || 0;
                          
                          let isDependencyMet = true;
                          const isAlreadyCompleted = userStats?.completedChallenges?.includes(challenge.id) || false;

                          if (challenge.dependsOn) {
                            const completedChallenges = userStats?.completedChallenges || [];
                            if (!completedChallenges.includes(challenge.dependsOn)) {
                              isDependencyMet = false;
                            }
                          }

                          const isUnlocked = currentLevel >= challenge.requiredLevel && isDependencyMet;

                          return (
                            <div key={challenge.id} className="min-w-[200px] max-w-[240px] flex-1 snap-start relative group">
                              {index < sorted.length - 1 && (
                                <div className="hidden md:flex absolute top-12 -right-8 w-8 items-center justify-center z-0">
                                  <div className={cn(
                                    "h-[1px] w-full transition-all duration-500",
                                    isUnlocked ? "bg-main/30 shadow-[0_0_8px_rgba(var(--main-rgb),0.2)]" : "bg-zinc-800/50"
                                  )} />
                                  <div className={cn(
                                    "absolute w-1.5 h-1.5 rounded-full border transition-all duration-500",
                                    isUnlocked ? "bg-main border-main shadow-[0_0_12px_rgba(var(--main-rgb),0.6)] scale-110" : "bg-zinc-900 border-zinc-800"
                                  )} />
                                </div>
                              )}
                              <ChallengeCard
                                challenge={challenge}
                                isUnlocked={isUnlocked}
                                currentLevel={currentLevel}
                                onStart={handleStartChallenge}
                                hasActiveChallenge={!!activeChallenge}
                                isDependencyMet={isDependencyMet}
                                isCompleted={isAlreadyCompleted}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainContainer>
  );
};

ChallengesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"exercise"} subtitle='Challenges' variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default ChallengesPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "timer", "toast", "exercises", "rating_popup"],
});
