import { UpgradeModal } from "feature/premium/components/UpgradeModal";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { selectUserInfo } from "feature/user/store/userSlice";
import { useState } from "react";
import { useAppSelector } from "store/hooks";
import { ExerciseCard } from "./ExerciseCard";

interface ExerciseGridProps {
  exercises: Exercise[];
  selectedExercises: Exercise[];
  onToggleExercise: (exercise: Exercise) => void;
}

export const ExerciseGrid = ({
  exercises,
  selectedExercises,
  onToggleExercise,
}: ExerciseGridProps) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const userInfo = useAppSelector(selectUserInfo);
  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {exercises.map((exercise) => {
          const isSelected = selectedExercises.some((e) => e.id === exercise.id);
          const locked = !!exercise.premium && !isPremium;

          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              isSelected={isSelected}
              onToggle={onToggleExercise}
              isLocked={locked}
              onUpgrade={locked ? () => setShowUpgradeModal(true) : undefined}
            />
          );
        })}
      </div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
};
