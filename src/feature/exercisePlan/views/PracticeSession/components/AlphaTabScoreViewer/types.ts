export interface Track {
  name: string;
  idx: number;
}

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
  /** Changes on each new play session, triggering a seek-to-start */
  startTime: number | null;
  /** User BPM, converted to playbackSpeed relative to file's original tempo */
  bpm: number;
  /** 0 = muted, 1 = full. Mirrors session's audio mute toggle */
  volume?: number;
  /** Playback-only pitch shift in semitones — audio only, never affects the rendered notation. */
  pitchSemitones?: number;
  /** Drives AlphaTab's own built-in metronome click — kept as the single metronome
   *  source while notation is shown (the session's separate device-metronome click is
   *  muted for this view), so the click can never drift from the notation playback. */
  isMetronomeMuted?: boolean;
  className?: string;
  /** Session scoring hit map — drives the green/red pulse on the notation cursor. */
  hitNotes?: Record<string, boolean | number>;
  /** Session scoring miss map — drives the green/red pulse on the notation cursor. */
  missedNotes?: Record<string, boolean>;
}
