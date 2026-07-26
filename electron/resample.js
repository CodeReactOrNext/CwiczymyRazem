// Linear-interpolation resampler. Used only for cabinet IR loading (once per
// unique IR/sample-rate pair, then cached) — not in the real-time per-sample path,
// so simple linear interpolation is an acceptable quality/complexity trade-off.
function resampleLinear(samples, fromSr, toSr) {
  if (!samples || samples.length === 0) return new Float32Array(0);
  if (fromSr === toSr) return Float32Array.from(samples);

  const ratio = fromSr / toSr;
  const outLength = Math.max(1, Math.round(samples.length / ratio));
  const out = new Float32Array(outLength);
  const lastIndex = samples.length - 1;

  for (let i = 0; i < outLength; i++) {
    const srcPos = i * ratio;
    const i0 = Math.min(lastIndex, Math.floor(srcPos));
    const i1 = Math.min(lastIndex, i0 + 1);
    const frac = srcPos - i0;
    out[i] = samples[i0] * (1 - frac) + samples[i1] * frac;
  }
  return out;
}

module.exports = { resampleLinear };
