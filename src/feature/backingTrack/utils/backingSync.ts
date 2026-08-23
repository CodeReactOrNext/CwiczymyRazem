/**
 * Pure timing maths for keeping a backing track glued to the tab.
 *
 * The session already has a master clock: the metronome back-dates `startTime`
 * on every seek, pause/resume and loop restart, so wall-clock elapsed time
 * always measures from the tab's beat 0. Everything here is derived from it,
 * which is why bar clicks and loops need no extra wiring.
 *
 * Two tempos are in play and must not be confused:
 *   - `effectiveBpm` — what the session plays at right now (BPM × speed multiplier).
 *   - `sourceBpm`    — what the recording itself was played at, its own fixed tempo.
 * The recording's internal timeline never changes, so positions inside the file
 * depend only on `sourceBpm`; `effectiveBpm` only sets how fast we read it.
 *
 * A band that drifts breaks the assumption that one `sourceBpm` describes the
 * whole recording. Once bars have been pinned by hand (see utils/tempoMap) the
 * recording still runs at one steady rate — it is a fixed artifact — and the
 * *tab* is what bends to meet it. That bend reaches the tab through the
 * session's own tempo automation (see helpers/backingTempoOverlay), which is
 * why everything here asks the session where the tab is rather than working it
 * out from the recording.
 */

/**
 * What the backing track needs to know about the session's clock.
 *
 * The metronome measures elapsed time in *warped* beats: a bar the score takes
 * at 0.8× occupies more of them, so `elapsed × bpm / 60` is not a position in
 * the tab. Only the session can say which bar that lands on, and this is the
 * shape of the answer — structurally the practice session's `TempoRuler`,
 * named here by what is wanted from it rather than imported, because the
 * backing track knows nothing about exercises.
 *
 * Absent (or null) means the tab runs at one steady tempo, where warped beats
 * and score beats are the same number and every path below collapses to the
 * plain arithmetic it always was.
 */
export interface ScoreClock {
  /** Warped beats → beats of the score, which is what the tab is drawn against. */
  fromWarped(warped: number): number;
  /** Tempo ratio the score is running at around a beat. 1 where nothing bends. */
  ratioAt(beat: number): number;
}

/**
 * Beats of the score elapsed since the tab's beat 0.
 *
 * Wall time measures *warped* beats: the metronome back-dates `startTime` so
 * that `elapsed × bpm / 60` is a position in warped-beat space, which is where
 * every scheduler in the session works. The tab's notes and its bar numbers are
 * indexed by *score* beats, so crossing between the two needs the session's own
 * clock — and getting that wrong costs a whole beat per bar of automation, with
 * the error never coming back.
 *
 * Without a clock the two spaces are the same number, which is true of every
 * exercise carrying no tempo automation and was the only case this handled.
 */
export function beatsSinceStart(
  nowMs: number,
  startTime: number | null,
  effectiveBpm: number,
  scoreClock?: ScoreClock | null,
): number {
  if (startTime === null || !Number.isFinite(effectiveBpm) || effectiveBpm <= 0) return 0;
  const warped = ((nowMs - startTime) / 1000) * (effectiveBpm / 60);
  return Math.max(0, scoreClock ? scoreClock.fromWarped(warped) : warped);
}

/**
 * Where the session is sitting right now — playing or stopped.
 *
 * Stopped is not the same as "at the beginning", and the panel used to treat it
 * that way: `startTime` goes null on Stop, every clock read zero, and the
 * playhead jumped back to bar 1 — taking the following view with it. So Stop
 * threw away the place you had just found, and nothing on screen said where the
 * next Play would pick up.
 *
 * While the transport is stopped the answer belongs to the metronome, which is
 * the only thing that knows where it will resume from and whether it snaps to a
 * whole beat on the way.
 */
export function sessionBeats(
  nowMs: number,
  startTime: number | null,
  effectiveBpm: number,
  scoreClock?: ScoreClock | null,
  getResumeBeat?: () => number,
): number {
  if (startTime !== null) return beatsSinceStart(nowMs, startTime, effectiveBpm, scoreClock);
  const resume = getResumeBeat?.() ?? 0;
  return Number.isFinite(resume) ? Math.max(0, resume) : 0;
}

