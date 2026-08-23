/**
 * A trustworthy "where is the video right now" clock, fitted from the player's
 * own answers.
 *
 * The IFrame API's `getCurrentTime` is not a clock — it is a value that arrives
 * over postMessage and firms up in steps, so read at sixty hertz it staircases:
 * the same number for a stretch, then a jump. Filing audio under it bunches
 * everything heard during a step onto that step's instant, which is exactly the
 * smear waveform learning cannot afford.
 *
 * So the readings are treated as noisy samples of a line — position advances at
 * the playback rate — and the line is fitted over a short window. Between
 * samples the fit is what answers, which is smooth, and the quantisation
 * averages out instead of landing in the waveform.
 *
 * Pure and clock-injected, so the behaviour that matters (a seek, a stall, an
 * ad) can be tested without a player.
 */

/** How far back the fit looks. Long enough to average the steps out, short
 *  enough that a rate change is not dragged along for ages. */
const WINDOW_MS = 6_000;

/**
 * Past this the player did not simply advance — it seeked, stalled, or an ad
 * took the timeline over. Nothing learned about the old run carries across.
 *
 * Comfortably above the step size of the reported value (~250 ms) so ordinary
 * quantisation is never mistaken for a jump.
 */
const JUMP_SEC = 0.4;

/** Below this many samples the fit is noise; the newest reading plus the
 *  nominal rate is the better answer. */
const MIN_FIT_SAMPLES = 4;

/**
 * How far past the newest sample the fit may be trusted. Beyond it the player
 * has stopped answering — the iframe died, the tab froze — and extrapolating
 * would file audio under a position invented out of nothing.
 */
const MAX_EXTRAPOLATION_MS = 1_500;

/**
 * How far *before* the oldest reading of the current run the clock will answer.
 *
 * Captured audio is always a little behind — the block being placed was heard a
 * tenth of a second ago — so a small amount of looking back is normal. Looking
 * further back than this is not: right after a seek the run is one reading old,
 * and the audio still in flight belongs to wherever the video was before the
 * jump. Answering for it would file the old passage under the new position.
 */
const MAX_BACKFILL_MS = 100;

/** A fitted rate outside this is not a rate, it is a bad fit. */
const MIN_PLAUSIBLE_RATE = 0.1;
const MAX_PLAUSIBLE_RATE = 4;

/** Where in the spread of readings the line is placed — see refit. High enough
 *  to sit on the leading edge, short of the maximum so one outlier cannot own
 *  the whole window. */
const INTERCEPT_QUANTILE = 0.9;

/** One reading straight off the player. */
export interface VideoClockSample {
  /** Position the player reports, in seconds of the video. */
  currentTime: number;
  /** Zero until the video has loaded enough to know its own length. */
  durationSec: number;
  /** Rate the player was told to run at — the fit's starting guess. */
  rate: number;
  /**
   * Whether the reported position is actually advancing with the audio.
   *
   * False for paused, buffering, unstarted — and for ads, where the position
   * belongs to a different recording entirely and anything filed under it would
   * be written into the wrong song.
   */
  isPlaying: boolean;
}

export interface VideoClock {
  /** Feeds a reading taken at `atMs` on the performance clock. */
  sample(sample: VideoClockSample, atMs: number): void;
  /**
   * Video position at an instant, or null when there is nothing trustworthy to
   * say — no samples yet, the video is not playing, or the player went quiet.
   */
  at(atMs: number): number | null;
  /** The rate the fit actually observed, which is not always the one asked for. */
  observedRate(): number;
  /** Longest duration any sample has reported. */
  durationSec(): number;
  /** Bumped whenever continuity broke — a seek, a stall, an ad. Lets a caller
   *  drop the state it was accumulating across the discontinuity. */
  epoch(): number;
}

interface Reading {
  atMs: number;
  videoSec: number;
}

