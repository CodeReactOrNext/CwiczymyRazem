export interface Track {
  name: string;
  idx: number;
}

export interface AlphaTabScoreViewerProps {
  rawGpFile: File;
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
}
