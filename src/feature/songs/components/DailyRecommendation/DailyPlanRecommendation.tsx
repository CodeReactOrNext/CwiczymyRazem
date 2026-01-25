import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { ArrowRight, ChevronRight, Clock, Dumbbell, Play, Target, Zap } from "lucide-react";
import Link from "next/link";

interface DailyPlanRecommendationProps {
  plan: ExercisePlan;
}

export const DailyPlanRecommendation = ({ plan }: DailyPlanRecommendationProps) => {
  const totalMinutes = plan.exercises.reduce((acc, curr) => acc + (curr.timeInMinutes || 0), 0);
  
  const categoryColors: Record<string, string> = {
    technique: "text-red-400 bg-red-500/10 border-red-500/20",
    theory: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    hearing: "text-green-400 bg-green-500/10 border-green-500/20",
    creativity: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    mixed: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };

  const colorStyle = categoryColors[plan.category] || categoryColors.mixed;
  const titleStr = plan.title;

  return (
    <Card
      className="group relative flex h-full flex-col justify-between overflow-hidden bg-zinc-900/40 p-6 border-white/5 transition-all hover:border-white/10"
    >
      <div className="relative z-10 h-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4 flex-1">
             <div className={cn("p-2 rounded-lg shrink-0 mt-1", colorStyle)}>
                <Dumbbell className="h-4 w-4" />
             </div>
             <div className="min-w-0 flex-1 space-y-1">
               <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-zinc-200 tracking-wider">Suggested Practice</h3>
               </div>
                <h4 className="truncate text-xl font-bold text-white group-hover:text-cyan-400 transition-colors mb-2">
                  {titleStr}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                   <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-zinc-400">
                     <Clock className="h-3 w-3 text-zinc-500" />
                     <span>{totalMinutes} min</span>
                   </div>
                   <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-zinc-400">
                     <Target className="h-3 w-3 text-zinc-500" />
                     <span className="capitalize">{plan.difficulty}</span>
                   </div>
                   <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-zinc-400">
                     <Zap className="h-3 w-3 text-zinc-500" />
                     <span>{plan.exercises.length} Exercises</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href={`/timer/plans?planId=${plan.id}`} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                Practice
                <ChevronRight size={14} strokeWidth={3} className="ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Subtle Background Glow */}
      <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/10 transition-all" />
    </Card>
  );
};
