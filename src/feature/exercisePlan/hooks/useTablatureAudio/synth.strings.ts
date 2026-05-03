import type Soundfont from "soundfont-player";

import type { TablatureNote } from "../../types/exercise.types";
import { BASS_STRING_FREQS, BASS_STRING_MIDI, getCachedNoiseBuffer, GUITAR_STRING_FREQS, GUITAR_STRING_MIDI } from "./audio.constants";
import { synthBass, synthGuitar } from "./synth.guitar";
import type { StringSynthOptions } from "./types";

export interface StringPlayers {
  guitar:      Soundfont.Player | null;
  mutedGuitar: Soundfont.Player | null;
  bass:        Soundfont.Player | null;
  vocals:      Soundfont.Player | null;
}

// ── Dead note: percussive thud, no pitch ──────────────────────────────────────

export function playDeadNote(
  ctx: AudioContext,
  t: number,
  trackGain: GainNode,
  trackType: "guitar" | "bass" | "vocals",
): void {
  const dur = 0.035;
  const ns  = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 35);
  const lp  = ctx.createBiquadFilter(); lp.type = "lowpass";
  lp.frequency.value = trackType === "bass" ? 500 : 900; lp.Q.value = 0.6;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.55, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + dur);
  ns.connect(lp); lp.connect(env); env.connect(trackGain);
  ns.onended = () => { lp.disconnect(); env.disconnect(); };
  ns.start(t); ns.stop(t + dur);
}

// ── Natural / Artificial harmonic — pure bell-like sine ───────────────────────

export function playHarmonicNote(
  ctx: AudioContext,
  freq: number,
  t: number,
  trackGain: GainNode,
  duration: number,
  gainScale = 1,
): void {
  const sustain = Math.max(duration * 3.5, 1.2);
  const peak    = 0.38 * gainScale;

  const osc1 = ctx.createOscillator(); osc1.type = "sine"; osc1.frequency.value = freq;
  const osc2 = ctx.createOscillator(); osc2.type = "sine"; osc2.frequency.value = freq * 2;
  const g1   = ctx.createGain(); g1.gain.value = 0.75;
  const g2   = ctx.createGain(); g2.gain.value = 0.18;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t + 0.008);
  env.gain.exponentialRampToValueAtTime(0.001, t + sustain);

  osc1.connect(g1); osc2.connect(g2);
  g1.connect(env); g2.connect(env); env.connect(trackGain);

  let _done = 0;
  const _cleanup = () => { if (++_done === 2) { g1.disconnect(); g2.disconnect(); env.disconnect(); } };
  osc1.onended = _cleanup; osc2.onended = _cleanup;
  osc1.start(t); osc2.start(t);
  osc1.stop(t + sustain + 0.05); osc2.stop(t + sustain + 0.05);
}

// ── String note player (soundfont preferred, synth fallback) ──────────────────

