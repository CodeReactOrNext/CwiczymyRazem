import type { TablatureNote } from "../../types/exercise.types";

import { getCachedNoiseBuffer } from "./audio.constants";

export function playDrumNote(
  ctx: AudioContext,
  note: TablatureNote,
  time: number,
  trackGain: GainNode,
): void {
  const t = Math.max(ctx.currentTime + 0.001, time);
  const accentScale = note.isAccented ? 1.35 : 1.0;

  const playTom = (startFreq: number, endFreq: number, dur: number, gainVal: number) => {
    gainVal *= accentScale;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur * 0.35);
    const env = ctx.createGain();
    env.gain.setValueAtTime(gainVal, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(env); env.connect(trackGain);
    osc.onended = () => { env.disconnect(); };
    osc.start(t); osc.stop(t + dur + 0.02);
    const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 12);
    const nbp = ctx.createBiquadFilter(); nbp.type = "bandpass";
    nbp.frequency.value = startFreq * 2; nbp.Q.value = 0.5;
    const ng = ctx.createGain(); ng.gain.value = gainVal * 0.4;
    ns.connect(nbp); nbp.connect(ng); ng.connect(trackGain);
    ns.onended = () => { nbp.disconnect(); ng.disconnect(); };
    ns.start(t); ns.stop(t + 0.012);
  };

  const midi = note.midiNote ?? (
    note.string <= 2 ? 36 :
    note.string === 3 ? 38 :
    note.string === 4 ? 42 :
    note.string === 5 ? 43 :
    38
  );

  switch (midi) {
    // ── Kick drums ────────────────────────────────────────────────────────────
    case 35:
    case 36: {
      const gain = 1.0 * accentScale;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(48, t + 0.07);
      const env = ctx.createGain();
      env.gain.setValueAtTime(gain, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(env); env.connect(trackGain);
      osc.onended = () => { env.disconnect(); };
      osc.start(t); osc.stop(t + 0.30);
      const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 15);
      const nbp = ctx.createBiquadFilter(); nbp.type = "bandpass"; nbp.frequency.value = 2500; nbp.Q.value = 0.7;
      const ng = ctx.createGain(); ng.gain.value = gain * 0.55;
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
      ns.connect(nbp); nbp.connect(ng); ng.connect(trackGain);
      ns.onended = () => { nbp.disconnect(); ng.disconnect(); };
      ns.start(t); ns.stop(t + 0.015);
      break;
    }

    // ── Side Stick / Rimshot ──────────────────────────────────────────────────
    case 37: {
      const gain = 0.7 * accentScale;
      const dur  = 0.07;
      const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 70);
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1500; bp.Q.value = 2.0;
      const nenv = ctx.createGain(); nenv.gain.setValueAtTime(gain, t); nenv.gain.exponentialRampToValueAtTime(0.001, t + dur);
      ns.connect(bp); bp.connect(nenv); nenv.connect(trackGain);
      ns.onended = () => { bp.disconnect(); nenv.disconnect(); };
      ns.start(t); ns.stop(t + dur);
      const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = 320;
      const tenv = ctx.createGain(); tenv.gain.setValueAtTime(gain * 0.7, t); tenv.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(tenv); tenv.connect(trackGain);
      osc.onended = () => { tenv.disconnect(); };
      osc.start(t); osc.stop(t + 0.05);
      break;
    }

    // ── Acoustic / Electric Snare ─────────────────────────────────────────────
    case 38:
    case 40: {
      const gain = 0.65 * accentScale;
      const dur  = 0.13;
      const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 130);
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 1.2;
      const nenv = ctx.createGain(); nenv.gain.setValueAtTime(gain, t); nenv.gain.exponentialRampToValueAtTime(0.001, t + dur);
      ns.connect(bp); bp.connect(nenv); nenv.connect(trackGain);
      ns.onended = () => { bp.disconnect(); nenv.disconnect(); };
      ns.start(t); ns.stop(t + dur);
      const osc = ctx.createOscillator(); osc.type = "triangle"; osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.04);
      const tenv = ctx.createGain(); tenv.gain.setValueAtTime(gain * 0.6, t); tenv.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(tenv); tenv.connect(trackGain);
      osc.onended = () => { tenv.disconnect(); };
      osc.start(t); osc.stop(t + 0.07);
      break;
    }

    // ── Hand Clap ─────────────────────────────────────────────────────────────
    case 39: {
      for (let i = 0; i < 3; i++) {
        const delay = i * 0.012;
        const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 40);
        const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1200; bp.Q.value = 0.8;
        const env = ctx.createGain();
        env.gain.setValueAtTime(Math.max(0.1, (0.5 - i * 0.1) * accentScale), t + delay);
        env.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.04);
        ns.connect(bp); bp.connect(env); env.connect(trackGain);
        ns.onended = () => { bp.disconnect(); env.disconnect(); };
        ns.start(t + delay); ns.stop(t + delay + 0.04);
      }
      break;
    }

    // ── Toms ──────────────────────────────────────────────────────────────────
    case 41: playTom(100, 52,  0.38, 0.90); break; // Low Floor Tom
    case 43: playTom(125, 65,  0.32, 0.90); break; // High Floor Tom
    case 45: playTom(155, 78,  0.27, 0.85); break; // Low Tom
    case 47: playTom(185, 92,  0.23, 0.85); break; // Low-Mid Tom
    case 48: playTom(225, 112, 0.20, 0.80); break; // Hi-Mid Tom
    case 50: playTom(275, 138, 0.17, 0.80); break; // High Tom

    // ── Closed Hi-Hat ─────────────────────────────────────────────────────────
    case 42:
    case 44: {
      const gain = 0.22 * accentScale;
      const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 40);
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 9000;
      const env = ctx.createGain(); env.gain.setValueAtTime(gain, t); env.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      ns.connect(hp); hp.connect(env); env.connect(trackGain);
      ns.onended = () => { hp.disconnect(); env.disconnect(); };
      ns.start(t); ns.stop(t + 0.04);
      break;
    }

    // ── Open Hi-Hat ───────────────────────────────────────────────────────────
    case 46: {
      const gain = 0.25 * accentScale;
      const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 300);
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 8000;
      const env = ctx.createGain(); env.gain.setValueAtTime(gain, t); env.gain.exponentialRampToValueAtTime(0.001, t + 0.30);
      ns.connect(hp); hp.connect(env); env.connect(trackGain);
      ns.onended = () => { hp.disconnect(); env.disconnect(); };
      ns.start(t); ns.stop(t + 0.30);
      break;
    }

    // ── Crash Cymbal ──────────────────────────────────────────────────────────
    case 49:
    case 57: {
      const gain = accentScale;
      const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 1400);
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 4500;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.50 * gain, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
      ns.connect(hp); hp.connect(env); env.connect(trackGain);
      ns.onended = () => { hp.disconnect(); env.disconnect(); };
      ns.start(t); ns.stop(t + 1.4);
      [3100, 5300, 7900].forEach((f, i) => {
        const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = f;
        const oe = ctx.createGain();
        oe.gain.setValueAtTime(0.06 * gain, t);
        oe.gain.exponentialRampToValueAtTime(0.001, t + 0.25 - i * 0.04);
        osc.connect(oe); oe.connect(trackGain);
        osc.onended = () => { oe.disconnect(); };
        osc.start(t); osc.stop(t + 0.27);
      });
      break;
    }

    // ── Ride Cymbal ───────────────────────────────────────────────────────────
    case 51:
    case 59: {
      const gain = accentScale;
      const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = 2800;
      const oenv = ctx.createGain();
      oenv.gain.setValueAtTime(0.18 * gain, t);
      oenv.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(oenv); oenv.connect(trackGain);
      osc.onended = () => { oenv.disconnect(); };
      osc.start(t); osc.stop(t + 0.47);
      const osc2 = ctx.createOscillator(); osc2.type = "sine"; osc2.frequency.value = 4300;
      const oenv2 = ctx.createGain();
      oenv2.gain.setValueAtTime(0.07 * gain, t);
      oenv2.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
      osc2.connect(oenv2); oenv2.connect(trackGain);
      osc2.onended = () => { oenv2.disconnect(); };
      osc2.start(t); osc2.stop(t + 0.22);
      const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 100);
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7500;
      const nenv = ctx.createGain(); nenv.gain.setValueAtTime(0.10 * gain, t); nenv.gain.exponentialRampToValueAtTime(0.001, t + 0.10);
      ns.connect(hp); hp.connect(nenv); nenv.connect(trackGain);
      ns.onended = () => { hp.disconnect(); nenv.disconnect(); };
      ns.start(t); ns.stop(t + 0.10);
      break;
    }

    // ── Ride Bell ─────────────────────────────────────────────────────────────
    case 53: {
      const gain = accentScale;
      const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = 1200;
      const oenv = ctx.createGain();
      oenv.gain.setValueAtTime(0.35 * gain, t);
      oenv.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(oenv); oenv.connect(trackGain);
      osc.onended = () => { oenv.disconnect(); };
      osc.start(t); osc.stop(t + 0.62);
      break;
    }

    // ── Chinese Cymbal ────────────────────────────────────────────────────────
    case 52: {
      const gain = accentScale;
      const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 600);
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 6000;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.4 * gain, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      ns.connect(hp); hp.connect(env); env.connect(trackGain);
      ns.onended = () => { hp.disconnect(); env.disconnect(); };
      ns.start(t); ns.stop(t + 0.6);
      break;
    }

    // ── Splash Cymbal ─────────────────────────────────────────────────────────
    case 55: {
      const gain = accentScale;
      const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 180);
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 8000;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.30 * gain, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      ns.connect(hp); hp.connect(env); env.connect(trackGain);
      ns.onended = () => { hp.disconnect(); env.disconnect(); };
      ns.start(t); ns.stop(t + 0.18);
      break;
    }

    // ── Cowbell ───────────────────────────────────────────────────────────────
    case 56: {
      const gain = accentScale;
      const osc1 = ctx.createOscillator(); osc1.type = "square"; osc1.frequency.value = 562;
      const osc2 = ctx.createOscillator(); osc2.type = "square"; osc2.frequency.value = 845;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 500;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.25 * gain, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc1.connect(hp); osc2.connect(hp); hp.connect(env); env.connect(trackGain);
      let _done = 0;
      const _cleanup = () => { if (++_done === 2) { hp.disconnect(); env.disconnect(); } };
      osc1.onended = _cleanup; osc2.onended = _cleanup;
      osc1.start(t); osc2.start(t); osc1.stop(t + 0.3); osc2.stop(t + 0.3);
      break;
    }

    // ── Tambourine ────────────────────────────────────────────────────────────
    case 54: {
      const gain = accentScale;
      for (let i = 0; i < 3; i++) {
        const d = i * 0.018;
        const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 30);
        const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7000;
        const env = ctx.createGain();
        env.gain.setValueAtTime((0.22 - i * 0.05) * gain, t + d);
        env.gain.exponentialRampToValueAtTime(0.001, t + d + 0.03);
        ns.connect(hp); hp.connect(env); env.connect(trackGain);
        ns.onended = () => { hp.disconnect(); env.disconnect(); };
        ns.start(t + d); ns.stop(t + d + 0.03);
      }
      break;
    }

    // ── Bongos ────────────────────────────────────────────────────────────────
    case 60: playTom(380, 260, 0.10, 0.70 * accentScale); break; // Hi Bongo
    case 61: playTom(260, 180, 0.14, 0.70 * accentScale); break; // Low Bongo

    // ── Congas ────────────────────────────────────────────────────────────────
    case 62: playTom(430, 300, 0.08, 0.65 * accentScale); break; // Mute Hi Conga
    case 63: playTom(310, 220, 0.12, 0.65 * accentScale); break; // Open Hi Conga
    case 64: playTom(210, 150, 0.16, 0.70 * accentScale); break; // Low Conga

    // ── Timbales ──────────────────────────────────────────────────────────────
    case 65: playTom(600, 450, 0.07, 0.60 * accentScale); break; // High Timbale
    case 66: playTom(420, 300, 0.09, 0.60 * accentScale); break; // Low Timbale

    // ── Claves ────────────────────────────────────────────────────────────────
    case 75: {
      const gain = accentScale;
      const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = 2500;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.5 * gain, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(env); env.connect(trackGain);
      osc.onended = () => { env.disconnect(); };
      osc.start(t); osc.stop(t + 0.07);
      break;
    }

    // ── Mute Triangle ─────────────────────────────────────────────────────────
    case 80: {
      const gain = accentScale;
      const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = 4200;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.28 * gain, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(env); env.connect(trackGain);
      osc.onended = () => { env.disconnect(); };
      osc.start(t); osc.stop(t + 0.10);
      break;
    }

    // ── Open Triangle ─────────────────────────────────────────────────────────
    case 81: {
      const gain = accentScale;
      const osc  = ctx.createOscillator(); osc.type  = "sine"; osc.frequency.value  = 4200;
      const osc2 = ctx.createOscillator(); osc2.type = "sine"; osc2.frequency.value = 6300;
      const env  = ctx.createGain();
      env.gain.setValueAtTime(0.25 * gain, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      osc.connect(env); osc2.connect(env); env.connect(trackGain);
      let _done = 0;
      const _cl = () => { if (++_done === 2) env.disconnect(); };
      osc.onended = _cl; osc2.onended = _cl;
      osc.start(t); osc2.start(t); osc.stop(t + 0.92); osc2.stop(t + 0.92);
      break;
    }

    // ── Default (misc percussion) ─────────────────────────────────────────────
    default: {
      const gain = accentScale;
      const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 150);
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 6000;
      const env = ctx.createGain(); env.gain.setValueAtTime(0.18 * gain, t); env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      ns.connect(hp); hp.connect(env); env.connect(trackGain);
      ns.onended = () => { hp.disconnect(); env.disconnect(); };
      ns.start(t); ns.stop(t + 0.15);
    }
  }
}
