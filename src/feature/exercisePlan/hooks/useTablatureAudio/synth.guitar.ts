import type { BendPoint } from "../../types/exercise.types";

import { getCachedNoiseBuffer, SOFT_CLIP_CURVE_LIGHT } from "./audio.constants";
import type { StringSynthOptions } from "./types";

// ── Guitar synthesis ──────────────────────────────────────────────────────────

export function synthGuitar(
  ctx: AudioContext,
  freq: number,
  t: number,
  trackGain: GainNode,
  duration: number,
  opts: StringSynthOptions = {},
): void {
  const { isPalmMute, isVibrato, isBend, bendCurve, bendSemitones, gainScale = 1 } = opts;

  const peak        = (isPalmMute ? 0.50 : 0.28) * gainScale;
  const sustainLvl  = peak * 0.40;
  const sustainEnd  = isPalmMute ? t + Math.min(0.055, duration) : t + Math.max(duration, 0.15);
  const releaseTime = isPalmMute ? sustainEnd + 0.020 : sustainEnd + 0.15;
  const stopTime    = releaseTime + 0.05;

  const osc1 = ctx.createOscillator(); osc1.type = "triangle"; osc1.frequency.setValueAtTime(freq, t);
  const osc2 = ctx.createOscillator(); osc2.type = "sine";     osc2.frequency.setValueAtTime(freq, t);

  if (isBend) {
    const applyBend = (param: AudioParam) => {
      if (bendCurve && bendCurve.length > 0) {
        const offset = 0.02;
        param.setValueAtTime(freq * Math.pow(2, bendCurve[0].cents / 1200), t + offset);
        for (let i = 1; i < bendCurve.length; i++) {
          param.linearRampToValueAtTime(freq * Math.pow(2, bendCurve[i].cents / 1200), t + offset + bendCurve[i].position * duration);
        }
      } else if (bendSemitones) {
        param.setValueAtTime(freq, t + 0.05);
        param.linearRampToValueAtTime(freq * Math.pow(2, bendSemitones / 12), t + 0.22);
      }
    };
    applyBend(osc1.frequency);
    applyBend(osc2.frequency);
  }

  if (isVibrato) {
    const lfo  = ctx.createOscillator(); lfo.frequency.value = 5.5;
    const lfoG = ctx.createGain();
    lfoG.gain.setValueAtTime(0, t + 0.08);
    lfoG.gain.linearRampToValueAtTime(freq * 0.022, t + 0.26);
    lfo.connect(lfoG);
    lfoG.connect(osc1.frequency);
    lfoG.connect(osc2.frequency);
    lfo.start(t + 0.08); lfo.stop(stopTime);
    lfo.onended = () => { lfoG.disconnect(); };
  }

  const g1 = ctx.createGain(); g1.gain.value = 0.65;
  const g2 = ctx.createGain(); g2.gain.value = 0.30;
  osc1.connect(g1); osc2.connect(g2);

  const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 10);
  const ng = ctx.createGain(); ng.gain.value = (isPalmMute ? 0.40 : 0.18) * gainScale;

  const filter = ctx.createBiquadFilter(); filter.type = "lowpass";
  if (isPalmMute) {
    filter.frequency.setValueAtTime(freq * 2.5, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.1, 180), t + 0.03);
    filter.Q.value = 3.0;
  } else {
    filter.frequency.setValueAtTime(Math.min(freq * 8, 16000), t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 2.5, 800), t + 0.06);
    filter.Q.value = 1.0;
  }

  const ws = ctx.createWaveShaper(); ws.curve = SOFT_CLIP_CURVE_LIGHT; ws.oversample = "2x";

  const env = ctx.createGain();
  if (isPalmMute) {
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peak, t + 0.003);
    env.gain.exponentialRampToValueAtTime(0.001, sustainEnd);
  } else {
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peak, t + 0.004);
    env.gain.exponentialRampToValueAtTime(sustainLvl, t + 0.08);
    env.gain.setValueAtTime(sustainLvl, sustainEnd);
    env.gain.exponentialRampToValueAtTime(0.001, releaseTime);
  }

  g1.connect(filter); g2.connect(filter); ng.connect(filter);
  filter.connect(ws); ws.connect(env); env.connect(trackGain);

  let _done = 0;
  const _cleanup = () => {
    if (++_done === 3) { g1.disconnect(); g2.disconnect(); ng.disconnect(); filter.disconnect(); ws.disconnect(); env.disconnect(); }
  };
  ns.onended = _cleanup; osc1.onended = _cleanup; osc2.onended = _cleanup;
  ns.start(t); ns.stop(t + 0.010);
  osc1.start(t); osc1.stop(stopTime);
  osc2.start(t); osc2.stop(stopTime);
}

// ── Bass synthesis ────────────────────────────────────────────────────────────

