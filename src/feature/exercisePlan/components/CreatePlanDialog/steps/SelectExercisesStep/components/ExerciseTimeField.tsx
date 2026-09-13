'use client';

import { Input } from 'assets/components/ui/input';
import { Label } from 'assets/components/ui/label';
import { cn } from 'assets/lib/utils';
import { Clock } from 'lucide-react';
import { useEffect, useRef } from 'react';

const QUICK_TIMES = [3, 5, 10, 15, 20];

interface ExerciseTimeFieldProps {
  /** Raw text of the minutes input — the caller parses it on confirm. */
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  /** Selects the input's text once, when the dialog around it opens. */
  selectOnMount?: boolean;
}

/** Parses the field's text; null unless it is a positive whole number of minutes. */
export const parseExerciseMinutes = (value: string): number | null => {
  const parsed = parseInt(value, 10);
  return !isNaN(parsed) && parsed > 0 ? parsed : null;
};

/**
 * The "how long" of a plan item: a minutes input with the usual quick picks.
 * Shared by the exercise time dialog and the song dialog so a song's slot is
 * set exactly the way an exercise's is.
 */
export function ExerciseTimeField({
  value,
  onChange,
  onSubmit,
  onCancel,
  selectOnMount = true,
}: ExerciseTimeFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectOnMount) return;
    const timeout = setTimeout(() => inputRef.current?.select(), 50);
    return () => clearTimeout(timeout);
  }, [selectOnMount]);

  return (
    <div className='space-y-5'>
      <div className='space-y-2.5'>
        <Label
          htmlFor='exercise-time'
          className='flex items-center gap-1.5 text-[12px] font-bold tracking-wider text-zinc-500'>
          <Clock className='h-3.5 w-3.5 text-cyan-500/70' />
          Practice duration
        </Label>
        <div className='relative'>
          <Input
            ref={inputRef}
            id='exercise-time'
            type='number'
            min={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmit();
              if (e.key === 'Escape') onCancel();
            }}
            className='h-14 rounded-[8px] border-white/5 bg-white/[0.03] text-center text-xl font-black text-cyan-300 shadow-inner transition-all placeholder:text-zinc-700 focus-visible:border-cyan-500/30 focus-visible:bg-white/[0.06] focus-visible:ring-1 focus-visible:ring-cyan-500/40'
            placeholder='0'
          />
          <span className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold tracking-widest text-zinc-500'>
            min
          </span>
        </div>
      </div>

      <div className='flex flex-wrap gap-2'>
        {QUICK_TIMES.map((t) => (
          <button
            key={t}
            type='button'
            onClick={() => onChange(String(t))}
            className={cn(
              'min-w-[50px] flex-1 rounded-[8px] border py-2 text-[12px] font-bold transition-all duration-300 active:scale-95',
              value === String(t)
                ? 'border-cyan-500/30 bg-cyan-500/15 text-cyan-300 shadow-[0_0_10px_-2px_rgba(6,182,212,0.2)]'
                : 'border-white/5 bg-white/[0.03] text-zinc-400 hover:border-white/10 hover:bg-white/10 hover:text-zinc-200'
            )}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
