import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { selectDailyQuest } from "feature/user/store/userSlice";
import { claimQuestRewardAction,initializeDailyQuestAction } from "feature/user/store/userSlice.asyncThunk";
import { CheckCircle2, Gift, Swords } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "store/hooks";

export const DailyQuestWidget = () => {
    const dispatch = useAppDispatch();
    const dailyQuest = useAppSelector(selectDailyQuest);
    const { t } = useTranslation("common");

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
                    <div className="p-2 rounded-sm bg-orange-500/10 text-orange-500">
                        <Swords size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-wider">Daily Quests</h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                            {new Date().toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!isClaimed && (
                        <div className="flex items-center justify-center px-2 py-1 rounded-sm bg-orange-500/10 border border-orange-500/20">
                            <span className="text-[10px] font-bold text-orange-400 tracking-wider leading-none">
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
                        className={cn(
                            "flex items-center justify-between p-2.5 rounded-sm transition-all",
                            task.isCompleted 
                                ? "bg-zinc-800/40 text-zinc-500" 
                                : "bg-zinc-800/80 text-zinc-300"
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
                            <span className="text-[10px] font-bold text-zinc-500">
                                {task.progress}/{task.target}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            <Button
                disabled={!allCompleted || isClaimed}
                onClick={handleClaim}
                className={cn(
                    "w-full h-10 rounded-sm text-xs font-bold tracking-wide transition-all",
                    isClaimed 
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        : allCompleted 
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 hover:scale-105"
                            : "bg-zinc-800/50 text-zinc-600"
                )}
            >
                {isClaimed ? (
                    <span className="flex items-center gap-2"><CheckCircle2 size={14} /> Reward Claimed</span>
                ) : allCompleted ? (
                    <span className="flex items-center gap-2"><Gift size={14} className="animate-bounce" /> Claim 100 XP</span>
                ) : (
                    "Complete All Tasks"
                )}
            </Button>
        </Card>
    );
};
