import { memo, type ReactNode } from "react";

import type { Exercise } from "../../../types/exercise.types";

interface ExerciseInfoGridProps {
  exercise: Exercise;
  isPlayalong?: boolean;
  hasMetronome: boolean;
  children: ReactNode;
}

export const ExerciseInfoGrid = memo(function ExerciseInfoGrid({ children }: ExerciseInfoGridProps) {
  return (
    <div className="flex justify-end w-full max-w-[1800px] mx-auto mt-8">
      {children}
    </div>
  );
});
