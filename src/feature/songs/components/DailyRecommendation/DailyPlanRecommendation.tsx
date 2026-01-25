import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { ArrowRight, Clock, Dumbbell, Play, Target, Zap } from "lucide-react";
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
      className="group relative overflow-hidden bg-zinc-900/40 p-6 backdrop-blur-xl border-white/5 transition-all hover:border-white/10"
    >
      <div className="relative z-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
             <div className={cn("p-2 rounded-lg shrink-0", colorStyle)}>
                <Dumbbell className="h-4 w-4" />
             </div>
             <div className="min-w-0 flex-1 space-y-1">
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-zinc-500">Suggested plan</span>
               </div>
               <h4 className="truncate text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                 {titleStr}
               </h4>
               <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{totalMinutes} min</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="capitalize">{plan.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{plan.exercises.length} Exercises</span>
                  </div>
               </div>
             </div>
          </div>

          <div className="flex items-center gap-3 mt-2 xl:mt-0">
            <Link href={`/timer/plans?planId=${plan.id}`} className="block w-full sm:w-auto">
              <Button variant="secondary" className="h-9 w-full sm:w-auto rounded-lg px-6 text-xs sm:text-sm font-black transition-all active:scale-95">
                <Play className="mr-2 h-4 w-4 fill-current" />
                Practice
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
