import type { PitchClass } from "feature/autoBacking/theory";

/** Open strings from the high e down, as MIDI notes — the board reads like a tab. */
export const OPEN_MIDI = [64, 59, 55, 50, 45, 40] as const;
/** The neck the board shows: the open strings and twelve frets. */
export const NECK_FRETS = 12;
/** Frets a playing position spans — a hand's reach, one finger a fret plus a stretch. */
export const WINDOW_FRETS = 5;
/** The highest fret a position can start on and still fit the board. */
const LAST_START = NECK_FRETS - WINDOW_FRETS + 1;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export interface FretSpot {
  /** 0 = the high e, as the board draws it. */
  string: number;
  fret: number;
}

/** The pitch class at a spot. */
export const pcAt = (string: number, fret: number): PitchClass => (OPEN_MIDI[string] + fret) % 12;

/** Every place a pitch sits on the board. */
export const spotsOf = (midi: number): FretSpot[] =>
  OPEN_MIDI.flatMap((open, string) => {
    const fret = midi - open;
    return fret >= 0 && fret <= NECK_FRETS ? [{ string, fret }] : [];
  });

/** A spot is within the position starting at `start`. */
export const inWindow = (fret: number, start: number) => fret >= start && fret < start + WINDOW_FRETS;

/**
 * Where a key's progression is shown first: the tonic under the first finger
 * on the low E string, or on the A string when that keeps it off the nut and
 * the top of the board.
 */
export const homeWindow = (tonic: PitchClass) => {
  const onE = (tonic - 4 + 12) % 12;
  const onA = (tonic - 9 + 12) % 12;
  const root = onE >= 1 && onE <= 9 ? onE : onA >= 1 && onA <= 9 ? onA : onE;
  return clamp(root - 1, 0, LAST_START);
};

/**
 * The position after a note: kept while the note can be played in it,
 * otherwise moved to the nearest place it was played — the board goes where
 * the player is.
 */
export const followWindow = (start: number, midi: number) => {
  const spots = spotsOf(midi);
  if (!spots.length || spots.some((spot) => inWindow(spot.fret, start))) return start;
  const center = start + (WINDOW_FRETS - 1) / 2;
  const nearest = spots.reduce((a, b) => (Math.abs(b.fret - center) < Math.abs(a.fret - center) ? b : a));
  return clamp(nearest.fret - Math.floor((WINDOW_FRETS - 1) / 2), 0, LAST_START);
};

/** The position the board shows: home for the key, then wherever the notes played took it. */
export const windowFor = (tonic: PitchClass, played: readonly { midi: number }[]) =>
  played.reduce((start, note) => followWindow(start, note.midi), homeWindow(tonic));
