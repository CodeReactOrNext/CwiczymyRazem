import React from "react";
import { Dumbbell, ArrowRight, Clock, Target, Zap } from "lucide-react";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { cn } from "assets/lib/utils";
import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import Image from "next/image";
import Link from "next/link";

interface DailyPlanRecommendationProps {
  plan: ExercisePlan;
}

export const DailyPlanRecommendation = ({ plan }: DailyPlanRecommendationProps) => {
  const totalMinutes = plan.exercises.reduce((acc, curr) => acc + (curr.timeInMinutes || 0), 0);
  
  // Use category colors
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
      className="group relative overflow-hidden bg-zinc-900/50 p-5 backdrop-blur-xl transition-all hover:border-white/10"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
           <div className={cn("p-2 rounded-lg", colorStyle)}>
              <Dumbbell className="h-4 w-4" />
           </div>
           <div>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Suggested Plan</span>
             </div>
             <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
               {titleStr}
             </h4>
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4 text-[11px] font-bold text-zinc-400">
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

        <Link href={`/timer/plans?planId=${plan.id}`} className="block">
          <Button variant="outline" className="w-full h-8 rounded-md border-white/10 bg-zinc-800/10 hover:bg-zinc-800/50 text-xs text-white transition-all active:scale-[0.98]">
            Start Training
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Subtle Background Glow */}
      <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/10 transition-all" />
    </Card>
  );
};
