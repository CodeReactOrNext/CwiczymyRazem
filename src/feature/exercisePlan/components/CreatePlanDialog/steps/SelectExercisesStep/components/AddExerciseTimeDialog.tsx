'use client';

import { Button } from 'assets/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'assets/components/ui/dialog';
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
  const [time, setTime] = useState(String(exercise.timeInMinutes));
  const minutes = parseExerciseMinutes(time);

  const handleConfirm = () => {
    if (minutes !== null) onConfirm(exercise, minutes);
  };

  return (
    <DialogContent className="sm:max-w-[360px] border-white/10 bg-zinc-950/80 backdrop-blur-xl shadow-2xl [&>button]:!rounded-[8px]" style={{ borderRadius: '8px' }}>
      <DialogHeader>
        <DialogTitle className="text-[16px] font-bold leading-tight pr-6 text-zinc-100 flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-[8px] bg-cyan-500 mt-1.5 shrink-0" />
          {exercise.title}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5 pt-2">
        <ExerciseTimeField
          value={time}
          onChange={setTime}
          onSubmit={handleConfirm}
          onCancel={onCancel}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" className="rounded-[8px] text-zinc-400 hover:text-white hover:bg-white/5 transition-colors font-semibold" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button
            className="rounded-[8px] bg-white hover:bg-zinc-200 text-black transition-colors font-bold px-6"
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
