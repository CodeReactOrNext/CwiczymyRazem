import type { BossDifficulty, BossRecord } from "../types/boss.types";

/** Easiest first. */
export const DIFFICULTIES: readonly BossDifficulty[] = ["easy", "normal", "hard", "brutal"];

export interface DifficultyDef {
  /** What every bite, slam and quake costs, as a share of its normal price. */
  damage: number;
  /** The tempo every phase is played at, as a share of the one it is dealt. */
  tempo: number;
  /** What a run's score is multiplied by. */
  reward: number;
}

export const DIFFICULTY: Readonly<Record<BossDifficulty, DifficultyDef>> = {
  easy: { damage: 0.6, tempo: 0.85, reward: 0.5 },
  normal: { damage: 1, tempo: 1, reward: 1 },
  hard: { damage: 1.4, tempo: 1.1, reward: 1.5 },
  brutal: { damage: 1.8, tempo: 1.2, reward: 2 },
};

export const isDifficulty = (value: unknown): value is BossDifficulty =>
  typeof value === "string" && (DIFFICULTIES as readonly string[]).includes(value);

/** A difficulty from a URL or storage; anything else is normal. */
export const parseDifficulty = (value: unknown): BossDifficulty => (isDifficulty(value) ? value : "normal");

// ── Gates and savepoints ────────────────────────────────────────────────────

/** Every this many phases the boss guards a gate. */
export const GATE_EVERY = 5;
/** A gate's phase has this much more HP than a phase usually would… */
export const GATE_HP = 1.5;
/** …and bites this much harder. */
export const GATE_BITE = 1.25;

/** 1-based phase `phase` is a gate: tougher, and a savepoint once reached. */
export const isGatePhase = (phase: number) => phase > 0 && phase % GATE_EVERY === 0;

/** Furthest phase reached on `difficulty` or a harder one. */
export const reachedOn = (record: Pick<BossRecord, "reached">, difficulty: BossDifficulty) =>
  Math.max(0, ...DIFFICULTIES.slice(DIFFICULTIES.indexOf(difficulty)).map((d) => record.reached[d] ?? 0));

/**
 * The phases a run on `difficulty` may start at: the first, and every gate
 * the player has reached on it or on a harder one — beating a hard run opens
 * the easier ones too.
 */
export const savepointsFor = (record: Pick<BossRecord, "reached">, difficulty: BossDifficulty): number[] => {
  const gates = Math.floor(reachedOn(record, difficulty) / GATE_EVERY);
  return [1, ...Array.from({ length: gates }, (_, i) => (i + 1) * GATE_EVERY)];
};

/** The next savepoint still locked on `difficulty`. */
export const nextSavepoint = (record: Pick<BossRecord, "reached">, difficulty: BossDifficulty) => {
  const open = savepointsFor(record, difficulty);
  return open.length === 1 ? GATE_EVERY : open[open.length - 1] + GATE_EVERY;
};

/** A start asked for (a URL's) if it is open on `difficulty`; otherwise the first phase. */
export const validStart = (
  record: Pick<BossRecord, "reached">,
  difficulty: BossDifficulty,
  phase: unknown,
): number => {
  const asked = typeof phase === "string" ? Number(phase) : phase;
  return typeof asked === "number" && savepointsFor(record, difficulty).includes(asked) ? asked : 1;
};
