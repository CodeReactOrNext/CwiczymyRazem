import { GUITAR_STRING_MIDI } from "feature/exercisePlan/hooks/useTablatureAudio/audio.constants";
import type {
  TablatureMeasure,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

import { pcOf } from "./theory";

/** One sounding note of the tab, placed in time. Positions are score beats
 *  (1 = quarter) from the start of the tab. */
export interface NoteEvent {
  pitch: number;
  pc: number;
  start: number;
  duration: number;
  bar: number;
  posInBar: number;
  /** How much the note says about the harmony: long notes on strong beats
   *  speak louder than a sixteenth passing between them. */
  weight: number;
}

export interface BarInfo {
  index: number;
  start: number;
  /** Real length in beats — the sum of the bar's own beats, which is what the
   *  scheduler plays, even where it disagrees with the time signature. */
  length: number;
  timeSignature: [number, number];
  /** Bar positions of accented notes; the meter drills spell their grouping this way. */
  accents: number[];
  chordName?: { pos: number; name: string }[];
  firstLoopOnly?: boolean;
  lastLoopOnly?: boolean;
  tempoChange?: number;
}

export interface TabContent {
  notes: NoteEvent[];
  bars: BarInfo[];
  totalLength: number;
}

const EPS = 1e-6;

// Natural harmonic → semitones above the open string, by the fret it is touched at.
const HARMONIC_SEMITONES: Record<number, number> = {
  12: 12,
  7: 19,
  19: 19,
  5: 24,
  24: 24,
  4: 28,
  9: 28,
  16: 28,
  3: 31,
};

function soundingPitch(
  note: TablatureNote,
  tuningOffsets?: readonly number[],
): number | null {
  const open = GUITAR_STRING_MIDI[note.string - 1];
  let pitch: number;
  if (open !== undefined) {
    pitch = open + (tuningOffsets?.[note.string - 1] ?? 0) + note.fret;
    if (
      note.harmonicType === 1 &&
      HARMONIC_SEMITONES[note.fret] !== undefined
    ) {
      pitch =
        open +
        (tuningOffsets?.[note.string - 1] ?? 0) +
        HARMONIC_SEMITONES[note.fret];
    }
  } else if (note.midiNote !== undefined) {
    pitch = note.midiNote;
  } else {
    return null;
  }
  // A bend is heard for its target — that is the note the phrase is aiming at.
  if (note.isBend && !note.isRelease) {
    const cents = note.bendCurve?.length
      ? Math.max(...note.bendCurve.map((point) => point.cents))
      : (note.bendSemitones ?? 0) * 100;
    pitch += Math.round(cents / 100);
  }
  return pitch;
}

/** The beat a bar's pulse is counted in: dotted quarters in 6/8, 9/8, 12/8. */
export function pulseOf([numerator, denominator]: [number, number]): number {
  const unit = 4 / denominator;
  return denominator >= 8 && numerator % 3 === 0 && numerator > 3
    ? unit * 3
    : unit;
}

const onGrid = (pos: number, step: number) =>
  Math.abs(pos / step - Math.round(pos / step)) < EPS;

/** 1 on the downbeat, falling through the pulse and its halves to the in-between notes. */
export function metricWeight(
  posInBar: number,
  timeSignature: [number, number],
): number {
  if (posInBar < EPS) return 1;
  const pulse = pulseOf(timeSignature);
  if (onGrid(posInBar, pulse)) return 0.75;
  if (onGrid(posInBar, pulse / 2)) return 0.55;
  return 0.4;
}

export function extractTabContent(
  measures: TablatureMeasure[],
  tuningOffsets?: readonly number[],
): TabContent {
  const notes: NoteEvent[] = [];
  const bars: BarInfo[] = [];
  let barStart = 0;

  measures.forEach((measure, index) => {
    let pos = 0;
    const accents: number[] = [];
    const chordNames: { pos: number; name: string }[] = [];
    for (const beat of measure.beats) {
      if (beat.chordName) chordNames.push({ pos, name: beat.chordName });
      for (const note of beat.notes) {
        if (note.isAccented && !accents.some((a) => Math.abs(a - pos) < EPS))
          accents.push(pos);
        if (note.isDead) continue;
        const pitch = soundingPitch(note, tuningOffsets);
        if (pitch === null) continue;
        const sustain = note.isLetRing
          ? Math.max(beat.duration, 2)
          : beat.duration;
        const durationFactor = Math.pow(
          Math.min(Math.max(sustain, 0.125), 2),
          0.6,
        );
        let weight = metricWeight(pos, measure.timeSignature) * durationFactor;
        if (note.isAccented) weight *= 1.25;
        if (note.isGhost) weight *= 0.4;
        notes.push({
          pitch,
          pc: pcOf(pitch),
          start: barStart + pos,
          duration: sustain,
          bar: index,
          posInBar: pos,
          weight,
        });
      }
      pos += beat.duration;
    }
    bars.push({
      index,
      start: barStart,
      length: pos,
      timeSignature: measure.timeSignature,
      accents,
      ...(chordNames.length ? { chordName: chordNames } : {}),
      ...(measure.firstLoopOnly ? { firstLoopOnly: true } : {}),
      ...(measure.lastLoopOnly ? { lastLoopOnly: true } : {}),
      ...(measure.tempoChange !== undefined
        ? { tempoChange: measure.tempoChange }
        : {}),
    });
    barStart += pos;
  });

  return { notes, bars, totalLength: barStart };
}
