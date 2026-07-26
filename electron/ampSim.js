// Amp simulator: real-time guitar monitoring with a tube-style effect chain.
// The DSP below (Biquad/AmpChain) runs inside the shared duplex stream owned by
// ./nativeAudioEngine, alongside note-detection capture — see that file for how the
// single ASIO/WASAPI stream is multiplexed between the two features. This module is
// now just the DSP + a thin adapter presenting the same start/stop/setParams/getStatus
// API it always has, so callers (electron/main.js) don't need to change.
//
// Signal chain (mono): noise gate → overdrive pedal (oversampled cubic
// soft-clip) → high-pass → PREAMP stage (oversampled asymmetric-tanh gain #1)
// → DC blocker → 3-band tone stack (bass/mid/treble shelving+peaking) →
// POWER AMP stage (oversampled asymmetric-tanh gain #2, the `drive` knob) →
// DC blocker → cabinet (resonance peak + LPF + presence peak, OR a loaded IR
// convolution) → delay → reverb → level + soft limiter.
//
// Two cascaded gain stages (not one) because that's what actually separates a
// "real amp" sound from a single distortion box: a real tube amp's preamp
// section and power section each clip and interact with the tone stack
// between them, compounding harmonics rather than just adding one lump of
// gain. See asymClip() below and the two call sites in AmpChain.process().
//
// Every clipping stage runs through dsp/oversample.js's Oversampler2x: any
// real-time distortion plugin (Decapitator, Neural DSP, UAD, ...) oversamples
// around its waveshaper, because clipping at the project sample rate folds the
// harmonics it generates above Nyquist back down as inharmonic aliasing.
//
// When a NAM (Neural Amp Modeler) model is loaded and enabled, it REPLACES the
// preamp/tone-stack/power/cabinet block above (hpf through cab) — a captured
// .nam model already models all of that end-to-end. Gate/overdrive stay before
// it and delay/reverb stay after, same as pedals-into-amp-into-rack in a real
// rig. See dsp/nam.js and electron/nam/README.md for why this needs its own
// internal block-buffering (the WASM call overhead per sample is too high to
// call it the way every other stage here is called, one sample at a time).

const { Delay } = require("./dsp/delay");
const { Reverb } = require("./dsp/reverb");
const { Convolver } = require("./dsp/convolver");
const { Overdrive } = require("./dsp/overdrive");
const { Oversampler2x } = require("./dsp/oversample");
const { NamEngine } = require("./dsp/nam");

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
  // RBJ cookbook shelving filters (shelf slope S=1 — the standard "one knob" shape).
  lowShelf(sr, f, gainDb, S = 1) {
    const A = Math.pow(10, gainDb / 40);
    const w = (2 * Math.PI * f) / sr, cw = Math.cos(w), sw = Math.sin(w);
    const al = (sw / 2) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
    const sqA = Math.sqrt(A);
    this._set(
      A * ((A + 1) - (A - 1) * cw + 2 * sqA * al),
      2 * A * ((A - 1) - (A + 1) * cw),
      A * ((A + 1) - (A - 1) * cw - 2 * sqA * al),
      (A + 1) + (A - 1) * cw + 2 * sqA * al,
      -2 * ((A - 1) + (A + 1) * cw),
      (A + 1) + (A - 1) * cw - 2 * sqA * al
    );
  }
  highShelf(sr, f, gainDb, S = 1) {
    const A = Math.pow(10, gainDb / 40);
    const w = (2 * Math.PI * f) / sr, cw = Math.cos(w), sw = Math.sin(w);
    const al = (sw / 2) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
    const sqA = Math.sqrt(A);
    this._set(
      A * ((A + 1) + (A - 1) * cw + 2 * sqA * al),
      -2 * A * ((A - 1) + (A + 1) * cw),
      A * ((A + 1) + (A - 1) * cw - 2 * sqA * al),
      (A + 1) - (A - 1) * cw + 2 * sqA * al,
      2 * ((A - 1) - (A + 1) * cw),
      (A + 1) - (A - 1) * cw - 2 * sqA * al
    );
  }
  process(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
  reset() { this.x1 = this.x2 = this.y1 = this.y2 = 0; }
}

