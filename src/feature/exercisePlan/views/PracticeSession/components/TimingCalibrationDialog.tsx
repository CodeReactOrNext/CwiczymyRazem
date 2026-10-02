import { Button } from "assets/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { Mic, Timer } from "lucide-react";

import { useSessionUI } from "../contexts/SessionUIContext";
import { useTimingCalibration } from "../hooks/useTimingCalibration";
import type { CalibrationRunState } from "../hooks/useTimingCalibrationRun";
import { useTimingCalibrationRun } from "../hooks/useTimingCalibrationRun";
import type { CalibrationResult } from "../utils/timingCalibration";
import { CALIBRATION_BPM, CALIBRATION_CLICKS, CALIBRATION_COUNT_IN, CALIBRATION_MIN_HITS } from "../utils/timingCalibration";

interface TimingCalibrationDialogProps {
  audioRefs: AudioRefs;
  /** The session metronome's context, so the clicks take the session's output path. */
  audioContext: AudioContext | null;
  isListening: boolean;
  /** The formula-based latency used while uncalibrated, shown for comparison. */
  estimateLatencyMs: () => number;
  onEnableMic: () => void;
  /** Stops the session's own playback — its clicks would land on top of ours. */
  onBeforeStart: () => void;
}

const PRIMARY = "h-10 flex-1 rounded-lg bg-white text-sm font-semibold text-zinc-950 hover:bg-zinc-200";
const SECONDARY = "h-10 flex-1 rounded-lg bg-zinc-800 text-sm font-medium text-zinc-100 hover:bg-zinc-700";

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className='flex gap-3'>
    <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-800 text-[11px] font-semibold text-zinc-400'>
      {n}
    </span>
    <span className='leading-5'>{children}</span>
  </li>
);

const IdleStep = ({
  isListening, savedLatencyMs, estimateLatencyMs, onStart, onEnableMic, onUseEstimate,
}: {
  isListening: boolean;
  savedLatencyMs: number | null;
  estimateLatencyMs: () => number;
  onStart: () => void;
  onEnableMic: () => void;
  onUseEstimate: () => void;
}) => (
  <>
    <DialogDescription className='mt-4 text-sm leading-relaxed text-zinc-400'>
      Speakers, headphones and audio interfaces each add a delay between the click you hear and the note we
      pick up. Play along to a few clicks and we&apos;ll measure yours, so timing grades match what you hear.
    </DialogDescription>

    <ol className='mt-6 space-y-3 text-sm text-zinc-300'>
      <Step n={1}>Use the speakers or headphones you practice with.</Step>
      <Step n={2}>Pluck the open low E on every click and let it ring — don&apos;t mute between clicks. {CALIBRATION_BPM} BPM, {CALIBRATION_COUNT_IN} clicks to get ready, then {CALIBRATION_CLICKS} counted.</Step>
      <Step n={3}>Play with the click, not ahead of it.</Step>
    </ol>

    <div className='mt-6 rounded-lg bg-zinc-900/60 px-4 py-3 text-sm'>
      <span className='text-zinc-400'>Now using </span>
      {savedLatencyMs !== null ? (
        <>
          <span className='font-semibold tabular-nums text-zinc-100'>{savedLatencyMs} ms</span>
          <span className='text-zinc-400'> — measured in this browser</span>
        </>
      ) : (
        <>
          <span className='font-semibold tabular-nums text-zinc-100'>~{Math.round(estimateLatencyMs())} ms</span>
          <span className='text-zinc-400'> — an estimate, not measured yet</span>
        </>
      )}
    </div>

    <div className='mt-6 flex gap-2.5'>
      {isListening ? (
        <Button onClick={onStart} className={PRIMARY}>Start</Button>
      ) : (
        <Button onClick={onEnableMic} className={PRIMARY}>
          <Mic className='h-4 w-4' />
          Turn on the mic first
        </Button>
      )}
    </div>

    {savedLatencyMs !== null && (
      <button
        type='button'
        onClick={onUseEstimate}
        className='mt-4 rounded text-xs text-zinc-400 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500'>
        Forget the measurement and go back to the estimate
      </button>
    )}
  </>
);

const RunningStep = ({
  state, onCancel,
}: {
  state: Extract<CalibrationRunState, { phase: "running" }>;
  onCancel: () => void;
}) => {
  const heard = state.delays.filter((d) => typeof d === "number").length;
  const counting = state.countInLeft > 0;

  return (
    <>
      <div className='mt-8 flex flex-col items-center text-center'>
        <span className='font-teko text-6xl font-bold leading-none tabular-nums text-zinc-100'>
          {counting ? state.countInLeft : `${heard}/${CALIBRATION_CLICKS}`}
        </span>
        <p className='mt-3 text-sm text-zinc-400'>
          {counting ? "Get ready — listen to the pulse" : "Pluck on every click"}
        </p>
      </div>

      <div className='mt-8 flex justify-center gap-2' aria-hidden>
        {state.delays.map((delay, i) => (
          <span
            key={i}
            className={cn(
              "h-2.5 w-2.5 rounded-full transition-colors",
              delay === undefined && "bg-zinc-800",
              delay === null && "bg-zinc-600",
              typeof delay === "number" && "bg-emerald-500",
            )}
          />
        ))}
      </div>

      <div className='mt-8 flex'>
        <Button onClick={onCancel} className={SECONDARY}>Cancel</Button>
      </div>
    </>
  );
};

