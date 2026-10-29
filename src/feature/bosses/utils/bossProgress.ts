import type { BossDifficulty, BossRecord } from "../types/boss.types";
import { isDifficulty, reachedOn } from "./difficulty";

export const EMPTY_RECORD: BossRecord = { bestPhase: 0, bestDamage: 0, bestScore: 0, reached: {}, runs: 0 };

export interface RunResult {
  /** Phase the run ended in, 1-based. */
  phase: number;
  damage: number;
  /** The run's score — see runScore. */
  score: number;
  difficulty: BossDifficulty;
}

/** The record after a run: bests only ever go up, every run counts. */
export const recordRun = (record: BossRecord, run: RunResult): BossRecord => ({
  bestPhase: Math.max(record.bestPhase, run.phase),
  bestDamage: Math.max(record.bestDamage, run.damage),
  bestScore: Math.max(record.bestScore, run.score),
  reached: {
    ...record.reached,
    [run.difficulty]: Math.max(record.reached[run.difficulty] ?? 0, run.phase),
  },
  runs: record.runs + 1,
});

/**
 * The run went further, or scored more, than any before it. Further on its
 * difficulty or a harder one: a run on easy started from a savepoint a hard
 * run opened, ending where that hard run did, went nowhere new.
 */
export const isNewRecord = (record: BossRecord, run: RunResult) =>
  record.runs > 0 && (run.phase > reachedOn(record, run.difficulty) || run.score > record.bestScore);

const wholeNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;

/**
 * Reads a stored entry defensively — anything malformed counts as no record.
 * Records from before difficulties were all fought on normal.
 */
export const parseRecord = (raw: unknown): BossRecord => {
  if (!raw || typeof raw !== "object") return EMPTY_RECORD;
  const data = raw as Record<string, unknown>;
  const bestPhase = wholeNumber(data.bestPhase);
  const stored = data.reached && typeof data.reached === "object" ? (data.reached as Record<string, unknown>) : null;
  const reached: BossRecord["reached"] = {};
  if (stored) {
    for (const [difficulty, phase] of Object.entries(stored)) {
      if (isDifficulty(difficulty) && wholeNumber(phase)) reached[difficulty] = wholeNumber(phase);
    }
  } else if (bestPhase) {
    reached.normal = bestPhase;
  }
  return {
    bestPhase,
    bestDamage: wholeNumber(data.bestDamage),
    // Before scores, a run scored its damage on normal.
    bestScore: wholeNumber(data.bestScore ?? data.bestDamage),
    reached,
    runs: wholeNumber(data.runs),
  };
};
