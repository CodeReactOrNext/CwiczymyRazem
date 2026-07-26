const { Oversampler2x } = require("./oversample");

// Cubic soft clip (Reiss/McPherson three-segment clip) — unity slope at the
// origin (small signals pass through nearly unchanged), rounding progressively
// harder as it approaches its natural ±2/3 ceiling. Symmetric (odd function),
// so unlike the amp's asymmetric tanh this introduces no DC bias.
function cubicClipShape(x, gain) {
  const driven = x * gain;
  if (driven <= -1) return -2 / 3;
  if (driven >= 1) return 2 / 3;
  return driven - (driven ** 3) / 3;
}

// Stompbox-style overdrive: the cubic clip above, deliberately NOT the tanh used
// by the amp's own Drive knob in ampSim.js. This runs as its own pedal stage
// ahead of the amp, so engaging both produces the cascaded-gain-stage grit of a
// real pedal-into-amp rig, with a distinctly harder, brighter knee than the
// amp's smoother tube-style saturation.
class Overdrive {
  constructor(sr) {
    this.sr = sr;
    this.toneLpf = 0; // one-pole lowpass state for the Tone control
    // 2x oversampling around the clip — see dsp/oversample.js for why (real
    // distortion plugins always do this; skipping it leaves audible aliasing).
    this.oversampler = new Oversampler2x(sr, cubicClipShape);
    this.params = { drive: 0.5, tone: 0.5, level: 0.5, mix: 0 };
    this.setParams(this.params);
  }
  setParams(p) {
    this.params = { ...this.params, ...p };
    const drive = Math.min(1, Math.max(0, this.params.drive));
    const tone = Math.min(1, Math.max(0, this.params.tone));
    this.params.level = Math.min(1, Math.max(0, this.params.level));
    this.params.mix = Math.min(1, Math.max(0, this.params.mix));
    this.preGain = 1 + drive * 14; // pedal-range gain — lower ceiling than the amp's own Drive
    // One-pole lowpass "Tone": dark (~600Hz) at 0 .. bright/near-unfiltered (~9kHz) at 1.
    const cutoff = 600 + tone * 8400;
    this.toneCoeff = Math.exp((-2 * Math.PI * cutoff) / this.sr);
  }
  process(x) {
    const shaped = this.oversampler.process(x, this.preGain);
    this.toneLpf = shaped * (1 - this.toneCoeff) + this.toneLpf * this.toneCoeff;
    const wet = this.toneLpf * (0.5 + this.params.level * 1.5); // level: attenuate .. boost
    const { mix } = this.params;
    return x * (1 - mix) + wet * mix;
  }
  reset() {
    this.toneLpf = 0;
    this.oversampler.reset();
  }
}

module.exports = { Overdrive };
