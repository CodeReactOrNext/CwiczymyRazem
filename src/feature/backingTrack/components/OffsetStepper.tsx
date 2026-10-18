import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

/** One press, in ms. Shift multiplies it. */
export const NUDGE_MS = 20;
export const NUDGE_COARSE_FACTOR = 5;

const stepButton =
  "flex h-8 items-center justify-center gap-1.5 rounded-lg bg-zinc-800/60 px-2 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const keyCap = "rounded bg-zinc-950/70 px-1.5 text-xs font-semibold leading-5 text-zinc-300";

interface OffsetStepperProps {
  valueMs: number;
  onChange: (nextMs: number) => void;
  /** Names the thing being moved, for the buttons a screen reader reads out. */
  label: string;
  /** Prints the keys that do the same on the buttons themselves. */
  showKeys?: boolean;
  className?: string;
}

/**
 * Earlier / later by a hair, or typed outright.
 *
 * Dragging is how a start is found by eye; this is how it is finished by ear —
 * and how a video that starts four seconds into its intro is moved without
 * two hundred clicks.
 */
export function OffsetStepper({ valueMs, onChange, label, showKeys, className }: OffsetStepperProps) {
  const { t } = useTranslation("backing_track");
  const [draft, setDraft] = useState<string | null>(null);

  const step = (direction: -1 | 1, coarse: boolean) =>
    onChange(valueMs + direction * NUDGE_MS * (coarse ? NUDGE_COARSE_FACTOR : 1));

  const commit = () => {
    const parsed = Number.parseFloat((draft ?? "").replace(",", "."));
    if (Number.isFinite(parsed)) onChange(parsed);
    setDraft(null);
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <button
        type='button'
        onClick={(event) => step(-1, event.shiftKey)}
        aria-label={t("offset.earlier", { what: label })}
        title={t("offset.hint", { ms: NUDGE_MS, coarse: NUDGE_MS * NUDGE_COARSE_FACTOR })}
        className={stepButton}>
        <ChevronLeft className='h-4 w-4' />
        {showKeys && <kbd className={keyCap}>[</kbd>}
      </button>
      <label className='flex h-8 items-center gap-1 rounded-lg bg-zinc-950/60 px-2'>
        <input
          type='text'
          inputMode='decimal'
          aria-label={label}
          value={draft ?? `${valueMs > 0 ? "+" : ""}${Math.round(valueMs)}`}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
            if (event.key === "Escape") setDraft(null);
          }}
          className='w-16 bg-transparent text-right text-sm font-semibold tabular-nums text-zinc-100 outline-none'
        />
        <span className='text-xs text-zinc-500'>ms</span>
      </label>
      <button
        type='button'
        onClick={(event) => step(1, event.shiftKey)}
        aria-label={t("offset.later", { what: label })}
        title={t("offset.hint", { ms: NUDGE_MS, coarse: NUDGE_MS * NUDGE_COARSE_FACTOR })}
        className={stepButton}>
        {showKeys && <kbd className={keyCap}>]</kbd>}
        <ChevronRight className='h-4 w-4' />
      </button>
    </div>
  );
}
