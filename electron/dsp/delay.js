// Identity below full scale, smooth asymptotic cap above it. A plain feedback
// delay is a comb filter: a sustained tone near a multiple of 1/delayTime gets
// amplified by up to 1/(1-feedback) on every round trip (20x at feedback=0.95,
// the max the UI allows) — clamping feedback below 1 only guarantees the loop
// eventually decays, not that it stays inside ±1 while doing so. Left
// unchecked this rides straight into ampSim.js's final hard limiter and reads
// as harsh digital clipping. Applied only inside the feedback loop (not to the
// dry/wet output), so normal echoes are untouched — this is why a held chord
// with Feedback near max was the one place the delay actually sounded broken.
function softLimit(x) {
  const a = Math.abs(x);
  if (a <= 1) return x;
  return Math.sign(x) * (1 + Math.tanh(a - 1));
}

// Feedback delay line (circular buffer). Feedback is clamped below 1 to guarantee
// a decaying (stable) response regardless of what the UI sends.
class Delay {
  constructor(sr, maxMs = 1000) {
    this.sr = sr;
    this.buf = new Float32Array(Math.ceil((maxMs / 1000) * sr) + 1);
    this.writePos = 0;
    this.params = { delayMs: 300, feedback: 0.35, mix: 0 };
  }
  setParams(p) {
    this.params = { ...this.params, ...p };
    this.params.feedback = Math.min(0.95, Math.max(0, this.params.feedback));
    this.params.mix = Math.min(1, Math.max(0, this.params.mix));
  }
  process(x) {
    const { delayMs, feedback, mix } = this.params;
    const delaySamples = Math.min(
      this.buf.length - 1,
      Math.max(1, Math.round((delayMs / 1000) * this.sr))
    );
    let readPos = this.writePos - delaySamples;
    if (readPos < 0) readPos += this.buf.length;
    const delayed = this.buf[readPos];
    this.buf[this.writePos] = softLimit(x + delayed * feedback);
    this.writePos = this.writePos + 1 === this.buf.length ? 0 : this.writePos + 1;
    return x * (1 - mix) + delayed * mix;
  }
  reset() {
    this.buf.fill(0);
    this.writePos = 0;
  }
}

module.exports = { Delay };
