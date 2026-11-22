import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Minus, Plus, X } from "lucide-react";
import { type ReactNode, useState } from "react";

import { type BlockTone, TONE_CLASSES } from "./helpers/categoryTone";
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
  /** Tints the number — for a block that lights up once it holds time. */
  tone?: BlockTone;
  onChange: (minutes: number) => void;
}

/** Minutes as a number you can step in fives or type over. */
export const MinutesStepper = ({
  label,
  minutes,
  max,
  size = "md",
  tone,
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
        size='icon-touch'
        className=''
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
            "rounded-lg bg-zinc-950/60 text-center font-bold tabular-nums transition-colors duration-base focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            size === "lg" ? "h-14 w-24 text-4xl" : "h-11 w-16 text-xl",
            tone ? TONE_CLASSES[tone].number : "text-zinc-100",
          )}
        />
        <span className='text-sm font-medium text-zinc-400'>
          {t("flow.min")}
        </span>
      </div>

      <Button
        type='button'
        variant='ghost'
        size='icon-touch'
        className=''
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
  /**
   * `row` puts the name and the minutes on one line, for the desktop form
   * where every block is on screen at once and typing beats the presets.
   */
  variant?: "card" | "row";
  /** Extra settings under a `row` block, e.g. a song's part and ear time. */
  children?: ReactNode;
  /** The colour a `row` block lights up in — its category's; songs stay emerald. */
  tone?: BlockTone;
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
  variant = "card",
  children,
  tone = "emerald",
}: TimeBlockProps) => {
  const { t } = useTranslation("report");

  if (variant === "row") {
    const isActive = minutes > 0;
    return (
      // Lights up once it holds time: a wash in its category's colour running
      // out across the row, so the filled blocks read at a glance.
      <div
        className={cn(
          "flex flex-col gap-5 rounded-lg p-5 ring-1 ring-inset transition-[background-color,box-shadow] duration-base xl:px-6",
          isActive
            ? cn("bg-gradient-to-r", TONE_CLASSES[tone].row)
            : "bg-zinc-950/30 ring-transparent",
        )}>
        <div className='flex flex-wrap items-center gap-x-8 gap-y-4'>
          <div className='flex min-w-[12rem] flex-1 items-center gap-4'>
            {leading}
            <div className='min-w-0 flex-1'>
              <p
                translate={isName ? "no" : undefined}
                className={cn(
                  "truncate text-base font-semibold transition-colors duration-base",
                  "text-zinc-100",
                )}>
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
          </div>
          <MinutesStepper
            label={title}
            minutes={minutes}
            max={max}
            tone={isActive ? tone : undefined}
            onChange={onChange}
          />
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
        {children}
      </div>
    );
  }

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
