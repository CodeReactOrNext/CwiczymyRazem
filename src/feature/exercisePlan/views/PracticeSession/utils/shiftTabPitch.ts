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

/**
 * A tab with every real pitch moved from the tuning it is written in to the one
 * the player is in, string by string — for a plain tab exercise that carries
 * real pitches anyway (a Guitar Pro file pasted into the tab editor keeps them).
 * The matcher prefers a note's real pitch over its string and fret, so without
 * this a Half Step Down player was listened for in Standard.
 *
 * Offsets are per string from standard tuning (see TuningOffsets). Notes without
 * a real pitch are left alone, and with nothing to move the same array comes back.
 */
export function retuneTabPitch<T extends TablatureMeasure[] | undefined>(
  measures: T,
  writtenOffsets: readonly number[],
  playedOffsets: readonly number[],
): T {
  const shiftOf = (string: number) => (playedOffsets[string - 1] ?? 0) - (writtenOffsets[string - 1] ?? 0);
  const maxStrings = Math.max(writtenOffsets.length, playedOffsets.length);
  const moves = Array.from({ length: maxStrings }, (_, i) => shiftOf(i + 1)).some((shift) => shift !== 0);
  if (!measures || !moves) return measures;
  return measures.map((measure) => ({
    ...measure,
    beats: measure.beats.map((beat) => ({
      ...beat,
      notes: beat.notes.map((note) =>
        typeof note.midiNote === "number" && shiftOf(note.string) !== 0
          ? { ...note, midiNote: note.midiNote + shiftOf(note.string) }
          : note),
    })),
  })) as T;
}
