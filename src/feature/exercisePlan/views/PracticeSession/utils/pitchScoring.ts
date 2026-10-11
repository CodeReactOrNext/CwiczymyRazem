import type { ScoringFocus } from "feature/exercisePlan/types/exercise.types";
import { getCentsDistance } from "utils/audio/noteUtils";

import type { TimingGrade } from "./timingGrade";
import { timingWindowsFor } from "./timingGrade";

/**
 * What an exercise's score rewards on top of hitting the notes.
 *
 * - "timing" (default): every hit is graded by how close to the beat it landed.
 * - "pitch": bends, pre-bends and releases are graded by how close to the
 *   written pitch they got; nothing is graded down for timing. Timing is still
 *   measured and shown, it just doesn't cost points. Meant for drills whose
 *   point is intonation — a slow bend-and-release is about where the string
 *   ends up, not about when the next note was picked.
 */
export type { ScoringFocus };

/** The parts of a tab note the rules below read. */
interface TechniqueFlags {
  isHammerOn?: boolean;
  isPullOff?: boolean;
  isRelease?: boolean;
  isBend?: boolean;
  isPreBend?: boolean;
  isDead?: boolean;
}

/**
 * Whether a note is sounded by its own pick attack. Hammer-ons and pull-offs
 * are fretted out of a ringing string, and a release is the bent string let
 * back down — nobody picks it. Such notes are credited on pitch alone and
 * never timed: there is no attack of theirs to time, and any attack the
 * detector reports during one belongs to something else.
 */
export const hasOwnAttack = (note: TechniqueFlags): boolean =>
  !note.isHammerOn && !note.isPullOff && !note.isRelease;

/**
 * How a note's intonation is read when the exercise focuses on pitch, or null
 * for a note that has none to read (muted).
 *
 * - "bend" / "release": a moving string, judged on the best moment — whether
 *   the bend got there, where the release landed.
 * - "note": a fretted note just sits at its pitch, so it is judged on where it
 *   sat for most of its length — pressing too hard keeps it sharp the whole
 *   time, and one passing reading near the target shouldn't cover for that.
 */
export type IntonationKind = "bend" | "release" | "note";

export const intonationKindOf = (note: TechniqueFlags): IntonationKind | null => {
  if (note.isDead) return null;
  if (note.isRelease) return "release";
  if (note.isBend || note.isPreBend) return "bend";
  return "note";
};

/** Two pitches this close are the same note for the continuation rule below. */
const SAME_PITCH_CENTS = 50;

/**
 * Earliest attack (ms before the due time, as a negative offset) that may
 * still be a ringing continuation's own (see isSamePitchContinuation).
 * Anything earlier happened while the previous note was still ringing at this
 * pitch — a release settling, the detector misfiring on a decaying note — and
 * used to be timed as a wildly early pick. A real early pick past this is rare
 * at the tempi where notes ring this long, and still beats a phantom "Loose"
 * on every repeated note.
 */
export const continuationAttackFloorMs = (noteMs: number): number =>
  -timingWindowsFor(noteMs).closeMs;

/**
 * Whether a note asks for the very pitch a long previous note leaves ringing —
 * a release landing on the fret that gets picked next, a held note picked
 * again. The string already sounds the target before the note is due, so the
 * pitch says nothing about whether, or when, it was played: only a fresh
 * attack does, and only one close to the beat.
 *
 * Short previous notes are left out on purpose: an attack is otherwise
 * claimed by a note once it lands nearer to it than to the note before
 * (half the previous note's length), and for fast repeated notes — tremolo —
 * that is already tighter than the floor above, so nothing would improve and
 * every pick would suddenly have to be heard on its own.
 */
export const isSamePitchContinuation = (
  prevTargetFreq: number,
  targetFreq: number,
  prevNoteMs: number,
  noteMs: number,
): boolean =>
  prevNoteMs / 2 > -continuationAttackFloorMs(noteMs) &&
  prevTargetFreq > 0 &&
  targetFreq > 0 &&
  Math.abs(getCentsDistance(prevTargetFreq, targetFreq)) <= SAME_PITCH_CENTS;

// ── Intonation ──────────────────────────────────────────────────────────────

/**
 * Cents windows for the intonation grades. A trained ear starts to hear a bend
 * as out of tune somewhere around 10–20 cents; the detector itself reads a
 * clean sustained note to within a few cents, but a bend is a moving string
 * and the reading lags it, so the top grade sits at the edge of audible.
 */
