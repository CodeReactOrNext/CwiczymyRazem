export interface Track {
  name: string;
  idx: number;
}

import type { TablatureMeasure } from "../../../../types/exercise.types";

export interface AlphaTabScoreViewerProps {
  rawGpFile: File;
  /** Parsed session tablature — maps scoring hit/miss keys to fret numbers for colouring. */
  measures?: TablatureMeasure[];
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
  className?: string;
  /** Session scoring hit map — drives the green/red pulse on the notation cursor. */
  hitNotes?: Record<string, boolean | number>;
  /** Session scoring miss map — drives the green/red pulse on the notation cursor. */
  missedNotes?: Record<string, boolean>;
}
