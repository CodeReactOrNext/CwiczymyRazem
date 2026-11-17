'use client';

import { Button } from 'assets/components/ui/button';
import { Input } from 'assets/components/ui/input';
import { Label } from 'assets/components/ui/label';
import { cn } from 'assets/lib/utils';
import { SETUP_FIELD } from 'feature/exercisePlan/components/setupDialogStyles';
import { useTranslation } from "hooks/useTranslation";
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
  const { t } = useTranslation("plans");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectOnMount) return;
    const timeout = setTimeout(() => inputRef.current?.select(), 50);
    return () => clearTimeout(timeout);
  }, [selectOnMount]);

  return (
    <div className='space-y-3'>
      <Label htmlFor='exercise-time'>{t("practice_duration")}</Label>
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
          className={cn(
            SETUP_FIELD,
            'text-center text-lg font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
          )}
          placeholder='0'
        />
        <span className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400'>
          min
        </span>
      </div>

      <div className='flex flex-wrap gap-2'>
        {QUICK_TIMES.map((minutes) => (
          <Button
            key={minutes}
            type='button'
            variant={value === String(minutes) ? 'default' : 'secondary'}
            aria-pressed={value === String(minutes)}
            onClick={() => onChange(String(minutes))}
            className='min-w-[50px] flex-1'>
            {minutes}
          </Button>
        ))}
      </div>
    </div>
  );
}