export function synthBass(
  ctx: AudioContext,
  freq: number,
  t: number,
  trackGain: GainNode,
  duration: number,
  opts: StringSynthOptions = {},
): void {
  const { isPalmMute, isVibrato, isBend, bendCurve, bendSemitones, gainScale = 1 } = opts;

  const peak        = (isPalmMute ? 0.65 : 0.50) * gainScale;
  const sustainLvl  = peak * 0.40;
  const sustainEnd  = isPalmMute ? t + Math.min(0.065, duration) : t + Math.max(duration, 0.20);
  const releaseTime = isPalmMute ? sustainEnd + 0.025 : sustainEnd + 0.18;
  const stopTime    = releaseTime + 0.05;

  const osc1 = ctx.createOscillator(); osc1.type = "sine";     osc1.frequency.setValueAtTime(freq, t);
  const osc2 = ctx.createOscillator(); osc2.type = "triangle"; osc2.frequency.setValueAtTime(freq, t);
  const osc3 = ctx.createOscillator(); osc3.type = "sine";     osc3.frequency.setValueAtTime(freq * 2, t);

  if (isBend) {
    const applyBend = (param: AudioParam, baseFreq: number) => {
      if (bendCurve && bendCurve.length > 0) {
        const offset = 0.02;
        param.setValueAtTime(baseFreq * Math.pow(2, bendCurve[0].cents / 1200), t + offset);
        for (let i = 1; i < bendCurve.length; i++) {
          param.linearRampToValueAtTime(baseFreq * Math.pow(2, bendCurve[i].cents / 1200), t + offset + bendCurve[i].position * duration);
        }
      } else if (bendSemitones) {
        param.setValueAtTime(baseFreq, t + 0.05);
        param.linearRampToValueAtTime(baseFreq * Math.pow(2, bendSemitones / 12), t + 0.22);
      }
    };
    applyBend(osc1.frequency, freq);
    applyBend(osc2.frequency, freq);
    applyBend(osc3.frequency, freq * 2);
  }

  if (isVibrato) {
    const lfo  = ctx.createOscillator(); lfo.frequency.value = 5.5;
    const lfoG = ctx.createGain();
    lfoG.gain.setValueAtTime(0, t + 0.08);
    lfoG.gain.linearRampToValueAtTime(freq * 0.018, t + 0.26);
    lfo.connect(lfoG);
    lfoG.connect(osc1.frequency);
    lfoG.connect(osc2.frequency);
    lfo.start(t + 0.08); lfo.stop(stopTime);
    lfo.onended = () => { lfoG.disconnect(); };
  }

  const g1 = ctx.createGain(); g1.gain.value = 0.50;
  const g2 = ctx.createGain(); g2.gain.value = 0.38;
  const g3 = ctx.createGain(); g3.gain.value = 0.10;
  osc1.connect(g1); osc2.connect(g2); osc3.connect(g3);

  const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 8);
  const ng = ctx.createGain(); ng.gain.value = 0.18 * gainScale;

  const filter = ctx.createBiquadFilter(); filter.type = "lowpass";
  if (isPalmMute) {
    filter.frequency.setValueAtTime(Math.min(freq * 3, 800), t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.2, 100), t + 0.04);
    filter.Q.value = 2.0;
  } else {
    filter.frequency.setValueAtTime(Math.min(freq * 5, 3000), t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.8, 150), t + 0.08);
    filter.Q.value = 0.7;
  }

  const ws = ctx.createWaveShaper(); ws.curve = SOFT_CLIP_CURVE_LIGHT; ws.oversample = "2x";

  const env = ctx.createGain();
  if (isPalmMute) {
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peak, t + 0.004);
    env.gain.exponentialRampToValueAtTime(0.001, sustainEnd);
  } else {
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peak, t + 0.007);
    env.gain.exponentialRampToValueAtTime(sustainLvl, t + 0.09);
    env.gain.setValueAtTime(sustainLvl, sustainEnd);
    env.gain.exponentialRampToValueAtTime(0.001, releaseTime);
  }

  g1.connect(filter); g2.connect(filter); g3.connect(filter); ng.connect(filter);
  filter.connect(ws); ws.connect(env); env.connect(trackGain);

  let _done = 0;
  const _cleanup = () => {
    if (++_done === 4) { g1.disconnect(); g2.disconnect(); g3.disconnect(); ng.disconnect(); filter.disconnect(); ws.disconnect(); env.disconnect(); }
  };
  ns.onended = _cleanup; osc1.onended = _cleanup; osc2.onended = _cleanup; osc3.onended = _cleanup;
  ns.start(t); ns.stop(t + 0.008);
  osc1.start(t); osc1.stop(stopTime);
  osc2.start(t); osc2.stop(stopTime);
  osc3.start(t); osc3.stop(stopTime);
}