/**
 * Position inside the recording's own timeline (seconds) for a given tab beat.
 * `offsetMs` is where beat 0 sits in the file: positive when the file has an
 * intro to skip, negative when the file should start after the tab does.
 * Can return a negative number — the caller keeps the track paused until then.
 */
export function trackTimeForBeat(beats: number, sourceBpm: number, offsetMs: number): number {
  if (!Number.isFinite(sourceBpm) || sourceBpm <= 0) return offsetMs / 1000;
  return offsetMs / 1000 + (beats * 60) / sourceBpm;
}

// Blink accepts 0.0625–16 on a media element, but pitch-preserving stretching
// only sounds like music near the middle of that. Clamp hard, and let the UI
// warn once the ratio leaves the range where the stretch is actually clean.
export const MIN_PLAYBACK_RATE = 0.25;
export const MAX_PLAYBACK_RATE = 4;
export const CLEAN_RATE_MIN = 0.5;
export const CLEAN_RATE_MAX = 2;

export function clampPlaybackRate(rate: number): number {
  if (!Number.isFinite(rate)) return 1;
  return Math.min(MAX_PLAYBACK_RATE, Math.max(MIN_PLAYBACK_RATE, rate));
}

/** How much faster the file has to be read for it to match the session tempo. */
export function playbackRateFor(effectiveBpm: number, sourceBpm: number): number {
  if (!Number.isFinite(effectiveBpm) || !Number.isFinite(sourceBpm) || sourceBpm <= 0) return 1;
  return clampPlaybackRate(effectiveBpm / sourceBpm);
}

/**
 * The rate that keeps the recording under a tab whose own tempo moves.
 *
 * Two curves meet here and both have to be in the rate, or the target creeps
 * away from the audio and the drift corrector answers with a hard seek every
 * second or so — audible, and never actually catching up, because the error is
 * a rate error and regrows as fast as it is erased.
 *
 *  - `scoreRatio`   — how fast the *tab* is moving right now (1 unless the score
 *                     carries tempo automation).
 *  - `recordingBpm` — what the *recording* runs at around this bar, which is the
 *                     nominal tempo until bars have been pinned by hand.
 *
 * Once the tab has been made to follow the recording the two cancel exactly and
 * this is the plain tempo ratio again — the recording plays untouched, which is
 * the whole point of bending the tab rather than the performance.
 */
export function syncRateFor(params: {
  effectiveBpm: number;
  scoreRatio: number;
  recordingBpm: number;
}): number {
  const { effectiveBpm, scoreRatio, recordingBpm } = params;
  const ratio = Number.isFinite(scoreRatio) && scoreRatio > 0 ? scoreRatio : 1;
  return playbackRateFor(effectiveBpm * ratio, recordingBpm);
}

/** True while time stretching still sounds like the instrument it started as. */
export function isCleanStretch(rate: number): boolean {
  return rate >= CLEAN_RATE_MIN && rate <= CLEAN_RATE_MAX;
}

// ── Drift correction ────────────────────────────────────────────────────────
//
// Wall clock and audio-device clock tick at slightly different rates, and
// starting a media element costs a few tens of milliseconds. Rather than
// re-seeking (audible) on every millisecond of error, a proportional nudge to
// the playback rate absorbs small drift inaudibly; only a real jump — a seek,
// a loop restart, the file falling behind after a stall — gets a hard seek.

/** Past this, position is wrong enough that a seek beats waiting it out. */
export const HARD_SEEK_THRESHOLD_SEC = 0.25;
/** Inside this, leave the rate exactly on target — no hunting around zero. */
export const NUDGE_DEADBAND_SEC = 0.01;
/** Time a nudge aims to take to erase the drift. */
export const CORRECTION_WINDOW_SEC = 2;
/** Largest tempo distortion a nudge may apply (±2% is under a beating threshold). */
export const MAX_NUDGE = 0.02;
/** Tighter threshold for the first correction, when a seek costs nothing audible. */
export const STARTUP_SEEK_THRESHOLD_SEC = 0.02;

