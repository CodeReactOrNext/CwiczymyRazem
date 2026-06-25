import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { Timer } from "lucide-react";
import { memo } from "react";

import type { Exercise, ExercisePlan } from "../../../types/exercise.types";

interface ExerciseHeroHeaderProps {
  exercise: Exercise;
  activeExercise: Exercise;
  plan: ExercisePlan;
  rewardSkillId?: string;
  rewardAmount?: number;
  /**
   * "header" → just the compact, left-aligned title (sits in the top bar).
   * "goals"  → the custom-goal / streak-challenge blocks (sit above the player).
   */
  variant?: "header" | "goals";
}

export const ExerciseHeroHeader = memo(function ExerciseHeroHeader({
  exercise, activeExercise, plan, variant = "header"
}: ExerciseHeroHeaderProps) {
  const streakPlan = plan as any;

  if (variant === "header") {
    return (
      <h2 className={cn(
        "font-bold text-white tracking-tight flex flex-wrap items-center gap-2.5 min-w-0",
        exercise.isPlayalong ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"
      )}>
        {exercise.isPlayalong && (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 shrink-0">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-wide text-red-400">Playalong</span>
          </div>
        )}
        <span className="truncate">{activeExercise.title}</span>
      </h2>
    );
  }

  return (
    <>
      {/* The custom-goal card lives inside the detector (NoteHuntDetector /
          ChordHuntPanel) so it isn't duplicated here. */}

      {!!streakPlan.streakDays && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 w-full max-w-2xl px-6 py-4 rounded-xl bg-main/10 flex items-center justify-between"
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
              <div key={i} className="h-1.5 w-6 rounded-full bg-main/20" />
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
});
