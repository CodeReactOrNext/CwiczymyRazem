import { Button, PRESSABLE_KEY } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { SKILL_CATEGORY_ICONS } from "components/Icon/skillCategoryIcons";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import type { CategoryKey } from "./helpers/timeSteps";

interface StepHeaderProps {
  /** 1-based index of the question on screen. */
  step: number;
  total: number;
  backLabel: string;
  /** Omit on the first question — there is nowhere to go back to. */
  onBack?: () => void;
}

/**
 * The top of every question: a way back and how far through the log you are.
 * The bar stops short of full on the last question — it fills on save.
 */
export const StepHeader = ({
  step,
  total,
  backLabel,
  onBack,
}: StepHeaderProps) => (
  <div className='flex h-11 items-center gap-4'>
    {onBack && (
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='h-11 w-11'
        aria-label={backLabel}
        onClick={onBack}>
        <ArrowLeft />
      </Button>
    )}
    <div
      role='progressbar'
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={step}
      className='h-3 flex-1 overflow-hidden rounded-full bg-zinc-800'>
      <div
        className='h-full rounded-full bg-emerald-500 transition-[width] duration-slow'
        style={{ width: `${((step - 0.5) / total) * 100}%` }}
      />
    </div>
  </div>
);

interface CategoryBadgeProps {
  category: CategoryKey;
  size?: "sm" | "md";
}

/**
 * A practice category's icon on a neutral plate. The icon alone tells the
 * categories apart — the four category colours were tried here and fought
 * with the rest of the form.
 */
export const CategoryBadge = ({
  category,
  size = "md",
}: CategoryBadgeProps) => {
  const Icon = SKILL_CATEGORY_ICONS[category];

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-zinc-950/40 text-zinc-200",
        size === "sm" ? "h-8 w-8 text-base" : "h-11 w-11 text-xl",
      )}>
      <Icon size='1em' />
    </span>
  );
};

interface ChoiceTileProps {
  /** Shown in a neutral plate; pass `leading` instead for a ready-made one. */
  icon?: ReactNode;
  leading?: ReactNode;
  title: string;
  hint?: string;
  /** Set for a tile that toggles; leave out for one that moves to the next question. */
  selected?: boolean;
  /** A lower-key face, for shortcuts sitting under the main answers. */
  quiet?: boolean;
  /** `lg` for the first question, where the two answers are the whole screen. */
  size?: "md" | "lg";
  onClick: () => void;
}

/** One answer to a question: a big key with an icon, a name and a line of help. */
export const ChoiceTile = ({
  icon,
  leading,
  title,
  hint,
  selected,
  quiet,
  size = "md",
  onClick,
}: ChoiceTileProps) => {
  const isToggle = selected !== undefined;
  const isLarge = size === "lg";

  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={isToggle ? selected : undefined}
      className={cn(
        PRESSABLE_KEY,
        "flex w-full items-center rounded-lg text-left transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isLarge ? "gap-5 p-5 sm:p-6" : "min-h-[4.75rem] gap-4 p-4",
        selected
          ? "bg-zinc-800 ring-2 ring-zinc-200"
          : quiet
            ? "bg-zinc-900/40 hover:bg-zinc-800/60"
            : isLarge
              ? "bg-zinc-800 hover:bg-zinc-700"
              : "bg-zinc-800/60 hover:bg-zinc-800",
      )}>
      {leading ?? (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg transition-colors duration-fast",
            // The big answers get a light plate: the one bright thing on a
            // dark tile, so the eye lands on the choice without any colour.
            isLarge
              ? "h-14 w-14 bg-zinc-100 text-2xl text-zinc-950"
              : "h-11 w-11 bg-zinc-950/40 text-xl",
            !isLarge && (selected ? "text-zinc-100" : "text-zinc-400"),
          )}>
          {icon}
        </span>
      )}
      <span className='min-w-0 flex-1'>
        <span
          className={cn(
            "block truncate font-semibold text-zinc-100",
            isLarge ? "text-xl" : "text-base",
          )}>
          {title}
        </span>
        {hint && (
          <span
            className={cn(
              "block font-normal text-zinc-400",
              isLarge ? "mt-1 text-base" : "mt-0.5 text-sm",
            )}>
            {hint}
          </span>
        )}
      </span>
      {isToggle ? (
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-fast",
            selected
              ? "bg-zinc-100 text-zinc-950"
              : "bg-zinc-950/40 text-transparent",
          )}>
          <Check className='h-3.5 w-3.5' strokeWidth={3} />
        </span>
      ) : (
        <ChevronRight
          className={cn(
            "shrink-0",
            isLarge ? "h-6 w-6 text-zinc-300" : "h-5 w-5 text-zinc-500",
          )}
        />
      )}
    </button>
  );
};

interface DetailRowProps {
  icon: ReactNode;
  label: string;
  /** What will be saved for this detail, or its default when untouched. */
  value: string;
  /** Whether the player changed it — a default reads quieter than a choice. */
  isSet: boolean;
  onClick: () => void;
}

/** One optional detail of the log; opens its own sheet. */
export const DetailRow = ({
  icon,
  label,
  value,
  isSet,
  onClick,
}: DetailRowProps) => (
  <button
    type='button'
    onClick={onClick}
    className='flex min-h-[3.25rem] w-full items-center gap-3 rounded-lg bg-zinc-900/40 px-4 py-3.5 text-left transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-zinc-800/50'>
    <span className='shrink-0 text-zinc-400 [&_svg]:h-4 [&_svg]:w-4'>
      {icon}
    </span>
    <span className='shrink-0 text-sm font-medium text-zinc-100'>{label}</span>
    <span
      className={cn(
        "ml-auto min-w-0 truncate text-sm",
        isSet ? "text-zinc-100" : "text-zinc-400",
      )}>
      {value}
    </span>
    <ChevronRight className='h-4 w-4 shrink-0 text-zinc-500' />
  </button>
);
