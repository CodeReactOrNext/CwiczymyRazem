import type { BossRecord } from "../types/boss.types";

export const EMPTY_RECORD: BossRecord = { bestPhase: 0, bestDamage: 0, runs: 0 };

export interface RunResult {
  /** Phase the run ended in, 1-based. */
  phase: number;
  damage: number;
}

/** The record after a run: bests only ever go up, every run counts. */
export const recordRun = (record: BossRecord, run: RunResult): BossRecord => ({
  bestPhase: Math.max(record.bestPhase, run.phase),
  bestDamage: Math.max(record.bestDamage, run.damage),
  runs: record.runs + 1,
});

/** The run went further, or hit harder, than any before it. */
export const isNewRecord = (record: BossRecord, run: RunResult) =>
  record.runs > 0 && (run.phase > record.bestPhase || run.damage > record.bestDamage);

const wholeNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;

/** Reads a stored entry defensively — anything malformed counts as no record. */
export const parseRecord = (raw: unknown): BossRecord => {
  if (!raw || typeof raw !== "object") return EMPTY_RECORD;
  const data = raw as Record<string, unknown>;
  return {
    bestPhase: wholeNumber(data.bestPhase),
    bestDamage: wholeNumber(data.bestDamage),
    runs: wholeNumber(data.runs),
  };
};
