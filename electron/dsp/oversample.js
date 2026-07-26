// Generic 2x oversampling wrapper for a per-sample nonlinear shaping function.
// Real distortion plugins (Soundtoys Decapitator, Neural DSP amp plugins, UAD,
// etc.) always run their waveshaper at 2x+ the project sample rate and
// band-limit before decimating back down — skip that and the harmonics a hard
// clip generates above the original Nyquist fold back down as inharmonic
// aliasing, which is a big part of why naive digital distortion reads as
// "buzzy"/"fizzy" next to an analog circuit (which just rolls those off
// naturally instead of aliasing them).
//
// Upsampling here is a cheap linear interpolation (not a full polyphase FIR) —
// good enough to meaningfully cut aliasing on a guitar signal without the
// extra cost/latency a proper high-order interpolator would add.
class Oversampler2x {
  constructor(sr, shape) {
    this.shape = shape;
    this.prevIn = 0;
    const cutoff = sr * 0.45; // just under the ORIGINAL Nyquist
    const filterRate = sr * 2; // this filter ticks twice per original sample (the oversampled rate)
    this.coeff = Math.exp((-2 * Math.PI * cutoff) / filterRate);
    this.z1 = 0;
    this.z2 = 0;
  }
  // Cascaded one-pole lowpass (2nd order) — steeper than a single pole, still
  // cheap, used as the anti-imaging filter before decimating back to 1x.
  _lpf(x) {
    this.z1 = x * (1 - this.coeff) + this.z1 * this.coeff;
    this.z2 = this.z1 * (1 - this.coeff) + this.z2 * this.coeff;
    return this.z2;
  }
  process(x, gain) {
    const xMid = (this.prevIn + x) / 2; // linear-interpolated halfway point
    this.prevIn = x;
    this._lpf(this.shape(xMid, gain)); // oversampled point — filtered, then dropped on decimation
    return this._lpf(this.shape(x, gain)); // kept — this is the decimated output
  }
  reset() {
    this.prevIn = 0;
    this.z1 = 0;
    this.z2 = 0;
  }
}

module.exports = { Oversampler2x };
