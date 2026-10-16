import { getFrequencyFromTab, midiToFrequency } from "utils/audio/noteUtils";

import type { TablatureMeasure, TablatureNote } from "../../../types/exercise.types";
import { hasOwnAttack } from "./pitchScoring";

/**
 * Learn mode walks the tab one beat at a time instead of following a clock: the
 * exercise waits on a beat until the player has played it. A "step" is one beat
 * with something to play — rests are not steps, there is nothing to wait for.
 */
export interface LearnStep {
  /** Where the beat sits on the tab, in beats from its start. */
  beatStart: number;
  beatEnd: number;
  /** Keyed like the note matcher's hit marks (`measure-beat-note`), so the tab
   *  paints a learned note exactly like a scored one. */
  notes: { noteKey: string; note: TablatureNote }[];
}

export function buildLearnSteps(measures: TablatureMeasure[] | null | undefined): LearnStep[] {
  if (!measures) return [];
  const steps: LearnStep[] = [];
  let position = 0;
  measures.forEach((measure, measureIdx) => {
    measure.beats.forEach((beat, beatIdx) => {
      if (beat.notes.length > 0) {
        steps.push({
          beatStart: position,
          beatEnd: position + beat.duration,
          notes: beat.notes.map((note, noteIdx) => ({ note, noteKey: `${measureIdx}-${beatIdx}-${noteIdx}` })),
        });
      }
      position += beat.duration;
    });
  });
  return steps;
}

/** Hit marks for the steps already played: each note filled to its full length. */
export function learnHitNotes(steps: readonly LearnStep[], playedCount: number): Record<string, number> {
  const hits: Record<string, number> = {};
  for (let i = 0; i < playedCount && i < steps.length; i++) {
    for (const { noteKey } of steps[i].notes) hits[noteKey] = steps[i].beatEnd;
  }
  return hits;
}

/**
 * How many of a chord's notes have to ring before the beat counts. A strum on a
 * guitar rarely sounds every string — one muted or weak string in a big chord
 * shouldn't hold the lesson up — but small shapes have to be played whole.
 */
export const requiredChordTones = (toneCount: number): number =>
  toneCount <= 2 ? toneCount : Math.ceil(toneCount * 0.75);

/** What one note of a step has to sound like. */
export interface LearnTarget {
  noteKey: string;
  /** Expected pitch in Hz, tuning and bends included; 0 for a muted note. */
  freq: number;
  isDead: boolean;
  /** A picked note has an attack of its own; a hammer-on, pull-off or release
   *  only changes the pitch of a string that is already sounding. */
  hasAttack: boolean;
}

export function resolveLearnTargets(
  step: LearnStep,
  tuningOffsets: readonly number[] | undefined,
  getAdjustedTargetFreq: (string: number, baseFreq: number) => number,
): LearnTarget[] {
  return step.notes.map(({ note, noteKey }) => {
    if (note.isDead) return { noteKey, freq: 0, isDead: true, hasAttack: true };
    // A bend is learned at the pitch it reaches, not the one it starts from.
    const bend = (note.isBend || note.isPreBend) && note.bendSemitones ? note.bendSemitones : 0;
    const base = typeof note.midiNote === "number"
      ? midiToFrequency(note.midiNote + bend)
      : getFrequencyFromTab(note.string, note.fret + bend, tuningOffsets);
    return { noteKey, freq: getAdjustedTargetFreq(note.string, base), isDead: false, hasAttack: hasOwnAttack(note) };
  });
}
