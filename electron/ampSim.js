// Amp simulator: real-time guitar monitoring with a tube-style effect chain.
// Opens a DUPLEX RtAudio stream (input + output on the same ASIO/WASAPI device),
// runs the DSP per audio block in JS, and writes the processed signal back out.
//
// Signal chain (mono): high-pass → drive+waveshaper(tanh) → tone LPF →
// cabinet (LPF + presence peak) → level + soft limiter.
const { RtAudioFormat } = require("audify");
const shared = require("./rtaudio");

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
let isOpen = false;
let chain = null;
let info = null;

function start(opts = {}) {
  const r = shared.getRt();
  shared.closeStream(); // take over the device from any capture/amp stream
  isOpen = false;

  const api = (() => { try { return r.getApi(); } catch { return ""; } })();
  const isAsio = /asio/i.test(api);

  const devices = r.getDevices();
  const inDev =
    devices.find((d) => d.id === opts.deviceId && d.inputChannels > 0) ||
    devices.find((d) => d.isDefaultInput && d.inputChannels > 0) ||
    devices.find((d) => d.inputChannels > 0);
  if (!inDev) throw new Error("No suitable input device for amp sim");
  const inDevId = inDev.id;

  // ASIO is one driver for both directions → output = input device.
  // WASAPI/CoreAudio/DS: input (mic/interface) has no output, so route to the
  // default render device (or the explicitly chosen output) instead.
  let outDev;
  if (isAsio) {
    outDev = inDev;
  } else if (opts.outputDeviceId != null) {
    outDev = devices.find((d) => d.id === opts.outputDeviceId && d.outputChannels > 0);
  }
  if (!outDev) {
    const defOutId = (() => { try { return r.getDefaultOutputDevice(); } catch { return undefined; } })();
    outDev =
      devices.find((d) => d.id === defOutId && d.outputChannels > 0) ||
      devices.find((d) => d.outputChannels > 0);
  }
  if (!outDev) throw new Error("No output device available for amp monitoring");
  const outDevId = outDev.id;

  const sampleRate = opts.sampleRate || inDev.preferredSampleRate || 48000;
  const reqFrame = opts.frameSize || 256;
  const inChannel = Math.max(0, Math.min(opts.channel || 0, Math.max(0, inDev.inputChannels - 1)));
  const outChannels = Math.min(2, outDev.outputChannels || 2) || 1;

  chain = new AmpChain(sampleRate);
  if (opts.params) chain.setParams(opts.params);

  const actualFrame = r.openStream(
    { deviceId: outDevId, nChannels: outChannels, firstChannel: 0 },
    { deviceId: inDevId, nChannels: 1, firstChannel: inChannel },
    RtAudioFormat.RTAUDIO_FLOAT32,
    sampleRate,
    reqFrame,
    "CwiczymyRazem-amp",
    (inputBuffer) => {
      // The driver can deliver a few more blocks after stop()/restart has already
      // nulled the chain. Bail out instead of dereferencing null.
      const activeChain = chain;
      if (!activeChain) return;
      // Read mono input safely (4-byte alignment guard), process, write out.
      const n = Math.floor(inputBuffer.byteLength / 4);
      let inF;
      if (inputBuffer.byteOffset % 4 === 0) {
        inF = new Float32Array(inputBuffer.buffer, inputBuffer.byteOffset, n);
      } else {
        const c = Buffer.from(inputBuffer); inF = new Float32Array(c.buffer, c.byteOffset, n);
      }
      const out = new Float32Array(n * outChannels);
      for (let i = 0; i < n; i++) {
        const y = activeChain.process(inF[i]);
        for (let ch = 0; ch < outChannels; ch++) out[i * outChannels + ch] = y;
      }
      try { r.write(Buffer.from(out.buffer, out.byteOffset, out.byteLength)); }
      catch { /* stream closing — drop this block */ }
    },
    null
  );
  r.start();
  isOpen = true;

  let latFrames = 0;
  try { latFrames = r.getStreamLatency ? r.getStreamLatency() : 0; } catch { /* ignore */ }

  info = {
    deviceName: inDev.name,
    sampleRate,
    frameSize: actualFrame || reqFrame,
    outChannels,
    inChannel,
    roundTripMs: ((latFrames + (actualFrame || reqFrame) * 2) / sampleRate) * 1000,
    params: chain.params,
  };
  return info;
}

function setParams(p) {
  if (chain) chain.setParams(p || {});
  if (info && chain) info.params = chain.params;
  return info;
}

function stop() {
  shared.closeStream();
  isOpen = false;
  chain = null;
  info = null;
}

function getStatus() {
  return { isOpen, info };
}

module.exports = { start, stop, setParams, getStatus };
