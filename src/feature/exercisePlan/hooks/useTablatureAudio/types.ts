import type { BendPoint, TablatureMeasure } from "../../types/exercise.types";

export interface AudioTrackConfig {
  id:         string;
  name?:      string;
  measures:   TablatureMeasure[];
  volume:     number;
  isMuted:    boolean;
  trackType?: "guitar" | "bass" | "drums" | "vocals";
  pan?:       number; // -1.0 (left) to 1.0 (right)
}

export interface UseTablatureAudioProps {
  tracks?:        AudioTrackConfig[];
  measures?:      TablatureMeasure[]; // legacy single-track
  isMuted?:       boolean;            // legacy single-track
  bpm:            number;
  isPlaying:      boolean;
  startTime:      number | null;
  onLoopComplete?: () => void;
  audioContext?:   AudioContext | null;
  audioStartTime?: number | null;
  /** Skip soundfont loading — use when AlphaTab handles audio */
  disabled?:      boolean;
  /** Times to play the loop (0 = infinite) */
  repeatCount?:   number;
  /** Per-string semitone offset from standard tuning (index 0 = string 1 … index 5 = string 6),
   *  applied to guitar-track notes so the background instrument matches the player's own tuning. */
  tuningOffsets?: readonly number[];
}

export interface StringSynthOptions {
  isPalmMute?:    boolean;
  isVibrato?:     boolean;
  isBend?:        boolean;
  bendCurve?:     BendPoint[];
  bendSemitones?: number;
  gainScale?:     number;
}
