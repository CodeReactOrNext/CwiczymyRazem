import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { Timer } from "lucide-react";
import { memo } from "react";

import type { Exercise, ExercisePlan } from "../../../types/exercise.types";

interface ExerciseHeroHeaderProps {
  exercise: Exercise;
  activeExercise: Exercise;
  plan: ExercisePlan;
}

export const ExerciseHeroHeader = memo(function ExerciseHeroHeader({ exercise, activeExercise, plan }: ExerciseHeroHeaderProps) {
  const streakPlan = plan as any;
  return (
    <>
      <h2 className={cn(
        "font-bold text-white tracking-tight flex flex-wrap items-center justify-center gap-3 mb-8",
        exercise.isPlayalong ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl"
      )}>
        {exercise.isPlayalong && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/10 backdrop-blur-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-wide text-red-400">Playalong</span>
          </div>
        )}
        {activeExercise.title}
      </h2>

      {activeExercise.customGoal && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={exercise.customGoal}
          className="mb-12 flex flex-col items-center gap-4"
        >
          <div className="relative group">
            <div className="absolute -inset-8 bg-cyan-500/20 blur-[40px] rounded-full opacity-50 group-hover:opacity-80 transition-opacity animate-pulse" />
            <div className="relative w-32 h-32 rounded-3xl bg-zinc-900/80 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              <span className="text-6xl font-extrabold text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                {exercise.customGoal}
              </span>
            </div>
          </div>
          {exercise.customGoalDescription && (
            <p className="text-xs text-zinc-500 font-semibold tracking-wide mt-2">
              {exercise.customGoalDescription}
            </p>
          )}
        </motion.div>
      )}

      {!!streakPlan.streakDays && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 w-full max-w-2xl px-6 py-4 rounded-xl bg-main/10 border border-main/20 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-main text-white"><Timer size={20} /></div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Challenge: {streakPlan.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{streakPlan.description}</p>
              <p className="text-xs text-main font-semibold tracking-wide">
                Reward: {streakPlan.rewardDescription}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: streakPlan.streakDays }).map((_: unknown, i: number) => (
              <div key={i} className="h-1.5 w-6 rounded-full bg-main/20 border border-main/10" />
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
});
