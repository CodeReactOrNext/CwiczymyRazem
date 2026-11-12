import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

/**
 * A Guitar Pro tab with every note's real pitch moved by `semitones`, frets
 * untouched — for a player whose whole instrument is tuned higher or lower than
 * the file is written in (the file in Standard, the guitar in Eb). The pitch is
 * what the matcher listens for, so the same frets then score against the sound
 * that instrument actually makes.
 *
 * Notes without a real pitch are left alone: they are worked out from string and
 * fret under the session's tuning, which already carries the shift. With nothing
 * to move the same array comes back, identity included.
 */
export function shiftTabPitch<T extends TablatureMeasure[] | undefined>(measures: T, semitones: number): T {
  if (!measures || semitones === 0) return measures;
  return measures.map((measure) => ({
    ...measure,
    beats: measure.beats.map((beat) => ({
      ...beat,
      notes: beat.notes.map((note) =>
        typeof note.midiNote === "number" ? { ...note, midiNote: note.midiNote + semitones } : note),
    })),
  })) as T;
}
