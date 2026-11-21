import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Minus, Plus, X } from "lucide-react";
import { type ReactNode, useState } from "react";

import {
  stepMinutesDown,
  stepMinutesUp,
  TIME_PRESETS,
} from "./helpers/timeSteps";

interface MinutesStepperProps {
  /** What the minutes belong to — read out by the buttons and the field. */
  label: string;
  minutes: number;
  max: number;
  size?: "md" | "lg";
  onChange: (minutes: number) => void;
}

/** Minutes as a number you can step in fives or type over. */
export const MinutesStepper = ({
  label,
  minutes,
  max,
  size = "md",
  onChange,
}: MinutesStepperProps) => {
  const { t } = useTranslation("report");
  // While the field is focused the raw text wins, so clearing it to type a new
  // number doesn't snap back to "0" under the cursor.
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <div className='flex shrink-0 items-center justify-center gap-3'>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='h-11 w-11'
        aria-label={t("flow.less", { label })}
        disabled={minutes <= 0}
        onClick={() => onChange(stepMinutesDown(minutes))}>
        <Minus />
      </Button>

      <div className='flex items-baseline gap-2'>
        <input
          inputMode='numeric'
          aria-label={t("flow.minutes_of", { label })}
          value={draft ?? String(minutes)}
          onChange={(event) => {
            const cleaned = event.target.value.replace(/\D/g, "").slice(0, 3);
            setDraft(cleaned);
            onChange(Math.min(Number(cleaned || 0), max));
          }}
          onFocus={(event) => event.target.select()}
          onBlur={() => setDraft(null)}
          onKeyDown={(event) => {
            // The field lives inside the report form; Enter must not save it.
            if (event.key !== "Enter") return;
            event.preventDefault();
            event.currentTarget.blur();
          }}
          className={cn(
            "rounded-lg bg-zinc-950/60 text-center font-bold tabular-nums text-zinc-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            size === "lg" ? "h-14 w-24 text-4xl" : "h-11 w-16 text-xl",
          )}
        />
        <span className='text-sm font-medium text-zinc-400'>
          {t("flow.min")}
        </span>
      </div>

      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='h-11 w-11'
        aria-label={t("flow.more", { label })}
        disabled={minutes >= max}
        onClick={() => onChange(stepMinutesUp(minutes, max))}>
        <Plus />
      </Button>
    </div>
  );
};

interface TimeBlockProps {
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  /** Song titles and artists are names — keep the browser from translating them. */
  isName?: boolean;
  minutes: number;
  max: number;
  onChange: (minutes: number) => void;
  /** Shown only when there is more than one block to choose between. */
  onRemove?: () => void;
}

/**
 * The time one thing got in the session — a song or a category. Presets cover
 * the usual lengths in one tap; the stepper and the field handle the rest.
 */
export const TimeBlock = ({
  leading,
  title,
  subtitle,
  isName,
  minutes,
  max,
  onChange,
  onRemove,
}: TimeBlockProps) => {
  const { t } = useTranslation("report");

  return (
    <div className='flex flex-col gap-5 rounded-lg bg-zinc-900/40 p-5'>
      <div className='flex items-center gap-3'>
        {leading}
        <div className='min-w-0 flex-1'>
          <p
            translate={isName ? "no" : undefined}
            className='truncate text-base font-semibold text-zinc-100'>
            {title}
          </p>
          {subtitle && (
            <p
              translate={isName ? "no" : undefined}
              className='truncate text-sm text-zinc-400'>
              {subtitle}
            </p>
          )}
        </div>
        {onRemove && (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label={t("flow.remove", { label: title })}
            onClick={onRemove}>
            <X />
          </Button>
        )}
      </div>

      <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8'>
        <MinutesStepper
          label={title}
          minutes={minutes}
          max={max}
          size='lg'
          onChange={onChange}
        />

        <div className='grid grid-cols-3 gap-2 sm:w-80 sm:shrink-0'>
          {TIME_PRESETS.map((preset) => (
            <button
              key={preset}
              type='button'
              aria-pressed={minutes === preset}
              onClick={() => onChange(preset)}
              className={cn(
                "min-h-11 rounded-lg px-2 text-sm font-semibold tabular-nums transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                minutes === preset
                  ? "bg-zinc-100 text-zinc-950"
                  : "bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800 hover:text-white",
              )}>
              {preset} {t("flow.min")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
