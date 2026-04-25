import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Soundfont from "soundfont-player";

import type { BendPoint,TablatureMeasure, TablatureNote } from "../types/exercise.types";

export interface AudioTrackConfig {
  id: string;
  name?: string;
  measures: TablatureMeasure[];
  volume: number;
  isMuted: boolean;
  trackType?: 'guitar' | 'bass' | 'drums' | 'vocals';
  pan?: number; // -1.0 (left) to 1.0 (right)
}

interface UseTablatureAudioProps {
  tracks?: AudioTrackConfig[];
  measures?: TablatureMeasure[]; // Legacy support
  isMuted?: boolean; // Legacy support
  bpm: number;
  isPlaying: boolean;
  startTime: number | null;
  onLoopComplete?: () => void;
  audioContext?: AudioContext | null;
  audioStartTime?: number | null;
  /** Skip soundfont loading entirely — use when AlphaTab handles audio */
  disabled?: boolean;
  /** Number of times to play the loop (0 = infinite). Required for lastLoopOnly measures. */
  repeatCount?: number;
}

// ── Open-string MIDI note numbers ─────────────────────────────────────────────
// note.string 1 → E4 (64), 2 → B3 (59), 3 → G3 (55), 4 → D3 (50), 5 → A2 (45), 6 → E2 (40)
const GUITAR_STRING_MIDI = [64, 59, 55, 50, 45, 40];
// note.string 1 → G2 (43), 2 → D2 (38), 3 → A1 (33), 4 → E1 (28)
const BASS_STRING_MIDI   = [43, 38, 33, 28];

// Synthesis fallback frequencies
const GUITAR_STRING_FREQS = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];
const BASS_STRING_FREQS   = [98.00,  73.42,  55.00,  41.20];

function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const len = Math.max(1, Math.ceil(ctx.sampleRate * duration));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// Cache noise buffers per AudioContext+duration to avoid per-hit allocation.
// WeakMap keys on AudioContext so the cache is GC'd when the context closes.
const _noiseCache = new WeakMap<AudioContext, Map<number, AudioBuffer>>();
function getCachedNoiseBuffer(ctx: AudioContext, durationMs: number): AudioBuffer {
  let ctxMap = _noiseCache.get(ctx);
  if (!ctxMap) { ctxMap = new Map(); _noiseCache.set(ctx, ctxMap); }
  let buf = ctxMap.get(durationMs);
  if (!buf) { buf = createNoiseBuffer(ctx, durationMs / 1000); ctxMap.set(durationMs, buf); }
  return buf;
}

function makeSoftClipCurve(samples = 512, drive = 2.0): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(samples) as Float32Array<ArrayBuffer>;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
  }
  return curve;
}

// Pre-compute once — reused by synthesis functions
const SOFT_CLIP_CURVE       = makeSoftClipCurve(512, 2.0); // heavy drive (drums)
const SOFT_CLIP_CURVE_LIGHT = makeSoftClipCurve(512, 0.7); // gentle warmth (strings)

interface StringSynthOptions {
  isPalmMute?: boolean;
  isVibrato?: boolean;
  isBend?: boolean;
  bendCurve?: BendPoint[];
  bendSemitones?: number;
  gainScale?: number;
}

