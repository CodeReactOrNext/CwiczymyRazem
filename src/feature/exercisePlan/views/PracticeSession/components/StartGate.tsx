import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Eye, Play } from "lucide-react";
import { memo, useCallback, useState } from "react";

/**
 * Whether the start gate still stands: until the session's clock has run once,
 * or the player chose to look around first. Once down it stays down for the
 * whole session — later exercises start from the bottom bar as before.
 */
export function useStartGate(isPlaying: boolean) {
  const [dismissed, setDismissed] = useState(false);
  // Started from anywhere (Space, the bar, a note in learn mode) — the gate is done.
  if (isPlaying && !dismissed) setDismissed(true);
  const dismiss = useCallback(() => setDismissed(true), []);
  return { open: !dismissed && !isPlaying, dismiss };
}

interface StartGateProps {
  onStart: () => void;
  onPreview: () => void;
  /** The exercise runs to a metronome, which counts the player in first. */
  countsIn: boolean;
  className?: string;
}

/**
 * Laid over the tab before the first start: players were looking at the
 * notes and never found Start on the bar below. Start runs the clock;
 * Preview only lifts the veil, so the tab can be read without the clock.
 */
export const StartGate = memo(function StartGate({
  onStart,
  onPreview,
  countsIn,
  className,
}: StartGateProps) {
  const { t } = useTranslation("session");

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-zinc-950/85 p-4 text-center",
        className,
      )}>
      <div className='flex flex-wrap items-center justify-center gap-3'>
        <Button size='lg' onClick={onStart} className='h-12 gap-2 px-8 text-base font-bold'>
          <Play className='!size-5' />
          {t("start_gate.start")}
        </Button>
        <Button size='lg' variant='ghost' onClick={onPreview} className='h-12 gap-2 px-6 text-base font-semibold'>
          <Eye className='!size-5' />
          {t("start_gate.preview")}
        </Button>
      </div>
      <p className='max-w-xs text-sm leading-relaxed text-zinc-400'>
        {countsIn ? t("start_gate.hint_count_in") : t("start_gate.hint")}
      </p>
    </div>
  );
});
