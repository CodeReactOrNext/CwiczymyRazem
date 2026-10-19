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

export interface BossDefinition {
  id: string;
  name: string;
  title: string;
}

/** The player's best against one boss. */
export interface BossRecord {
  /** Furthest phase reached, 1-based; 0 before the first run. */
  bestPhase: number;
  /** Most damage dealt in one run. */
  bestDamage: number;
  runs: number;
}

/** Records for every boss, keyed by boss id. */
export type BossRecordMap = Record<string, BossRecord>;
