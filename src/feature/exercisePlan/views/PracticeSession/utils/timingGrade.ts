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
  /** Dead on the beat (see isPerfectTiming) — earns a "+" on the tab. */
  perfect: boolean;
  /** How far the attack landed from the note's start, in beats (positive =
   *  late); null when the attack couldn't be measured. */
  offsetBeats: number | null;
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
 * Both windows scale with the note's length and are capped: at 60 BPM a 100 ms
 * slip is still in the pocket, in 16ths at 180 BPM (83 ms a note) the floor is
 * most of a note — the measurement error doesn't shrink with the note, and the
 * owner wants beginners to land on 3 easily, so the floors hold.
 */
const ON_TIME_SHARE = 0.6;
const ON_TIME_MIN_MS = 70;
const ON_TIME_MAX_MS = 100;
const CLOSE_SHARE = 1.2;
const CLOSE_MIN_MS = 140;
const CLOSE_MAX_MS = 200;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Timing windows (± ms around the due time) for a note `noteMs` long. */
export const timingWindowsFor = (noteMs: number): { onTimeMs: number; closeMs: number } => ({
  onTimeMs: clamp(noteMs * ON_TIME_SHARE, ON_TIME_MIN_MS, ON_TIME_MAX_MS),
  closeMs: clamp(noteMs * CLOSE_SHARE, CLOSE_MIN_MS, CLOSE_MAX_MS),
});

/**
 * Within this of the beat a hit counts as dead on. Tight enough to be an event
 * rather than the norm, loose enough to stay human — and well above the
 * detector's own error (±9 ms for 90% of attacks), so it rewards the hand, not
 * the measurement's luck. Feedback only: it scores like any other 3.
 */
export const PERFECT_TIMING_MS = 25;

/** Whether a measured attack landed dead on the beat. Unmeasured never is. */
export const isPerfectTiming = (deltaMs: number | null): boolean =>
  deltaMs !== null && Math.abs(deltaMs) <= PERFECT_TIMING_MS;

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
