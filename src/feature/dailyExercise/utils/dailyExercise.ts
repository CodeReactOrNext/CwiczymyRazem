import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { hasTablatureNotes } from "feature/exercisePlan/utils/hasTablatureNotes";
import { getServerDateKey } from "utils/converter/getServerDateKey";

import type { DailyExerciseEntry } from "../types/dailyExercise.types";

/** How many places the daily board shows. */
export const DAILY_LEADERBOARD_SIZE = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whether an exercise can be the exercise of the day: it has to be scored by
 * pitch detection against written notes, at a tempo, so every player's run is
 * the same test. Hunts, ear quizzes, play-alongs, strumming-only and
 * instruction-only drills score differently (or not at all) and stay out.
 */
export const isDailyExerciseCandidate = (exercise: Exercise): boolean =>
  (hasTablatureNotes(exercise.tablature) || !!exercise.gpFileUrl) &&
  !!exercise.metronomeSpeed &&
  !exercise.disableMic &&
  !exercise.isPlayalong &&
  !exercise.isHiddenFromLibrary &&
  !exercise.noGuitarNeeded &&
  !exercise.customGoal &&
  !exercise.noteHuntConfig &&
  !exercise.riddleConfig &&
  !exercise.earQuizConfig;

/** Sorted by id so the draw does not move when the catalogue is reordered. */
export const DAILY_EXERCISE_POOL: Exercise[] = exercisesAgregat
  .filter(isDailyExerciseCandidate)
  .sort((a, b) => a.id.localeCompare(b.id));

/**
 * The day the board belongs to. UTC on purpose: the exercise is the same for
 * everyone, so everyone has to be on the same day at the same moment.
 */
export const getDailyDayKey = (date: Date = new Date()): string =>
  getServerDateKey(date);

const previousDayKey = (dayKey: string): string =>
  getServerDateKey(new Date(Date.parse(`${dayKey}T00:00:00Z`) - DAY_MS));

/** FNV-1a — small, stable across runtimes, and spreads consecutive dates well. */
const hash = (value: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

const mix = (value: number): number => {
  let t = value;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** mulberry32 — a seeded generator, so a cycle shuffles the same way everywhere. */
const seededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    return mix(state);
  };
};

const shuffledCycle = (cycle: number, size: number): number[] => {
  const order = Array.from({ length: size }, (_, i) => i);
  const random = seededRandom(hash(`daily-exercise:${cycle}`));
  for (let i = size - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
};

/**
 * The pool is dealt like a deck: each run of `pool.length` days is one
 * shuffle, so every exercise comes up once per cycle. Where two cycles meet,
 * the new one's first card is swapped if it matches the old one's last.
 */
const cycleOrder = (cycle: number, size: number): number[] => {
  const order = shuffledCycle(cycle, size);
  if (size > 1 && cycle > 0 && order[0] === shuffledCycle(cycle - 1, size)[size - 1]) {
    [order[0], order[1]] = [order[1], order[0]];
  }
  return order;
};

/**
 * The exercise everyone plays on `dayKey`. Never the same as yesterday's —
 * a repeat would just hand yesterday's top five a head start.
 */
export const getDailyExercise = (
  dayKey: string,
  pool: Exercise[] = DAILY_EXERCISE_POOL,
): Exercise | null => {
  if (pool.length === 0) return null;
  const dayNumber = Math.floor(Date.parse(`${dayKey}T00:00:00Z`) / DAY_MS);
  const cycle = Math.floor(dayNumber / pool.length);
  const position = dayNumber % pool.length;
  return pool[cycleOrder(cycle, pool.length)[position]];
};

/**
 * Which day's board a finished run of `exerciseId` counts for, if any. A
 * session started just before midnight UTC still counts for the day it was
 * started on, so yesterday is accepted too.
 */
export const findDailyDayKeyFor = (
  exerciseId: string,
  now: Date = new Date(),
  pool: Exercise[] = DAILY_EXERCISE_POOL,
): string | null => {
  const today = getDailyDayKey(now);
  if (getDailyExercise(today, pool)?.id === exerciseId) return today;
  const yesterday = previousDayKey(today);
  if (getDailyExercise(yesterday, pool)?.id === exerciseId) return yesterday;
  return null;
};

/**
 * How long past midnight UTC a run of the day before still counts — enough for
 * a session started just before midnight to be played out. After it the board
 * is closed for good, and only then is its #1 paid.
 */
export const DAILY_BOARD_GRACE_MS = 60 * 60 * 1000;

/** A board's #1 only wins something if they beat at least one other player. */
export const DAILY_PRIZE_MIN_PLAYERS = 2;

/** How many past days a board check looks back for one still unsettled. */
const SETTLE_LOOKBACK_DAYS = 3;

const dayStartMs = (dayKey: string): number => Date.parse(`${dayKey}T00:00:00Z`);

/** Whether a run can still land on `dayKey`'s board at `now`. */
export const isDailyBoardOpen = (dayKey: string, now: Date = new Date()): boolean => {
  const t = now.getTime();
  return t >= dayStartMs(dayKey) && t < dayStartMs(dayKey) + DAY_MS + DAILY_BOARD_GRACE_MS;
};

/** Whether `dayKey`'s board is closed for good, so its winner can be settled. */
export const canSettleDailyBoard = (dayKey: string, now: Date = new Date()): boolean =>
  now.getTime() >= dayStartMs(dayKey) + DAY_MS + DAILY_BOARD_GRACE_MS;

/**
 * The recent days whose boards are closed, newest first. The settlement cron
 * looks a few days back, so a run that never happened is caught up by the next.
 */
export const getSettleableDayKeys = (now: Date = new Date()): string[] => {
  const today = getDailyDayKey(now);
  const days: string[] = [];
  let day = today;
  for (let i = 0; i < SETTLE_LOOKBACK_DAYS; i++) {
    day = previousDayKey(day);
    if (canSettleDailyBoard(day, now)) days.push(day);
  }
  return days;
};

/**
 * The board's winner: the best score, and on a tie whoever set it first. No
 * winner on a board nobody else played.
 */
export const pickDailyWinner = (
  topEntries: readonly DailyExerciseEntry[],
  players: number,
): DailyExerciseEntry | null => {
  if (players < DAILY_PRIZE_MIN_PLAYERS || topEntries.length === 0) return null;
  return [...topEntries].sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt)[0];
};

/** Milliseconds until the next exercise — the next UTC midnight. */
export const getMsUntilNextDailyExercise = (now: Date = new Date()): number => {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next - now.getTime();
};
