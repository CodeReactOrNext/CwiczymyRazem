export interface Track {
  name: string;
  idx: number;
}

import type { ReactNode } from "react";

import type { TablatureMeasure } from "../../../../types/exercise.types";

export interface AlphaTabScoreViewerProps {
  /** Real Guitar Pro file. When absent, `measures` is converted to alphaTex and rendered instead. */
  rawGpFile?: File;
  /** Session tablature — maps scoring hit/miss keys to fret numbers for colouring, and (when
   *  there's no rawGpFile) is the source rendered via the alphaTex converter. */
  measures?: TablatureMeasure[];
  /** Tempo baked into the generated alphaTex when there's no rawGpFile (ignored otherwise). */
  baseTempo?: number;
  /** "score" = standard notation, "tab" = guitar tablature */
  mode?: "score" | "tab";
  /** True only after count-in — mirrors session's isAudioPlaying */
  isPlaying: boolean;
  /** Remaining metronome count-in beats before playback starts (4 → 0). Drives the overlay. */
  countInRemaining: number;
  /** Changes on each new play session, triggering a seek-to-start */
  startTime: number | null;
  /** User BPM, converted to playbackSpeed relative to file's original tempo */
  bpm: number;
  /** 0 = muted, 1 = full. Mirrors session's audio mute toggle */
  volume?: number;
  /** Drives AlphaTab's own built-in metronome click — kept as the single metronome
   *  source while notation is shown (the session's separate device-metronome click is
   *  muted for this view), so the click can never drift from the notation playback. */
  isMetronomeMuted?: boolean;
  /** Per-track mute/volume for the underlying synth (independent of which track is rendered
   *  visually). Both this and `backingTrackIds` MUST be memoized by the caller. */
  trackConfigs?: Record<string, { isMuted: boolean; volume: number }>;
  backingTrackIds?: string[];
  className?: string;
  /** Session scoring hit map — drives the green/red pulse on the notation cursor. */
  hitNotes?: Record<string, boolean | number>;
  /** Session scoring miss map — drives the green/red pulse on the notation cursor. */
  missedNotes?: Record<string, boolean>;
  /** Height of the scrollable score viewport in px. Falls back to a 300–500 range when unset. */
  heightPx?: number;
  /** Optional resize handle rendered over the bottom edge of the score viewport. */
  resizeHandle?: ReactNode;
}
