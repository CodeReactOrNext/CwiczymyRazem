import Soundfont from "soundfont-player";
import { midiToFrequency } from "utils/audio/noteUtils";

// Own AudioContext, lazily created and kept for the page's lifetime — previews
// are one-shot UI sounds that must work outside a running playback session, so
// they can't ride on the session's context (which only exists while a tab is
// loaded and playing). Same pattern as playCompletionSound in utils/audioUtils.
let _previewCtx: AudioContext | null = null;

function getPreviewCtx(): AudioContext | null {
  try {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!_previewCtx || _previewCtx.state === "closed") _previewCtx = new AudioContextClass();
    return _previewCtx;
  } catch {
    return null;
  }
}

// ── Output bus: dry + a small room ────────────────────────────────────────────

interface PreviewBus {
  /** Connect a source here — it reaches both the dry output and the reverb. */
  input: GainNode;
}

let _bus: PreviewBus | null = null;
let _busCtx: AudioContext | null = null;

/**
 * A synthetic impulse response: noise decaying exponentially, decorrelated per
 * channel. Not a real room, but enough of one that a single plucked note stops
 * sounding like it was recorded inside a cardboard box.
 */
function renderRoomImpulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const length = Math.max(1, Math.ceil(ctx.sampleRate * seconds));
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

function getPreviewBus(ctx: AudioContext): PreviewBus {
  if (_bus && _busCtx === ctx) return _bus;

  const input = ctx.createGain();
  input.gain.value = 1;

  // Nothing musical lives below the low E (~82 Hz) here, and the pluck's body
  // bump plus the reverb tail put enough energy down there to read as a thump
  // on speakers with any bass response.
  const rumbleCut = ctx.createBiquadFilter();
  rumbleCut.type = "highpass";
  rumbleCut.frequency.value = 70;
  rumbleCut.Q.value = 0.7;
  input.connect(rumbleCut);
  rumbleCut.connect(ctx.destination);

  const reverb = ctx.createConvolver();
  reverb.buffer = renderRoomImpulse(ctx, 1.7, 2.6);
  const wet = ctx.createGain();
  wet.gain.value = 0.2;
  rumbleCut.connect(reverb);
  reverb.connect(wet);
  wet.connect(ctx.destination);

  _bus = { input };
  _busCtx = ctx;
  return _bus;
}

// ── Sampled instrument (preferred) ────────────────────────────────────────────

// Deliberately the same instrument useTablatureAudio loads: a practice session
// already pulls that soundfont (~2.5 MB), so previews cost no extra download and
// sound like the rest of the app. An acoustic (`acoustic_guitar_nylon`) is warmer
// for a lone reference note, but it is a whole separate file to fetch.
const PREVIEW_INSTRUMENT = "electric_guitar_clean";

let _instrument: Soundfont.Player | null = null;
let _instrumentLoad: Promise<Soundfont.Player | null> | null = null;

/** soundfont-player routes a note to a given node at runtime; its types omit the
 *  option, so the call is made through this signature instead of `any`. */
type PlayIntoDestination = (
  name: string,
  when: number,
  options: { duration: number; gain: number; destination: AudioNode },
) => void;

function loadInstrument(ctx: AudioContext): Promise<Soundfont.Player | null> {
  if (!_instrumentLoad) {
    _instrumentLoad = Soundfont.instrument(ctx, PREVIEW_INSTRUMENT as Soundfont.InstrumentName)
      .then((player) => {
        _instrument = player;
        return player;
      })
      .catch(() => null); // offline / CDN down → the synth pluck below carries on
  }
  return _instrumentLoad;
}

/**
 * Start fetching the sampled instrument ahead of the first preview, so the very
 * first note the player hears is already the real thing rather than the
 * fallback. Safe to call repeatedly — the load happens once.
 */
export function preloadGuitarNotePreview(): void {
  const ctx = getPreviewCtx();
  if (ctx) void loadInstrument(ctx);
}

// ── Fallback: Karplus–Strong plucked string ───────────────────────────────────

// How much of the string's energy survives each trip around the delay line.
// Close to 1 = long sustain; the averaging filter takes the highs down first,
// which is what makes a plucked string sound plucked.
const STRING_DAMPING = 0.9965;

const _pluckCache = new WeakMap<AudioContext, Map<number, AudioBuffer>>();

/**
 * Render one plucked-string note with Karplus–Strong: fill a delay line one
 * period long with noise, then keep reading it back while low-pass filtering
 * each pass. Costs a few milliseconds and sounds like a string rather than an
 * oscillator, because the harmonics decay at different rates the way real ones do.
 *
 * The delay line is a whole number of samples, so the pitch it produces is only
 * near the requested one; the caller corrects the difference exactly with
 * `playbackRate`, using `pluckPeriodToFrequency` to know what it really got.
 *
 * Exported for tests: plain numbers in, plain samples out, no Web Audio needed.
 */
