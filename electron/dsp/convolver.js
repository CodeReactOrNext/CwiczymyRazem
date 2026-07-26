// Direct time-domain FIR convolution for cabinet IR loading. Capped at a fixed
// (sample-rate-independent) tap count so worst-case CPU cost stays bounded — see
// electron/bench-convolve.js for the measurement that picked this constant.
//
// Uses a "doubled ring buffer" (write every sample to both `pos` and `pos+N`) so the
// per-tap inner loop reads a contiguous descending slice with no wraparound branch —
// a meaningful speedup for a hand-written convolution loop in V8.
const MAX_IR_TAPS = 2048;

class Convolver {
  constructor(sr) {
    this.sr = sr;
    this.ir = null;
    this.n = 0;
    this.hist = null;
    this.pos = 0;
  }
  setIR(samples) {
    if (!samples || samples.length === 0) {
      this.ir = null; this.n = 0; this.hist = null; this.pos = 0;
      return;
    }
    const n = Math.min(samples.length, MAX_IR_TAPS);
    this.ir = samples instanceof Float32Array ? samples.subarray(0, n) : Float32Array.from(samples.slice(0, n));
    this.n = n;
    this.hist = new Float32Array(n * 2);
    this.pos = 0;
  }
  process(x) {
    if (!this.ir) return x;
    const n = this.n, ir = this.ir, hist = this.hist;
    const pos = this.pos;
    hist[pos] = x;
    hist[pos + n] = x;
    let acc = 0;
    let idx = pos + n;
    for (let k = 0; k < n; k++) {
      acc += hist[idx] * ir[k];
      idx--;
    }
    this.pos = pos + 1 === n ? 0 : pos + 1;
    return acc;
  }
  reset() {
    if (this.hist) this.hist.fill(0);
    this.pos = 0;
  }
}

module.exports = { Convolver, MAX_IR_TAPS };
