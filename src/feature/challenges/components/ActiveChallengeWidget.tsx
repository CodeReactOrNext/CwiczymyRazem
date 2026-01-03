import { useAppSelector } from "store/hooks";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { challengesList } from "feature/challenges/data/challengesList";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Flame, Play, Timer, Trophy } from "lucide-react";
import { cn } from "assets/lib/utils";
import { Button } from "assets/components/ui/button";
import { useRouter } from "next/router";

export const ActiveChallengeWidget = () => {
    const { i18n } = useTranslation();
    const currentLang = (i18n.language || 'en').split('-')[0] as 'pl' | 'en';
    const userStats = useAppSelector(selectCurrentUserStats);
    const router = useRouter();

    console.log('[Widget] UserStats:', userStats);
    console.log('[Widget] ActiveChallenge:', userStats?.activeChallenge);

    if (!userStats?.activeChallenge) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full h-full p-4 rounded-md bg-main-opposed-bg shadow-lg relative overflow-hidden flex flex-col justify-center items-center gap-3"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-main/5 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                    <div className="p-3 rounded-md bg-zinc-800/50 text-zinc-500">
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
                        className="mt-2 px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest transition-all text-xs gap-2"
                    >
                        <Trophy size={14} />
                        Browse Challenges
                    </Button>
                </div>
            </motion.div>
        );
    }

    const { challengeId, currentDay, totalDays, lastCompletedDate } = userStats.activeChallenge;
    const challenge = challengesList.find(c => c.id === challengeId);

    if (!challenge) return null;

    // Check if today's goal is already done
    const today = new Date().toISOString().split('T')[0];
    const isTodayDone = lastCompletedDate === today;

    const handleStartSession = () => {
        // We can navigate to the challenges page with a specific query or state to auto-start
        // Or simpler: pass the challenge data to a "Practice Runner" directly.
        // For now, let's redirect to challenges page where we can auto-trigger it, 
        // OR better: redirect to a "run active challenge" route or just start it here if we refactor.
        // Let's assume we navigate to /timer/challenges?active=true for now or similar.
        // Actually, the user wants to start it FROM here. 
        // Ideally we'd open the PracticeSession modal. Since PracticeSession is usually a full page view or a big component,
        // we might want to redirect to /timer/challenges with the challenge pre-selected.
        router.push(`/timer/challenges?start=${challengeId}`);
    };

    const getLocalized = (content: string | any) => {
        if (typeof content === 'string') return content;
        if (!content) return '';
        return content[currentLang] || content['en'] || '';
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-full p-4 rounded-md bg-main-opposed-bg shadow-lg relative overflow-hidden flex flex-col justify-center"
        >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-main/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full justify-between gap-3">
                
                {/* Header Section */}
                <div className="flex items-start justify-between gap-3 p-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-main/10 text-main shrink-0">
                            <Flame size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">
                                <span>Active Commitment</span>
                            </div>
                            <h2 className="text-base font-bold text-white tracking-tight leading-tight">
                                {getLocalized(challenge.title)}
                            </h2>
                            <p className="text-[10px] text-zinc-400 font-medium leading-none mt-0.5">
                                {getLocalized(challenge.shortGoal)}
                            </p>
                        </div>
                    </div>
                    
                    <div className="shrink-0 px-3 py-1 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 leading-none">
                            Day <span className="text-main">{currentDay - (isTodayDone ? 1 : 0)}</span> of {totalDays}
                        </span>
                    </div>
                </div>

                {/* Progress Visuals - Centered & Flexible */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                     <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {Array.from({ length: totalDays }).map((_, idx) => {
                            const dayNum = idx + 1;
                            const isCompleted = dayNum < currentDay;
                            const isCurrent = dayNum === currentDay && !isTodayDone;
                            
                            return (
                                <div key={dayNum} className="flex flex-col items-center">
                                    <div 
                                        className={cn(
                                            "w-7 h-7 rounded-sm flex items-center justify-center transition-all duration-300",
                                            isCompleted ? "bg-main text-white" : 
                                            isCurrent ? "bg-main/20 text-main ring-1 ring-main shadow-[0_0_10px_rgba(45,212,191,0.2)]" : 
                                            "bg-zinc-800 text-zinc-600"
                                        )}
                                    >
                                        {isCompleted ? <CheckCircle2 size={12} /> : <span className="text-[10px] font-bold">{dayNum}</span>}
                                    </div>
                                </div>
                            );
                         })}
                     </div>
                </div>

                {/* Action Button */}
                <div className="w-full">
                    {isTodayDone ? (
                        <div className="w-full px-4 py-2.5 rounded-md bg-zinc-800/50 text-zinc-400 font-bold text-center text-[10px] uppercase tracking-widest border border-white/5">
                            Today's Goal Complete
                        </div>
                    ) : (
                        <Button 
                            onClick={handleStartSession}
                            className="w-full px-4 py-3 rounded-md bg-main hover:bg-main-600 text-white font-bold uppercase tracking-widest hover:scale-[1.01] transition-all text-xs gap-2 shadow-lg shadow-main/10"
                        >
                            <Play size={14} fill="currentColor" />
                            Start Day {currentDay} Session
                        </Button>
                    )}
                </div>

            </div>
        </motion.div>
    );
};
