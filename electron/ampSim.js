// Amp simulator: real-time guitar monitoring with a tube-style effect chain.
// The DSP below (Biquad/AmpChain) runs inside the shared duplex stream owned by
// ./nativeAudioEngine, alongside note-detection capture — see that file for how the
// single ASIO/WASAPI stream is multiplexed between the two features. This module is
// now just the DSP + a thin adapter presenting the same start/stop/setParams/getStatus
// API it always has, so callers (electron/main.js) don't need to change.
//
// Signal chain (mono): high-pass → drive+waveshaper(tanh) → tone LPF →
// cabinet (LPF + presence peak) → level + soft limiter.

// ── RBJ biquad ───────────────────────────────────────────────────────────────
class Biquad {
  constructor() {
    this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0;
    this.x1 = 0; this.x2 = 0; this.y1 = 0; this.y2 = 0;
  }
  _set(b0, b1, b2, a0, a1, a2) {
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0;
    this.a1 = a1 / a0; this.a2 = a2 / a0;
  }
  lowpass(sr, f, Q) {
    const w = (2 * Math.PI * f) / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * Q);
    this._set((1 - cw) / 2, 1 - cw, (1 - cw) / 2, 1 + al, -2 * cw, 1 - al);
  }
  highpass(sr, f, Q) {
    const w = (2 * Math.PI * f) / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * Q);
    this._set((1 + cw) / 2, -(1 + cw), (1 + cw) / 2, 1 + al, -2 * cw, 1 - al);
  }
  peaking(sr, f, Q, gainDb) {
    const A = Math.pow(10, gainDb / 40);
    const w = (2 * Math.PI * f) / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * Q);
    this._set(1 + al * A, -2 * cw, 1 - al * A, 1 + al / A, -2 * cw, 1 - al / A);
  }
  process(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
  reset() { this.x1 = this.x2 = this.y1 = this.y2 = 0; }
}

// ── Amp chain ────────────────────────────────────────────────────────────────
class AmpChain {
  constructor(sr) {
    this.sr = sr;
    this.hpf = new Biquad();
    this.toneLpf = new Biquad();
    this.cabLpf = new Biquad();
    this.cabPeak = new Biquad();
    this.params = { drive: 0.5, tone: 0.5, level: 0.6, cab: true };
    this._applyFixed();
    this.setParams(this.params);
  }
  _applyFixed() {
    this.hpf.highpass(this.sr, 80, 0.707);    // remove rumble before clipping
    this.cabLpf.lowpass(this.sr, 5000, 0.707); // 4x12 high-end rolloff
    this.cabPeak.peaking(this.sr, 2500, 1.0, 3); // presence bump
  }
  setParams(p) {
    this.params = { ...this.params, ...p };
    // tone: 0 → dark (1.5kHz), 1 → bright (8kHz)
    const cutoff = 1500 + this.params.tone * 6500;
    this.toneLpf.lowpass(this.sr, cutoff, 0.707);
  }
  process(x) {
    const { drive, level, cab } = this.params;
    let s = this.hpf.process(x);
    const d = 1 + drive * 30;            // pre-gain into the waveshaper
    s = Math.tanh(s * d);                // tube-style soft clip
    s = this.toneLpf.process(s);
    if (cab) { s = this.cabLpf.process(s); s = this.cabPeak.process(s); }
    s = s * level * 0.7;                 // makeup compensation for tanh loudness
    // soft safety limiter
    if (s > 1) s = 1; else if (s < -1) s = -1;
    return s;
  }
  reset() { this.hpf.reset(); this.toneLpf.reset(); this.cabLpf.reset(); this.cabPeak.reset(); }
}

// ── Stream management ────────────────────────────────────────────────────────
// Lazily required (not at module load) to avoid a circular-require: the engine
// needs AmpChain from this file, so this file cannot require the engine at the top.
function start(opts = {}) {
  return require("./nativeAudioEngine").attachAmp(opts);
}

function setParams(p) {
  return require("./nativeAudioEngine").updateAmpParams(p);
}

function stop() {
  require("./nativeAudioEngine").detachAmp();
}

function getStatus() {
  return require("./nativeAudioEngine").getAmpStatus();
}

module.exports = { AmpChain, start, stop, setParams, getStatus };