// Asymmetric soft clip shared by both amp gain stages below: the negative half
// saturates a bit less than the positive half, like a real triode stage biased
// into class-A (it doesn't conduct identically on both halves of the waveform).
// A perfectly symmetric tanh only generates odd harmonics and reads as flat/
// buzzy solid-state distortion; this adds the even-order content that makes
// tube-style gain sound "warm" instead of just "clipped". Bounded to (-1, 1)
// same as plain tanh, so no extra headroom is needed downstream.
function asymClip(driven) {
  return driven >= 0 ? Math.tanh(driven) : Math.tanh(driven * 0.85);
}

// Shape function passed to each stage's Oversampler2x — bakes the pre-gain
// multiply in so process() doesn't need a per-sample closure allocation.
function ampClipShape(x, gain) {
  return asymClip(x * gain);
}

// ── Noise gate ───────────────────────────────────────────────────────────────
// Envelope-follower gate ahead of the drive stage — without it, pickup hum and
// interface self-noise get amplified by `drive * 30` into audible hiss on the
// high-gain end of the range.
class NoiseGate {
  constructor(sr, { thresholdDb = -50, attackMs = 3, releaseMs = 150 } = {}) {
    this.threshold = Math.pow(10, thresholdDb / 20);
    this.attackCoeff = Math.exp(-1 / ((attackMs / 1000) * sr));
    this.releaseCoeff = Math.exp(-1 / ((releaseMs / 1000) * sr));
    this.envelope = 0;
    this.gain = 0;
  }
  process(x) {
    const rectified = Math.abs(x);
    this.envelope =
      rectified > this.envelope
        ? rectified + this.attackCoeff * (this.envelope - rectified)
        : rectified + this.releaseCoeff * (this.envelope - rectified);
    const target = this.envelope >= this.threshold ? 1 : 0;
    // Smooth the on/off gain itself (same attack/release feel) so the gate
    // doesn't click as it opens/closes.
    this.gain =
      target > this.gain
        ? target + this.attackCoeff * (this.gain - target)
        : target + this.releaseCoeff * (this.gain - target);
    return x * this.gain;
  }
  reset() { this.envelope = 0; this.gain = 0; }
}

