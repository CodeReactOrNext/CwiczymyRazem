import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { challengesList } from "feature/challenges";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { CheckCircle2, ChevronRight, Flame, Loader2,Play } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

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
        <Card className="flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-sm bg-main/10 text-main">
                        <Flame size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-wider">Active Challenges</h3>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
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
                            className={cn(
                                "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-sm transition-all mb-4",
                                isTodayDone 
                                    ? "bg-zinc-800/40" 
                                    : "bg-zinc-800/80"
                            )}
                        >
                            <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
                                <div className="p-1.5 rounded-lg bg-main/10 text-main shrink-0 mt-1">
                                    {(() => {
                                        const skillData = guitarSkills.find(s => s.id === challenge.requiredSkillId);
                                        const SkillIcon = skillData?.icon;
                                        return SkillIcon ? <SkillIcon size={14} /> : <Flame size={14} />;
                                    })()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div className="min-w-0">
                                            <h4 className={cn(
                                                "text-xs font-bold truncate",
                                                isTodayDone ? "text-zinc-500 line-through opacity-50" : "text-white"
                                            )}>
                                                {challenge.title}
                                            </h4>
                                        </div>
                                        
                                        {challenge.rewardSkillId && (
                                            <div className="flex items-center justify-center px-1.5 py-0.5 rounded-sm bg-orange-500/10 border border-orange-500/20 shrink-0">
                                                <span className="text-[9px] font-bold text-orange-400 tracking-wider">
                                                    +{challenge.rewardLevel} {challenge.rewardSkillId.split('_').pop()?.toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Mini Progress Bar */}
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                                        <div 
                                            className="h-full bg-main transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                                            style={{ width: `${Math.min(((ac.currentDay - (isTodayDone ? 0 : 1)) / ac.totalDays) * 100, 100)}%` }}
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-1">
                                        {Array.from({ length: ac.totalDays }).map((_, idx) => {
                                            const dayNum = idx + 1;
                                            const isCompleted = dayNum < ac.currentDay;
                                            const isCurrent = dayNum === ac.currentDay && !isTodayDone;
                                            
                                            return (
                                                <div 
                                                    key={dayNum} 
                                                    className={cn(
                                                        "w-5 h-5 rounded-md flex items-center justify-center transition-all duration-300",
                                                        isCompleted 
                                                            ? "bg-white text-zinc-900 shadow-sm scale-105" 
                                                            : isCurrent 
                                                                ? "bg-main/20 text-main ring-1 ring-main" 
                                                                : "bg-zinc-800/50 text-zinc-500"
                                                    )}
                                                >
                                                    {isCompleted ? (
                                                        <CheckCircle2 size={10} strokeWidth={3} />
                                                    ) : (
                                                        <span className="text-[8px] font-black">{dayNum}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            
                            {!isTodayDone ? (
                                <Button 
                                    onClick={handleStartSession}
                                    size="sm"
                                    className="w-full sm:w-auto"
                                >
                                    {ac.currentDay === 1 ? `Start Day 1` : `Continue (Day ${ac.currentDay})`}
                                    <ChevronRight size={14} strokeWidth={3} className="ml-1" />
                                </Button>
                            ) : (
                                <div className="flex items-center justify-end sm:justify-start gap-2 shrink-0 pr-2 w-full sm:w-auto">
                                     <CheckCircle2 size={16} className="text-emerald-500" />
                                     <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Done</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};
