'use client';

import { Button } from 'assets/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'assets/components/ui/dialog';
import { Input } from 'assets/components/ui/input';
import { Label } from 'assets/components/ui/label';
import type { Exercise } from 'feature/exercisePlan/types/exercise.types';
import { Clock } from 'lucide-react';
import { useEffect, useRef,useState } from 'react';

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
      <DialogContent className="sm:max-w-[360px] border-white/10 bg-zinc-950/80 backdrop-blur-xl shadow-2xl [&>button]:!rounded-[8px]" style={{ borderRadius: '8px' }}>
        <DialogHeader>
          <DialogTitle className="text-[16px] font-bold leading-tight pr-6 text-zinc-100 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-[8px] bg-cyan-500 mt-1.5 shrink-0" />
            {exercise.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2.5">
            <Label htmlFor="exercise-time" className="flex items-center gap-1.5 text-[12px] uppercase tracking-wider font-bold text-zinc-500">
              <Clock className="h-3.5 w-3.5 text-cyan-500/70" />
              Practice duration
            </Label>
            <div className="relative">
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
                className="text-center text-xl font-black h-14 bg-white/[0.03] border-white/5 rounded-[8px] text-cyan-300 focus-visible:ring-1 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/30 focus-visible:bg-white/[0.06] transition-all shadow-inner placeholder:text-zinc-700"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-zinc-500 uppercase tracking-widest pointer-events-none">
                min
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_TIMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTime(String(t))}
                className={`flex-1 min-w-[50px] py-2 rounded-[8px] text-[12px] font-bold border transition-all duration-300 active:scale-95 ${
                  time === String(t)
                    ? 'border-cyan-500/30 bg-cyan-500/15 text-cyan-300 shadow-[0_0_10px_-2px_rgba(6,182,212,0.2)]'
                    : 'border-white/5 bg-white/[0.03] text-zinc-400 hover:border-white/10 hover:bg-white/10 hover:text-zinc-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" className="rounded-[8px] text-zinc-400 hover:text-white hover:bg-white/5 transition-colors font-semibold" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              className="rounded-[8px] bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)] transition-all font-bold px-6"
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
