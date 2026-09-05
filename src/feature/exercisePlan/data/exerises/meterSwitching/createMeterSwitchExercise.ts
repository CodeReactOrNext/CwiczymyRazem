import type {
  Exercise,
  TablatureBeat,
  TablatureMeasure,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

/** Everything is played on the low E — the drill is about time, not about notes. */
const STRING = 6;
/** The pulse note: open E, palm muted, so accents are the only thing that stands out. */
const PULSE_FRET = 0;
/** The two-note "we're switching" gesture at the end of every bar: G then A, ringing. */
const SEAM_FRETS = [3, 5] as const;

/**
 * How the last two notes of a bar are marked so the change of meter is *felt*
 * and not just counted:
 *  - "lift"  — the last two notes keep their length but move up to G–A, accented
 *              and un-muted. Used where the bar is a stream of eighths.
 *  - "split" — the last beat (a quarter) breaks into two accented eighths on
 *              G–A. Used where the bar is a stream of quarters: the sudden
 *              subdivision is what announces the bar line.
 */
export type SeamStyle = "lift" | "split";

export interface MeterBar {
  timeSignature: [number, number];
  /** Note-group lengths, e.g. [2, 2, 3] = 7/8 felt as 2+2+3. The first note of
   *  every group is accented — the grouping is the whole content of the drill. */
  groups: number[];
  /** Sounding length of one note in quarter-note units (0.5 = eighth, 1 = quarter).
   *  For tuplets this is the compressed value, matching TablatureBeat.duration. */
  noteDuration: number;
  tuplet?: number;
  /** Tempo ratio for this bar — only for the pairs where the pulse, not the
   *  eighth, is what stays constant across the change. */
  tempoChange?: number;
}

export interface MeterSwitchConfig {
  id: string;
  addedAt: string;
  title: string;
  description: string;
  whyItMatters: string;
  difficulty: Exercise["difficulty"];
  timeInMinutes: number;
  metronomeSpeed: { min: number; max: number; recommended: number };
  instructions: string[];
  tips: string[];
  /** The two bars the drill alternates between. */
  bars: [MeterBar, MeterBar];
  seam?: SeamStyle;
  /** How many times the pair repeats. 4 pairs = 8 bars. */
  pairs?: number;
}

const pulseNote = (isAccented: boolean): TablatureNote => ({
  string: STRING,
  fret: PULSE_FRET,
  isPalmMute: true,
  ...(isAccented ? { isAccented: true } : {}),
});

const seamNote = (fret: number): TablatureNote => ({
  string: STRING,
  fret,
  isAccented: true,
});

/** Indices (0-based) of the notes that open a group — the ones that get the accent. */
export const accentIndexes = (groups: number[]): Set<number> => {
  const indexes = new Set<number>();
  let index = 0;
  for (const group of groups) {
    indexes.add(index);
    index += group;
  }
  return indexes;
};

/**
 * Turns one bar spec into a measure: a stream of palm-muted open E notes with the
 * group openings accented, closed by the two-note seam gesture.
 *
 * The measure's notated length always comes out as `noteCount * noteDuration` —
 * "split" halves one beat into two instead of adding one — which is what keeps it
 * matching the declared time signature (see tablatureMeasureIntegrity.test.ts).
 */
export const buildMeterBar = (bar: MeterBar, seam: SeamStyle): TablatureMeasure => {
  const noteCount = bar.groups.reduce((sum, group) => sum + group, 0);
  const accents = accentIndexes(bar.groups);
  const tuplet = bar.tuplet ? { tuplet: bar.tuplet } : {};

  // "lift" repaints the last two notes, "split" only the last one — which then
  // becomes two notes of half the length.
  const pulseCount = seam === "lift" ? noteCount - 2 : noteCount - 1;
  const seamDuration = seam === "lift" ? bar.noteDuration : bar.noteDuration / 2;

  const beats: TablatureBeat[] = [];
  for (let index = 0; index < pulseCount; index += 1) {
    beats.push({ duration: bar.noteDuration, ...tuplet, notes: [pulseNote(accents.has(index))] });
  }
  for (const fret of SEAM_FRETS) {
    beats.push({ duration: seamDuration, ...tuplet, notes: [seamNote(fret)] });
  }

  return {
    timeSignature: bar.timeSignature,
    beats,
    ...(bar.tempoChange !== undefined ? { tempoChange: bar.tempoChange } : {}),
  };
};

export const buildMeterTablature = (
  bars: [MeterBar, MeterBar],
  seam: SeamStyle,
  pairs: number,
): TablatureMeasure[] => {
  const measures = Array.from({ length: pairs }, () =>
    bars.map((bar) => buildMeterBar(bar, seam)),
  ).flat();

  // A pair that returns to base tempo carries `tempoChange: 1` on its first bar so
  // the second half of every repeat can hand the tempo back. On bar 1 that is a
  // no-op the generator would print as a second `\tempo` next to the score's own.
  const [first] = measures;
  if (first?.tempoChange === 1) delete first.tempoChange;

  return measures;
};

/**
 * Builds one meter-switching drill: two bars in different meters (or in the same
 * meter grouped two different ways) played back to back, over and over.
 *
 * Every variant is the same game — only the pair of bars changes — so they all
 * share this factory instead of copying eight nearly identical tablatures around.
 */
export function createMeterSwitchExercise(config: MeterSwitchConfig): Exercise {
  const seam = config.seam ?? "lift";

  // No metronomeGrid: the session reads the meter off the tablature below, which
  // states both bars of the pair, so the click alternates with them on its own
  // (see deriveMetronomeGrid). A hand-written grid here used to accent every
  // group opening instead — four accents in a bar of 4/4 — which read as noise
  // rather than as a meter.
  return {
    id: config.id,
    addedAt: config.addedAt,
    title: config.title,
    description: config.description,
    whyItMatters: config.whyItMatters,
    difficulty: config.difficulty,
    category: "technique",
    timeInMinutes: config.timeInMinutes,
    instructions: config.instructions,
    tips: config.tips,
    metronomeSpeed: config.metronomeSpeed,
    relatedSkills: ["rhythm"],
    tablature: buildMeterTablature(config.bars, seam, config.pairs ?? 4),
  };
}
