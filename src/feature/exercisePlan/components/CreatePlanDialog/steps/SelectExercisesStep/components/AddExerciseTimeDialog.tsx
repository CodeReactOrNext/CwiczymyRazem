'use client';

import { Button } from 'assets/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'assets/components/ui/dialog';
import { SETUP_DIALOG_FOOTER } from 'feature/exercisePlan/components/setupDialogStyles';
import { useLocalizeExercise } from "feature/exercisePlan/hooks/useLocalizedExercises";
import type { Exercise } from 'feature/exercisePlan/types/exercise.types';
import { useTranslation } from "hooks/useTranslation";
import { useState } from 'react';

import { ExerciseTimeField, parseExerciseMinutes } from './ExerciseTimeField';

interface AddExerciseTimeDialogProps {
  exercise: Exercise | null;
  onConfirm: (exercise: Exercise, timeInMinutes: number) => void;
  onCancel: () => void;
}

function AddExerciseTimeForm({
  exercise,
  onConfirm,
  onCancel,
}: {
  exercise: Exercise;
  onConfirm: (exercise: Exercise, timeInMinutes: number) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation("plans");
  const localizeExercise = useLocalizeExercise();
  const [time, setTime] = useState(String(exercise.timeInMinutes));
  const minutes = parseExerciseMinutes(time);

  const handleConfirm = () => {
    if (minutes !== null) onConfirm(exercise, minutes);
  };

  return (
    <DialogContent className="sm:max-w-[380px]">
      <DialogHeader>
        <DialogTitle className="pr-6">
          {localizeExercise(exercise).title}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-8 pt-2">
        <ExerciseTimeField
          value={time}
          onChange={setTime}
          onSubmit={handleConfirm}
          onCancel={onCancel}
        />

        <div className={SETUP_DIALOG_FOOTER}>
          <Button variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={minutes === null}
          >
            {t("add_to_plan")}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

export function AddExerciseTimeDialog({ exercise, onConfirm, onCancel }: AddExerciseTimeDialogProps) {
  return (
    <Dialog open={!!exercise} onOpenChange={(open) => { if (!open) onCancel(); }}>
      {/* Keyed on the exercise so each one opens with its own minutes. */}
      {exercise && (
        <AddExerciseTimeForm key={exercise.id} exercise={exercise} onConfirm={onConfirm} onCancel={onCancel} />
      )}
    </Dialog>
  );
}
