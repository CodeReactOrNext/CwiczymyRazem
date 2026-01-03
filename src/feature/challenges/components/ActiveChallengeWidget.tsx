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
    if (!userStats?.activeChallenges || userStats.activeChallenges.length === 0) {
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

    return (
        <div className="flex flex-col gap-4 w-full h-full">
            {userStats.activeChallenges.map((ac) => {
                const challenge = challengesList.find(c => c.id === ac.challengeId);
                if (!challenge) return null;

                const today = new Date().toISOString().split('T')[0];
                const isTodayDone = ac.lastCompletedDate === today;

                const handleStartSession = () => {
                    router.push(`/timer/challenges?start=${ac.challengeId}`);
                };

                const getLocalized = (content: string | any) => {
                    if (typeof content === 'string') return content;
                    if (!content) return '';
                    return content[currentLang] || content['en'] || '';
                };

                return (
                    <motion.div 
                        key={ac.challengeId}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full p-4 rounded-md bg-zinc-900/60 shadow-lg relative overflow-hidden flex flex-col justify-center border border-white/5"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-main/5 blur-[60px] rounded-full pointer-events-none" />

                        <div className="relative z-10 flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-md bg-main/10 text-main shrink-0">
                                        <Flame size={16} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-main px-1 bg-main/10 rounded">Challenge</span>
                                        </div>
                                        <h2 className="text-sm font-bold text-white tracking-tight leading-tight">
                                            {getLocalized(challenge.title)}
                                        </h2>
                                    </div>
                                </div>
                                
                                {!isTodayDone && (
                                    <Button 
                                        onClick={handleStartSession}
                                        size="sm"
                                        className="h-8 px-3 rounded-md bg-main hover:bg-main-600 text-white font-bold uppercase tracking-widest transition-all text-[9px] gap-1.5 shadow-lg shadow-main/10"
                                    >
                                        <Play size={10} fill="currentColor" />
                                        Start
                                    </Button>
                                )}
                                {isTodayDone && (
                                    <div className="px-2 py-1 rounded bg-zinc-800 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">
                                        Done
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {Array.from({ length: ac.totalDays }).map((_, idx) => {
                                    const dayNum = idx + 1;
                                    const isCompleted = dayNum < ac.currentDay || (dayNum === ac.currentDay && isTodayDone);
                                    const isCurrent = dayNum === ac.currentDay && !isTodayDone;
                                    
                                    return (
                                        <div 
                                            key={dayNum} 
                                            className={cn(
                                                "w-7 h-7 rounded-md flex items-center justify-center transition-all duration-300 border-2",
                                                isCompleted 
                                                    ? "bg-main border-main text-white shadow-[0_4px_12px_rgba(var(--main-rgb),0.3)] scale-105" 
                                                    : isCurrent 
                                                        ? "bg-main/20 border-main text-main shadow-[0_0_15px_rgba(var(--main-rgb),0.2)]" 
                                                        : "bg-zinc-800/50 border-white/5 text-zinc-500 hover:border-zinc-700"
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
                    </motion.div>
                );
            })}
        </div>
    );
};
