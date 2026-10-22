import type { ChordFamily, NotesPerBeat, SpiderRoute } from "../types/boss.types";
import { passBeats } from "./chordPhaseGenerator";
import type { Affix, ChordPhasePlan, PhasePlan, SpiderPhasePlan } from "./phaseGenerator";
import { spiderPassNotes } from "./spiderTab";

/** What can threaten the player in a phase, beyond the bites every phase has. */
export type ThreatId = "slams" | "quake" | "weak_spots" | Affix;

export const threatsOf = (plan: PhasePlan): ThreatId[] => [
  ...(plan.slams ? (["slams"] as const) : []),
  ...(plan.kind === "chords" && plan.quakes ? (["quake"] as const) : []),
  ...(plan.weakSpots ? (["weak_spots"] as const) : []),
  ...plan.affixes,
];

/** Notes a beat — or, on the colossus, strums a beat over the whole pass, quakes included. */
export const unitsPerBeat = (plan: PhasePlan) =>
  plan.kind === "chords"
    ? plan.variation.units.length / Math.max(1, passBeats(plan.variation))
    : plan.variation.notesPerBeat;

/** The frets a phase's drill spans. */
export const fretSpan = (plan: Pick<SpiderPhasePlan, "variation">) => {
  const frets = spiderPassNotes(plan.variation).map((note) => note.fret);
  return { low: Math.min(...frets), high: Math.max(...frets) };
};

const samePatterns = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

/** What any next phase changes, whichever boss deals it. */
export interface PhaseShift {
  bpm: { from: number; to: number };
  /**
   * How much faster the notes come, tempo and rhythm together: 0.38 = 38%
   * faster. The BPM alone can mislead — 96 quarters to 66 eighths is a lower
   * number and quicker notes.
   */
  speedChange: number;
  /** Threats the new phase brings, and the ones it leaves behind. */
  gained: ThreatId[];
  lost: ThreatId[];
}

/** The speed and the threats of the next phase against the one just cleared. */
export const describePhaseShift = (
  previous: PhasePlan,
  next: PhasePlan,
  previousBpm: number,
  nextBpm: number,
): PhaseShift => {
  const threatsBefore = threatsOf(previous);
  const threatsAfter = threatsOf(next);
  const before = previousBpm * unitsPerBeat(previous);
  const after = nextBpm * unitsPerBeat(next);
  return {
    bpm: { from: previousBpm, to: nextBpm },
    speedChange: before > 0 ? after / before - 1 : 0,
    gained: threatsAfter.filter((threat) => !threatsBefore.includes(threat)),
    lost: threatsBefore.filter((threat) => !threatsAfter.includes(threat)),
  };
};

export interface PhaseChanges extends PhaseShift {
  rhythm: { from: NotesPerBeat; to: NotesPerBeat; changed: boolean };
  route: { to: SpiderRoute; changed: boolean };
  patterns: { to: readonly string[]; changed: boolean };
  frets: { low: number; high: number; changed: boolean };
}

/**
 * What the spider's next phase does differently from the one just cleared —
 * the briefing the draft shows while the run is held. Tempos are the ones the
 * player actually plays, boons included.
 */
export const describePhaseChanges = (
  previous: SpiderPhasePlan,
  next: SpiderPhasePlan,
  previousBpm: number,
  nextBpm: number,
): PhaseChanges => {
  const before = fretSpan(previous);
  const after = fretSpan(next);
  return {
    ...describePhaseShift(previous, next, previousBpm, nextBpm),
    rhythm: {
      from: previous.variation.notesPerBeat,
      to: next.variation.notesPerBeat,
      changed: previous.variation.notesPerBeat !== next.variation.notesPerBeat,
    },
    route: { to: next.variation.route, changed: previous.variation.route !== next.variation.route },
    patterns: {
      to: next.variation.patterns,
      changed: !samePatterns(previous.variation.patterns, next.variation.patterns),
    },
    frets: { ...after, changed: before.low !== after.low || before.high !== after.high },
  };
};

export interface ChordChanges extends PhaseShift {
  rhythm: { from: 1 | 2 | 4; to: 1 | 2 | 4; changed: boolean };
  family: { to: ChordFamily; changed: boolean };
  progression: { to: readonly string[]; changed: boolean };
  /** Quakes in a pass. */
  quakes: { from: number; to: number; changed: boolean };
}

/** Quakes in a pass: runs of quake strums. */
const quakeCount = (plan: ChordPhasePlan) =>
  plan.variation.units.filter(
    (unit, i, units) => unit.quake && !units[(i - 1 + units.length) % units.length].quake,
  ).length;

/** The colossus's counterpart of describePhaseChanges. */
export const describeChordChanges = (
  previous: ChordPhasePlan,
  next: ChordPhasePlan,
  previousBpm: number,
  nextBpm: number,
): ChordChanges => {
  const quakesBefore = quakeCount(previous);
  const quakesAfter = quakeCount(next);
  return {
    ...describePhaseShift(previous, next, previousBpm, nextBpm),
    rhythm: {
      from: previous.variation.beatsPerChord,
      to: next.variation.beatsPerChord,
      changed: previous.variation.beatsPerChord !== next.variation.beatsPerChord,
    },
    family: { to: next.variation.family, changed: previous.variation.family !== next.variation.family },
    progression: {
      to: next.variation.progression,
      changed: previous.variation.progression.join() !== next.variation.progression.join(),
    },
    quakes: { from: quakesBefore, to: quakesAfter, changed: quakesBefore !== quakesAfter },
  };
};
