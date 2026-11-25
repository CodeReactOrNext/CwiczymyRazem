import { Button, PRESSABLE_KEY } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { BackingLeakNotice, useBackingLeakNotice } from "feature/autoBacking/components/BackingLeakNotice";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { isWholeNeckHunt } from "feature/exercisePlan/utils/huntModes";
import { useTranslation } from "hooks/useTranslation";
import { Check, Eye, Mic, Play, Timer } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { GiMetronome } from "react-icons/gi";

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

/** The mic question, asked on the gate. */
export interface StartGateMic {
  enabled: boolean;
  isListening: boolean;
  volumeRef: RefObject<number>;
  onEnable: () => void;
  onSkip: () => void;
}

interface StartGateProps {
  onStart: () => void;
  /** Lifts the veil without the clock. Left out where the board IS the answer
   *  sheet (the click drills): there's nothing to read first, only to score. */
  onPreview?: () => void;
  /** The exercise runs to a metronome, which counts the player in first. */
  countsIn: boolean;
  /** The mic is on for this exercise — what the backing-into-the-mic note depends on. */
  micOn?: boolean;
  /** Left out where the mic is no choice (exams) or no use. */
  mic?: StartGateMic;
  /** What the round asks for, where the gate covers it (the hunts). Takes the
   *  hint's place: it already says when the clock runs. */
  intro?: { title: string; detail: string };
  className?: string;
}

const LEVEL_BARS = [0.55, 0.85, 1, 0.75, 0.5];

/** What the gate says where it covers the question itself: a whole-neck hunt's
 *  notes and its two clocks, a listening quiz's task. */
export function useGateIntro(
  exercise: Pick<Exercise, "customGoal" | "customGoalRegion" | "noteHuntConfig" | "earQuizConfig" | "timeInMinutes">,
) {
  const { t } = useTranslation("session");
  if (exercise.earQuizConfig) {
    return {
      title: t(`quiz.gate.${exercise.earQuizConfig.mode}`),
      detail: t("quiz.gate_detail", { minutes: exercise.timeInMinutes }),
    };
  }
  if (!isWholeNeckHunt(exercise)) return undefined;
  return {
    title: t("note_hunt.gate_title"),
    detail: t("note_hunt.gate_detail", { minutes: exercise.timeInMinutes, seconds: exercise.noteHuntConfig?.rotateSeconds }),
  };
}

/** The mic's level as it hears the guitar, so a dead input shows before the run. */
const MicLevel = ({ volumeRef }: { volumeRef: RefObject<number> }) => {
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    let level = 0;
    const tick = () => {
      const raw = Math.min(1, (volumeRef.current ?? 0) * 6); // boost quiet guitar levels
      level += (raw - level) * 0.2;
      barsRef.current.forEach((bar, i) => {
        if (bar) bar.style.transform = `scaleY(${0.2 + 0.8 * level * LEVEL_BARS[i]})`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [volumeRef]);

  return (
    <span aria-hidden className='flex h-6 shrink-0 items-center gap-1'>
      {LEVEL_BARS.map((_, i) => (
        <span
          key={i}
          ref={(el) => { barsRef.current[i] = el; }}
          className='h-full w-1 rounded-full bg-emerald-400'
          style={{ transform: "scaleY(0.2)" }}
        />
      ))}
    </span>
  );
};

interface MicTileProps {
  icon: ReactNode;
  title: string;
  detail: string;
  selected: boolean;
  onClick: () => void;
  trailing?: ReactNode;
}

/**
 * One answer to the mic question. The picked one is green with a ticked dot,
 * as every picked control in the session is: a shade lighter than the other
 * tile was too close to tell which one was on.
 */
const MicTile = ({ icon, title, detail, selected, onClick, trailing }: MicTileProps) => (
  <button
    type='button'
    role='radio'
    aria-checked={selected}
    onClick={onClick}
    className={cn(
      PRESSABLE_KEY,
      "flex min-w-0 items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:gap-3.5 sm:px-[18px] sm:py-4 shortwide:py-2.5",
      selected ? "bg-emerald-500/15 hover:bg-emerald-500/20" : "bg-zinc-800 hover:bg-zinc-700/70",
    )}>
    <span aria-hidden className={cn("shrink-0 [&>svg]:h-5 [&>svg]:w-5", selected ? "text-emerald-400" : "text-zinc-400")}>{icon}</span>
    <span className='min-w-0 flex-1'>
      <span className={cn("block truncate text-sm font-bold", selected ? "text-emerald-300" : "text-zinc-200")}>{title}</span>
      <span className={cn("block text-xs font-normal leading-snug", selected ? "text-emerald-200/70" : "text-zinc-400")}>
        {detail}
      </span>
    </span>
    {trailing}
    <span
      aria-hidden
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
        selected ? "bg-emerald-500 text-emerald-950" : "ring-2 ring-inset ring-zinc-600",
      )}>
      {selected && <Check className='h-3 w-3' strokeWidth={3.5} />}
    </span>
  </button>
);

