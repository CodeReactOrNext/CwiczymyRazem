import type { NotesPerBeat, SpiderRoute } from "../types/boss.types";
import type { Affix, PhasePlan } from "./phaseGenerator";
import { spiderPassNotes } from "./spiderTab";

/** What can threaten the player in a phase, beyond the bites every phase has. */
export type ThreatId = "slams" | "weak_spots" | Affix;

export const threatsOf = (plan: Pick<PhasePlan, "slams" | "weakSpots" | "affixes">): ThreatId[] => [
  ...(plan.slams ? (["slams"] as const) : []),
  ...(plan.weakSpots ? (["weak_spots"] as const) : []),
  ...plan.affixes,
];

/** The frets a phase's drill spans. */
export const fretSpan = (plan: Pick<PhasePlan, "variation">) => {
  const frets = spiderPassNotes(plan.variation).map((note) => note.fret);
  return { low: Math.min(...frets), high: Math.max(...frets) };
};

const samePatterns = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

export interface PhaseChanges {
  bpm: { from: number; to: number };
  /**
   * How much faster the notes come, tempo and rhythm together: 0.38 = 38%
   * faster. The BPM alone can mislead — 96 quarters to 66 eighths is a lower
   * number and quicker notes.
   */
  speedChange: number;
  rhythm: { from: NotesPerBeat; to: NotesPerBeat; changed: boolean };
  route: { to: SpiderRoute; changed: boolean };
  patterns: { to: readonly string[]; changed: boolean };
  frets: { low: number; high: number; changed: boolean };
  /** Threats the new phase brings, and the ones it leaves behind. */
  gained: ThreatId[];
  lost: ThreatId[];
}

/**
 * What the next phase does differently from the one just cleared — the
 * briefing the draft shows while the run is held. Tempos are the ones the
 * player actually plays, boons included.
 */
export const describePhaseChanges = (
  previous: PhasePlan,
  next: PhasePlan,
  previousBpm: number,
  nextBpm: number,
): PhaseChanges => {
  const before = fretSpan(previous);
  const after = fretSpan(next);
  const threatsBefore = threatsOf(previous);
  const threatsAfter = threatsOf(next);
  const notesBefore = previousBpm * previous.variation.notesPerBeat;
  const notesAfter = nextBpm * next.variation.notesPerBeat;
  return {
    bpm: { from: previousBpm, to: nextBpm },
    speedChange: notesBefore > 0 ? notesAfter / notesBefore - 1 : 0,
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
    gained: threatsAfter.filter((threat) => !threatsBefore.includes(threat)),
    lost: threatsBefore.filter((threat) => !threatsAfter.includes(threat)),
  };
};
