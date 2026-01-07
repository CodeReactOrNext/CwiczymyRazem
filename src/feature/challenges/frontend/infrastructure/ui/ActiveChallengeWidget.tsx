import { useAppSelector } from "store/hooks";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { challengesList } from "feature/challenges";
import { CheckCircle2, Circle, Flame, Play, Timer, Trophy, Award } from "lucide-react";
import { cn } from "assets/lib/utils";
import { Button } from "assets/components/ui/button";
import { useRouter } from "next/router";
import { guitarSkills } from "feature/skills/data/guitarSkills";

export const ActiveChallengeWidget = () => {
    const userStats = useAppSelector(selectCurrentUserStats);
    const router = useRouter();

    if (!userStats?.activeChallenges || userStats.activeChallenges.length === 0) {
        return (
            <div className="w-full h-full p-4 rounded-lg bg-main-opposed-bg relative overflow-hidden flex flex-col justify-center items-center gap-3">
                <div className="absolute top-0 right-0 w-64 h-64 bg-main/5 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                    <div className="p-3 rounded-lg bg-zinc-800/50 text-zinc-500">
                        <Flame size={32} className="opacity-50" />
                    </div>
                    
                    <div>
                        <h3 className="text-sm font-bold text-white mb-1">No Active Challenge</h3>
                        <p className="text-xs text-zinc-500 max-w-[200px]">
                            Take on a streak challenge to earn massive XP rewards
                        </p>
                    </div>
                    
                    <Button
                        onClick={() => router.push('/timer/challenges')}
                        className="mt-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-wider transition-all text-xs gap-2"
                    >
                        <Trophy size={14} />
                        Browse Challenges
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 w-full h-full">
            {userStats.activeChallenges.map((ac) => {
                const challenge = (challengesList as any[]).find(c => c.id === ac.challengeId);
                if (!challenge) return null;

                const today = new Date().toISOString().split('T')[0];
                const isTodayDone = ac.lastCompletedDate === today;

                const handleStartSession = () => {
                    router.push(`/timer/challenges?start=${ac.challengeId}`);
                };

                return (
                    <div 
                        key={ac.challengeId}
                        className="w-full p-4 rounded-lg bg-zinc-900/60 relative overflow-hidden flex flex-col justify-center"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-main/5 blur-[60px] rounded-full pointer-events-none" />

                        <div className="relative z-10 flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-main/10 text-main shrink-0">
                                        {(() => {
                                            const skillData = guitarSkills.find(s => s.id === challenge.requiredSkillId);
                                            const SkillIcon = skillData?.icon;
                                            return SkillIcon ? <SkillIcon size={16} /> : <Flame size={16} />;
                                        })()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-main px-1 bg-main/10 rounded">Challenge</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <h2 className="text-sm font-bold text-white tracking-tight leading-tight">
                                                {challenge.title}
                                            </h2>
                                            {challenge.rewardSkillId && (
                                              <div className="flex items-center gap-2 mt-1.5 p-2 rounded-lg bg-main/5 border border-main/10 w-fit">
                                                 <div className="p-1.5 rounded bg-main/10 text-main">
                                                 {(() => {
                                                   const rewSkill = guitarSkills.find(s => s.id === challenge.rewardSkillId);
                                                   const RewIcon = rewSkill?.icon;
                                                   return RewIcon ? <RewIcon size={14} /> : <Award size={14} />;
                                                 })()}
                                                 </div>
                                                 <div className="flex flex-col">
                                                     <span className="text-[9px] font-black text-main uppercase tracking-wider leading-none mb-0.5">Reward</span>
                                                     <div className="flex items-center gap-1.5">
                                                        <span className="text-[11px] font-black text-white leading-none">+{challenge.rewardLevel} XP</span>
                                                        <span className="text-[9px] font-bold text-zinc-500 uppercase">{challenge.rewardSkillId.split('_').join(' ')}</span>
                                                     </div>
                                                 </div>
                                              </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {!isTodayDone && (
                                    <Button 
                                        onClick={handleStartSession}
                                        size="sm"
                                        className="h-8 px-3 rounded-lg bg-main hover:bg-main-600 text-white font-bold uppercase tracking-wider transition-all text-[9px] gap-1.5 shadow-lg shadow-main/10"
                                    >
                                        <Play size={10} fill="currentColor" />
                                        Start
                                    </Button>
                                )}
                                {isTodayDone && (
                                    <div className="px-2 py-1 rounded bg-zinc-800 text-emerald-400 text-[8px] font-black uppercase tracking-wider">
                                        Done
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {Array.from({ length: ac.totalDays }).map((_, idx) => {
                                    const dayNum = idx + 1;
                                    const isCompleted = dayNum < ac.currentDay;
                                    const isCurrent = dayNum === ac.currentDay && !isTodayDone;
                                    
                                    return (
                                        <div 
                                            key={dayNum} 
                                            className={cn(
                                                "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300",
                                                isCompleted 
                                                    ? "bg-main text-white shadow-lg shadow-main/20 scale-105" 
                                                    : isCurrent 
                                                        ? "bg-main/20 text-main ring-1 ring-main" 
                                                        : "bg-zinc-800/50 text-zinc-500"
                                            )}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle2 size={12} strokeWidth={3} className="drop-shadow-md" />
                                            ) : (
                                                <span className="text-[10px] font-black">{dayNum}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