const ResultStep = ({
  result, savedLatencyMs, estimateLatencyMs, onSave, onRetry,
}: {
  result: CalibrationResult;
  savedLatencyMs: number | null;
  estimateLatencyMs: () => number;
  onSave: (latencyMs: number) => void;
  onRetry: () => void;
}) => {
  if (!result.ok) {
    return (
      <>
        <p className='mt-6 text-sm font-semibold text-zinc-100'>
          {result.reason === "tooFewHits"
            ? "Not enough clicks heard"
            : result.reason === "ahead"
              ? "The notes came in ahead of the click"
              : "The hits were too spread out"}
        </p>
        <p className='mt-2 text-sm leading-relaxed text-zinc-400'>
          {result.reason === "tooFewHits"
            ? `We picked up ${result.hits} of ${result.total} — it takes at least ${CALIBRATION_MIN_HITS}. Pluck a little harder, and check the mic is the one your guitar is on.`
            : result.reason === "ahead"
              ? "Sound can't reach us before it's played, so something else was heard. Let the string ring between clicks instead of muting it, and play with the click, not ahead of it."
              : `They wandered by about ±${result.spreadMs} ms, which says more about the run than about your setup. Try again, playing right on the click and letting the string ring.`}
        </p>
        <div className='mt-6 flex'>
          <Button onClick={onRetry} className={PRIMARY}>Try again</Button>
        </div>
      </>
    );
  }

  const previous = savedLatencyMs ?? Math.round(estimateLatencyMs());

  return (
    <>
      <div className='mt-8 flex flex-col items-center text-center'>
        <span className='text-[11px] font-semibold tracking-wide text-zinc-500'>Measured delay</span>
        <span className='mt-1 font-teko text-6xl font-bold leading-none tabular-nums text-zinc-100'>
          {result.latencyMs} ms
        </span>
        <p className='mt-3 text-sm text-zinc-400'>
          {result.hits} of {result.total} clicks heard, steady within ±{result.spreadMs} ms
        </p>
        <p className='mt-1 text-xs text-zinc-500'>
          {savedLatencyMs !== null ? "Saved before" : "Estimated before"}: {previous} ms
        </p>
      </div>

      <div className='mt-8 flex gap-2.5'>
        <Button onClick={onRetry} className={SECONDARY}>Try again</Button>
        <Button onClick={() => onSave(result.latencyMs)} className={PRIMARY}>Use {result.latencyMs} ms</Button>
      </div>
    </>
  );
};

/**
 * Measures how late the player's attacks reach us after a click, end to end,
 * so tab-note timing grades line up with what the player actually hears.
 */
export const TimingCalibrationDialog = ({
  audioRefs, audioContext, isListening, estimateLatencyMs, onEnableMic, onBeforeStart,
}: TimingCalibrationDialogProps) => {
  const { isTimingCalibrationOpen, closeTimingCalibration } = useSessionUI();
  const savedLatencyMs = useTimingCalibration((s) => s.latencyMs);
  const setLatency = useTimingCalibration((s) => s.setLatency);
  const { state, start, reset } = useTimingCalibrationRun({ audioRefs, audioContext });

  const close = () => {
    reset();
    closeTimingCalibration();
  };

  const handleStart = () => {
    onBeforeStart();
    void start();
  };

  const handleSave = (latencyMs: number) => {
    setLatency(latencyMs);
    close();
  };

  return (
    <Dialog open={isTimingCalibrationOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className='max-w-md border-0 bg-zinc-950 p-0 shadow-none sm:rounded-lg'>
        <div className='px-7 pb-7 pt-7'>
          <div className='flex items-center gap-2.5 pr-10'>
            <Timer className='h-4 w-4 text-zinc-400' />
            <DialogTitle className='text-base font-semibold text-zinc-100'>Calibrate timing</DialogTitle>
          </div>

          {state.phase === "idle" && (
            <IdleStep
              isListening={isListening}
              savedLatencyMs={savedLatencyMs}
              estimateLatencyMs={estimateLatencyMs}
              onStart={handleStart}
              onEnableMic={onEnableMic}
              onUseEstimate={() => setLatency(null)}
            />
          )}

          {state.phase === "running" && <RunningStep state={state} onCancel={reset} />}

          {state.phase === "done" && (
            <ResultStep
              result={state.result}
              savedLatencyMs={savedLatencyMs}
              estimateLatencyMs={estimateLatencyMs}
              onSave={handleSave}
              onRetry={handleStart}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
