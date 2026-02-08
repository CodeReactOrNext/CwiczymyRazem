import { cn } from "assets/lib/utils";

import type { ExercisePlan } from "../../../types/exercise.types";

interface ExerciseProgressProps {
  plan: ExercisePlan;
  currentExerciseIndex: number;
  onExerciseSelect: (index: number) => void;
}

export const ExerciseProgress = ({
  plan,
  currentExerciseIndex,
  onExerciseSelect,
}: ExerciseProgressProps) => {
  return (
    <div className='w-full max-w-4xl mx-auto py-4 px-1'>
      <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[12px] font-bold text-white tracking-wide">
            Session Progress
          </span>
          <span className="text-[12px] font-bold text-white tracking-wider">
            {currentExerciseIndex + 1} <span className="text-white/30">/</span> {plan.exercises.length}
          </span>
      </div>
      <div className='flex items-center w-full h-8'>
        {plan.exercises.map((_, idx) => {
          const isActive = idx === currentExerciseIndex;
          const isVisited = idx < currentExerciseIndex;

          return (
            <button
              key={idx}
              onClick={() => onExerciseSelect(idx)}
              className="group relative flex-1 h-full px-1.5 focus:outline-none transition-all"
              aria-label={`Go to exercise ${idx + 1}`}
            >
              {/* Background slot highlight on hover */}
              <div className="absolute inset-y-0 inset-x-1.5 rounded-lg bg-white/0 group-hover:bg-white/5 transition-colors" />
              
              {/* The Visual Bar */}
              <div className={cn(
                "relative h-2.5 w-full rounded-full transition-all duration-300",
                isActive 
                  ? "bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.7)]" 
                  : isVisited
                  ? "bg-zinc-500 hover:bg-zinc-400"
                  : "bg-zinc-800 hover:bg-zinc-700"
              )} />
              
              {/* Subtle hover tooltip showing exercise number */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-zinc-900 border border-white/10 text-[10px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Exercise {idx + 1}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
