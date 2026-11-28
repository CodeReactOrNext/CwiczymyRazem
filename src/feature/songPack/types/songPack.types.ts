/**
 * The tab of an imported song package, as the desktop app stores it
 * (electron/songPack). Times are seconds into the package's own recording —
 * a package has no note values, only when each note is played.
 */

export interface SongPackBeat {
  time: number;
  /** First beat of a bar. */
  bar: boolean;
}

export interface SongPackBend {
  time: number;
  /** Semitones above the fretted pitch. */
  step: number;
}

export interface SongPackNote {
  time: number;
  /** 0 is the lowest string — the other way round from a tab's string 1. */
  string: number;
  fret: number;
  /** Seconds the note is held, 0 when it is simply picked. */
  sustain: number;
  /** Name of the chord this string is part of. */
  chord?: string;
  hammerOn?: boolean;
  pullOff?: boolean;
  palmMute?: boolean;
  mute?: boolean;
  harmonic?: boolean;
  pinchHarmonic?: boolean;
  accent?: boolean;
  tap?: boolean;
  vibrato?: boolean;
  /** Fret a slide lands on. */
  slideTo?: number;
  /** Fret a slide heads for without landing on a note. */
  slideUnpitchTo?: number;
  bends?: SongPackBend[];
}

export interface SongPackSection {
  name: string;
  time: number;
}

export interface SongPackPart {
  name: string;
  kind: "guitar" | "bass";
  stringCount: number;
  /** Semitones each string is off standard tuning, lowest string first. */
  tuning: number[];
  capo: number;
  beats: SongPackBeat[];
  sections: SongPackSection[];
  notes: SongPackNote[];
}

export interface SongPackTab {
  format: number;
  title: string;
  artist: string;
  lengthSec: number;
  parts: SongPackPart[];
  /** The recording that came in the same package, in the backing-track library. */
  audioTrackId: string | null;
}
