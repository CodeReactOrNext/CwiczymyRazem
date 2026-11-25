import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { useTranslation } from "hooks/useTranslation";
import { ChevronLeft, X } from "lucide-react";
import type { ReactNode } from "react";

/** The thick bar with the highlight along its top, 0–1. */
export const BuilderProgressBar = ({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) => {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      role='progressbar'
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn(
        "relative h-4 flex-1 overflow-hidden rounded-full bg-zinc-800",
        className,
      )}>
      <div
        className='bar-shine h-full rounded-full bg-amber-400 transition-[width] duration-slow [--shine-inset:8px]'
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

/** The question a builder screen asks, and the line under it. */
export const BuilderHeading = ({
  title,
  hint,
}: {
  title: ReactNode;
  hint?: ReactNode;
}) => (
  <div className='space-y-2'>
    <h2 className='break-words font-display text-2xl font-black leading-tight text-zinc-100 [text-wrap:balance] sm:text-3xl'>
      {title}
    </h2>
    {hint && <p className='text-sm leading-relaxed text-zinc-400'>{hint}</p>}
  </div>
);

interface BuilderFrameProps {
  /** How far through the whole builder this screen is, 0–1. */
  progress: number;
  /** One screen back; left out on the first screen. */
  onBack?: () => void;
  onClose: () => void;
  tokensLeft?: number;
  children: ReactNode;
  /** The quiet line beside the buttons: what the next press costs or does. */
  note?: ReactNode;
  actions?: ReactNode;
}

/**
 * One screen of the roadmap builder: how far through across the top, the
 * question in the middle, and a single row of actions at the bottom — the
 * same frame for the goal, the level and every question the coach asks.
 */
export const BuilderFrame = ({
  progress,
  onBack,
  onClose,
  tokensLeft,
  children,
  note,
  actions,
}: BuilderFrameProps) => {
  const { t } = useTranslation("supporter");

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='mx-auto flex w-full max-w-3xl shrink-0 items-center gap-3 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pt-6'>
        {onBack && (
          <Button
            type='button'
            variant='subtle'
            size='icon'
            onClick={onBack}
            aria-label={t("panel.brief.back")}>
            <ChevronLeft />
          </Button>
        )}
        <BuilderProgressBar
          value={progress}
          label={t("panel.brief.progress")}
        />
        {tokensLeft !== undefined && (
          <span
            className='flex items-center gap-1.5 text-sm font-bold tabular-nums text-zinc-100'
            title={t("panel.generate.tokens_left", { count: tokensLeft })}>
            <SupportToken size={16} />
            {tokensLeft}
          </span>
        )}
        <Button
          type='button'
          variant='subtle'
          size='icon'
          onClick={onClose}
          aria-label={t("panel.generate.close_builder")}>
          <X />
        </Button>
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-4 sm:px-8 sm:pt-8'>
        <div className='mx-auto w-full max-w-2xl'>{children}</div>
      </div>

      {(note || actions) && (
        <div className='shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-8 sm:pb-6'>
          <div className='mx-auto flex w-full max-w-2xl flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-sm leading-relaxed text-zinc-500'>{note}</p>
            <div className='flex shrink-0 items-center justify-end gap-2'>
              {actions}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
