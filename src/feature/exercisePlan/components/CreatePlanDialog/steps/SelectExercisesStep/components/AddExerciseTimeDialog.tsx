'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'assets/components/ui/dialog';
import { Button } from 'assets/components/ui/button';
import { Input } from 'assets/components/ui/input';
import { Label } from 'assets/components/ui/label';
import { Clock } from 'lucide-react';
import type { Exercise } from 'feature/exercisePlan/types/exercise.types';

interface AddExerciseTimeDialogProps {
  exercise: Exercise | null;
  onConfirm: (exercise: Exercise, timeInMinutes: number) => void;
  onCancel: () => void;
}

const QUICK_TIMES = [3, 5, 10, 15, 20];

export function AddExerciseTimeDialog({ exercise, onConfirm, onCancel }: AddExerciseTimeDialogProps) {
  const [time, setTime] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (exercise) {
      setTime(String(exercise.timeInMinutes));
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [exercise]);

  if (!exercise) return null;

  const handleConfirm = () => {
    const parsed = parseInt(time, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onConfirm(exercise, parsed);
    }
  };

  return (
    <Dialog open={!!exercise} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold leading-tight pr-6">
            {exercise.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label htmlFor="exercise-time" className="flex items-center gap-1.5 text-sm text-zinc-400">
              <Clock className="h-3.5 w-3.5" />
              Practice duration (minutes)
            </Label>
            <Input
              ref={inputRef}
              id="exercise-time"
              type="number"
              min={1}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
                if (e.key === 'Escape') onCancel();
              }}
              className="text-center text-lg font-bold h-11"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_TIMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTime(String(t))}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                  time === String(t)
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                    : 'border-white/10 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`}
              >
                {t} min
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!time || parseInt(time, 10) <= 0}
            >
              Add to plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
