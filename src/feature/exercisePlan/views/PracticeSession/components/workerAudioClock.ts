/**
 * AudioContext.currentTime as the tab worker sees it between the main thread's
 * readings of it.
 *
 * currentTime moves in whole audio callbacks (~10 ms on Windows), and a reading
 * also waits for its message, so every reading is late by a different few ms.
 * The worker used to re-anchor its clock on each one, which jerked the cursor —
 * and everything scrolling with it — back and forth by that much, 30 times a
 * second. A reading can only ever be late, never early, so the freshest one of
 * the last second is the best guess of where the audio clock is; in between,
 * the estimate runs on the worker's own clock.
 */
export interface AudioClock {
  /** audio sec − wall sec of each recent reading, and the wall ms it arrived at */
  readings: { offset: number; at: number }[];
  /** The freshest offset among them; null before the first reading. */
  offset: number | null;
}

const WINDOW_MS = 1000;
/** A reading this far behind the estimate means the audio clock really fell
 *  back (a stall, a context resumed) — follow it rather than wait it out. */
const SNAP_SEC = 0.08;

export const createAudioClock = (): AudioClock => ({ readings: [], offset: null });

export function resetAudioClock(clock: AudioClock): void {
  clock.readings.length = 0;
  clock.offset = null;
}

/** A reading of currentTime (`audioSec`) that arrived at `wallMs`. */
export function observeAudioClock(clock: AudioClock, audioSec: number, wallMs: number): void {
  const offset = audioSec - wallMs / 1000;
  if (clock.offset !== null && offset < clock.offset - SNAP_SEC) clock.readings.length = 0;
  clock.readings.push({ offset, at: wallMs });
  // The window keeps the newest reading even after a long quiet spell.
  let stale = 0;
  while (stale < clock.readings.length - 1 && clock.readings[stale].at < wallMs - WINDOW_MS) stale++;
  if (stale > 0) clock.readings.splice(0, stale);
  let freshest = -Infinity;
  for (const reading of clock.readings) if (reading.offset > freshest) freshest = reading.offset;
  clock.offset = freshest;
}

/** The audio time at wall time `wallMs`, or null before the first reading. */
export const audioClockNow = (clock: AudioClock, wallMs: number): number | null =>
  clock.offset === null ? null : clock.offset + wallMs / 1000;
