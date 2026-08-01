"use client";

import { cn } from "assets/lib/utils";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { AlphaTabScoreViewer } from "feature/exercisePlan/views/PracticeSession/components/AlphaTabScoreViewer/AlphaTabScoreViewer";
import { Minus, Pause, Play, Plus, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

interface GuideRiffPlayerProps {
  measures: TablatureMeasure[];
  bpm: number;
  bpmMin?: number;
  bpmMax?: number;
  className?: string;
}

const BPM_STEP = 2;
const DEFAULT_BPM_MIN = 40;
const DEFAULT_BPM_MAX = 300;

/**
 * Standalone, playable AlphaTab embed for a public guide page — reuses the
 * same interactive viewer PracticeSession uses (real audio via AlphaTab's own
 * synth), but with none of the session's mic/scoring/auth machinery: no
 * login, no microphone permission, works immediately. `notationDarkModeOverride`
 * keeps this from reading (or silently mutating) the visitor's persisted
 * PracticeSession appearance settings.
 *
 * BPM and the metronome click are local-only state — AlphaTab's own built-in
 * metronome (not the session's separate device-metronome engine), so no extra
 * audio infrastructure is pulled in just for a preview.
 */
export const GuideRiffPlayer = ({
  measures,
  bpm: initialBpm,
  bpmMin = DEFAULT_BPM_MIN,
  bpmMax = DEFAULT_BPM_MAX,
  className,
}: GuideRiffPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [bpm, setBpm] = useState(initialBpm);
  const [isMetronomeMuted, setIsMetronomeMuted] = useState(false);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setStartTime(Date.now());
      setIsPlaying(true);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className='flex flex-wrap items-center gap-3'>
        <button
          type='button'
          onClick={togglePlay}
          className='flex h-9 items-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-bold text-black transition-colors hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300'>
          {isPlaying ? (
            <Pause className='h-4 w-4' aria-hidden='true' />
          ) : (
            <Play className='h-4 w-4' aria-hidden='true' />
          )}
          {isPlaying ? "Pause" : "Play"}
        </button>

        <div className='flex items-center gap-1 rounded-lg bg-zinc-900 p-1'>
          <button
            type='button'
            onClick={() => setBpm((value) => Math.max(bpmMin, value - BPM_STEP))}
            disabled={bpm <= bpmMin}
            aria-label='Decrease BPM'
            className='flex h-7 w-7 items-center justify-center rounded text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent'>
            <Minus className='h-3.5 w-3.5' />
          </button>
          <span className='w-16 select-none text-center text-sm font-bold tabular-nums text-zinc-100'>
            {bpm} BPM
          </span>
          <button
            type='button'
            onClick={() => setBpm((value) => Math.min(bpmMax, value + BPM_STEP))}
            disabled={bpm >= bpmMax}
            aria-label='Increase BPM'
            className='flex h-7 w-7 items-center justify-center rounded text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent'>
            <Plus className='h-3.5 w-3.5' />
          </button>
        </div>

        <button
          type='button'
          onClick={() => setIsMetronomeMuted((value) => !value)}
          aria-pressed={!isMetronomeMuted}
          title={isMetronomeMuted ? "Metronome off — click to enable" : "Metronome on — click to mute"}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors",
            isMetronomeMuted
              ? "bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              : "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
          )}>
          {isMetronomeMuted ? (
            <VolumeX className='h-4 w-4' aria-hidden='true' />
          ) : (
            <Volume2 className='h-4 w-4' aria-hidden='true' />
          )}
          Metronome
        </button>
      </div>

      {/* Full-bleed: breaks out of GuideSection's max-w-5xl reading column to
      span wider than the article text, regardless of how deeply this is
      nested. Capped at max-w-6xl so it doesn't stretch edge-to-edge on
      ultrawide monitors. Requires no overflow-x-hidden on any ancestor (main
      already has none — see SongGuidePage). */}
      <div className='relative left-1/2 right-1/2 -mx-[50vw] w-screen px-4 sm:px-8'>
        <div className='mx-auto max-w-6xl'>
          <AlphaTabScoreViewer
            measures={measures}
            baseTempo={initialBpm}
            mode='score'
            isPlaying={isPlaying}
            countInRemaining={0}
            startTime={startTime}
            bpm={bpm}
            isMetronomeMuted={isMetronomeMuted}
            notationDarkModeOverride
            notationSpacingOverride={1.8}
            justifyLastSystem
            className='bg-zinc-950/70'
          />
        </div>
      </div>
    </div>
  );
};
