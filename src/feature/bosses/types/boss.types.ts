import type { ChordScaleId } from "feature/autoBacking/theory";

/**
 * How a pass walks the neck.
 * - `walk`: every string at one position — up the strings, then down them at
 *   the next position.
 * - `skip`: the same, skipping a string each step (6-4-5-3-4-2-3-1).
 * - `diagonal`: each string one fret higher than the last on the way up, one
 *   lower on the way down.
 */
export type SpiderRoute = "walk" | "skip" | "diagonal";

export type NotesPerBeat = 1 | 2 | 3 | 4;

/** One drill the spider throws: what is played, how fast and where. */
export interface SpiderVariation {
  bpm: number;
  /** 1 = quarters, 2 = eighths, 3 = triplets, 4 = sixteenths. */
  notesPerBeat: NotesPerBeat;
  /** Finger orders ("1324"), dealt one per string in turn on the way up. */
  patterns: readonly string[];
  /** Finger orders on the way down; the way-up list when absent. */
  descendPatterns?: readonly string[];
  route: SpiderRoute;
  /**
   * Index-finger fret of each position a pass visits. Even entries are played
   * up the strings, odd entries down them.
   */
  positions: readonly number[];
}

/** The kinds of chord the colossus throws, in the order the fight brings them. */
export type ChordFamily = "open" | "power" | "barre" | "seventh";

/** One strum of the colossus's drill: the chord and how long it rings. */
export interface ChordUnit {
  chord: string;
  /** In beats: 2 = a half note, 1 = a quarter, 0.5 = an eighth. */
  beats: number;
  /** Part of a quake — the bars where the chords change twice as often. */
  quake: boolean;
}

/** One drill the colossus throws: a looped chord progression at a tempo. */
export interface ChordVariation {
  bpm: number;
  family: ChordFamily;
  /** The progression the pass cycles through, in order. */
  progression: readonly string[];
  /** Beats each chord rings outside a quake: 4 = a bar, 2 = half notes, 1 = quarters. */
  beatsPerChord: 1 | 2 | 4;
  /** The pass strum by strum, in whole 4/4 bars; the tab loops it. */
  units: readonly ChordUnit[];
}

/** The modes the changeling's progressions are written in — chord scales of the backing's theory. */
export type ChangesMode = Extract<
  ChordScaleId,
  "ionian" | "aeolian" | "dorian" | "mixolydian" | "harmonicMinor" | "blues"
>;

/** Triads first; sevenths add the tone that names the chord's colour. */
export type HarmonyFamily = "triads" | "sevenths";

/**
 * One progression the changeling plays over: no notes to read, only chords
 * to solo over. The player improvises; the chord tones are what count.
 */
export interface ChangesVariation {
  bpm: number;
  /** The key the progression lives in: its tonic (C = 0) and its mode. */
  key: { tonic: number; mode: ChangesMode };
  family: HarmonyFamily;
  /** The progression the pass cycles through, in order. */
  progression: readonly string[];
  /** Beats each chord lasts outside a rush: 4 = a bar, 2 = half a bar. */
  beatsPerChord: 2 | 4;
  /** The pass chord by chord, in whole 4/4 bars — rushes are its quakes. */
  units: readonly ChordUnit[];
}

/** What a boss deals: the spider's finger drills, the colossus's chord changes, the changeling's changes to solo over. */
export type DrillKind = "spider" | "chords" | "changes";

export type BossId = "fretweaver" | "colossus" | "changeling";

export interface BossDefinition {
  id: BossId;
  name: string;
  title: string;
  drill: DrillKind;
}

/** How hard the player asks a fight to be: what bites cost, how fast it plays, what a run scores. */
export type BossDifficulty = "easy" | "normal" | "hard" | "brutal";

/** The player's best against one boss. */
export interface BossRecord {
  /** Furthest phase reached, 1-based, on any difficulty; 0 before the first run. */
  bestPhase: number;
  /** Most damage dealt in one run. */
  bestDamage: number;
  /** Highest run score — damage and skipped phases, times the difficulty's reward. */
  bestScore: number;
  /** Furthest phase reached on each difficulty — what unlocks its savepoints. */
  reached: Partial<Record<BossDifficulty, number>>;
  runs: number;
}

/** Records for every boss, keyed by boss id. */
export type BossRecordMap = Record<string, BossRecord>;