export const useTablatureAudio = ({
  tracks: inputTracks,
  measures,
  isMuted: legacyIsMuted = false,
  bpm,
  isPlaying,
  startTime,
  onLoopComplete,
  audioContext: externalAudioContext,
  audioStartTime,
  disabled = false,
  repeatCount = 0,
}: UseTablatureAudioProps) => {
  // ── Audio graph refs ──────────────────────────────────────────────────────
  const ownAudioContextRef  = useRef<AudioContext | null>(null);
  const audioContextRef     = useRef<AudioContext | null>(null);
  const masterGainRef       = useRef<GainNode | null>(null);
  const trackGainsRef       = useRef<Record<string, GainNode>>({});
  const trackPannersRef     = useRef<Record<string, StereoPannerNode>>({});
  const timeoutRef          = useRef<number | null>(null);

  // ── Absolute-clock playback state ────────────────────────────────────────
  // beatIdx grows monotonically (never reset on loop) so audio time is always:
  //   startAudioTime
  //   + floor(beatIdx / N) * totalLoopDuration   ← loop offset
  //   + offsets[beatIdx % N]                      ← beat offset within loop
  // This eliminates all floating-point accumulation between tracks.
  const startAudioTimeRef    = useRef<number | null>(null);
  const audioStartTimePropRef = useRef<number | null>(null);
  const repeatCountRef       = useRef(repeatCount);
  useEffect(() => { repeatCountRef.current = repeatCount; }, [repeatCount]);
  const trackStatesRef       = useRef<Record<string, { beatIdx: number }>>({});
  const pendingLoopCompleteTimeoutsRef = useRef<Set<number>>(new Set());

  // Synchronous ref update — no useEffect needed, always has the latest value before any scheduler tick
  audioStartTimePropRef.current = audioStartTime ?? null;

  // ── Active soundfont nodes for note-off (key = `${trackId}-${string}`) ──
  const activeNodesRef = useRef<Map<string, any>>(new Map());

  // ── Soundfont instrument players ─────────────────────────────────────────
  const guitarPlayerRef      = useRef<Soundfont.Player | null>(null);
  const mutedGuitarPlayerRef = useRef<Soundfont.Player | null>(null);
  const bassPlayerRef        = useRef<Soundfont.Player | null>(null);
  const vocalsPlayerRef      = useRef<Soundfont.Player | null>(null);
  const [soundfontsReady, setSoundfontsReady] = useState(false);

  // ── isPlaying ref for use inside scheduler closure ────────────────────────
  const isPlayingRef    = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  /**
   * Stable ref the caller can call on every external tick (e.g. metronome worklet ~25ms).
   * Points to the active scheduler when playing, null otherwise.
   * Exposed so PracticeSession can wire up: onTick → schedulerTickRef.current?.()
   */
  const schedulerTickRef = useRef<(() => void) | null>(null);

  // ── Track data ────────────────────────────────────────────────────────────
  const activeTracks = useMemo(() => {
    if (inputTracks) return inputTracks;
    if (measures) return [{ id: 'main', measures, volume: 1, isMuted: legacyIsMuted }];
    return [];
  }, [inputTracks, measures, legacyIsMuted]);

  const activeTracksRef = useRef(activeTracks);
  useEffect(() => { activeTracksRef.current = activeTracks; }, [activeTracks]);

  const bpmRef = useRef(bpm);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  // Pre-compute per-track beat data: flat list + cumulative offsets in beat-units
  // offsets[i] = sum of durations of beats 0..i-1  →  absolute position of beat i in the loop
  const trackDataRef = useRef<Record<string, {
    flattened:     any[];
    offsets:       number[]; // beat-unit start time of each beat within one loop
    totalDuration: number;   // total loop length in beat-units (first loop, includes firstLoopOnly)
    loopStartIdx:  number;   // first beat index that repeats (0 if no firstLoopOnly measures)
    loopStartOff:  number;   // beat-unit offset of loopStartIdx
    loopDuration:  number;   // repeating section duration in beat-units
    loopEndIdx:    number;   // first beat index of lastLoopOnly measures (= N if none)
    loopEndOff:    number;   // beat-unit offset of loopEndIdx
  }>>({});

  useEffect(() => {
    trackDataRef.current = {};
    activeTracks.forEach(track => {
      const flattened = track.measures.flatMap(m => m.beats);
      const offsets: number[] = [];
      let cursor = 0;
      for (const beat of flattened) {
        offsets.push(cursor);
        cursor += beat.duration;
      }
      // Find first beat that is NOT part of a firstLoopOnly measure
      let loopStartIdx = 0;
      let loopStartOff = 0;
      for (const m of track.measures) {
        if (!m.firstLoopOnly) break;
        loopStartIdx += m.beats.length;
        loopStartOff += m.beats.reduce((s, b) => s + b.duration, 0);
      }
      // Find first beat of trailing lastLoopOnly measures
      let loopEndIdx = flattened.length;
      let loopEndOff = cursor;
      for (let i = track.measures.length - 1; i >= 0; i--) {
        if (!track.measures[i].lastLoopOnly) break;
        loopEndIdx -= track.measures[i].beats.length;
        loopEndOff -= track.measures[i].beats.reduce((s, b) => s + b.duration, 0);
      }
      const loopDuration = loopEndOff - loopStartOff;
      trackDataRef.current[track.id] = {
        flattened, offsets, totalDuration: cursor,
        loopStartIdx, loopStartOff, loopDuration,
        loopEndIdx, loopEndOff,
      };
    });
  }, [activeTracks]);

  // ── AudioContext + master gain setup ──────────────────────────────────────
  useEffect(() => {
    if (externalAudioContext) {
      audioContextRef.current = externalAudioContext;
    } else {
      ownAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ownAudioContextRef.current;
    }

    if (audioContextRef.current) {
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
      trackGainsRef.current  = {};
      trackPannersRef.current = {};
    }

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      ownAudioContextRef.current?.close();
    };
  }, [externalAudioContext]);

  // ── Load soundfont instruments ────────────────────────────────────────────
  useEffect(() => {
    if (disabled) return;
    const ctx = audioContextRef.current;
    if (!ctx) return;

    guitarPlayerRef.current      = null;
    mutedGuitarPlayerRef.current = null;
    bassPlayerRef.current        = null;
    vocalsPlayerRef.current      = null;
    setSoundfontsReady(false);

    let cancelled = false;

    Promise.all([
      Soundfont.instrument(ctx, "electric_guitar_clean"  as Soundfont.InstrumentName),
      Soundfont.instrument(ctx, "electric_guitar_muted"  as Soundfont.InstrumentName),
      Soundfont.instrument(ctx, "electric_bass_pick"     as Soundfont.InstrumentName),
      Soundfont.instrument(ctx, "choir_aahs"             as Soundfont.InstrumentName),
    ]).then(([guitar, mutedGuitar, bass, vocals]) => {
      if (cancelled) return;
      guitarPlayerRef.current      = guitar;
      mutedGuitarPlayerRef.current = mutedGuitar;
      bassPlayerRef.current        = bass;
      vocalsPlayerRef.current      = vocals;
      setSoundfontsReady(true);
    }).catch(() => {
      // Network unavailable — synthesis fallback will be used automatically
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalAudioContext, audioContextRef.current]);

  // ── Per-track gain + panner ───────────────────────────────────────────────
  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !masterGainRef.current) return;

    const currentIds = new Set(activeTracks.map(t => t.id));

    // Disconnect and remove nodes for tracks no longer active
    Object.keys(trackGainsRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        trackGainsRef.current[id]?.disconnect();
        trackPannersRef.current[id]?.disconnect();
        delete trackGainsRef.current[id];
        delete trackPannersRef.current[id];
      }
    });

    activeTracks.forEach(track => {
      const existing = trackGainsRef.current[track.id];
      if (!existing || existing.context !== ctx) {
        // Disconnect stale nodes before replacing
        if (existing) {
          trackGainsRef.current[track.id]?.disconnect();
          trackPannersRef.current[track.id]?.disconnect();
        }
        const gain   = ctx.createGain();
        const panner = ctx.createStereoPanner();
        panner.pan.value = track.pan ?? 0;
        gain.connect(panner);
        panner.connect(masterGainRef.current!);
        trackGainsRef.current[track.id]  = gain;
        trackPannersRef.current[track.id] = panner;
      } else {
        const panner = trackPannersRef.current[track.id];
        if (panner) panner.pan.value = track.pan ?? 0;
      }

      const targetGain = track.isMuted ? 0 : track.volume;
      trackGainsRef.current[track.id].gain.setTargetAtTime(targetGain, ctx.currentTime, 0.02);
    });
  }, [activeTracks, externalAudioContext]);

  const onLoopCompleteRef = useRef(onLoopComplete);
  useEffect(() => { onLoopCompleteRef.current = onLoopComplete; }, [onLoopComplete]);

  // ── Synthesis fallback — guitar ───────────────────────────────────────────
  const synthGuitar = useCallback((
    freq: number, t: number, trackGain: GainNode, duration: number,
    opts: StringSynthOptions = {},
  ) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    const { isPalmMute, isVibrato, isBend, bendCurve, bendSemitones, gainScale = 1 } = opts;

    // ── Envelope parameters ───────────────────────────────────────────────
    const peak        = (isPalmMute ? 0.50 : 0.28) * gainScale;
    const sustainLvl  = peak * 0.40; // hold at 40% of peak through sustain phase
    const sustainEnd  = isPalmMute ? t + Math.min(0.055, duration) : t + Math.max(duration, 0.15);
    const releaseTime = isPalmMute ? sustainEnd + 0.020 : sustainEnd + 0.15;
    const stopTime    = releaseTime + 0.05;

    // ── Oscillators: triangle (body) + sine (fundamental) ────────────────
    const osc1 = ctx.createOscillator(); osc1.type = 'triangle'; osc1.frequency.setValueAtTime(freq, t);
    const osc2 = ctx.createOscillator(); osc2.type = 'sine';     osc2.frequency.setValueAtTime(freq, t);

    // ── Bend: follow curve point-by-point (or single semitone glide fallback)
    if (isBend) {
      const applyBend = (param: AudioParam) => {
        if (bendCurve && bendCurve.length > 0) {
          const offset = 0.02;
          param.setValueAtTime(freq * Math.pow(2, bendCurve[0].cents / 1200), t + offset);
          for (let i = 1; i < bendCurve.length; i++) {
            const ptTime = t + offset + bendCurve[i].position * duration;
            param.linearRampToValueAtTime(freq * Math.pow(2, bendCurve[i].cents / 1200), ptTime);
          }
        } else if (bendSemitones) {
          const target = freq * Math.pow(2, bendSemitones / 12);
          param.setValueAtTime(freq, t + 0.05);
          param.linearRampToValueAtTime(target, t + 0.22);
        }
      };
      applyBend(osc1.frequency);
      applyBend(osc2.frequency);
    }

    // ── Vibrato: LFO with gradual depth swell (starts after attack) ───────
    if (isVibrato) {
      const lfo  = ctx.createOscillator(); lfo.frequency.value = 5.5;
      const lfoG = ctx.createGain();
      lfoG.gain.setValueAtTime(0, t + 0.08);
      lfoG.gain.linearRampToValueAtTime(freq * 0.022, t + 0.26); // swell over 180ms
      lfo.connect(lfoG);
      lfoG.connect(osc1.frequency);
      lfoG.connect(osc2.frequency);
      lfo.start(t + 0.08); lfo.stop(stopTime);
      lfo.onended = () => { lfoG.disconnect(); };
    }

    const g1 = ctx.createGain(); g1.gain.value = 0.65; // triangle
    const g2 = ctx.createGain(); g2.gain.value = 0.30; // sine
    osc1.connect(g1); osc2.connect(g2);

    // ── Attack noise transient ────────────────────────────────────────────
    const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 10);
    const ng = ctx.createGain(); ng.gain.value = (isPalmMute ? 0.40 : 0.18) * gainScale;

    // ── Tonal filter ──────────────────────────────────────────────────────
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass';
    if (isPalmMute) {
      filter.frequency.setValueAtTime(freq * 2.5, t);
      filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.1, 180), t + 0.03);
      filter.Q.value = 3.0;
    } else {
      filter.frequency.setValueAtTime(Math.min(freq * 8, 16000), t);
      filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 2.5, 800), t + 0.06);
      filter.Q.value = 1.0;
    }

    // ── Gentle waveshaper ─────────────────────────────────────────────────
    const ws = ctx.createWaveShaper(); ws.curve = SOFT_CLIP_CURVE_LIGHT; ws.oversample = '2x';

    // ── ADSR envelope with sustain plateau ────────────────────────────────
    const env = ctx.createGain();
    if (isPalmMute) {
      // Palm mute: hard attack, fast decay, no sustain
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(peak, t + 0.003);
      env.gain.exponentialRampToValueAtTime(0.001, sustainEnd);
    } else {
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(peak, t + 0.004);           // 4ms attack
      env.gain.exponentialRampToValueAtTime(sustainLvl, t + 0.08); // 76ms decay to sustain
      env.gain.setValueAtTime(sustainLvl, sustainEnd);             // hold sustain plateau
      env.gain.exponentialRampToValueAtTime(0.001, releaseTime);   // release
    }

    // ── Connect graph ─────────────────────────────────────────────────────
    g1.connect(filter); g2.connect(filter); ng.connect(filter);
    filter.connect(ws); ws.connect(env); env.connect(trackGain);

    let _done = 0;
    const _cleanup = () => {
      if (++_done === 3) { g1.disconnect(); g2.disconnect(); ng.disconnect(); filter.disconnect(); ws.disconnect(); env.disconnect(); }
    };
    ns.onended   = _cleanup;
    osc1.onended = _cleanup;
    osc2.onended = _cleanup;

    ns.start(t); ns.stop(t + 0.010);
    osc1.start(t); osc1.stop(stopTime);
    osc2.start(t); osc2.stop(stopTime);
  }, []);

  // ── Synthesis fallback — bass ─────────────────────────────────────────────
  const synthBass = useCallback((
    freq: number, t: number, trackGain: GainNode, duration: number,
    opts: StringSynthOptions = {},
  ) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    const { isPalmMute, isVibrato, isBend, bendCurve, bendSemitones, gainScale = 1 } = opts;

    // ── Envelope parameters ───────────────────────────────────────────────
    const peak        = (isPalmMute ? 0.65 : 0.50) * gainScale;
    const sustainLvl  = peak * 0.40;
    const sustainEnd  = isPalmMute ? t + Math.min(0.065, duration) : t + Math.max(duration, 0.20);
    const releaseTime = isPalmMute ? sustainEnd + 0.025 : sustainEnd + 0.18;
    const stopTime    = releaseTime + 0.05;

    // ── Oscillators: sine (fundamental) + triangle (body) + sine (octave) ─
    const osc1 = ctx.createOscillator(); osc1.type = 'sine';     osc1.frequency.setValueAtTime(freq, t);
    const osc2 = ctx.createOscillator(); osc2.type = 'triangle'; osc2.frequency.setValueAtTime(freq, t);
    const osc3 = ctx.createOscillator(); osc3.type = 'sine';     osc3.frequency.setValueAtTime(freq * 2, t);

    // ── Bend: follow curve or single semitone glide ───────────────────────
    if (isBend) {
      const applyBend = (param: AudioParam, baseFreq: number) => {
        if (bendCurve && bendCurve.length > 0) {
          const offset = 0.02;
          param.setValueAtTime(baseFreq * Math.pow(2, bendCurve[0].cents / 1200), t + offset);
          for (let i = 1; i < bendCurve.length; i++) {
            const ptTime = t + offset + bendCurve[i].position * duration;
            param.linearRampToValueAtTime(baseFreq * Math.pow(2, bendCurve[i].cents / 1200), ptTime);
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

    // ── Vibrato ───────────────────────────────────────────────────────────
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

    const g1 = ctx.createGain(); g1.gain.value = 0.50; // sine fundamental
    const g2 = ctx.createGain(); g2.gain.value = 0.38; // triangle body
    const g3 = ctx.createGain(); g3.gain.value = 0.10; // octave sine
    osc1.connect(g1); osc2.connect(g2); osc3.connect(g3);

    // ── Attack noise transient ────────────────────────────────────────────
    const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 8);
    const ng = ctx.createGain(); ng.gain.value = 0.18 * gainScale;

    // ── Filter ────────────────────────────────────────────────────────────
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass';
    if (isPalmMute) {
      filter.frequency.setValueAtTime(Math.min(freq * 3, 800), t);
      filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.2, 100), t + 0.04);
      filter.Q.value = 2.0;
    } else {
      filter.frequency.setValueAtTime(Math.min(freq * 5, 3000), t);
      filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.8, 150), t + 0.08);
      filter.Q.value = 0.7;
    }

    // ── Gentle waveshaper ─────────────────────────────────────────────────
    const ws = ctx.createWaveShaper(); ws.curve = SOFT_CLIP_CURVE_LIGHT; ws.oversample = '2x';

    // ── ADSR envelope with sustain plateau ────────────────────────────────
    const env = ctx.createGain();
    if (isPalmMute) {
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(peak, t + 0.004);
      env.gain.exponentialRampToValueAtTime(0.001, sustainEnd);
    } else {
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(peak, t + 0.007);           // 7ms attack
      env.gain.exponentialRampToValueAtTime(sustainLvl, t + 0.09); // 83ms decay
      env.gain.setValueAtTime(sustainLvl, sustainEnd);             // hold sustain
      env.gain.exponentialRampToValueAtTime(0.001, releaseTime);   // release
    }

    // ── Connect graph ─────────────────────────────────────────────────────
    g1.connect(filter); g2.connect(filter); g3.connect(filter); ng.connect(filter);
    filter.connect(ws); ws.connect(env); env.connect(trackGain);

    let _done = 0;
    const _cleanup = () => {
      if (++_done === 4) { g1.disconnect(); g2.disconnect(); g3.disconnect(); ng.disconnect(); filter.disconnect(); ws.disconnect(); env.disconnect(); }
    };
    ns.onended   = _cleanup;
    osc1.onended = _cleanup;
    osc2.onended = _cleanup;
    osc3.onended = _cleanup;

    ns.start(t); ns.stop(t + 0.008);
    osc1.start(t); osc1.stop(stopTime);
    osc2.start(t); osc2.stop(stopTime);
    osc3.start(t); osc3.stop(stopTime);
  }, []);

  // ── Dead note — percussive thud, no pitch ─────────────────────────────────
  const playDeadNote = useCallback((t: number, trackGain: GainNode, trackType: 'guitar' | 'bass' | 'vocals') => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    const dur = 0.035;
    const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 35);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.value = trackType === 'bass' ? 500 : 900; lp.Q.value = 0.6;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.55, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    ns.connect(lp); lp.connect(env); env.connect(trackGain);
    ns.onended = () => { lp.disconnect(); env.disconnect(); };
    ns.start(t); ns.stop(t + dur);
  }, []);

  // ── Natural/Artificial harmonic — pure bell-like sine ─────────────────────
  const playHarmonicNote = useCallback((
    freq: number, t: number, trackGain: GainNode, duration: number, gainScale = 1,
  ) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    // Harmonics ring out 3-4× longer than normal notes
    const sustain = Math.max(duration * 3.5, 1.2);
    const peak    = 0.38 * gainScale;

    const osc1 = ctx.createOscillator(); osc1.type = 'sine'; osc1.frequency.value = freq;
    const osc2 = ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = freq * 2;
    const g1 = ctx.createGain(); g1.gain.value = 0.75;
    const g2 = ctx.createGain(); g2.gain.value = 0.18;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peak, t + 0.008); // fast clean attack
    env.gain.exponentialRampToValueAtTime(0.001, t + sustain);

    osc1.connect(g1); osc2.connect(g2);
    g1.connect(env); g2.connect(env);
    env.connect(trackGain);

    let _done = 0;
    const _cleanup = () => { if (++_done === 2) { g1.disconnect(); g2.disconnect(); env.disconnect(); } };
    osc1.onended = _cleanup; osc2.onended = _cleanup;

    osc1.start(t); osc2.start(t);
    osc1.stop(t + sustain + 0.05); osc2.stop(t + sustain + 0.05);
  }, []);

  // ── Drum synthesis — full GM drum map ────────────────────────────────────
  const playDrumNote = useCallback((note: TablatureNote, time: number, trackGain: GainNode) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    const t = Math.max(ctx.currentTime + 0.001, time);
    const accentScale = note.isAccented ? 1.35 : 1.0;

    // Helper: synthesize a tom with pitched sine + transient click
    const playTom = (startFreq: number, endFreq: number, dur: number, gainVal: number) => {
      gainVal *= accentScale;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur * 0.35);
      const env = ctx.createGain();
      env.gain.setValueAtTime(gainVal, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(env); env.connect(trackGain);
      osc.onended = () => { env.disconnect(); };
      osc.start(t); osc.stop(t + dur + 0.02);

      // Transient click for articulation
      const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 12);
      const nbp = ctx.createBiquadFilter(); nbp.type = 'bandpass';
      nbp.frequency.value = startFreq * 2; nbp.Q.value = 0.5;
      const ng = ctx.createGain(); ng.gain.value = gainVal * 0.4;
      ns.connect(nbp); nbp.connect(ng); ng.connect(trackGain);
      ns.onended = () => { nbp.disconnect(); ng.disconnect(); };
      ns.start(t); ns.stop(t + 0.012);
    };

    // If no MIDI note from parser, fall back to a guess based on GP5 string position
    const midi = note.midiNote ?? (
      note.string <= 2 ? 36 :          // low strings → kick
      note.string === 3 ? 38 :          // → snare
      note.string === 4 ? 42 :          // → closed hi-hat
      note.string === 5 ? 43 :          // → floor tom
      38                                 // default snare
    );

    switch (midi) {
      // ── Kick drums ──────────────────────────────────────────────────────
      case 35: // Acoustic Bass Drum
      case 36: { // Bass Drum 1
        const gain = 1.0 * accentScale;
        // Body: pitched sine sweep
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.exponentialRampToValueAtTime(48, t + 0.07);
        const env = ctx.createGain();
        env.gain.setValueAtTime(gain, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(env); env.connect(trackGain);
        osc.onended = () => { env.disconnect(); };
        osc.start(t); osc.stop(t + 0.30);
        // Attack transient: beater click
        const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 15);
        const nbp = ctx.createBiquadFilter(); nbp.type = 'bandpass'; nbp.frequency.value = 2500; nbp.Q.value = 0.7;
        const ng = ctx.createGain(); ng.gain.value = gain * 0.55;
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
        ns.connect(nbp); nbp.connect(ng); ng.connect(trackGain);
        ns.onended = () => { nbp.disconnect(); ng.disconnect(); };
        ns.start(t); ns.stop(t + 0.015);
        break;
      }

      // ── Side Stick / Rimshot ────────────────────────────────────────────
      case 37: {
        const gain = 0.7 * accentScale;
        const dur = 0.07;
        const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 70);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 2.0;
        const nenv = ctx.createGain(); nenv.gain.setValueAtTime(gain, t); nenv.gain.exponentialRampToValueAtTime(0.001, t + dur);
        ns.connect(bp); bp.connect(nenv); nenv.connect(trackGain);
        ns.onended = () => { bp.disconnect(); nenv.disconnect(); };
        ns.start(t); ns.stop(t + dur);
        const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 320;
        const tenv = ctx.createGain(); tenv.gain.setValueAtTime(gain * 0.7, t); tenv.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.connect(tenv); tenv.connect(trackGain);
        osc.onended = () => { tenv.disconnect(); };
        osc.start(t); osc.stop(t + 0.05);
        break;
      }

      // ── Acoustic / Electric Snare ───────────────────────────────────────
      case 38:
      case 40: {
        const gain = 0.65 * accentScale;
        const dur = 0.13;
        const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 130);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1.2;
        const nenv = ctx.createGain(); nenv.gain.setValueAtTime(gain, t); nenv.gain.exponentialRampToValueAtTime(0.001, t + dur);
        ns.connect(bp); bp.connect(nenv); nenv.connect(trackGain);
        ns.onended = () => { bp.disconnect(); nenv.disconnect(); };
        ns.start(t); ns.stop(t + dur);
        const osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.04);
        const tenv = ctx.createGain(); tenv.gain.setValueAtTime(gain * 0.6, t); tenv.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(tenv); tenv.connect(trackGain);
        osc.onended = () => { tenv.disconnect(); };
        osc.start(t); osc.stop(t + 0.07);
        break;
      }

      // ── Hand Clap ───────────────────────────────────────────────────────
      case 39: {
        for (let i = 0; i < 3; i++) {
          const delay = i * 0.012;
          const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 40);
          const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 0.8;
          const env = ctx.createGain();
          env.gain.setValueAtTime(Math.max(0.1, (0.5 - i * 0.1) * accentScale), t + delay);
          env.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.04);
          ns.connect(bp); bp.connect(env); env.connect(trackGain);
          ns.onended = () => { bp.disconnect(); env.disconnect(); };
          ns.start(t + delay); ns.stop(t + delay + 0.04);
        }
        break;
      }

      // ── Toms (floor → high) ─────────────────────────────────────────────
      case 41: playTom(100, 52,  0.38, 0.90); break; // Low Floor Tom
      case 43: playTom(125, 65,  0.32, 0.90); break; // High Floor Tom
      case 45: playTom(155, 78,  0.27, 0.85); break; // Low Tom
      case 47: playTom(185, 92,  0.23, 0.85); break; // Low-Mid Tom
      case 48: playTom(225, 112, 0.20, 0.80); break; // Hi-Mid Tom
      case 50: playTom(275, 138, 0.17, 0.80); break; // High Tom

      // ── Closed Hi-Hat ───────────────────────────────────────────────────
      case 42: // Closed Hi-Hat
      case 44: { // Pedal Hi-Hat
        const gain = 0.22 * accentScale;
        const dur = 0.04;
        const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 40);
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 9000;
        const env = ctx.createGain(); env.gain.setValueAtTime(gain, t); env.gain.exponentialRampToValueAtTime(0.001, t + dur);
        ns.connect(hp); hp.connect(env); env.connect(trackGain);
        ns.onended = () => { hp.disconnect(); env.disconnect(); };
        ns.start(t); ns.stop(t + dur);
        break;
      }

      // ── Open Hi-Hat ─────────────────────────────────────────────────────
      case 46: {
        const gain = 0.25 * accentScale;
        const dur = 0.30;
        const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 300);
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 8000;
        const env = ctx.createGain(); env.gain.setValueAtTime(gain, t); env.gain.exponentialRampToValueAtTime(0.001, t + dur);
        ns.connect(hp); hp.connect(env); env.connect(trackGain);
        ns.onended = () => { hp.disconnect(); env.disconnect(); };
        ns.start(t); ns.stop(t + dur);
        break;
      }

      // ── Crash Cymbal ────────────────────────────────────────────────────
      case 49: // Crash Cymbal 1
      case 57: { // Crash Cymbal 2
        const gain = accentScale;
        const dur = 1.4;
        // Noise body (main crash wash)
        const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 1400);
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 4500;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.50 * gain, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + dur);
        ns.connect(hp); hp.connect(env); env.connect(trackGain);
        ns.onended = () => { hp.disconnect(); env.disconnect(); };
        ns.start(t); ns.stop(t + dur);
        // Metallic partials for shimmer
        const freqs = [3100, 5300, 7900];
        freqs.forEach((f, i) => {
          const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f;
          const oe = ctx.createGain();
          oe.gain.setValueAtTime(0.06 * gain, t);
          oe.gain.exponentialRampToValueAtTime(0.001, t + 0.25 - i * 0.04);
          osc.connect(oe); oe.connect(trackGain);
          osc.onended = () => { oe.disconnect(); };
          osc.start(t); osc.stop(t + 0.27);
        });
        break;
      }

      // ── Ride Cymbal ─────────────────────────────────────────────────────
      case 51: // Ride Cymbal 1
      case 59: { // Ride Cymbal 2
        const gain = accentScale;
        // Metallic ping at proper ride frequency
        const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 2800;
        const oenv = ctx.createGain();
        oenv.gain.setValueAtTime(0.18 * gain, t);
        oenv.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(oenv); oenv.connect(trackGain);
        osc.onended = () => { oenv.disconnect(); };
        osc.start(t); osc.stop(t + 0.47);
        // Second partial for shimmer
        const osc2 = ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = 4300;
        const oenv2 = ctx.createGain();
        oenv2.gain.setValueAtTime(0.07 * gain, t);
        oenv2.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
        osc2.connect(oenv2); oenv2.connect(trackGain);
        osc2.onended = () => { oenv2.disconnect(); };
        osc2.start(t); osc2.stop(t + 0.22);
        // Noise body (shorter than crash)
        const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 100);
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7500;
        const nenv = ctx.createGain(); nenv.gain.setValueAtTime(0.10 * gain, t); nenv.gain.exponentialRampToValueAtTime(0.001, t + 0.10);
        ns.connect(hp); hp.connect(nenv); nenv.connect(trackGain);
        ns.onended = () => { hp.disconnect(); nenv.disconnect(); };
        ns.start(t); ns.stop(t + 0.10);
        break;
      }

      // ── Ride Bell ───────────────────────────────────────────────────────
      case 53: {
        const gain = accentScale;
        const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 1200;
        const oenv = ctx.createGain();
        oenv.gain.setValueAtTime(0.35 * gain, t);
        oenv.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.connect(oenv); oenv.connect(trackGain);
        osc.onended = () => { oenv.disconnect(); };
        osc.start(t); osc.stop(t + 0.62);
        break;
      }

      // ── Chinese Cymbal ──────────────────────────────────────────────────
      case 52: {
        const gain = accentScale;
        const dur = 0.6;
        const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 600);
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.4 * gain, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + dur);
        ns.connect(hp); hp.connect(env); env.connect(trackGain);
        ns.onended = () => { hp.disconnect(); env.disconnect(); };
        ns.start(t); ns.stop(t + dur);
        break;
      }

      // ── Splash Cymbal ───────────────────────────────────────────────────
      case 55: {
        const gain = accentScale;
        const dur = 0.18;
        const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 180);
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 8000;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.30 * gain, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + dur);
        ns.connect(hp); hp.connect(env); env.connect(trackGain);
        ns.onended = () => { hp.disconnect(); env.disconnect(); };
        ns.start(t); ns.stop(t + dur);
        break;
      }

      // ── Cowbell ─────────────────────────────────────────────────────────
      case 56: {
        const gain = accentScale;
        const dur = 0.3;
        const osc1 = ctx.createOscillator(); osc1.type = 'square'; osc1.frequency.value = 562;
        const osc2 = ctx.createOscillator(); osc2.type = 'square'; osc2.frequency.value = 845;
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.25 * gain, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc1.connect(hp); osc2.connect(hp); hp.connect(env); env.connect(trackGain);
        let _done = 0;
        const _cleanup = () => { if (++_done === 2) { hp.disconnect(); env.disconnect(); } };
        osc1.onended = _cleanup; osc2.onended = _cleanup;
        osc1.start(t); osc2.start(t); osc1.stop(t + dur); osc2.stop(t + dur);
        break;
      }

      // ── Tambourine ──────────────────────────────────────────────────────
      case 54: {
        const gain = accentScale;
        // Short metallic rattle — multiple bursts
        for (let i = 0; i < 3; i++) {
          const d = i * 0.018;
          const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 30);
          const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
          const env = ctx.createGain();
          env.gain.setValueAtTime((0.22 - i * 0.05) * gain, t + d);
          env.gain.exponentialRampToValueAtTime(0.001, t + d + 0.03);
          ns.connect(hp); hp.connect(env); env.connect(trackGain);
          ns.onended = () => { hp.disconnect(); env.disconnect(); };
          ns.start(t + d); ns.stop(t + d + 0.03);
        }
        break;
      }

      // ── Bongos ──────────────────────────────────────────────────────────
      case 60: playTom(380, 260, 0.10, 0.70 * accentScale); break; // Hi Bongo
      case 61: playTom(260, 180, 0.14, 0.70 * accentScale); break; // Low Bongo

      // ── Congas ──────────────────────────────────────────────────────────
      case 62: playTom(430, 300, 0.08, 0.65 * accentScale); break; // Mute Hi Conga
      case 63: playTom(310, 220, 0.12, 0.65 * accentScale); break; // Open Hi Conga
      case 64: playTom(210, 150, 0.16, 0.70 * accentScale); break; // Low Conga

      // ── Timbales ────────────────────────────────────────────────────────
      case 65: playTom(600, 450, 0.07, 0.60 * accentScale); break; // High Timbale
      case 66: playTom(420, 300, 0.09, 0.60 * accentScale); break; // Low Timbale

      // ── Claves ──────────────────────────────────────────────────────────
      case 75: {
        const gain = accentScale;
        const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 2500;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.5 * gain, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(env); env.connect(trackGain);
        osc.onended = () => { env.disconnect(); };
        osc.start(t); osc.stop(t + 0.07);
        break;
      }

      // ── Triangle ────────────────────────────────────────────────────────
      case 80: { // Mute Triangle
        const gain = accentScale;
        const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 4200;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.28 * gain, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(env); env.connect(trackGain);
        osc.onended = () => { env.disconnect(); };
        osc.start(t); osc.stop(t + 0.10);
        break;
      }
      case 81: { // Open Triangle
        const gain = accentScale;
        const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 4200;
        const osc2 = ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = 6300;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.25 * gain, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
        osc.connect(env); osc2.connect(env); env.connect(trackGain);
        let _done = 0;
        const _cl = () => { if (++_done === 2) env.disconnect(); };
        osc.onended = _cl; osc2.onended = _cl;
        osc.start(t); osc2.start(t); osc.stop(t + 0.92); osc2.stop(t + 0.92);
        break;
      }

      // ── Default (misc percussion) ────────────────────────────────────────
      default: {
        const gain = accentScale;
        const dur = 0.15;
        const ns = ctx.createBufferSource(); ns.buffer = getCachedNoiseBuffer(ctx, 150);
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
        const env = ctx.createGain(); env.gain.setValueAtTime(0.18 * gain, t); env.gain.exponentialRampToValueAtTime(0.001, t + dur);
        ns.connect(hp); hp.connect(env); env.connect(trackGain);
        ns.onended = () => { hp.disconnect(); env.disconnect(); };
        ns.start(t); ns.stop(t + dur);
      }
    }
  }, []);

  // ── String note player (soundfont preferred, synth fallback) ─────────────
  const playStringNote = useCallback((
    note: TablatureNote,
    time: number,
    trackGain: GainNode,
    duration: number,
    trackType: 'guitar' | 'bass' | 'vocals',
    trackId: string,
  ) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const t = Math.max(ctx.currentTime + 0.001, time);

    // ── Dead note: percussive thud, no pitch ──────────────────────────────
    if (note.isDead) {
      playDeadNote(t, trackGain, trackType);
      return;
    }

    // ── Pitch resolution ──────────────────────────────────────────────────
    // Vocals: midiNote is stored directly by the parser (altNote.value = MIDI pitch)
    // Guitar/Bass: calculate from string + fret
    let midiNote: number;
    let freq: number;

    if (trackType === 'vocals' && note.midiNote !== undefined) {
      midiNote = note.midiNote;
      freq     = 440 * Math.pow(2, (midiNote - 69) / 12);
    } else {
      const midiBase = trackType === 'bass' ? BASS_STRING_MIDI[note.string - 1] : GUITAR_STRING_MIDI[note.string - 1];
      const freqBase = trackType === 'bass' ? BASS_STRING_FREQS[note.string - 1] : GUITAR_STRING_FREQS[note.string - 1];
      if (midiBase === undefined || freqBase === undefined) return;
      midiNote = midiBase + note.fret;
      freq     = freqBase * Math.pow(2, note.fret / 12);
    }

    if (!isFinite(freq) || freq <= 0 || midiNote < 0 || midiNote > 127) return;

    // ── Gain scale: dynamics + ghost note + accent ─────────────────────────
    const dynScale    = note.dynamics !== undefined ? Math.max(0.05, note.dynamics) : 1.0;
    const ghostScale  = note.isGhost    ? 0.28 : 1.0;
    const accentScale = note.isAccented ? 1.25 : 1.0;
    const gainScale   = dynScale * ghostScale * accentScale;

    // ── Duration modifiers ────────────────────────────────────────────────
    let effectiveDuration = duration;
    if (note.isLetRing)   effectiveDuration = Math.max(duration * 4.0, 2.0);
    if (note.isStaccato)  effectiveDuration = Math.max(duration * 0.15, 0.025);
    if (note.isPalmMute)  effectiveDuration = Math.min(effectiveDuration, 0.10);

    // ── Note-off: stop previous note on the same string ───────────────────
    const noteKey = `${trackId}-${note.string}`;
    const prevNode = activeNodesRef.current.get(noteKey);
    if (prevNode) {
      try { prevNode.stop(t); } catch { /* already ended */ }
      activeNodesRef.current.delete(noteKey);
    }

    if (note.harmonicType && note.harmonicType > 0) {
      // ── Harmonic: pure bell-like sine — soundfont can't replicate this ───
      playHarmonicNote(freq, t, trackGain, effectiveDuration, gainScale);
      return;
    }

    // ── Select soundfont player ────────────────────────────────────────────
    // Vocals → choir_aahs; Bass → bass pick; Palm mute → muted guitar; else clean guitar
    let player: Soundfont.Player | null = null;
    if (trackType === 'vocals') {
      player = vocalsPlayerRef.current;
    } else if (trackType === 'bass') {
      player = bassPlayerRef.current;
    } else if (note.isPalmMute && mutedGuitarPlayerRef.current) {
      player = mutedGuitarPlayerRef.current;
    } else {
      player = guitarPlayerRef.current;
    }

    if (player) {
      // ── Soundfont path ────────────────────────────────────────────────────
      // Vocals: slightly longer sustain (choir_aahs has a slow release)
      const sfDuration = trackType === 'vocals'
        ? Math.max(effectiveDuration * 1.3, 0.3)
        : Math.max(effectiveDuration * 0.92, 0.08);
      const baseGain = trackType === 'bass' ? 0.8 : trackType === 'vocals' ? 0.55 : 0.65;
      const node = player.play(String(midiNote), t, {
        duration:    sfDuration,
        gain:        baseGain * gainScale,
        destination: trackGain,
      } as any) as unknown as AudioBufferSourceNode | null;

      if (node) {
        activeNodesRef.current.set(noteKey, node);

        // soundfont-player returns a wrapper; the real AudioBufferSourceNode is at node.source
        // (older versions used .bufferSource — try both)
        const sourceNode = ((node as any).source ?? (node as any).bufferSource) as AudioBufferSourceNode | undefined;
        const detuneParam: AudioParam | undefined = sourceNode?.detune;
        const rateParam: AudioParam | undefined = sourceNode?.playbackRate;

        // ── Vibrato: LFO on detune, swells in after attack ─────────────────
        if (note.isVibrato && detuneParam) {
          const lfo  = ctx.createOscillator();
          lfo.type   = 'sine';
          lfo.frequency.value = 5.5;
          const lfoG = ctx.createGain();
          lfoG.gain.setValueAtTime(0, t + 0.08);
          lfoG.gain.linearRampToValueAtTime(28, t + 0.26); // ±28 cents depth
          lfo.connect(lfoG);
          lfoG.connect(detuneParam);
          lfo.start(t + 0.08);
          lfo.stop(t + sfDuration);
          lfo.onended = () => { lfoG.disconnect(); };
        }

        // ── Bend: follow full bend curve point-by-point ────────────────────
        if (note.isBend && (detuneParam || rateParam)) {
          const bendOffset = 0.02;
          if (detuneParam) {
            // Preferred: detune param (cents)
            if (note.bendCurve && note.bendCurve.length > 0) {
              const curve = note.bendCurve;
              detuneParam.setValueAtTime(curve[0].cents, t + bendOffset);
              for (let i = 1; i < curve.length; i++) {
                const ptTime = t + bendOffset + curve[i].position * sfDuration;
                detuneParam.linearRampToValueAtTime(curve[i].cents, ptTime);
              }
            } else if (note.bendSemitones) {
              const targetCents = note.bendSemitones * 100;
              detuneParam.setValueAtTime(0, t + bendOffset);
              detuneParam.linearRampToValueAtTime(targetCents, t + bendOffset + 0.20);
            }
          } else if (rateParam) {
            // Fallback: playbackRate (ratio = 2^(semitones/12))
            if (note.bendCurve && note.bendCurve.length > 0) {
              const curve = note.bendCurve;
              rateParam.setValueAtTime(Math.pow(2, curve[0].cents / 1200), t + bendOffset);
              for (let i = 1; i < curve.length; i++) {
                const ptTime = t + bendOffset + curve[i].position * sfDuration;
                rateParam.linearRampToValueAtTime(Math.pow(2, curve[i].cents / 1200), ptTime);
              }
            } else if (note.bendSemitones) {
              rateParam.setValueAtTime(1, t + bendOffset);
              rateParam.linearRampToValueAtTime(Math.pow(2, note.bendSemitones / 12), t + bendOffset + 0.20);
            }
          }
        }
      }
    } else {
      // ── Synthesis fallback (soundfont not loaded yet) ─────────────────────
      const opts: StringSynthOptions = {
        isPalmMute:    note.isPalmMute,
        isVibrato:     note.isVibrato,
        isBend:        note.isBend,
        bendCurve:     note.bendCurve,
        bendSemitones: note.bendSemitones,
        gainScale,
      };
      if (trackType === 'bass') synthBass(freq, t, trackGain, effectiveDuration, opts);
      else                       synthGuitar(freq, t, trackGain, effectiveDuration, opts);
    }
  }, [synthGuitar, synthBass, playDeadNote, playHarmonicNote]);

  // ── Unified dispatcher ────────────────────────────────────────────────────
  const playNote = useCallback((
    note: TablatureNote,
    time: number,
    trackId: string,
    duration: number,
    trackType: 'guitar' | 'bass' | 'drums' | 'vocals' = 'guitar',
  ) => {
    const ctx = audioContextRef.current;
    const trackGain = trackGainsRef.current[trackId];
    if (!ctx || !trackGain || !isFinite(time)) return;

    if (trackType === 'drums') playDrumNote(note, time, trackGain);
    else playStringNote(note, time, trackGain, Math.max(0.01, duration), trackType, trackId);
  }, [playDrumNote, playStringNote]);

  // ── Scheduler ─────────────────────────────────────────────────────────────
  // Beat times are computed ABSOLUTELY from startAudioTime — no accumulation drift.
  //
  //   beatAudioTime(i) = startAudioTime
  //                    + floor(i / N) * loopDurationSeconds   ← which loop
  //                    + offsets[i % N] * secondsPerBeat       ← position in loop
  //
  // beatIdx grows monotonically; the modulo maps it back to the loop.
  // All tracks reference the same startAudioTime so they cannot drift apart.
  const scheduler = useCallback(() => {
    // Clear any pending fallback timeout first — prevents accumulation when called by external tick.
    if (timeoutRef.current) { window.clearTimeout(timeoutRef.current); timeoutRef.current = null; }

    const ctx = audioContextRef.current;
    if (!ctx || !isPlayingRef.current) return;

    // Self-initialize from the synchronous prop ref — no useEffect async delay
    if (startAudioTimeRef.current === null) {
      const anchor = audioStartTimePropRef.current;
      if (anchor == null) {
        // Metronome count-in not finished yet — poll again shortly
        timeoutRef.current = window.setTimeout(scheduler, 10);
        return;
      }
      startAudioTimeRef.current = anchor;
      const newStates: Record<string, { beatIdx: number }> = {};
      activeTracksRef.current.forEach(track => { newStates[track.id] = { beatIdx: 0 }; });
      trackStatesRef.current = newStates;
      activeNodesRef.current.clear();
    }

    const lookaheadTime  = ctx.currentTime + 0.25;
    const secondsPerBeat = 60 / (bpmRef.current || 120);
    const tracks         = activeTracksRef.current;
    const refTrackId     = tracks.length > 0 ? tracks[0].id : null;
    const startAudio     = startAudioTimeRef.current;

    tracks.forEach(track => {
      const data  = trackDataRef.current[track.id];
      const state = trackStatesRef.current[track.id];
      if (!data || data.flattened.length === 0 || !state) return;

      const N             = data.flattened.length;
      const { loopStartIdx, loopStartOff, loopDuration, totalDuration, loopEndIdx, loopEndOff } = data;
      const rc            = repeatCountRef.current; // 0 = infinite
      // Core = repeating section (between firstLoopOnly prefix and lastLoopOnly suffix)
      const N_core        = loopEndIdx - loopStartIdx;
      // First loop plays prefix+core (no lastLoopOnly unless rc===1)
      const firstLoopBeats = loopEndIdx; // = loopStartIdx + N_core
      const firstLoopSec   = loopEndOff * secondsPerBeat;
      const loopDurSec     = (loopDuration > 0 ? loopDuration : totalDuration) * secondsPerBeat;

      while (true) {
        // Map ever-incrementing beatIdx → (loopCount, localIdx)
        // accounting for firstLoopOnly prefix and lastLoopOnly suffix.
        let loopCount: number;
        let localIdx: number;

        if (rc === 0 || rc === 1) {
          // Infinite (rc=0): lastLoopOnly never plays; loop over core only.
          // Single play (rc=1): everything plays once linearly.
          if (rc === 1) {
            loopCount = 0;
            localIdx  = state.beatIdx < N ? state.beatIdx : N - 1;
          } else if (state.beatIdx < firstLoopBeats || loopStartIdx === 0 && loopEndIdx === N) {
            loopCount = Math.floor(state.beatIdx / firstLoopBeats || 1);
            // Infinite: loop over core only (no lastLoopOnly)
            if (state.beatIdx < firstLoopBeats) {
              loopCount = 0; localIdx = state.beatIdx;
            } else {
              const afterFirst = state.beatIdx - firstLoopBeats;
              loopCount = 1 + Math.floor(afterFirst / N_core);
              localIdx  = loopStartIdx + (afterFirst % N_core);
            }
          } else {
            const afterFirst = state.beatIdx - firstLoopBeats;
            loopCount = 1 + Math.floor(afterFirst / N_core);
            localIdx  = loopStartIdx + (afterFirst % N_core);
          }
        } else {
          // Finite loops: first=prefix+core, middle=core, last=core+lastLoopOnly
          if (state.beatIdx < firstLoopBeats) {
            loopCount = 0;
            localIdx  = state.beatIdx;
          } else {
            const afterFirst     = state.beatIdx - firstLoopBeats;
            const middleLoops    = rc - 2; // loops 1..rc-2 (0 if rc===2)
            const totalMiddle    = middleLoops * N_core;
            if (afterFirst < totalMiddle) {
              loopCount = 1 + Math.floor(afterFirst / N_core);
              localIdx  = loopStartIdx + (afterFirst % N_core);
            } else {
              // Last loop — includes lastLoopOnly suffix
              loopCount = rc - 1;
              localIdx  = loopStartIdx + (afterFirst - totalMiddle);
            }
          }
        }

        // Absolute audio time of this beat
        let beatAudioTime: number;
        if (loopCount === 0) {
          beatAudioTime = startAudio + data.offsets[localIdx] * secondsPerBeat;
        } else {
          const relOff = (data.offsets[localIdx] - loopStartOff) * secondsPerBeat;
          beatAudioTime = startAudio + firstLoopSec + (loopCount - 1) * loopDurSec + relOff;
        }

        if (beatAudioTime >= lookaheadTime) break;

        // Guard against out-of-range localIdx (e.g. last loop overrun)
        if (localIdx >= N) { state.beatIdx++; continue; }

        const beat         = data.flattened[localIdx];
        const beatDuration = Math.max(0.05, beat.duration * secondsPerBeat);
        const t = Math.max(ctx.currentTime + 0.001, beatAudioTime);

        if (!track.isMuted) {
          beat.notes.forEach((n: TablatureNote) => {
            playNote(n, t, track.id, beatDuration, track.trackType ?? 'guitar');
          });
        }

        // Boundary for loopComplete:
        // - last finite loop: fire at N-1 (after lastLoopOnly suffix)
        // - all other loops (including infinite): fire at loopEndIdx-1 (end of core)
        const isLastLoop   = rc > 0 && loopCount === rc - 1;
        const loopBoundary = isLastLoop ? N - 1 : loopEndIdx - 1;
        if (localIdx === loopBoundary && track.id === refTrackId) {
          // The last note is scheduled at beatAudioTime, and lasts beatDuration.
          // Wait until it has fully sounded, plus a small 500ms safety tail, before firing completion.
          const delayMs = (beatAudioTime + beatDuration - ctx.currentTime) * 1000;
          const tid = window.setTimeout(() => {
            pendingLoopCompleteTimeoutsRef.current.delete(tid);
            onLoopCompleteRef.current?.();
          }, Math.max(0, delayMs + 500));
          pendingLoopCompleteTimeoutsRef.current.add(tid);
        }

        state.beatIdx++;
      }
    });

    // Primary driver is the external worklet tick (every ~25ms).
    // This setTimeout is a fallback in case the tick is not wired up.
    timeoutRef.current = window.setTimeout(scheduler, 200);
  }, [playNote]);

  // ── Start / stop playback ─────────────────────────────────────────────────
  useEffect(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

    if (isPlaying) {
      if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
      // Reset anchor — scheduler will self-initialize once audioStartTimePropRef is non-null
      startAudioTimeRef.current = null;
      schedulerTickRef.current  = scheduler;
      scheduler();
    } else {
      schedulerTickRef.current  = null;
      // Stop all lingering soundfont nodes
      startAudioTimeRef.current = null;
      activeNodesRef.current.forEach(node => {
        try { node.stop(); } catch { /* already ended */ }
      });
      activeNodesRef.current.clear();
      trackStatesRef.current = {};
      pendingLoopCompleteTimeoutsRef.current.forEach(id => window.clearTimeout(id));
      pendingLoopCompleteTimeoutsRef.current.clear();
    }

    return () => { 
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current); 
      pendingLoopCompleteTimeoutsRef.current.forEach(id => window.clearTimeout(id));
    };
  }, [isPlaying, scheduler]);

  return { soundfontsReady, schedulerTickRef };
};
