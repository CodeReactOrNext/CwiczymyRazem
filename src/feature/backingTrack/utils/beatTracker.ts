/**
 * The recording's own beats, found from its attacks.
 *
 * A band does not play to the score's tempo, or to any single tempo: it
 * breathes, pushes the chorus, drags the bridge. Laying the tab on a constant
 * grid smears that over a whole song until every bar shift looks about as
 * good as every other. Tracking where the beats actually fall first, then
 * hanging the tab's beats on them, keeps the comparison sharp from the first
 * bar to the last.
 *
 * Dynamic-programming beat tracking (Ellis, 2007): each beat is placed where
 * the attacks are strong, at a spacing close to the tempo, by finding the best
 * chain of beats through the whole recording at once.
 */

/** How strongly spacing away from the tempo is penalised (librosa's default). */
const TIGHTNESS = 100;

/**
 * The beat period near `nominalBpm` that the recording's attacks repeat at,
 * in frames: the autocorrelation peak within ±12% of it.
 */
export function estimatePeriod(onset: Float32Array, fps: number, nominalBpm: number): number {
  const nominal = (60 / nominalBpm) * fps;
  const from = Math.max(2, Math.floor(nominal * 0.88));
  const to = Math.ceil(nominal * 1.12);
  let best = nominal;
  let bestValue = Number.NEGATIVE_INFINITY;
  for (let lag = from; lag <= to; lag += 1) {
    let sum = 0;
    for (let i = lag; i < onset.length; i += 1) sum += onset[i] * onset[i - lag];
    // A slight pull towards the score's tempo breaks near-ties the right way.
    const value = sum * (1 - 0.15 * Math.abs(lag - nominal) / nominal);
    if (value > bestValue) {
      bestValue = value;
      best = lag;
    }
  }
  // Parabolic interpolation for a period finer than one frame.
  const at = (lag: number) => {
    let sum = 0;
    for (let i = lag; i < onset.length; i += 1) sum += onset[i] * onset[i - lag];
    return sum;
  };
  const left = at(best - 1);
  const mid = at(best);
  const right = at(best + 1);
  const denominator = left - 2 * mid + right;
  return denominator < 0 ? best + (0.5 * (left - right)) / denominator : best;
}

/** Beat times in seconds, first to last, through the whole recording. */
export function trackBeats(onset: Float32Array, fps: number, periodFrames: number): number[] {
  const n = onset.length;
  if (n === 0 || !(periodFrames > 1)) return [];

  // Attack strength, lightly smoothed and normalised by its spread, so the
  // spacing penalty means the same in a quiet intro and a loud chorus.
  const local = new Float32Array(n);
  let mean = 0;
  for (let i = 0; i < n; i += 1) mean += onset[i];
  mean /= n;
  let variance = 0;
  for (let i = 0; i < n; i += 1) variance += (onset[i] - mean) ** 2;
  const spread = Math.sqrt(variance / n) || 1;
  for (let i = 0; i < n; i += 1) {
    const a = onset[Math.max(0, i - 1)];
    const b = onset[i];
    const c = onset[Math.min(n - 1, i + 1)];
    local[i] = (0.25 * a + 0.5 * b + 0.25 * c) / spread;
  }

  const score = new Float32Array(n);
  const backlink = new Int32Array(n).fill(-1);
  const minGap = Math.max(1, Math.round(periodFrames / 2));
  const maxGap = Math.round(periodFrames * 2);
  for (let t = 0; t < n; t += 1) {
    let best = 0;
    let bestFrom = -1;
    for (let gap = minGap; gap <= maxGap && t - gap >= 0; gap += 1) {
      const deviation = Math.log(gap / periodFrames);
      const candidate = score[t - gap] - TIGHTNESS * deviation * deviation;
      if (bestFrom < 0 || candidate > best) {
        best = candidate;
        bestFrom = t - gap;
      }
    }
    score[t] = local[t] + (bestFrom >= 0 ? Math.max(0, best) : 0);
    backlink[t] = bestFrom >= 0 && best > 0 ? bestFrom : -1;
  }

  // End on the best-scoring frame among the last period's worth, then walk back.
  let end = n - 1;
  for (let t = Math.max(0, n - Math.round(periodFrames)); t < n; t += 1) {
    if (score[t] > score[end]) end = t;
  }
  const frames: number[] = [];
  for (let t = end; t >= 0; t = backlink[t]) {
    frames.push(t);
    if (backlink[t] < 0) break;
  }
  frames.reverse();

  // The chain can stop short of the start (silence before the music): carry
  // the grid on backwards at the period so the tab can still start there.
  while (frames.length > 0 && frames[0] - periodFrames >= 0) {
    frames.unshift(frames[0] - periodFrames);
  }
  return frames.map((frame) => frame / fps);
}
