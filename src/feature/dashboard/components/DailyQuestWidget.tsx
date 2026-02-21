import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { selectDailyQuest } from "feature/user/store/userSlice";
import { claimQuestRewardAction,initializeDailyQuestAction } from "feature/user/store/userSlice.asyncThunk";
import { useTranslation } from "hooks/useTranslation";
import { ArrowRight, CheckCircle2, Gift, Swords } from "lucide-react";
import Router from "next/router";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { DailyQuestTaskType } from "types/api.types";

const questRoutes: Record<DailyQuestTaskType, string> = {
    rate_song: "/songs?view=library",
    add_want_to_learn: "/songs?view=management",
    practice_any_song: "/timer/song-select",
    healthy_habits: "/report",
    auto_plan: "/timer/auto",
    practice_plan: "/timer/plans",
    practice_total_time: "/timer/song-select",
    practice_technique_time: "/timer/plans",
    practice_specific_exercise: "/profile/skills", // Base path, handled dynamically
};

export const DailyQuestWidget = () => {
    const dispatch = useAppDispatch();
    const dailyQuest = useAppSelector(selectDailyQuest);

    useEffect(() => {
        dispatch(initializeDailyQuestAction());
    }, [dispatch]);

    if (!dailyQuest) return null;

    const allCompleted = dailyQuest.tasks.every(task => task.isCompleted);
    const isClaimed = dailyQuest.isRewardClaimed;

    const handleClaim = () => {
        if (allCompleted && !isClaimed) {
            dispatch(claimQuestRewardAction());
        }
    };

    return (
        <Card className="flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-sm bg-orange-500/5 text-zinc-500">
                        <Swords size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-zinc-200 tracking-wider">Daily Quests</h3>

                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!isClaimed && (
                        <div className="flex items-center justify-center px-1.5 py-0.5 rounded-sm bg-orange-500/10 border border-orange-500/20">
                            <span className="text-[9px] font-bold text-orange-400 tracking-wider leading-none">
                                +100 XP
                            </span>
                        </div>
                    )}
                    <div className="text-xs font-bold text-zinc-500">
                        {dailyQuest.tasks.filter(t => t.isCompleted).length}/{dailyQuest.tasks.length}
                    </div>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                {dailyQuest.tasks.map((task) => (
                    <div
                        key={task.id}
                        role={!task.isCompleted ? "button" : undefined}
                        tabIndex={!task.isCompleted ? 0 : undefined}
                        onClick={() => {
                            if (!task.isCompleted) {
                                if (task.type === 'practice_specific_exercise' && task.exerciseId) {
                                  Router.push(`/profile/skills?exerciseId=${task.exerciseId}`);
                                } else {
                                  Router.push(questRoutes[task.type]);
                                }
                            }
                        }}
                        onKeyDown={(e) => {
                            if (!task.isCompleted && (e.key === "Enter" || e.key === " ")) {
                                if (task.type === 'practice_specific_exercise' && task.exerciseId) {
                                  Router.push(`/profile/skills?exerciseId=${task.exerciseId}`);
                                } else {
                                  Router.push(questRoutes[task.type]);
                                }
                            }
                        }}
                        className={cn(
                            "flex items-center justify-between p-2.5 rounded-sm transition-all",
                            task.isCompleted
                                ? "bg-zinc-800/40 text-zinc-500"
                                : "bg-zinc-800/80 text-zinc-300 cursor-pointer hover:bg-zinc-700/80"
                        )}
                    >
                        <span className={cn(
                            "text-xs font-bold",
                            task.isCompleted && "line-through opacity-50"
                        )}>
                            {task.title}
                        </span>

                        {task.isCompleted ? (
                             <CheckCircle2 size={14} className="text-green-500" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-zinc-500">
                                    {task.progress}/{task.target}
                                </span>
                                <ArrowRight size={12} className="text-zinc-600" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {allCompleted && !isClaimed && (
                <Button
                    onClick={handleClaim}
                    className="w-full h-10 rounded-sm text-xs font-bold tracking-wide transition-all bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 hover:scale-105"
                >
                    <span className="flex items-center gap-2">
                        <Gift size={14} className="animate-bounce" /> 
                        Claim 100 XP
                    </span>
                </Button>
            )}

            {isClaimed && (
                 <div className="w-full h-10 flex items-center justify-center gap-2 rounded-sm bg-zinc-800/40 text-[10px] font-black uppercase tracking-widest text-zinc-500 border border-white/5">
                     <CheckCircle2 size={14} className="text-emerald-500" />
                     Reward Claimed
                 </div>
            )}
        </Card>
    );
};
