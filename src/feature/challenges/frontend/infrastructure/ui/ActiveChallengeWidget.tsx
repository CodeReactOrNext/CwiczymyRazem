import { useAppSelector } from "store/hooks";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { challengesList } from "feature/challenges";
import { ArrowRight, CheckCircle2, ChevronRight, Circle, Flame, Play, Timer, Trophy, Loader2 } from "lucide-react";
import { cn } from "assets/lib/utils";
import { Button } from "assets/components/ui/button";
import { useRouter } from "next/router";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { Card } from "assets/components/ui/card";
import { useState } from "react";

export const ActiveChallengeWidget = () => {
    const userStats = useAppSelector(selectCurrentUserStats);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleBrowseChallenges = async () => {
        setIsLoading(true);
        await router.push('/timer/challenges');
    };

    if (!userStats?.activeChallenges || userStats.activeChallenges.length === 0) {
        return (
            <Card className="flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-sm bg-purple-500/10 text-purple-500">
                            <Flame size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white tracking-wider">No Active Challenge</h3>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-zinc-400 mb-4">
                    Take on a streak challenge to earn massive XP rewards
                </p>
                
                <Button
                    variant='secondary'
                    onClick={handleBrowseChallenges}
                    disabled={isLoading}
                    className="w-full h-10 rounded-sm text-xs font-bold tracking-wide"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Loading...
                        </>
                    ) : (
                        <>
                            Browse Challenges
                            <ChevronRight size={14} />
                        </>
                    )}
                </Button>
            </Card>
        );
    }

    return (
        <Card>
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
                                              <span className="text-xs font-black text-cyan-400 mt-1">
                                                +{challenge.rewardLevel} {challenge.rewardSkillId.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                              </span>
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
                                                    ? "bg-white text-zinc-900 shadow-lg shadow-white/20 scale-105" 
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
        </Card>
    );
};