// ── Amp chain ────────────────────────────────────────────────────────────────
class AmpChain {
  constructor(sr) {
    this.sr = sr;
    this.gate = new NoiseGate(sr);
    this.hpf = new Biquad();
    this.bassEq = new Biquad();
    this.midEq = new Biquad();
    this.trebleEq = new Biquad();
    this.cabRes = new Biquad();
    this.cabLpf = new Biquad();
    this.cabPeak = new Biquad();
    this.dcBlockPreamp = new Biquad();
    this.dcBlockPower = new Biquad();
    // 2x oversampling around each gain stage's clip — see dsp/oversample.js for why
    // (real distortion plugins always do this; skipping it leaves audible aliasing).
    this.preampOversampler = new Oversampler2x(sr, ampClipShape);
    this.powerOversampler = new Oversampler2x(sr, ampClipShape);
    this.delay = new Delay(sr);
    this.reverb = new Reverb(sr);
    this.convolver = new Convolver(sr);
    this.overdrive = new Overdrive(sr);
    this.nam = new NamEngine(sr);
    this.params = {
      preampGain: 0.3, drive: 0.5, bass: 0.5, mid: 0.5, treble: 0.5, level: 0.6, cab: true, gate: true,
      overdriveEnabled: false, overdriveDrive: 0.35, overdriveTone: 0.5, overdriveLevel: 0.5,
      delayEnabled: false, delayMs: 300, delayFeedback: 0.35, delayMix: 0.25,
      reverbEnabled: false, reverbSize: 0.5, reverbDamping: 0.5, reverbMix: 0.25,
      namEnabled: false, namModelId: null,
      irId: null,
    };
    this._applyFixed();
    this.setParams(this.params);
  }
  _applyFixed() {
    this.hpf.highpass(this.sr, 80, 0.707);    // remove rumble before clipping
    // Box resonance: real cabinets have a low-mid bump (~100-150Hz) from the
    // speaker/cabinet resonant frequency. The old model was just a highpass-ish
    // rolloff + a treble presence peak with nothing giving the sound "body" —
    // this is what was making the synthetic cab read as thin.
    this.cabRes.peaking(this.sr, 120, 1.3, 5);
    this.cabLpf.lowpass(this.sr, 5000, 0.707); // 4x12 high-end rolloff
    this.cabPeak.peaking(this.sr, 2500, 1.0, 3); // presence bump
    this.dcBlockPreamp.highpass(this.sr, 20, 0.707); // strip the bias each asymmetric clip stage adds
    this.dcBlockPower.highpass(this.sr, 20, 0.707);
  }
  setParams(p) {
    this.params = { ...this.params, ...p };
    const { bass, mid, treble, delayEnabled, delayMs, delayFeedback, delayMix,
      reverbEnabled, reverbSize, reverbDamping, reverbMix,
      overdriveEnabled, overdriveDrive, overdriveTone, overdriveLevel } = this.params;
    // 0..1 → ±12dB around the center detent (0.5 = flat), like a real tone stack.
    this.bassEq.lowShelf(this.sr, 120, (bass - 0.5) * 24);
    this.midEq.peaking(this.sr, 800, 0.8, (mid - 0.5) * 24);
    this.trebleEq.highShelf(this.sr, 3000, (treble - 0.5) * 24);
    // Effects always run (cheap); "enabled" just zeroes the wet mix so toggling
    // never clicks and needs no extra branch in process(). Unlike delay/reverb
    // (which have a user-facing Mix knob), the pedal is either fully in the
    // signal path or fully bypassed — real stompboxes don't blend.
    this.overdrive.setParams({
      drive: overdriveDrive, tone: overdriveTone, level: overdriveLevel, mix: overdriveEnabled ? 1 : 0,
    });
    this.delay.setParams({ delayMs, feedback: delayFeedback, mix: delayEnabled ? delayMix : 0 });
    this.reverb.setParams({ size: reverbSize, damping: reverbDamping, mix: reverbEnabled ? reverbMix : 0 });
    // irSamples/namModelJson are resolved by the caller (nativeAudioEngine, which
    // owns disk/fs access) and passed through only when irId/namModelId actually
    // changed — this module stays a pure DSP chain with no fs/Electron dependency
    // of its own. NamEngine.loadModel() is async (WASM); fire-and-forget here —
    // process() checks this.nam.isLoaded() each call and falls back to the
    // traditional amp chain until it resolves.
    if ("irSamples" in p) this.convolver.setIR(p.irSamples);
    if ("namModelJson" in p) this.nam.loadModel(p.namModelJson);
  }
  process(x) {
    const { preampGain, drive, level, cab, gate, namEnabled } = this.params;
    let s = gate ? this.gate.process(x) : x;
    s = this.overdrive.process(s);

    const useNam = namEnabled && this.nam.isLoaded();
    if (useNam) {
      s = this.nam.process(s);
    } else {
      s = this.hpf.process(s);

      // ── Preamp stage: the first gain stage, gentler ceiling than the power
      // stage below (pre-gain ×9 vs ×31) — it's meant to add the warmth of a
      // second cascaded tube stage, not do the amp's clipping by itself.
      s = this.preampOversampler.process(s, 1 + preampGain * 8);
      s = this.dcBlockPreamp.process(s);

      s = this.bassEq.process(s);
      s = this.midEq.process(s);
      s = this.trebleEq.process(s);

      // ── Power amp stage: final saturation before the cabinet, cascaded after
      // the tone stack like a real amp's output section — this is the original
      // `drive` knob, now the second of two gain stages instead of the only one.
      s = this.powerOversampler.process(s, 1 + drive * 30);
      s = this.dcBlockPower.process(s);

      if (cab) {
        if (this.convolver.ir) s = this.convolver.process(s);
        else { s = this.cabRes.process(s); s = this.cabLpf.process(s); s = this.cabPeak.process(s); }
      }
    }

    s = this.delay.process(s);
    s = this.reverb.process(s);
    s = s * level * 0.7;                 // makeup compensation for tanh loudness
    // soft safety limiter
    if (s > 1) s = 1; else if (s < -1) s = -1;
    return s;
  }
  reset() {
    this.gate.reset(); this.hpf.reset();
    this.preampOversampler.reset(); this.powerOversampler.reset();
    this.dcBlockPreamp.reset(); this.dcBlockPower.reset();
    this.bassEq.reset(); this.midEq.reset(); this.trebleEq.reset();
    this.cabRes.reset(); this.cabLpf.reset(); this.cabPeak.reset();
    this.delay.reset(); this.reverb.reset(); this.convolver.reset(); this.overdrive.reset();
    this.nam.reset();
  }
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
