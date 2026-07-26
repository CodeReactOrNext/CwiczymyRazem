// Freeverb-style algorithmic reverb: parallel comb filters (with a damping lowpass
// in each feedback loop) summed and fed through series allpass filters. Cheap,
// proven, real-time-safe — no FFT/IR needed for the "room" tail (that's what
// convolver.js + a loaded cabinet IR is for; this is a separate, always-cheap block).
class Comb {
  constructor(delaySamples) {
    this.buf = new Float32Array(Math.max(1, Math.round(delaySamples)));
    this.pos = 0;
    this.filterStore = 0;
    this.feedback = 0.5;
    this.damp = 0.5;
  }
  process(x) {
    const output = this.buf[this.pos];
    this.filterStore = output * (1 - this.damp) + this.filterStore * this.damp;
    this.buf[this.pos] = x + this.filterStore * this.feedback;
    this.pos = this.pos + 1 === this.buf.length ? 0 : this.pos + 1;
    return output;
  }
  reset() {
    this.buf.fill(0);
    this.pos = 0;
    this.filterStore = 0;
  }
}

class Allpass {
  constructor(delaySamples) {
    this.buf = new Float32Array(Math.max(1, Math.round(delaySamples)));
    this.pos = 0;
    this.feedback = 0.5;
  }
  process(x) {
    const bufOut = this.buf[this.pos];
    const output = -x + bufOut;
    this.buf[this.pos] = x + bufOut * this.feedback;
    this.pos = this.pos + 1 === this.buf.length ? 0 : this.pos + 1;
    return output;
  }
  reset() {
    this.buf.fill(0);
    this.pos = 0;
  }
}

// Plain (non-feedback) delay line, used for pre-delay: the gap between the dry
// attack and the reverb tank starting to ring. Real rooms have this (time for the
// sound to reach the first wall and back); without it the tank's onset is glued
// to the transient and reads as a boxy "smear" instead of a spacious room.
class PreDelay {
  constructor(maxSamples) {
    this.buf = new Float32Array(Math.max(1, Math.round(maxSamples)));
    this.pos = 0;
    this.delaySamples = 0;
  }
  setDelay(samples) {
    this.delaySamples = Math.min(this.buf.length - 1, Math.max(0, Math.round(samples)));
  }
  process(x) {
    const len = this.buf.length;
    let readPos = this.pos - this.delaySamples;
    if (readPos < 0) readPos += len;
    const output = this.buf[readPos];
    this.buf[this.pos] = x;
    this.pos = this.pos + 1 === len ? 0 : this.pos + 1;
    return output;
  }
  reset() {
    this.buf.fill(0);
    this.pos = 0;
  }
}

// Slow modulated fractional delay feeding the tank. A static comb/allpass network
// rings at exactly the same fixed frequencies on every note, which is what makes
// vanilla Freeverb tails sound metallic/"boingy". A real room's air is never
// perfectly still, so its reflections drift by fractions of a millisecond —
// this reproduces that drift with sub-sample (linearly interpolated) reads
// around a fixed center delay, decorrelating the tank's resonances over time.
class Diffuser {
  constructor(sr) {
    this.maxDepth = Math.max(2, Math.round(sr * 0.006)); // ~6ms of modulation headroom
    this.center = this.maxDepth;
    this.depth = this.maxDepth * 0.5;
    this.buf = new Float32Array(this.maxDepth * 2 + 4);
    this.pos = 0;
    this.phase = 0;
    this.phaseInc = (2 * Math.PI * 0.35) / sr; // ~0.35Hz — room "breathing", not audible vibrato
  }
  process(x) {
    const len = this.buf.length;
    this.buf[this.pos] = x;
    const mod = Math.sin(this.phase) * this.depth;
    this.phase += this.phaseInc;
    if (this.phase > Math.PI * 2) this.phase -= Math.PI * 2;
    let readPos = this.pos - (this.center + mod);
    while (readPos < 0) readPos += len;
    const i0 = Math.floor(readPos);
    const frac = readPos - i0;
    const i1 = i0 + 1 === len ? 0 : i0 + 1;
    const output = this.buf[i0] * (1 - frac) + this.buf[i1] * frac;
    this.pos = this.pos + 1 === len ? 0 : this.pos + 1;
    return output;
  }
  reset() {
    this.buf.fill(0);
    this.pos = 0;
    this.phase = 0;
  }
}

// Classic Freeverb tunings, in samples @44100Hz — scaled to the running sample rate.
const COMB_TUNING_44K = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
const ALLPASS_TUNING_44K = [556, 441, 341, 225];

class Reverb {
  constructor(sr) {
    this.sr = sr;
    const scale = sr / 44100;
    this.combs = COMB_TUNING_44K.map((d) => new Comb(d * scale));
    this.allpasses = ALLPASS_TUNING_44K.map((d) => new Allpass(d * scale));
    this.preDelay = new PreDelay(sr * 0.08); // up to 80ms
    this.diffuser = new Diffuser(sr);
    this.params = { size: 0.5, damping: 0.5, mix: 0 };
    this.setParams(this.params);
  }
  setParams(p) {
    this.params = { ...this.params, ...p };
    const size = Math.min(1, Math.max(0, this.params.size));
    const damping = Math.min(1, Math.max(0, this.params.damping));
    this.params.mix = Math.min(1, Math.max(0, this.params.mix));
    // Room decay range capped below 1 for guaranteed stability.
    const feedback = Math.min(0.98, 0.28 + size * 0.7);
    const damp = damping * 0.9;
    this.combs.forEach((c) => { c.feedback = feedback; c.damp = damp; });
    // Bigger "room" → longer gap before the first reflection reaches the tank
    // (10ms small room .. 40ms cathedral), tied to the existing Size knob so
    // there's no new control to learn.
    this.preDelay.setDelay((0.01 + size * 0.03) * this.sr);
  }
  process(x) {
    const predelayed = this.preDelay.process(x);
    const diffused = this.diffuser.process(predelayed);
    let combSum = 0;
    for (const c of this.combs) combSum += c.process(diffused);
    combSum /= this.combs.length;
    let s = combSum;
    for (const a of this.allpasses) s = a.process(s);
    const { mix } = this.params;
    return x * (1 - mix) + s * mix;
  }
  reset() {
    this.combs.forEach((c) => c.reset());
    this.allpasses.forEach((a) => a.reset());
    this.preDelay.reset();
    this.diffuser.reset();
  }
}

module.exports = { Reverb, Comb, Allpass, PreDelay, Diffuser };