export function renderPluckSamples(sampleRate: number, periodSamples: number, seconds: number): Float32Array {
  const length = Math.ceil(sampleRate * seconds);
  const out = new Float32Array(length);

  // Excitation: noise, slightly smoothed so the attack is a pick scrape instead
  // of a click, and DC-corrected so the note doesn't open with a thump.
  const line = new Float32Array(periodSamples);
  let smoothed = 0;
  let sum = 0;
  for (let i = 0; i < periodSamples; i++) {
    smoothed = 0.6 * smoothed + 0.4 * (Math.random() * 2 - 1);
    line[i] = smoothed;
    sum += smoothed;
  }
  const mean = sum / periodSamples;
  for (let i = 0; i < periodSamples; i++) line[i] -= mean;

  let index = 0;
  for (let i = 0; i < length; i++) {
    const current = line[index];
    const next = line[(index + 1) % periodSamples];
    out[i] = current;
    line[index] = STRING_DAMPING * 0.5 * (current + next);
    index = (index + 1) % periodSamples;
  }

  // Fade the tail to exactly zero so the buffer never ends on a hard edge.
  const fade = Math.min(length, Math.round(sampleRate * 0.08));
  for (let i = 0; i < fade; i++) out[length - fade + i] *= 1 - (i + 1) / fade;

  return out;
}

/**
 * The pitch a delay line of `periodSamples` actually rings at. It is NOT
 * `sampleRate / periodSamples`: the loop's two-point averager reads one sample
 * ahead, which advances the phase by half a sample, so the round trip is half a
 * sample shorter than the line itself. Ignoring that leaves the note ~8 cents
 * sharp at guitar pitches — audible against a tuned instrument.
 */
export function pluckPeriodToFrequency(sampleRate: number, periodSamples: number): number {
  return sampleRate / (periodSamples - 0.5);
}

function renderPluck(ctx: AudioContext, periodSamples: number, seconds: number): AudioBuffer {
  let cache = _pluckCache.get(ctx);
  if (!cache) { cache = new Map(); _pluckCache.set(ctx, cache); }
  const cached = cache.get(periodSamples);
  if (cached) return cached;

  const samples = renderPluckSamples(ctx.sampleRate, periodSamples, seconds);
  const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
  buffer.getChannelData(0).set(samples);

  cache.set(periodSamples, buffer);
  return buffer;
}

function playPluck(ctx: AudioContext, bus: PreviewBus, freq: number, duration: number, volume: number): void {
  const periodSamples = Math.max(2, Math.round(ctx.sampleRate / freq + 0.5));
  const renderedFreq = pluckPeriodToFrequency(ctx.sampleRate, periodSamples);
  const buffer = renderPluck(ctx, periodSamples, duration + 0.4);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = freq / renderedFreq; // exact pitch, whatever the rounding did

  // A wide bump around the low mids stands in for a guitar body; the lowpass
  // takes the last of the noise-burst fizz off the attack.
  const body = ctx.createBiquadFilter();
  body.type = "peaking";
  body.frequency.value = 220;
  body.Q.value = 0.8;
  body.gain.value = 4;

  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 5200;
  tone.Q.value = 0.6;

  const level = ctx.createGain();
  level.gain.value = 0.55 * volume;

  source.connect(body);
  body.connect(tone);
  tone.connect(level);
  level.connect(bus.input);

  source.onended = () => {
    source.disconnect(); body.disconnect(); tone.disconnect(); level.disconnect();
  };
  source.start(ctx.currentTime + 0.02);
}

// ── Public API ────────────────────────────────────────────────────────────────

// React's strict mode runs mount effects twice in development, and a panel can
// remount for reasons that have nothing to do with the music. Identical notes
// landing in the same instant don't sound twice as loud — they sum into a thump.
// Anything repeated this fast is a duplicate trigger, not playing.
const RETRIGGER_GUARD_MS = 150;

let _lastTriggerMidi = -1;
let _lastTriggerAt = -Infinity;

function isDuplicateTrigger(midi: number): boolean {
  const now = Date.now();
  if (midi === _lastTriggerMidi && now - _lastTriggerAt < RETRIGGER_GUARD_MS) return true;
  _lastTriggerMidi = midi;
  _lastTriggerAt = now;
  return false;
}

/**
 * Play a single plucked guitar note — a real sampled instrument once it has
 * loaded, a Karplus–Strong string until then (and permanently, if the samples
 * can't be fetched). Fire-and-forget: never throws, and silently does nothing
 * where Web Audio is unavailable or still blocked by autoplay policy.
 */
export function playGuitarNotePreview(midi: number, duration = 1.6, volume = 0.9): void {
  if (isDuplicateTrigger(midi)) return;

  const ctx = getPreviewCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});

  const bus = getPreviewBus(ctx);

  if (_instrument) {
    (_instrument.play as unknown as PlayIntoDestination)(String(midi), ctx.currentTime + 0.02, {
      duration,
      gain: volume,
      destination: bus.input,
    });
    return;
  }

  // Not loaded yet — sound the note now (waiting on the network would put a
  // visible delay between the click and the pitch) and warm the samples up for
  // the next one.
  playPluck(ctx, bus, midiToFrequency(midi), duration, volume);
  void loadInstrument(ctx);
}
