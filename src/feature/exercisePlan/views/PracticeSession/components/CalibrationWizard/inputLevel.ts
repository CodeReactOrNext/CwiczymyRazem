/**
 * Level math for the setup step: the live meter and the automatic gain.
 *
 * The processor's volume refs are RMS × 10, clamped to 0–1 (so 1 = −20 dBFS).
 * rawVolumeRef is measured before the app's input gain, volumeRef after it.
 * The level that matters for detection is the gained one — the silence gate,
 * the onset detectors and the hunts all hear the gained signal — but it is
 * computed here as raw × gain, because the gained ref clamps at 1 and would
 * hide how loud a hot input really is.
 *
 * Tab-note scoring itself gates on the raw level against the measured noise
 * floor, so no gain setting can rescue an input that's buried in noise — that
 * is reported separately ("noisy"), as is clipping, which happens in the
 * interface or the mic before the app ever sees the signal.
 */

/** Gained level (volume units) auto-gain aims the loud part of playing at — ≈ −28 dBFS RMS. */
export const TARGET_VOLUME = 0.4;
/** Below this gained level playing reads as too quiet — ≈ −38 dBFS RMS. */
export const GOOD_MIN_VOLUME = 0.12;
/** A raw sample this close to full scale means the input is clipping. */
export const CLIP_PEAK = 0.97;
/** Playing has to stand this many times above the room's noise floor (~12 dB). */
export const MIN_SNR = 4;
/** Below this raw level nothing is being played, whatever the noise floor says. */
export const MIN_SIGNAL_RAW = 0.002;
/** Frames of actual playing auto-gain needs before it trusts the measurement (~⅓ s at 60 fps). */
export const MIN_AUTO_FRAMES = 20;

export const MIN_GAIN = 0.5;
export const MAX_GAIN = 10;

/** The meter's scale, in dBFS RMS of the gained signal. */
export const METER_FLOOR_DB = -60;
export const METER_CEIL_DB = -10;

/** Volume units (RMS × 10) → dBFS. */
export const volumeToDb = (volume: number) =>
  volume > 0 ? 20 * Math.log10(volume / 10) : -Infinity;

/** Volume units → 0–1 position on the meter (dB scale, so quiet playing still moves it). */
export const volumeToMeter = (volume: number) => {
  const db = volumeToDb(volume);
  if (!Number.isFinite(db)) return 0;
  return Math.max(0, Math.min(1, (db - METER_FLOOR_DB) / (METER_CEIL_DB - METER_FLOOR_DB)));
};

/** The raw level something has to beat to count as playing rather than room noise. */
export const signalGate = (noiseFloor: number) => Math.max(MIN_SIGNAL_RAW, noiseFloor * MIN_SNR * 0.75);

export type LevelStatus = "silent" | "quiet" | "good" | "clipping";

/**
 * What the meter should say, from the levels held over the last second or two —
 * held, not instantaneous, so the label doesn't flip to "too quiet" between strums.
 */
export function classifyLevel({
  rawHold, rawPeakHold, gain, noiseFloor,
}: {
  /** Loudest raw volume of the hold window. */
  rawHold: number;
  /** Loudest raw sample of the hold window. */
  rawPeakHold: number;
  gain: number;
  noiseFloor: number;
}): LevelStatus {
  if (rawPeakHold >= CLIP_PEAK) return "clipping";
  if (rawHold <= signalGate(noiseFloor)) return "silent";
  if (rawHold * gain < GOOD_MIN_VOLUME) return "quiet";
  return "good";
}

export type AutoGainStatus =
  /** Nothing loud enough was played — the gain was left alone. */
  | "no_signal"
  /** The input clipped while measuring — turn the interface/mic down. */
  | "clipping"
  /** Even the maximum gain leaves playing quiet. */
  | "at_max"
  /** The guitar barely stands above the room noise — gain can't fix that. */
  | "noisy"
  | "ok";

export interface AutoGainResult {
  status: AutoGainStatus;
  gain: number;
}

const percentile = (values: readonly number[], p: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
};

const roundGain = (gain: number) => Math.round(gain * 10) / 10;

/**
 * Picks the input gain from a few seconds of playing.
 *
 * @param rawLevels raw volume per frame, only frames above {@link signalGate}
 * @param rawPeak loudest raw sample heard while measuring
 */
export function computeAutoGain({
  rawLevels, rawPeak, noiseFloor, currentGain,
}: {
  rawLevels: readonly number[];
  rawPeak: number;
  noiseFloor: number;
  currentGain: number;
}): AutoGainResult {
  if (rawLevels.length < MIN_AUTO_FRAMES) return { status: "no_signal", gain: currentGain };

  // The loud part of playing, not the attack spikes or the decaying tails.
  const loud = percentile(rawLevels, 0.85);
  const ideal = TARGET_VOLUME / loud;
  const gain = roundGain(Math.max(MIN_GAIN, Math.min(MAX_GAIN, ideal)));

  if (rawPeak >= CLIP_PEAK) return { status: "clipping", gain };
  if (ideal > MAX_GAIN) return { status: "at_max", gain };
  if (noiseFloor > 0 && loud < noiseFloor * MIN_SNR) return { status: "noisy", gain };
  return { status: "ok", gain };
}
