import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { selectDailyQuest } from "feature/user/store/userSlice";
import { claimQuestRewardAction, initializeDailyQuestAction } from "feature/user/store/userSlice.questActions";
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
    practice_theory_time: "/timer/plans",
    practice_hearing_time: "/timer/plans",
    practice_creativity_time: "/timer/plans",
    creativity_focus: "/timer/plans",
    long_session: "/timer/song-select",
    well_rounded: "/timer/plans",
    two_categories_min: "/timer/plans",
    balanced_session: "/timer/plans",
    rate_multiple_songs: "/songs?view=library",
    complete_two_plans: "/timer/plans",
    improve_skill: "/profile/skills",
    practice_three_exercises: "/timer/plans",
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
        <Card className="flex-col justify-between p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                        <Swords size={18}  className="text-lg transition-all duration-500 text-zinc-700"/>
                    <div>
                        <h3 className="text-[12px] font-semibold text-zinc-400 tracking-wide">Daily Quests</h3>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!isClaimed && (
                        <div className="flex items-center gap-1.5 mr-1">
                            <span className="text-xs font-medium text-cyan-400 tracking-tight">
                                +10
                            </span>
                            <img src="/images/points.png" alt="points" className="h-5 w-5 object-contain" />
                        </div>
                    )}
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
                                ? "bg-green-900/25 text-green-400/70"
                                : "bg-zinc-800/80 text-zinc-300 cursor-pointer hover:bg-zinc-700/80 active:scale-[0.98]"
                        )}
                    >
                        <span className={cn(
                            "text-xs tracking-wide",
                            task.isCompleted ? "font-medium line-through opacity-50" : "font-medium"
                        )}>
                            {task.title}
                        </span>

                        {task.isCompleted ? (
                             <CheckCircle2 size={14} className="text-green-500/70" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-zinc-400">
                                    {task.progress}/{task.target}
                                </span>
                                <ArrowRight size={12} className="text-zinc-400" />
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
                        Claim 10 <img src="/images/points.png" alt="points" className="h-5 w-5 object-contain" />
                    </span>
                </Button>
            )}

            {isClaimed && (
                 <div className="w-full h-10 flex items-center justify-center gap-2 rounded-sm bg-zinc-800/40 text-[10px] font-black uppercase tracking-widest text-zinc-400 border border-white/5">
                     <CheckCircle2 size={14} className="text-emerald-500" />
                     Reward Claimed
                 </div>
            )}
        </Card>
    );
};