export function createVideoClock(): VideoClock {
  const readings: Reading[] = [];
  let nominalRate = 1;
  let fittedRate = 1;
  let fittedOriginSec = 0;
  let fittedOriginMs = 0;
  let hasFit = false;
  let longestDuration = 0;
  let epoch = 0;

  /** Drops the run so far — used when the position stopped being continuous. */
  const breakContinuity = () => {
    if (readings.length > 0) epoch += 1;
    readings.length = 0;
    hasFit = false;
  };

  const positionAt = (atMs: number): number | null => {
    const newest = readings[readings.length - 1];
    if (!newest) return null;
    // The player has gone quiet. Extrapolating from a stale anchor would invent
    // positions, and audio filed under invented positions is worse than a gap.
    if (atMs - newest.atMs > MAX_EXTRAPOLATION_MS) return null;
    if (readings[0].atMs - atMs > MAX_BACKFILL_MS) return null;

    if (hasFit) return fittedOriginSec + (fittedRate * (atMs - fittedOriginMs)) / 1000;
    return newest.videoSec + (nominalRate * (atMs - newest.atMs)) / 1000;
  };

  /**
   * Fits the line the readings are samples of.
   *
   * The slope comes from least squares, because it has to: a video told to run
   * at 1.5× does not run at exactly 1.5×, and over a four-minute song even a
   * percent of error walks the waveform a whole beat out of place.
   *
   * Where the line *sits* is not a least-squares question, because the readings
   * are not scattered evenly about the truth. A player that has not refreshed
   * its answer since the last message reports where it was, never where it will
   * be, so the error only ever points one way — and a line through the middle of
   * those readings inherits half of that staleness as a standing lag. The top of
   * the scatter is the honest edge. A high quantile of it rather than the
   * outright maximum, so one reading that overshoots cannot drag the clock along
   * behind it for the whole window.
   */
  const refit = () => {
    if (readings.length < MIN_FIT_SAMPLES) {
      hasFit = false;
      return;
    }

    // Relative to the newest reading, so the numbers stay small and the fit is
    // anchored where it is actually used — at the present moment.
    const base = readings[readings.length - 1];
    const secondsSinceBase = (reading: Reading) => (reading.atMs - base.atMs) / 1000;

    let sumX = 0;
    let sumY = 0;
    for (const reading of readings) {
      sumX += secondsSinceBase(reading);
      sumY += reading.videoSec - base.videoSec;
    }
    const meanX = sumX / readings.length;
    const meanY = sumY / readings.length;

    let covariance = 0;
    let variance = 0;
    for (const reading of readings) {
      const x = secondsSinceBase(reading) - meanX;
      covariance += x * (reading.videoSec - base.videoSec - meanY);
      variance += x * x;
    }
    if (variance <= 0) {
      hasFit = false;
      return;
    }

    const slope = covariance / variance;
    // A nonsense slope means the readings were not a line — better to fall back
    // to the rate the player was told to run at than to trust the arithmetic.
    if (slope < MIN_PLAUSIBLE_RATE || slope > MAX_PLAUSIBLE_RATE) {
      hasFit = false;
      return;
    }

    const residuals = readings
      .map((reading) => reading.videoSec - slope * secondsSinceBase(reading))
      .sort((a, b) => a - b);

    fittedRate = slope;
    fittedOriginMs = base.atMs;
    fittedOriginSec = residuals[Math.floor((residuals.length - 1) * INTERCEPT_QUANTILE)];
    hasFit = true;
  };

  return {
    sample(sample: VideoClockSample, atMs: number): void {
      if (sample.durationSec > longestDuration) longestDuration = sample.durationSec;

      if (!sample.isPlaying || !Number.isFinite(sample.currentTime) || sample.currentTime < 0) {
        breakContinuity();
        return;
      }

      if (sample.rate > 0 && sample.rate !== nominalRate) {
        // The rate changed under the fit, so every older reading now describes a
        // different line. Keeping them would blend the two.
        nominalRate = sample.rate;
        breakContinuity();
      }

      const predicted = positionAt(atMs);
      if (predicted !== null && Math.abs(sample.currentTime - predicted) > JUMP_SEC) {
        breakContinuity();
      }

      readings.push({ atMs, videoSec: sample.currentTime });
      while (readings.length > 1 && atMs - readings[0].atMs > WINDOW_MS) readings.shift();
      refit();
    },

    at: positionAt,
    observedRate: () => (hasFit ? fittedRate : nominalRate),
    durationSec: () => longestDuration,
    epoch: () => epoch,
  };
}
