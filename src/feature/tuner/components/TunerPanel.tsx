import { cn } from "assets/lib/utils";
import { useAudioAnalyzer } from "hooks/useAudioAnalyzer";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useMemo } from "react";

import { TUNER_IN_TUNE_CENTS, useStringTuner } from "../hooks/useStringTuner";
import type { TunerInstrument, TunerTuning } from "../instruments";
import { getTunerStrings, TUNER_INSTRUMENTS } from "../instruments";
import { playReferenceTone } from "../referenceTone";
import { ArcTuner } from "./ArcTuner";

/** Splits a reference name like "F#2" into the note letter and its octave. */
function splitNoteName(name: string): [string, string] {
  const match = /^([A-G]#?)(-?\d+)$/.exec(name);
  return match ? [match[1], match[2]] : [name, ""];
}

interface TunerPanelProps {
  instrument: TunerInstrument;
  tuning: TunerTuning;
  onInstrumentChange: (instrumentId: string) => void;
  onTuningChange: (tuningId: string) => void;
}

export const TunerPanel = ({
  instrument,
  tuning,
  onInstrumentChange,
  onTuningChange,
}: TunerPanelProps) => {
  const { isListening, error, init, close, audioRefs } = useAudioAnalyzer();
  const strings = useMemo(() => getTunerStrings(tuning), [tuning]);
  const { cents, hasNote, activeIndex, tuned } = useStringTuner(
    audioRefs.frequencyRef,
    audioRefs.volumeRef,
    strings,
    `${instrument.id}:${tuning.id}`,
  );

  const live = isListening && hasNote;
  const abs = Math.abs(cents);
  const isInTune = live && abs <= TUNER_IN_TUNE_CENTS;
  const isClose = live && abs < 25;
  const target = strings[activeIndex] ?? strings[0];
  const [targetNote, targetOctave] = splitNoteName(target.name);
  const allTuned = tuned.every(Boolean);

  const noteColor = !live
    ? "text-zinc-600"
    : isInTune
      ? "text-emerald-400"
      : isClose
        ? "text-amber-400"
        : "text-red-400";

  const status = !isListening
    ? "Turn the microphone on, then play one open string"
    : allTuned
      ? "Every string is in tune"
      : !hasNote
        ? "Listening… play one open string"
        : isInTune
          ? "In tune — hold it there"
          : cents > 0
            ? `${Math.round(abs)}¢ sharp — tune down`
            : `${Math.round(abs)}¢ flat — tune up`;

  return (
    <div className='rounded-2xl bg-zinc-900/40 p-6 sm:p-8'>
      <div className='flex flex-wrap gap-1.5'>
        {/* Instrument first: it decides which tunings even exist. */}
        <span className='w-full pb-1 text-[11px] font-bold tracking-wide text-zinc-500'>
          Instrument
        </span>
        {TUNER_INSTRUMENTS.map((option) => (
          <button
            key={option.id}
            type='button'
            onClick={() => onInstrumentChange(option.id)}
            aria-pressed={instrument.id === option.id}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-bold transition-background",
              instrument.id === option.id
                ? "bg-cyan-500/15 text-cyan-300"
                : "bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800",
            )}>
            {option.shortName}
          </button>
        ))}
      </div>

      <div className='mt-6 flex flex-wrap gap-1.5'>
        <span className='w-full pb-1 text-[11px] font-bold tracking-wide text-zinc-500'>
          Tuning
        </span>
        {instrument.tunings.map((option) => (
          <button
            key={option.id}
            type='button'
            onClick={() => onTuningChange(option.id)}
            aria-pressed={tuning.id === option.id}
            title={option.notation}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-bold transition-background",
              tuning.id === option.id
                ? "bg-cyan-500/15 text-cyan-300"
                : "bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800",
            )}>
            {option.name}
          </button>
        ))}
      </div>

      <div className='mt-8 flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-center sm:gap-12'>
        <div className='w-full max-w-sm'>
          <ArcTuner cents={live ? cents : 0} hasNote={live} />
          <div className='-mt-2 flex justify-between px-4 text-[10px] font-bold tracking-wide text-zinc-700'>
            <span>← Flat</span>
            <span>Sharp →</span>
          </div>
        </div>

        <div className='flex shrink-0 flex-col items-center gap-1'>
          <span
            className={cn(
              "font-mono text-7xl font-bold leading-none tracking-tight transition-colors duration-200",
              noteColor,
            )}>
            {targetNote}
          </span>
          <span className='font-mono text-base text-zinc-600'>{targetOctave}</span>
          <span
            className={cn(
              "font-mono mt-2 text-lg tabular-nums transition-colors duration-200",
              noteColor,
            )}>
            {live ? `${cents > 0 ? "+" : ""}${Math.round(cents)}¢` : "—"}
          </span>
          <span className='font-mono text-xs text-zinc-600'>
            {target.hz.toFixed(2)} Hz
          </span>
        </div>
      </div>

      <p
        aria-live='polite'
        className={cn(
          "mt-6 text-center text-sm font-medium transition-colors duration-200",
          allTuned && isListening ? "text-emerald-400" : "text-zinc-400",
        )}>
        {status}
      </p>

      {/* Every open string of the tuning: quiet until played, lifted while it is
          the one sounding, green once it has held in tune. Clicking one plays its
          reference pitch, so the tuner still works without a microphone. */}
      <div className='mt-6 flex flex-wrap justify-center gap-1.5'>
        {strings.map((str, index) => {
          const isDone = tuned[index];
          const isActive = live && index === activeIndex;
          return (
            <button
              key={`${str.string}-${str.name}`}
              type='button'
              onClick={() => playReferenceTone(str.hz)}
              title={`String ${str.string} — ${str.name} (${str.hz.toFixed(1)} Hz). Click to hear it.`}
              className={cn(
                "font-mono flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold tabular-nums transition-background",
                isDone
                  ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                  : isActive
                    ? "bg-white/15 text-white"
                    : "bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800",
              )}>
              <Volume2 className='h-3 w-3 opacity-50' />
              {str.name}
            </button>
          );
        })}
      </div>

      <div className='mt-8 flex flex-col items-center gap-3'>
        <button
          type='button'
          onClick={() => (isListening ? close() : void init())}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-6 py-3 text-sm font-bold transition-background",
            isListening
              ? "bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800"
              : "bg-cyan-500 text-zinc-950 hover:bg-cyan-400",
          )}>
          {isListening ? <MicOff className='h-4 w-4' /> : <Mic className='h-4 w-4' />}
          {isListening ? "Stop the microphone" : "Turn on the microphone"}
        </button>

        {error ? (
          <p className='max-w-sm text-center text-xs text-amber-400'>
            {error}. Allow microphone access in your browser, then try again — or
            tap a string above to tune by ear instead.
          </p>
        ) : (
          <p className='max-w-sm text-center text-xs text-zinc-600'>
            Audio stays in your browser: nothing is recorded, stored or uploaded.
          </p>
        )}
      </div>
    </div>
  );
};
