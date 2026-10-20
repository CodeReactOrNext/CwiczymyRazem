import type { Chord, ChordScaleId, PitchClass } from "./theory";
import { chordTonesOf, QUALITY_INTERVALS } from "./theory";

/** Root, third, fifth, seventh — all at home in the chord; the seventh a little less. */
const TONE_SCORE = [1, 1, 0.95, 0.8];
const AVOID = -1;
const COLOUR = 0.15;
const OUTSIDE = -0.25;

/**
 * One note against one chord. Chord tones are what the ear expects; a note a
 * semitone above a chord tone (F over E minor, C over G major) is the classic
 * "avoid note" and rubs audibly; other notes of the key are colour.
 */
export function noteFit(
  pc: PitchClass,
  chord: Chord,
  keyPcs: ReadonlySet<number>,
  chordScale: ChordScaleId,
): number {
  const relative = (pc - chord.root + 12) % 12;
  const index = QUALITY_INTERVALS[chord.quality].indexOf(relative);
  if (index >= 0)
    return chord.quality === "5" && index === 1
      ? TONE_SCORE[2]
      : TONE_SCORE[index];
  if (chordTonesOf(chord).some((tone) => (tone + 1) % 12 === pc)) {
    // The blues lives on the minor third and flat fifth over dominant chords.
    if (chordScale === "blues" && (relative === 3 || relative === 6))
      return 0.1;
    return AVOID;
  }
  return keyPcs.has(pc) ? COLOUR : OUTSIDE;
}

export interface WeightedNote {
  pc: PitchClass;
  pitch: number;
  start: number;
  weight: number;
}

/**
 * How well a chord sits under a group of notes, about −1…1. A rub on a long
 * note on the beat is what a listener hears; the same note as a quick passing
 * sixteenth barely registers, so an avoid note costs in proportion to how
 * exposed it is.
 */
export function notesFit(
  notes: readonly WeightedNote[],
  chord: Chord,
  keyPcs: ReadonlySet<number>,
  chordScale: ChordScaleId,
): number {
  if (notes.length === 0) return 0;
  let sum = 0;
  let weight = 0;
  for (const note of notes) {
    let fit = noteFit(note.pc, chord, keyPcs, chordScale);
    if (fit === AVOID) fit = -0.5 - 0.7 * Math.min(1, note.weight);
    sum += note.weight * fit;
    weight += note.weight;
  }
  let score = sum / weight;
  // When the tab plays chords itself, the lowest note of a struck chord is its
  // bass — a strong hint which chord it is. A single melody line has no such cue.
  const onsets = new Set<number>();
  let struck = false;
  for (const note of notes) {
    const at = Math.round(note.start * 1e4);
    if (onsets.has(at)) {
      struck = true;
      break;
    }
    onsets.add(at);
  }
  if (struck) {
    const lowest = notes.reduce((low, note) =>
      note.pitch < low.pitch ? note : low,
    );
    if (lowest.pc === chord.root) score += 0.1;
  }
  return score;
}
