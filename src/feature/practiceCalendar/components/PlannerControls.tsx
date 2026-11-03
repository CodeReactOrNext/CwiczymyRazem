import { PRESSABLE_KEY } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

/** A row of mutually exclusive options; the picked one sits a shade lighter. */
export const Segmented = <T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: SegmentedProps<T>) => (
  <div
    role='radiogroup'
    aria-label={ariaLabel}
    className={cn("grid gap-1 rounded-lg bg-zinc-800/50 p-1", className)}
    style={{
      gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
    }}>
    {options.map((option) => {
      const active = option.value === value;
      return (
        <button
          key={option.value}
          type='button'
          role='radio'
          aria-checked={active}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded px-2 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
            active
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
          )}>
          <span className='block text-sm font-medium'>{option.label}</span>
          {option.hint && (
            <span
              className={cn(
                "mt-0.5 block text-xs",
                active ? "text-zinc-300" : "text-zinc-500",
              )}>
              {option.hint}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

interface FieldProps {
  label: string;
  hint?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** A labelled group in the planner form. */
export const Field = ({
  label,
  hint,
  aside,
  children,
  className,
}: FieldProps) => (
  <div className={cn("space-y-3", className)}>
    <div className='flex items-end justify-between gap-4'>
      <div>
        <p className='text-sm font-medium text-zinc-100'>{label}</p>
        {hint && <p className='mt-1 text-xs text-zinc-400'>{hint}</p>}
      </div>
      {aside}
    </div>
    {children}
  </div>
);

interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * A length in whole minutes: typed, or nudged a minute at a time. The field
 * may be left empty while typing; it settles back to a valid value on blur.
 */
export const MinutesInput = ({
  value,
  min,
  max,
  onChange,
  label,
}: StepperProps) => {
  const [text, setText] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);
  // Follow outside changes (a quick pick, a reset) without an effect.
  if (value !== lastValue) {
    setLastValue(value);
    setText(String(value));
  }

  const nudge = (by: number) => onChange(clamp(value + by, min, max));

  return (
    <div className='flex items-center gap-1 rounded-lg bg-zinc-800/50 p-1'>
      <button
        type='button'
        onClick={() => nudge(-1)}
        disabled={value <= min}
        aria-label={`${label} −`}
        className={cn(
          PRESSABLE_KEY,
          "flex h-10 w-10 items-center justify-center rounded bg-zinc-700/60 text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:opacity-40 hover:bg-zinc-700 lg:h-8 lg:w-8",
        )}>
        <Minus className='h-3.5 w-3.5' />
      </button>
      <input
        type='text'
        inputMode='numeric'
        value={text}
        aria-label={label}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, 3);
          setText(digits);
          const parsed = parseInt(digits, 10);
          if (parsed >= min && parsed <= max) onChange(parsed);
        }}
        onBlur={() => setText(String(value))}
        onFocus={(event) => event.target.select()}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            nudge(1);
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            nudge(-1);
          }
        }}
        className='h-10 w-12 rounded bg-transparent text-center text-sm font-semibold tabular-nums text-zinc-100 focus-visible:bg-zinc-900/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 lg:h-8'
      />
      <button
        type='button'
        onClick={() => nudge(1)}
        disabled={value >= max}
        aria-label={`${label} +`}
        className={cn(
          PRESSABLE_KEY,
          "flex h-10 w-10 items-center justify-center rounded bg-zinc-700/60 text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:opacity-40 hover:bg-zinc-700 lg:h-8 lg:w-8",
        )}>
        <Plus className='h-3.5 w-3.5' />
      </button>
    </div>
  );
};

export const Stepper = ({ value, min, max, onChange, label }: StepperProps) => (
  <div className='flex items-center gap-1 rounded-lg bg-zinc-800/50 p-1'>
    <button
      type='button'
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      aria-label={`${label} −`}
      className={cn(
        PRESSABLE_KEY,
        "flex h-10 w-10 items-center justify-center rounded bg-zinc-700/60 text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:opacity-40 hover:bg-zinc-700 lg:h-8 lg:w-8",
      )}>
      <Minus className='h-3.5 w-3.5' />
    </button>
    <span className='w-8 text-center text-sm font-semibold tabular-nums text-zinc-100'>
      {value}
    </span>
    <button
      type='button'
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      aria-label={`${label} +`}
      className={cn(
        PRESSABLE_KEY,
        "flex h-10 w-10 items-center justify-center rounded bg-zinc-700/60 text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:opacity-40 hover:bg-zinc-700 lg:h-8 lg:w-8",
      )}>
      <Plus className='h-3.5 w-3.5' />
    </button>
  </div>
);