export function playStringNote(
  ctx: AudioContext,
  note: TablatureNote,
  time: number,
  trackGain: GainNode,
  duration: number,
  trackType: "guitar" | "bass" | "vocals",
  trackId: string,
  activeNodes: Map<string, any>,
  players: StringPlayers,
): void {
  const t = Math.max(ctx.currentTime + 0.001, time);

  if (note.isDead) { playDeadNote(ctx, t, trackGain, trackType); return; }

  // ── Pitch resolution ──────────────────────────────────────────────────────
  let midiNote: number;
  let freq: number;

  if (trackType === "vocals" && note.midiNote !== undefined) {
    midiNote = note.midiNote;
    freq     = 440 * Math.pow(2, (midiNote - 69) / 12);
  } else {
    const midiBase = trackType === "bass" ? BASS_STRING_MIDI[note.string - 1] : GUITAR_STRING_MIDI[note.string - 1];
    const freqBase = trackType === "bass" ? BASS_STRING_FREQS[note.string - 1] : GUITAR_STRING_FREQS[note.string - 1];
    if (midiBase === undefined || freqBase === undefined) return;
    midiNote = midiBase + note.fret;
    freq     = freqBase * Math.pow(2, note.fret / 12);
  }

  if (!isFinite(freq) || freq <= 0 || midiNote < 0 || midiNote > 127) return;

  // ── Gain scale: dynamics + ghost + accent ────────────────────────────────
  const dynScale    = note.dynamics !== undefined ? Math.max(0.05, note.dynamics) : 1.0;
  const ghostScale  = note.isGhost    ? 0.28 : 1.0;
  const accentScale = note.isAccented ? 1.25 : 1.0;
  const gainScale   = dynScale * ghostScale * accentScale;

  // ── Duration modifiers ────────────────────────────────────────────────────
  let effectiveDuration = duration;
  if (note.isLetRing)  effectiveDuration = Math.max(duration * 4.0, 2.0);
  if (note.isStaccato) effectiveDuration = Math.max(duration * 0.15, 0.025);
  if (note.isPalmMute) effectiveDuration = Math.min(effectiveDuration, 0.10);

  // ── Note-off: stop previous note on the same string ──────────────────────
  const noteKey  = `${trackId}-${note.string}`;
  const prevNode = activeNodes.get(noteKey);
  if (prevNode) {
    try { prevNode.stop(t); } catch { /* already ended */ }
    activeNodes.delete(noteKey);
  }

  if (note.harmonicType && note.harmonicType > 0) {
    playHarmonicNote(ctx, freq, t, trackGain, effectiveDuration, gainScale);
    return;
  }

  // ── Select soundfont player ───────────────────────────────────────────────
  let player: Soundfont.Player | null = null;
  if (trackType === "vocals") {
    player = players.vocals;
  } else if (trackType === "bass") {
    player = players.bass;
  } else if (note.isPalmMute && players.mutedGuitar) {
    player = players.mutedGuitar;
  } else {
    player = players.guitar;
  }

  if (player) {
    const sfDuration = trackType === "vocals"
      ? Math.max(effectiveDuration * 1.3, 0.3)
      : Math.max(effectiveDuration * 0.92, 0.08);
    const baseGain = trackType === "bass" ? 0.8 : trackType === "vocals" ? 0.55 : 0.65;
    const sfNode = player.play(String(midiNote), t, {
      duration: sfDuration, gain: baseGain * gainScale, destination: trackGain,
    } as any) as unknown as AudioBufferSourceNode | null;

    if (sfNode) {
      activeNodes.set(noteKey, sfNode);
      const sourceNode = ((sfNode as any).source ?? (sfNode as any).bufferSource) as AudioBufferSourceNode | undefined;
      const detuneParam: AudioParam | undefined = sourceNode?.detune;
      const rateParam:   AudioParam | undefined = sourceNode?.playbackRate;

      if (note.isVibrato && detuneParam) {
        const lfo  = ctx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 5.5;
        const lfoG = ctx.createGain();
        lfoG.gain.setValueAtTime(0, t + 0.08);
        lfoG.gain.linearRampToValueAtTime(28, t + 0.26);
        lfo.connect(lfoG); lfoG.connect(detuneParam);
        lfo.start(t + 0.08); lfo.stop(t + sfDuration);
        lfo.onended = () => { lfoG.disconnect(); };
      }

      if (note.isBend && (detuneParam || rateParam)) {
        const bendOffset = 0.02;
        if (detuneParam) {
          if (note.bendCurve && note.bendCurve.length > 0) {
            const curve = note.bendCurve;
            detuneParam.setValueAtTime(curve[0].cents, t + bendOffset);
            for (let i = 1; i < curve.length; i++) {
              detuneParam.linearRampToValueAtTime(curve[i].cents, t + bendOffset + curve[i].position * sfDuration);
            }
          } else if (note.bendSemitones) {
            detuneParam.setValueAtTime(0, t + bendOffset);
            detuneParam.linearRampToValueAtTime(note.bendSemitones * 100, t + bendOffset + 0.20);
          }
        } else if (rateParam) {
          if (note.bendCurve && note.bendCurve.length > 0) {
            const curve = note.bendCurve;
            rateParam.setValueAtTime(Math.pow(2, curve[0].cents / 1200), t + bendOffset);
            for (let i = 1; i < curve.length; i++) {
              rateParam.linearRampToValueAtTime(Math.pow(2, curve[i].cents / 1200), t + bendOffset + curve[i].position * sfDuration);
            }
          } else if (note.bendSemitones) {
            rateParam.setValueAtTime(1, t + bendOffset);
            rateParam.linearRampToValueAtTime(Math.pow(2, note.bendSemitones / 12), t + bendOffset + 0.20);
          }
        }
      }
    }
  } else {
    const opts: StringSynthOptions = {
      isPalmMute: note.isPalmMute, isVibrato: note.isVibrato,
      isBend: note.isBend, bendCurve: note.bendCurve,
      bendSemitones: note.bendSemitones, gainScale,
    };
    if (trackType === "bass") synthBass(ctx, freq, t, trackGain, effectiveDuration, opts);
    else                       synthGuitar(ctx, freq, t, trackGain, effectiveDuration, opts);
  }
}
