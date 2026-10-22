import type { NoteJudgement } from "feature/exercisePlan/views/PracticeSession/hooks/useNoteMatching";

/**
 * Tones a strum of three or more may drop and still count as clean. Chord
 * detection hears a correct tone 99% of the time on average but only 87% for
 * the worst one (chordTones.ts) — one silent string must not cost a change.
 */
export const CHORD_TONES_FORGIVEN = 1;

/** Tones a strum of `tones` has to sound to count. */
export const tonesNeeded = (tones: number) =>
  tones >= 3 ? tones - CHORD_TONES_FORGIVEN : tones;

/** One strum of the colossus's drill, settled from its tones. */
export interface StrumJudgement {
  /** The strum's index in the pass. */
  unit: number;
  hit: boolean;
  /** The best timing among its tones — they share one attack. */
  grade: NoteJudgement["grade"];
  perfect: boolean;
}

interface Tally {
  tones: number;
  seen: Set<string>;
  hits: number;
  misses: number;
  grade: NoteJudgement["grade"];
  perfect: boolean;
  settled: boolean;
}

/**
 * Turns the matcher's tone-by-tone judgements into strums. A chord's tones
 * are judged one at a time — a hit the moment each is heard, a miss once its
 * window has passed — and the strum settles as soon as its outcome is sure:
 * clean once enough tones are heard, missed once too many are lost. Tones
 * arriving after that are taken in quietly; the next pass, which repeats the
 * same note keys, starts the strum over.
 */
export const createStrumTally = () => {
  const tallies = new Map<number, Tally>();

  const add = (
    judgement: Pick<NoteJudgement, "noteKey" | "hit" | "grade" | "perfect">,
    unit: number,
    tones: number,
  ): StrumJudgement | null => {
    if (tones <= 0) return null;
    let tally = tallies.get(unit);
    // A tone this strum already had, or one more than it has: the next pass.
    if (!tally || tally.seen.has(judgement.noteKey) || tally.seen.size >= tally.tones) {
      tally = { tones, seen: new Set(), hits: 0, misses: 0, grade: null, perfect: false, settled: false };
      tallies.set(unit, tally);
    }
    tally.seen.add(judgement.noteKey);
    if (judgement.hit) {
      tally.hits += 1;
      if (judgement.grade !== null && (tally.grade === null || judgement.grade > tally.grade)) {
        tally.grade = judgement.grade;
      }
      tally.perfect ||= judgement.perfect;
    } else {
      tally.misses += 1;
    }
    if (tally.settled) return null;

    const needed = tonesNeeded(tones);
    if (tally.hits >= needed) {
      tally.settled = true;
      return { unit, hit: true, grade: tally.grade, perfect: tally.perfect };
    }
    if (tally.misses > tones - needed) {
      tally.settled = true;
      return { unit, hit: false, grade: null, perfect: false };
    }
    return null;
  };

  return { add, clear: () => tallies.clear() };
};

export type StrumTally = ReturnType<typeof createStrumTally>;
