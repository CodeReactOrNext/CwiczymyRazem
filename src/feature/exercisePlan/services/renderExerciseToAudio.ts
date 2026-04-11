import { Exercise, TablatureMeasure } from '../types/exercise.types';
import { encodeWAV } from 'utils/audio/wavEncoder';

const GUITAR_STRING_MIDI = [64, 59, 55, 50, 45, 40];
const BASS_STRING_MIDI   = [43, 38, 33, 28];
const GUITAR_STRING_FREQS = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];
const BASS_STRING_FREQS   = [98.00,  73.42,  55.00,  41.20];

// ─────────────────────────────────────────────────────────────────────────────
// Synthesis helpers adapted from useTablatureAudio
// ─────────────────────────────────────────────────────────────────────────────

function createNoiseBuffer(ctx: BaseAudioContext, duration: number): AudioBuffer {
  const len = Math.max(1, Math.ceil(ctx.sampleRate * duration));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

const _noiseCache = new WeakMap<BaseAudioContext, Map<number, AudioBuffer>>();
function getCachedNoiseBuffer(ctx: BaseAudioContext, durationMs: number): AudioBuffer {
  let ctxMap = _noiseCache.get(ctx);
  if (!ctxMap) { ctxMap = new Map(); _noiseCache.set(ctx, ctxMap); }
  let buf = ctxMap.get(durationMs);
  if (!buf) { buf = createNoiseBuffer(ctx, durationMs / 1000); ctxMap.set(durationMs, buf); }
  return buf;
}

function makeSoftClipCurve(samples = 512, drive = 2.0): Float32Array {
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
  }
  return curve;
}

const SOFT_CLIP_CURVE_LIGHT = makeSoftClipCurve(512, 0.7);

interface StringSynthOptions {
  isPalmMute?: boolean;
  isVibrato?: boolean;
  isBend?: boolean;
  bendCurve?: any[];
  bendSemitones?: number;
  gainScale?: number;
}

function synthGuitar(ctx: BaseAudioContext, freq: number, t: number, dest: AudioNode, duration: number, opts: StringSynthOptions = {}) {
  const { isPalmMute, isVibrato, isBend, bendCurve, bendSemitones, gainScale = 1 } = opts;
  const peak = (isPalmMute ? 0.50 : 0.28) * gainScale;
  const sustainLvl = peak * 0.40;
  const sustainEnd = isPalmMute ? t + Math.min(0.055, duration) : t + Math.max(duration, 0.15);
  const releaseTime = isPalmMute ? sustainEnd + 0.020 : sustainEnd + 0.15;
  const stopTime = releaseTime + 0.05;

  const osc1 = ctx.createOscillator(); osc1.type = 'triangle'; osc1.frequency.setValueAtTime(freq, t);
  const osc2 = ctx.createOscillator(); osc2.type = 'sine';     osc2.frequency.setValueAtTime(freq, t);

  if (isBend) {
    [osc1, osc2].forEach(osc => {
        if (bendCurve && bendCurve.length > 0) {
            osc.frequency.setValueAtTime(freq * Math.pow(2, (bendCurve[0]?.cents ?? 0) / 1200), t + 0.02);
            bendCurve.forEach((pt: any) => {
              if (pt) {
                osc.frequency.linearRampToValueAtTime(freq * Math.pow(2, (pt.cents ?? 0) / 1200), t + 0.02 + pt.position * duration);
              }
            });
        } else if (bendSemitones) {
            osc.frequency.setValueAtTime(freq, t + 0.05);
            osc.frequency.linearRampToValueAtTime(freq * Math.pow(2, bendSemitones / 12), t + 0.22);
        }
    });
  }

  if (isVibrato) {
    const lfo = ctx.createOscillator(); lfo.frequency.value = 5.5;
    const lfoG = ctx.createGain(); lfoG.gain.setValueAtTime(0, t + 0.08); lfoG.gain.linearRampToValueAtTime(freq * 0.022, t + 0.26);
    lfo.connect(lfoG); lfoG.connect(osc1.frequency); lfoG.connect(osc2.frequency);
    lfo.start(t + 0.08); lfo.stop(stopTime);
  }

  const g1 = ctx.createGain(); g1.gain.value = 0.65;
  const g2 = ctx.createGain(); g2.gain.value = 0.30;
  osc1.connect(g1); osc2.connect(g2);

  const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 10);
  const ng = ctx.createGain(); ng.gain.value = isPalmMute ? 0.40 : 0.18;

  const filter = ctx.createBiquadFilter(); filter.type = 'lowpass';
  filter.frequency.setValueAtTime(isPalmMute ? freq * 2.5 : Math.min(freq * 8, 16000), t);
  filter.frequency.exponentialRampToValueAtTime(isPalmMute ? Math.max(freq * 1.1, 180) : Math.max(freq * 2.5, 800), t + 0.06);

  const ws = ctx.createWaveShaper(); ws.curve = SOFT_CLIP_CURVE_LIGHT as any;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t + 0.004);
  env.gain.exponentialRampToValueAtTime(sustainLvl, t + 0.08);
  env.gain.setValueAtTime(sustainLvl, sustainEnd);
  env.gain.exponentialRampToValueAtTime(0.001, releaseTime);

  g1.connect(filter); g2.connect(filter); ng.connect(filter);
  filter.connect(ws); ws.connect(env); env.connect(dest);

  osc1.start(t); osc1.stop(stopTime);
  osc2.start(t); osc2.stop(stopTime);
  ns.start(t); ns.stop(t + 0.01);
}

