/**
 * How well a hit note was timed. Every grade is a hit — a note played too far
 * off to count at all never gets here, it is a miss.
 *
 * - 3: on time
 * - 2: a little off — audible, but close
 * - 1: counted, but clearly off the beat
 */
export type TimingGrade = 1 | 2 | 3;

/** How one hit note was timed, as the tab draws it. */
export interface NoteTiming {
  grade: TimingGrade;
  /** What the tab writes over the note (see timingHintFor); null for nothing. */
  hint: TimingHint | null;
  /** How far the attack landed from the note's start, in beats (positive =
   *  late); null when the attack couldn't be measured. */
  offsetBeats: number | null;
  /** Pitch-focused exercises only (see pitchScoring.ts): how close a bend,
   *  pre-bend or release got to its written pitch. Absent until the note has
   *  played out, since a bend is judged on where it got to. */
  intonation?: { grade: TimingGrade; cents: number | null };
}

/**
 * One note of a run, in the order the run graded it — loops included, unlike
 * the tab's hit marks, which start over every pass. What the summary's chart
 * is drawn from.
 */
export interface RunNote {
  hit: boolean;
  /** Signed attack offset (ms, + = late); null for a miss or an untimed hit. */
  timingMs: number | null;
  /** Signed cents off the pitch (+ = sharp), on runs that score intonation;
   *  null until the note is graded, or where it couldn't be read. */
  cents: number | null;
}

/** How many hits of a run landed on each grade. */
export type TimingCounts = Record<TimingGrade, number>;

export const emptyTimingCounts = (): TimingCounts => ({ 3: 0, 2: 0, 1: 0 });

/** Share of a note's points each grade keeps. */
export const TIMING_GRADE_POINTS: Record<TimingGrade, number> = { 3: 1, 2: 2 / 3, 1: 1 / 3 };

/**
 * "On time" is deliberately not "perfect". The attack time we measure carries
 * error of its own before the player adds any: on a clean synthetic signal the
 * detector lands within ±9 ms of the true attack for 90% of notes (outliers to
 * ~36 ms), and a real session adds the latency calibration's error and the jitter
 * of audio reaching the page on top. A player who is honestly on the beat has
 * to land on 3 through all of that, plus the few tens of ms any human hand
 * wanders — so the floor sits well above the measurement error. On top of
 * that it leans forgiving on purpose: a 3 is for "in the pocket", not for
 * metronome-tight, and only a slip a listener would clearly hear drops it.
 *
 * Both windows scale with the note's length and are capped: at 60 BPM a 130 ms
 * slip is still in the pocket, in 16ths at 180 BPM (83 ms a note) the floor is
 * more than a note — the measurement error doesn't shrink with the note, and the
 * owner wants beginners to land on 3 easily, so the floors hold.
 */
const ON_TIME_SHARE = 0.6;
const ON_TIME_MIN_MS = 70;
const ON_TIME_MAX_MS = 100;
const CLOSE_SHARE = 1.2;
const CLOSE_MIN_MS = 140;
const CLOSE_MAX_MS = 200;
/** Added flat to both windows at every note length — the owner loosened the
 *  grades by this much on top of the scaled windows above. */
const LOOSEN_MS = 30;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Timing windows (± ms around the due time) for a note `noteMs` long. */
export const timingWindowsFor = (noteMs: number): { onTimeMs: number; closeMs: number } => ({
  onTimeMs: clamp(noteMs * ON_TIME_SHARE, ON_TIME_MIN_MS, ON_TIME_MAX_MS) + LOOSEN_MS,
  closeMs: clamp(noteMs * CLOSE_SHARE, CLOSE_MIN_MS, CLOSE_MAX_MS) + LOOSEN_MS,
});

/**
 * A run whose typical attack (median |offset|) sits within this of the beat is
 * dead on — the goal chart's tight zone. Well above the detector's own error
 * (±9 ms for 90% of attacks), so it rewards the hand, not the measurement's luck.
 */
export const PERFECT_TIMING_MS = 25;

/**
 * The tab's labels — feedback only, they never touch the score (the grade
 * windows above do). Set by the owner apart from the grades: a "+" for any
 * attack within PLUS_HINT_MS, "Early"/"Late" only past OFF_BEAT_HINT_MS, and
 * nothing in between — even where that hit was graded a 2.
 */
export const PLUS_HINT_MS = 80;
export const OFF_BEAT_HINT_MS = 180;

export type TimingHint = "early" | "late" | "perfect";

/** The tab's label for a measured attack (signed ms, + = late). Unmeasured gets none. */
export const timingHintFor = (deltaMs: number | null): TimingHint | null => {
  if (deltaMs === null) return null;
  const offBy = Math.abs(deltaMs);
  if (offBy <= PLUS_HINT_MS) return "perfect";
  if (offBy > OFF_BEAT_HINT_MS) return deltaMs < 0 ? "early" : "late";
  return null;
};

/**
 * Grades a hit by how far its attack landed from the note's due time (signed,
 * positive = late; early and late cost the same). `null` means the attack
 * couldn't be told apart — a legato note has none of its own, a muted one may
 * only have ticked — and gets full marks: nobody is graded down for what we
 * cannot measure.
 */
export const gradeTiming = (deltaMs: number | null, noteMs: number): TimingGrade => {
  if (deltaMs === null) return 3;
  const { onTimeMs, closeMs } = timingWindowsFor(noteMs);
  const offBy = Math.abs(deltaMs);
  if (offBy <= onTimeMs) return 3;
  if (offBy <= closeMs) return 2;
  return 1;
};