export type DriftAction = "none" | "nudge" | "seek";

export interface DriftCorrection {
  action: DriftAction;
  /** Multiplier to apply on top of the target playback rate. */
  rateFactor: number;
}

/**
 * `driftSec` = actual position − wanted position (positive = running ahead).
 * `seekThresholdSec` overrides the default for the first correction after
 * playback starts, where a seek is cheap and start-up lag needs erasing now.
 */
export function resolveDrift(
  driftSec: number,
  seekThresholdSec: number = HARD_SEEK_THRESHOLD_SEC,
): DriftCorrection {
  if (!Number.isFinite(driftSec)) return { action: "none", rateFactor: 1 };
  if (Math.abs(driftSec) > seekThresholdSec) return { action: "seek", rateFactor: 1 };
  if (Math.abs(driftSec) <= NUDGE_DEADBAND_SEC) return { action: "none", rateFactor: 1 };

  const raw = -driftSec / CORRECTION_WINDOW_SEC;
  const rateFactor = 1 + Math.min(MAX_NUDGE, Math.max(-MAX_NUDGE, raw));
  return { action: "nudge", rateFactor };
}

// ── YouTube ─────────────────────────────────────────────────────────────────

/**
 * Fallback list only. The IFrame API documents the available rates as
 * *video dependent*, so the real set comes from getAvailablePlaybackRates() on
 * the live player and this is just what to assume before it answers.
 */
export const YOUTUBE_FALLBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

/** Relative error under which a resolved rate still tracks the tab musically. */
const YOUTUBE_RATE_TOLERANCE = 0.005;

/**
 * The rate the player will actually end up at.
 *
 * Not the nearest one: the API rounds an unsupported value "down to the nearest
 * supported value in the direction of 1", so 1.17 becomes 1.0 rather than 1.25.
 * Predicting it correctly is what lets the sync loop know whether it is chasing
 * a tempo the video can hold.
 */
export function resolveYouTubeRate(
  rate: number,
  availableRates: readonly number[] = YOUTUBE_FALLBACK_RATES,
): number {
  if (!Number.isFinite(rate) || availableRates.length === 0) return 1;

  const sorted = [...availableRates].sort((a, b) => a - b);
  if (sorted.includes(rate)) return rate;

  // Walk from the requested rate towards 1 and take the first supported value.
  const towardsOne = sorted.filter((r) => (rate > 1 ? r >= 1 && r <= rate : r <= 1 && r >= rate));
  if (towardsOne.length > 0) {
    return rate > 1 ? Math.max(...towardsOne) : Math.min(...towardsOne);
  }

  // Outside everything the player offers — it can only clamp to its own range.
  return rate > 1 ? sorted[sorted.length - 1] : sorted[0];
}

/**
 * Whether the video can actually hold this tempo.
 *
 * When it can't, the difference between what we want and what the player does
 * is a *rate* error, so position error regrows every second — re-seeking can
 * never win it, it only tears the picture. The caller stops correcting and the
 * UI offers a tempo that works instead.
 */
export function canYouTubeFollow(
  rate: number,
  availableRates: readonly number[] = YOUTUBE_FALLBACK_RATES,
): boolean {
  const resolved = resolveYouTubeRate(rate, availableRates);
  return Math.abs(resolved - rate) / rate <= YOUTUBE_RATE_TOLERANCE;
}

/**
 * Session tempos this video can hold exactly, for a recording at `sourceBpm`.
 * These are the only tempos at which tab and video stay locked together.
 */
export function achievableSessionBpms(
  sourceBpm: number,
  availableRates: readonly number[] = YOUTUBE_FALLBACK_RATES,
): number[] {
  if (!Number.isFinite(sourceBpm) || sourceBpm <= 0) return [];
  return [...availableRates]
    .sort((a, b) => a - b)
    .map((rate) => Math.round(sourceBpm * rate))
    .filter((bpm, index, all) => bpm > 0 && all.indexOf(bpm) === index);
}