function playDrumNote(ctx: BaseAudioContext, midi: number, t: number, dest: AudioNode, accented: boolean) {
  const accentScale = accented ? 1.35 : 1.0;
  if (midi === 35 || midi === 36) { // Kick
      const osc = ctx.createOscillator(); osc.frequency.setValueAtTime(130, t); osc.frequency.exponentialRampToValueAtTime(48, t + 0.07);
      const env = ctx.createGain(); env.gain.setValueAtTime(accentScale, t); env.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(env); env.connect(dest); osc.start(t); osc.stop(t + 0.3);
  } else if (midi === 38 || midi === 40) { // Snare
      const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 130);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800;
      const env = ctx.createGain(); env.gain.setValueAtTime(0.65 * accentScale, t); env.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      ns.connect(bp); bp.connect(env); env.connect(dest); ns.start(t); ns.stop(t + 0.13);
  } else if (midi === 42 || midi === 44) { // Hi-Hat
      const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 40);
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 9000;
      const env = ctx.createGain(); env.gain.setValueAtTime(0.22 * accentScale, t); env.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      ns.connect(hp); hp.connect(env); env.connect(dest); ns.start(t); ns.stop(t + 0.04);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Renderer Main
// ─────────────────────────────────────────────────────────────────────────────

export async function renderExerciseToBlob(exercise: Exercise, bpm: number, loops = 1): Promise<Blob> {
  const secondsPerBeat = 60 / bpm;
  // Calculate total duration
  let beatsInOneLoop = 0;
  (exercise.tablature || []).forEach(m => m.beats.forEach(b => beatsInOneLoop += b.duration));
  
  if (beatsInOneLoop === 0) beatsInOneLoop = 16; // default if empty
  
  const totalDuration = beatsInOneLoop * secondsPerBeat * loops + 2; // +buffer
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(2, sampleRate * totalDuration, sampleRate);
  
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  
  // Schedule notes
  for (let l = 0; l < loops; l++) {
    let cursor = l * beatsInOneLoop * secondsPerBeat;
    
    (exercise.tablature || []).forEach(measure => {
      measure.beats.forEach(beat => {
        const t = cursor;
        const beatDur = beat.duration * secondsPerBeat;
        
        beat.notes.forEach(note => {
            const freqBase = GUITAR_STRING_FREQS[note.string - 1] || 110;
            const freq = freqBase * Math.pow(2, note.fret / 12);
            const dyn = note.dynamics !== undefined ? Math.max(0.3, note.dynamics) : 1.0;
            
            synthGuitar(ctx, freq, t, masterGain, beatDur, {
                isPalmMute: note.isPalmMute,
                gainScale: dyn * (note.isAccented ? 1.25 : 1.0) * (note.isGhost ? 0.3 : 1.0)
            });
        });
        
        cursor += beatDur;
      });
    });
    
    // Add drum backing if available (simplified check)
    if (exercise.backingTracks) {
        // ... simplified drum render ...
    }
  }
  
  const renderedBuffer = await ctx.startRendering();
  return encodeWAV(renderedBuffer);
}