/**
 * Laid over the tab before the first start: players were looking at the
 * notes and never found Start on the bar below. Start runs the clock;
 * Preview only lifts the veil, so the tab can be read without the clock. The
 * mic is picked here too, rather than in a window over the gate.
 */
export const StartGate = memo(function StartGate({
  onStart,
  onPreview,
  countsIn,
  micOn = false,
  mic,
  intro,
  className,
}: StartGateProps) {
  const { t } = useTranslation("session");
  const showLeakNotice = useBackingLeakNotice(micOn);

  return (
    <div
      className={cn(
        // Near solid: the notes' colours showed through the hint's small print.
        "absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 overflow-y-auto bg-zinc-950/95 p-4 text-center shortwide:gap-3",
        // The first note must not show through before the clock runs.
        intro && "bg-zinc-950",
        className,
      )}>
      {intro && (
        <div className='space-y-1'>
          <p className='font-display text-2xl font-extrabold tracking-tight text-zinc-50 shortwide:text-xl'>{intro.title}</p>
          <p className='text-sm text-zinc-400'>{intro.detail}</p>
        </div>
      )}
      {mic && (
        <div
          role='radiogroup'
          aria-label={t("start_gate.mic_label")}
          className='grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2 shortwide:grid-cols-2'>
          <MicTile
            icon={<Mic />}
            title={t("start_gate.mic_on")}
            detail={t("start_gate.mic_on_detail")}
            selected={mic.enabled}
            onClick={mic.onEnable}
            trailing={mic.enabled && mic.isListening ? <MicLevel volumeRef={mic.volumeRef} /> : undefined}
          />
          <MicTile
            icon={<Timer />}
            title={t("start_gate.mic_off")}
            detail={t("start_gate.mic_off_detail")}
            selected={!mic.enabled}
            onClick={mic.onSkip}
          />
        </div>
      )}
      {/* One Start, as wide as the mic answers over it; looking first is the
          quiet way out under it, beside the one line on when the clock runs. */}
      {/* Called bare: onStart can be the timer's startTimer(delayMs), and the
          click event landing in delayMs started the clock at NaN. */}
      <Button size='xl' onClick={() => onStart()} className={cn("font-extrabold", mic && "w-full max-w-xl")}>
        <Play className='fill-current' />
        {t("start_gate.start")}
      </Button>
      {onPreview ? (
        <div className='flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-zinc-400'>
          {!intro && (
            <span className='flex items-center gap-1.5'>
              {countsIn ? <GiMetronome aria-hidden className='h-4 w-4 text-zinc-500' /> : <Timer aria-hidden className='h-4 w-4 text-zinc-500' />}
              {countsIn ? t("start_gate.count_in_short") : t("start_gate.clock_short")}
            </span>
          )}
          <Button size='sm' variant='ghost' onClick={onPreview}>
            <Eye />
            {t("start_gate.preview_first")}
          </Button>
        </div>
      ) : (
        !intro && <p className='max-w-xs text-sm leading-relaxed text-zinc-400'>{t("start_gate.hint_no_preview")}</p>
      )}
      {/* Said here, before the clock runs, rather than over the tab mid-play. */}
      {showLeakNotice && <BackingLeakNotice />}
    </div>
  );
});
