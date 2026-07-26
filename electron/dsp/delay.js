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
    this.buf[this.writePos] = x + delayed * feedback;
    this.writePos = this.writePos + 1 === this.buf.length ? 0 : this.writePos + 1;
    return x * (1 - mix) + delayed * mix;
  }
  reset() {
    this.buf.fill(0);
    this.writePos = 0;
  }
}

module.exports = { Delay };