export const IN_TUNE_CENTS = 20;
export const CLOSE_CENTS = 40;

/**
 * Grades how close a bend (or release) got to its written pitch. `null` means
 * it never came near — a bend that wasn't pushed up at all, say — and still
 * counts as a hit, but for the least.
 */
export const gradeIntonation = (cents: number | null): TimingGrade => {
  if (cents === null) return 1;
  const off = Math.abs(cents);
  if (off <= IN_TUNE_CENTS) return 3;
  if (off <= CLOSE_CENTS) return 2;
  return 1;
};

/** Readings further off than this are some other note, not an attempt at this one. */
const INTONATION_SEARCH_CENTS = 150;

/** Whether a reading (cents off a note's pitch) could be an attempt at that note. */
export const isNearPitch = (cents: number): boolean =>
  Number.isFinite(cents) && Math.abs(cents) <= INTONATION_SEARCH_CENTS;

/**
 * How long after a picked bend is hit its pitch readings are ignored. Through
 * an attack the detector keeps reporting the note before it (it holds its last
 * steady reading rather than guess from the transient), and the bend drills
 * precede each bend with a reference note AT the bend's target — so the first
 * readings of every bend would otherwise say it was already perfectly in tune.
 * No real bend gets there faster than this. A release has no attack, so its
 * readings are its own from the start.
 */
export const INTONATION_SETTLE_MS = 150;

/**
 * The settle window for a fretted note: the same hold-over, plus the string
 * starting a touch sharp the moment it is plucked. Capped by the note's own
 * length so a fast note still leaves readings to judge.
 */
export const noteSettleMs = (noteMs: number): number => Math.min(INTONATION_SETTLE_MS, noteMs * 0.4);

/** Middle reading of a held note — robust to the odd glitch at either end. */
export const medianCents = (readings: readonly number[]): number | null => {
  if (readings.length === 0) return null;
  const sorted = [...readings].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** Fewer graded notes than this and one bad bend would set the lean. */
const MIN_INTONATION_NOTES = 4;

/** Below this a lean is within what one string's own drift accounts for. */
export const MIN_INTONATION_LEAN_CENTS = 8;

/**
 * Where a run's notes tend to land: the median signed cents (+ = sharp).
 * Median, so one note that slipped doesn't speak for the whole run.
 */
export const summarizeIntonation = (cents: readonly number[]): { biasCents: number; measuredNotes: number } | null => {
  if (cents.length < MIN_INTONATION_NOTES) return null;
  return { biasCents: Math.round(medianCents(cents)!), measuredNotes: cents.length };
};

/**
 * Keeps the closest reading of a note's pitch seen so far (signed cents, + =
 * sharp). Closest rather than last: a bend is judged on whether it got there,
 * and a release on where it landed — both are the best moment of the note,
 * and the string drifting as it decays afterwards isn't the player's doing.
 */
export const closerIntonation = (best: number | null, cents: number): number | null => {
  if (!isNearPitch(cents)) return best;
  return best === null || Math.abs(cents) < Math.abs(best) ? cents : best;
};

/** How far above the unbent pitch the string is, in semitones. */
export const bendSemitonesOf = (freq: number, unbentFreq: number): number =>
  freq > 0 && unbentFreq > 0 ? 12 * Math.log2(freq / unbentFreq) : 0;

/**
 * The live pitch of the note under the cursor, for the tab to draw: a bend's
 * gauge, or — when the exercise scores intonation — a fretted note's tuner.
 * `amount` is how far a bend or release has gone, 0 → 1 (up toward the
 * target for a bend, back down to the fret for a release); null for a plain
 * note, and whenever there is no usable pitch.
 */
export interface LivePitch {
  noteKey: string;
  kind: IntonationKind;
  amount: number | null;
  /** Signed cents from the pitch the note is written to end on. */
  cents: number | null;
}

/** Bend readings this far outside the move are noise or another string. */
const LIVE_BEND_MARGIN_SEMIS = 1;

export const liveBendAmount = (
  kind: "bend" | "release",
  freq: number,
  unbentFreq: number,
  targetSemis: number,
): number | null => {
  if (freq <= 20 || unbentFreq <= 0 || targetSemis <= 0) return null;
  const semis = bendSemitonesOf(freq, unbentFreq);
  if (semis < -LIVE_BEND_MARGIN_SEMIS || semis > targetSemis + LIVE_BEND_MARGIN_SEMIS) return null;
  const up = Math.max(0, semis) / targetSemis;
  return kind === "bend" ? up : 1 - Math.min(1, up);
};
