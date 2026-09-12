import { cn } from "assets/lib/utils";
import { RippleButton } from "hooks/useRipple";
import { Lock, X } from "lucide-react";
import type { GuitarTuningPreset } from "utils/audio/tunings";

import { TUNER_IN_TUNE_CENTS, useLiveTuner } from "../hooks/useLiveTuner";
import { ArcTuner } from "./ArcTuner";

/** Splits a reference name like "F#2" into the note letter and its octave. */
function splitNoteName(name: string): [string, string] {
  const match = /^([A-G]#?)(-?\d+)$/.exec(name);
  return match ? [match[1], match[2]] : [name, ""];
}

interface TunerDialogProps {
  frequencyRef: React.RefObject<number>;
  volumeRef: React.RefObject<number>;
  /** Whether pitch is actually being captured right now. */
  isMicEnabled: boolean;
  /** What to tell the player while nothing is being captured — defaults to
   *  the practice session's "turn on Pitch Detect" nudge. */
  micHint?: string;
  /** The tuning actually driving detection right now — the tuner has to target
   *  the same open strings the exercise is graded against. */
  tuning: GuitarTuningPreset;
  isTuningLocked?: boolean;
  onClose: () => void;
}

/**
 * The tuner as a modal over whatever is on screen: the open strings of the
 * active tuning, the needle, the target note and how far off it is. Shared by
 * the practice session's toolbar and the desktop title bar's tuner button —
 * it only reads pitch/volume refs, so whoever owns the audio input hands them
 * in and stays in charge of starting and stopping it.
 */
export function TunerDialog({
  frequencyRef,
  volumeRef,
  isMicEnabled,
  micHint = "Enable Pitch Detect to use the tuner",
  tuning,
  isTuningLocked = false,
  onClose,
}: TunerDialogProps) {
  const { cents, hasNote, activeIndex, strings, tuned } = useLiveTuner(
    frequencyRef,
    volumeRef,
    tuning,
  );
  const abs = Math.abs(cents);
  const isInTune = hasNote && abs <= TUNER_IN_TUNE_CENTS;
  const isClose = hasNote && abs < 25;
  const noteColor = !hasNote
    ? "text-zinc-600"
    : isInTune
      ? "text-emerald-400"
      : isClose
        ? "text-amber-400"
        : "text-red-400";

  const target = strings[activeIndex];
  const [targetNote, targetOctave] = splitNoteName(target.name);
  const allTuned = tuned.every(Boolean);

  const statusText = !hasNote
    ? "Play an open string"
    : isInTune
      ? "In tune — hold it"
      : cents > 0
        ? `${Math.round(abs)}¢ sharp — tune down`
        : `${Math.round(abs)}¢ flat — tune up`;

  return (
    <div
      className='fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 backdrop-blur-sm'
      onClick={onClose}>
      <div
        className='relative w-80 rounded-lg bg-zinc-900 p-6 shadow-2xl'
        onClick={(e) => e.stopPropagation()}>
        <RippleButton
          onClick={onClose}
          className='absolute right-4 top-4 text-zinc-500 transition-colors hover:text-white'>
          <X size={16} />
        </RippleButton>

        <p className='text-center text-[10px] font-semibold tracking-wide text-zinc-500'>
          Tuner
        </p>
        <p className='mt-1 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-zinc-300'>
          {isTuningLocked && (
            <Lock className='h-3 w-3 shrink-0 text-zinc-500' />
          )}
          {tuning.name}
        </p>

        {!isMicEnabled && (
          <p className='mt-4 text-center text-xs text-zinc-500'>{micHint}</p>
        )}

        {/* Every open string of the active tuning — the ones still to tune stay
            quiet, the string being played lifts, tuned ones go green. */}
        <div className='mt-5 flex justify-center gap-1.5'>
          {strings.map((str, index) => {
            const isDone = tuned[index];
            const isActive = hasNote && index === activeIndex;
            return (
              <span
                key={str.string}
                title={`String ${str.string} — ${str.name} (${str.hz.toFixed(1)} Hz)`}
                className={cn(
                  "font-mono rounded-md px-2 py-1.5 text-[11px] font-bold tabular-nums transition-colors duration-200",
                  isDone
                    ? "bg-emerald-500/15 text-emerald-400"
                    : isActive
                      ? "bg-white/15 text-white"
                      : "bg-zinc-800/60 text-zinc-500",
                )}>
                {str.name}
              </span>
            );
          })}
        </div>

        <div className='mt-5'>
          <ArcTuner cents={cents} hasNote={hasNote} />
        </div>

        <div className='mt-2 flex flex-col items-center gap-0.5'>
          <span
            className={cn(
              "font-mono text-5xl font-bold tracking-tight transition-colors duration-200",
              noteColor,
            )}>
            {targetNote}
          </span>
          <span className='font-mono text-sm text-zinc-600'>
            {targetOctave}
          </span>
          <span
            className={cn(
              "font-mono mt-1 text-sm transition-colors duration-200",
              noteColor,
            )}>
            {hasNote
              ? cents > 0
                ? `+${Math.round(cents)}¢`
                : `${Math.round(cents)}¢`
              : "—"}
          </span>
        </div>

        <p
          className={cn(
            "mt-4 text-center text-xs font-medium transition-colors duration-200",
            allTuned ? "text-emerald-400" : "text-zinc-500",
          )}>
          {allTuned ? "All strings in tune" : statusText}
        </p>
      </div>
    </div>
  );
}
