/**
 * Timing calibration: the player plucks a string on every click of a short
 * click track, and the typical gap between each click and the attack we detect
 * for it is the whole chain's delay — output buffer, speakers or (Bluetooth)
 * headphones, the player's ear and hand, the input, the page or IPC hand-off and
 * our own DSP. Estimating that from browser-reported latencies can't see most of
 * it; measuring it end to end can.
 *
 * The result replaces the estimated latency when grading tab notes, so it is
 * measured in exactly the domain the matcher compares in: detected attack time
 * (Date.now()-domain, see guitarBufferProcessor) minus the wall-clock time the
 * click was scheduled for on the audio clock.
 */

export const CALIBRATION_BPM = 80;
/** Clicks before measuring starts — two bars to find the pulse, never graded. */
export const CALIBRATION_COUNT_IN = 8;
export const CALIBRATION_CLICKS = 12;
/** Fewer heard clicks than this and the median says more about noise than delay. */
export const CALIBRATION_MIN_HITS = 8;
/** Median distance of the hits from their own median. Wider than this and the
 *  player was guessing, not following the click — the median isn't a delay. */
export const CALIBRATION_MAX_SPREAD_MS = 35;

export const CALIBRATION_GAP_MS = 60000 / CALIBRATION_BPM;

/**
 * Where an attack may land to count as the answer to a click: a little before
 * it (anticipating) and well after it (a slow chain — Bluetooth alone can add
 * 200+ ms). At 80 BPM the two windows of neighbouring clicks never overlap.
 */
const EARLY_SHARE = 0.3;
const LATE_SHARE = 0.6;

/** Sanity bounds for a delay a real setup could have. */
const MIN_LATENCY_MS = 0;
const MAX_LATENCY_MS = 450;
/**
 * A typical attack this far AHEAD of the click isn't a fast setup — sound can't
 * reach us before it is played. Either the player ran ahead, or the detector
 * fired on something else: a string muted between clicks rings out into the
 * noise floor, and that decay reads as an "attack" well before the next pick.
 */
const MAX_AHEAD_MS = 30;

/**
 * Pairs each click with the first attack inside its window, each attack used at
 * most once. The first, not the closest: a pick often fires a second, weaker
 * onset as the string settles, and the attack is the earlier of the two.
 *
 * Returns, per click, the attack's delay after it in ms (null: nothing heard).
 */
export const matchAttacksToClicks = (
  clickMs: readonly number[],
  attackMs: readonly number[],
  gapMs: number = CALIBRATION_GAP_MS,
): (number | null)[] => {
  const attacks = [...attackMs].sort((a, b) => a - b);
  const used = new Set<number>();
  return clickMs.map((click) => {
    const from = click - gapMs * EARLY_SHARE;
    const to = click + gapMs * LATE_SHARE;
    for (let i = 0; i < attacks.length; i++) {
      if (used.has(i)) continue;
      if (attacks[i] < from) continue;
      if (attacks[i] > to) break;
      used.add(i);
      return attacks[i] - click;
    }
    return null;
  });
};

const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export type CalibrationResult =
  | { ok: true; latencyMs: number; spreadMs: number; hits: number; total: number }
  | { ok: false; reason: "tooFewHits"; hits: number; total: number }
  | { ok: false; reason: "ahead"; hits: number; total: number }
  | { ok: false; reason: "inconsistent"; spreadMs: number; hits: number; total: number };

/**
 * Turns the per-click delays into one latency. Median, not mean: one missed
 * pick that got paired with string noise must not move the result.
 */
export const measureTimingLatency = (delays: readonly (number | null)[]): CalibrationResult => {
  const heard = delays.filter((d): d is number => d !== null);
  const total = delays.length;
  if (heard.length < CALIBRATION_MIN_HITS) {
    return { ok: false, reason: "tooFewHits", hits: heard.length, total };
  }
  const center = median(heard);
  const spreadMs = Math.round(median(heard.map((d) => Math.abs(d - center))));
  if (spreadMs > CALIBRATION_MAX_SPREAD_MS) {
    return { ok: false, reason: "inconsistent", spreadMs, hits: heard.length, total };
  }
  if (center < -MAX_AHEAD_MS) {
    return { ok: false, reason: "ahead", hits: heard.length, total };
  }
  const latencyMs = Math.round(Math.min(MAX_LATENCY_MS, Math.max(MIN_LATENCY_MS, center)));
  return { ok: true, latencyMs, spreadMs, hits: heard.length, total };
};
