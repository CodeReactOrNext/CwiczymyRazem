// Shared guitar DSP: turns a window of mono Float32 PCM into the realtime refs
// (frequency / volume / onset / tick) consumed by PracticeSession.
//
// Used by BOTH input paths so they stay byte-for-byte identical:
//   • useAudioAnalyzer       — browser getUserMedia → AudioWorklet (web build)
//   • useNativeAudioAnalyzer — Electron native ASIO/WASAPI capture (desktop)
//
// The only difference between paths is *where the buffer comes from*; the math
// below is the single source of truth.
import type { AttackReading } from "utils/audio/attackTones";
import { createAttackSpectraTap } from "utils/audio/attackTones";
import { getAdaptiveVolumeGate, HIGH_STRING_MIN_FREQ } from "utils/audio/noteUtils";
import type { PcmSpectrum } from "utils/audio/pcmSpectrum";
import type { RecentAudio } from "utils/audio/recentAudio";

export interface GuitarDetectors {
  /** aubio Pitch ("yinfft", 2048, 512, sampleRate), tolerance 0.7 */
  pitch: any;
  /** aubio Onset ("hfc", 2048, 512, sampleRate), threshold 0.3 */
  onset: any;
  /** aubio Onset ("specflux", 2048, 512, sampleRate), threshold 0.15 */
  tick: any;
  /** Optional short-window pitch detector ("yinfft", 1024, 256) used only to
   *  shorten detection latency in the high register — see HIGH_RES_* below.
   *  Omit it and the processor behaves exactly as it did before. */
  pitchHigh?: any;
  /** Optional aubio Pitch ("yinfast", 2048, 512): the plain YIN, used only to
   *  correct the main detector's reading in the low register — see LOW_* below.
   *  Omit it and the processor behaves exactly as it did before. */
  pitchLow?: any;
  /** Optional aubio Pitch ("yinfast", 4096 at 48 kHz, 512): the plain YIN over a window
   *  long enough for a bass's bottom octave — consulted only while the player is
   *  on bass (see BASS_* below). Omit it and bass reads like a guitar. */
  pitchBass?: any;
}

/**
 * One detected attack, with the pitch that attack turned out to have.
 *
 * The point of this shape is that pitch is *anchored to the onset that produced
 * it* rather than to the moment the detector finally worked it out. Onsets are
 * timed precisely (measurably so — see guitarBufferProcessor.fastruns.test.ts,
 * 33/32 onsets at 260 BPM), while pitch trails the attack by ~40 ms in the high
 * register and ~105 ms in the low one. Reading pitch as a "what is sounding
 * right now" value therefore attributes it to whichever note happens to be under
 * the cursor when it arrives — which, once notes get shorter than that lag, is
 * the *next* note. Carrying the onset timestamp along with the pitch makes the
 * lag irrelevant instead of merely smaller.
 */
export interface DetectedNoteEvent {
  /** Date.now()-domain timestamp of the attack, refined to hop resolution. */
  onsetMs: number;
  /** Pitch attributed to this attack (Hz); 0 when it never resolved. */
  pitchHz: number;
  /** Peak raw (gain-independent) volume observed while resolving. */
  peakVolume: number;
  /**
   * The spectrum just before and just after the attack (attackTones.ts) —
   * which note it struck, even under strings still ringing. "reading" until
   * the "after" has been captured (~105 ms past the attack); null when it
   * couldn't be read cleanly (the next attack came first) or isn't read at all.
   */
  attack?: AttackReading;
}

/**
 * Hears every captured window, raw (ungained), at the capture rate — for a
 * listener after something other than the guitar (usePlaybackLeakGuard). The
 * buffer is reused, so copy whatever is kept past the call.
 */
export type InputTap = (samples: Float32Array, sampleRate: number) => void;

export interface ProcessorTargets {
  frequencyRef: React.MutableRefObject<number>;
  volumeRef: React.MutableRefObject<number>;
  rawVolumeRef: React.MutableRefObject<number>;
  confidenceRef: React.MutableRefObject<number>;
  lastOnsetTimeRef: React.MutableRefObject<number>;
  lastTickTimeRef: React.MutableRefObject<number>;
  /** Measured ambient noise floor, same 0–1 scale as rawVolumeRef. Updated only
   *  during confirmed-silent windows (see below); 0 means "not measured yet" —
   *  consumers (useNoteMatching) should fall back to a fixed gate until then.
   *  Feeds noteUtils.ts's getAdaptiveVolumeGate() so the "is this note actually
   *  being played" gate reflects this room/mic's real noise floor instead of a
   *  single constant tuned for an average setup. */
  noiseFloorRef: React.MutableRefObject<number>;
  /** Optional ring buffer of onset-anchored note events, oldest first. Omit it
   *  and no events are produced — every other output is unaffected either way. */
  noteEventsRef?: React.MutableRefObject<DetectedNoteEvent[]>;
  /** Optional: Date.now()-domain time of the most recent attack, refined to hop
   *  resolution like DetectedNoteEvent.onsetMs. lastOnsetTimeRef stamps the end
   *  of the block instead — good enough for "was there an attack lately", too
   *  coarse to grade timing by. */
  lastAttackMsRef?: React.MutableRefObject<number>;
  /** Optional: Date.now() (block end, like lastOnsetTimeRef) of the latest
   *  attack heard on a low string by the low-band detector — see LOW_ATTACK_*. */
  lastLowAttackMsRef?: React.MutableRefObject<number>;
  /** Optional: whoever is listening in on the raw input (see InputTap). */
  inputTapRef?: React.MutableRefObject<InputTap | null>;
}

export interface BufferProcessorOptions {
  detectors: GuitarDetectors;
  targets: ProcessorTargets;
  /** Current input gain multiplier (read fresh each call). */
  getGain: () => number;
  /** Capture sample rate — only used to time onsets within a block. */
  sampleRate?: number;
  /** Spectrum computed from the captured PCM itself, for a path with no
   *  AnalyserNode (native) — fed every window, read by the chord grading. */
  spectrum?: PcmSpectrum | null;
  /** The last seconds of raw input, kept for the note-onset model — fed every
   *  window, silent ones included, so its clock never skips. */
  recentAudio?: RecentAudio | null;
  /** Called (already throttled to ~10Hz) the first time signal is flowing. */
  onActive?: () => void;
  /** Whether the player is on bass right now (read fresh each call) — turns on
   *  the deep bass YIN, so switching instruments needs no new detectors. */
  isBass?: () => boolean;
}

/**
 * Creates a stateful processor. Call the returned function with each fixed-size
 * window (2048 samples, matching the aubio buffer size). Internal smoothing
 * state persists across calls.
 */
export function createGuitarBufferProcessor(opts: BufferProcessorOptions) {
  const { detectors, targets, getGain, spectrum, recentAudio, onActive, isBass, sampleRate = 48000 } = opts;
  const { pitch: pitchDetector, onset: onsetDetector, tick: tickDetector, pitchHigh: pitchHighDetector, pitchLow: pitchLowDetector, pitchBass: pitchBassDetector } = detectors;

  let lastFrequencies: number[] = [];
  // Per-hop pitch estimates of the current window, reused across calls.
  const hopFrequencies: number[] = [];
  // Same, from the optional short-window detector (finer time resolution).
  const hopFrequenciesHigh: number[] = [];
  let prevTickRms = 0;
  let lastTickFire = 0;
  let lastStateUpdate = 0;
  let silentWindows = 0;
  // Reused across calls — windows have a fixed size, so allocating per call
  // (~23×/s) only produced GC churn on the main thread.
  let normalizedBuf: Float32Array | null = null;

  const HOP = 512;

  // ── Low-string attacks ──────────────────────────────────────────────────────
  // The onset detector (hfc) listens for a bright attack, and a low string
  // picked softly — the thumb, a dark tone — has little brightness to give: it
  // can pass unheard, and a lesson waiting for a new attack never moves on. So
  // the low band (under LOW_BAND_HZ: a low E's fundamental and first harmonics)
  // is watched on its own, through its peak envelope — which, unlike an RMS over
  // a hop shorter than a low E's period, doesn't wobble with the wave's phase.
  // An attack is a hop whose envelope jumps well above the hops before it, and up
  // to where the low band recently was: two ringing strings beating out of a
  // quiet moment don't reach that. Read off the raw input — the per-window
  // normalisation below would flatten the jump out of a quiet start.
  const LOW_BAND_HZ = 250;
  /** The hop's low-band envelope against the louder of the two before it. */
  const LOW_ATTACK_RISE = 1.6;
  /** …and against the low band's recent peak, which halves every LOW_PEAK_HALF_LIFE_MS. */
  const LOW_ATTACK_OF_PEAK = 0.5;
  const LOW_PEAK_HALF_LIFE_MS = 500;
  /** The envelope falls back this fast between wave peaks (half-life, ms). */
  const LOW_ENVELOPE_HALF_LIFE_MS = 30;
  const LOW_ATTACK_REFRACTORY_MS = 80;
  // RBJ biquad low-pass (Q = 0.707) for the low band.
  const lowW = (2 * Math.PI * LOW_BAND_HZ) / sampleRate;
  const lowAlpha = Math.sin(lowW) / (2 * Math.SQRT1_2);
  const lowA0 = 1 + lowAlpha;
  const lowB0 = (1 - Math.cos(lowW)) / 2 / lowA0;
  const lowB1 = (1 - Math.cos(lowW)) / lowA0;
  const lowA1 = (-2 * Math.cos(lowW)) / lowA0;
  const lowA2 = (1 - lowAlpha) / lowA0;
  let lowX1 = 0, lowX2 = 0, lowY1 = 0, lowY2 = 0;
  const lowRelease = Math.pow(0.5, 1000 / (sampleRate * LOW_ENVELOPE_HALF_LIFE_MS));
  const lowPeakDecay = Math.pow(0.5, ((HOP / sampleRate) * 1000) / LOW_PEAK_HALF_LIFE_MS);
  let lowEnvelope = 0, lowPrev1 = 0, lowPrev2 = 0, lowPeak = 0, lastLowAttackMs = 0;

  /** True when a low string was struck in this window (see LOW_ATTACK_*). */
  const detectLowAttack = (input: Float32Array, nowMs: number): boolean => {
    const floor = targets.noiseFloorRef.current > 0 ? getAdaptiveVolumeGate(targets.noiseFloorRef.current) : 0.005;
    let found = false;
    for (let offset = 0; offset < input.length; offset += HOP) {
      const end = Math.min(input.length, offset + HOP);
      for (let i = offset; i < end; i++) {
        const x = input[i];
        const y = lowB0 * x + lowB1 * lowX1 + lowB0 * lowX2 - lowA1 * lowY1 - lowA2 * lowY2;
        lowX2 = lowX1; lowX1 = x; lowY2 = lowY1; lowY1 = y;
        const a = Math.abs(y);
        lowEnvelope = a > lowEnvelope ? a : lowEnvelope * lowRelease;
      }
      // Same scale as rawVolumeRef (×10), so the noise gate applies as is.
      const level = lowEnvelope * 10;
      const hopEndMs = nowMs - ((input.length - end) / sampleRate) * 1000;
      if (level > floor
          && level > LOW_ATTACK_RISE * Math.max(lowPrev1, lowPrev2)
          && level >= LOW_ATTACK_OF_PEAK * lowPeak
          && hopEndMs - lastLowAttackMs > LOW_ATTACK_REFRACTORY_MS) {
        lastLowAttackMs = hopEndMs;
        found = true;
      }
      lowPeak = Math.max(level, lowPeak * lowPeakDecay);
      lowPrev2 = lowPrev1;
      lowPrev1 = level;
    }
    if (found && targets.lastLowAttackMsRef) targets.lastLowAttackMsRef.current = nowMs;
    return found;
  };
  const VOLUME_THRESHOLD = 0.001; // catches low E on mics with high-pass filters

  // ── High-register fast path (A3) ────────────────────────────────────────────
  // The 2048-sample analysis window is sized for the LOW strings: E2 (82 Hz) only
  // fits ~3.5 periods in it. At E4 and above it holds 100+ periods — the extra
  // length buys nothing but costs time resolution, and time resolution is exactly
  // what fast passages need. A second detector with a 1024/256 window resolves
  // the same high notes with half the window, so a fresh note can be identified
  // before the 2048 path has settled.
  //
  // It is deliberately allowed to speak ONLY in the settle window right after an
  // onset, and only when it reports a high-register pitch: that is precisely the
  // gap where the 2048 path has nothing useful to say. Outside that gap the
  // long-window detector stays the authority, so the short window can shorten
  // latency but never override a settled reading.
  const HOP_HIGH = 256;
  /** How long after an onset the short-window detector may override (ms). Sized
   *  to the measured settle time of the 2048 path (~105 ms). */
  const HIGH_RES_SETTLE_MS = 120;
  /** Median is taken over the most recent estimates only — an average across the
   *  whole block would still be half made of the previous note. */
  const HIGH_RES_RECENT_HOPS = 3;

  // ── Low-register correction ─────────────────────────────────────────────────
  // yinfft weighs its spectrum the way the ear does. That keeps it robust on
  // bright, busy signals and costs it accuracy at the bottom: it reads the low
  // strings sharp — E2 by ~50 cents, and by more than a semitone when the tone
  // is dark (thumb, neck pickup), which put a low E played right outside its
  // window or onto the fret above. The plain YIN (yinfast — the same YIN,
  // computed through an FFT, no weighting) reads them where they are
  // (guitarBufferProcessor.lowstrings.test.ts).
  //
  // So below LOW_REFINE_MAX_HZ its reading is taken instead — but only while
  // both name the same note, give or take yinfft's bias, which only ever points
  // up: YIN's own weakness is octave errors, and a reading an octave away is
  // never taken. Everywhere else yinfft stays the authority, exactly as before.
  const LOW_REFINE_MAX_HZ = 200;
  /** How far under yinfft the plain YIN may read and still be the same note
   *  (yinfft's bias on a dark low E reaches ~170 cents). */
  const LOW_REFINE_BELOW_CENTS = 200;
  /** And how far over it — yinfft is never flat, so only noise is up here. */
  const LOW_REFINE_ABOVE_CENTS = 50;

  const refineLow = (coarse: number, fine: number): number => {
    if (coarse <= 20 || coarse >= LOW_REFINE_MAX_HZ || fine <= 20) return coarse;
    const cents = 1200 * Math.log2(fine / coarse);
    return cents >= -LOW_REFINE_BELOW_CENTS && cents <= LOW_REFINE_ABOVE_CENTS ? fine : coarse;
  };

  // ── Bass register ───────────────────────────────────────────────────────────
  // A YIN can only find periods up to half its window: 2048 samples at 48 kHz
  // stop at ~47 Hz, above a bass's low E (41 Hz) — yinfft reads E1–F#1 as
  // whatever harmonic it can see, and a dark G1/A1 already a fourth or more
  // sharp. On bass a 4096-sample plain YIN reaches ~23 Hz (a five-string's B0
  // at 31 Hz included) and is taken under BASS_REFINE_MAX_HZ — unless it sits an
  // octave or more under the main reading: yinfft's errors there only ever point
  // up, while YIN's own are sub-octaves, and those are never taken
  // (guitarBufferProcessor.bass.test.ts).
  const BASS_REFINE_MAX_HZ = 100;
  /** How far under the main reading the deep YIN may sit — B0 read by yinfft lands ~760 cents sharp. */
  const BASS_REFINE_BELOW_CENTS = 1000;
  const BASS_REFINE_ABOVE_CENTS = 50;

  const refineBass = (coarse: number, deep: number): number => {
    if (deep <= 20 || deep >= BASS_REFINE_MAX_HZ) return coarse;
    if (coarse <= 20) return deep;
    const cents = 1200 * Math.log2(deep / coarse);
    return cents >= -BASS_REFINE_BELOW_CENTS && cents <= BASS_REFINE_ABOVE_CENTS ? deep : coarse;
  };

  // ── Onset-anchored note events (B1) ─────────────────────────────────────────
  // A pending event collects pitch estimates from the hops that came AFTER its
  // own onset hop — never from hops belonging to the previous note. That
  // separation is the whole reason the attributed pitch can be trusted: the
  // `frequencyRef` value deliberately holds the previous note's median through
  // the attack (see the stabilisation block below), which is right for a
  // "what's ringing now" readout and completely wrong for "what did this attack
  // turn out to be".
  /** Estimates needed before an attack's pitch is considered settled. */
  const EVENT_MIN_ESTIMATES = 3;
  /** On bass the deep YIN's window is twice as long, so it needs more hops past
   *  the attack before it stops hearing the note before (BASS_* above) — ~53 ms
   *  of them, which is 5 hops at 48 kHz. */
  const BASS_EVENT_MIN_ESTIMATES = Math.max(5, Math.round((5 * sampleRate) / 48000));
  /** Give up waiting for a pitch this long after the attack (ms). Dead/muted
   *  notes never resolve one, and the grader still wants the timing. */
  const EVENT_RESOLVE_TIMEOUT_MS = 180;
  /** Ring buffer bound — the grader only ever looks back a beat or two. */
  const EVENT_BUFFER_MAX = 64;
  /** The onset detector cannot report an attack until the new note has filled its
   *  analysis window, so it always reports one window late. Measured at a steady
   *  +41…48 ms across every tempo and register (guitarBufferProcessor.fastruns.test.ts)
   *  against a window of 2048/48000 = 42.7 ms — i.e. the lag IS the window, not a
   *  tunable fudge, which is why it is derived rather than hardcoded. Subtracting
   *  it makes onsetMs mean "when the string was struck" instead of "when we
   *  worked out that it had been". */
  const ONSET_WINDOW = 2048;
  const ONSET_REPORT_LAG_MS = (ONSET_WINDOW / sampleRate) * 1000;
  /** Every attack is also looked at as a before/after spectrum (attackTones.ts) —
   *  only where events are wanted at all. Fed the raw input, like the chord spectrum. */
  const attackTap = targets.noteEventsRef ? createAttackSpectraTap(sampleRate) : null;
  /** Samples received before the current window — attackTap's clock. */
  let samplesIn = 0;

  // Only the onset hop itself is dropped: its window is dominated by the note
  // that just ended, so its estimate genuinely belongs to the previous event.
  //
  // Muting a full window's worth of hops instead (4 long / 4 high, by analogy
  // with ONSET_REPORT_LAG_MS) sounds more correct and measurably is not — it was
  // tried and made things worse: 16ths at 180 BPM fell from 96.9% to 84.4%
  // credited, and 220 BPM cascaded into mis-assignment. yinfft locks onto the
  // dominant periodicity rather than needing a pure window, so a window that is
  // merely mostly-new-note already reports the new note, and muting those hops
  // throws away most of a fast note's evidence for no gain. Don't re-derive this
  // from first principles; re-run guitarBufferProcessor.fastruns.test.ts.
  const ONSET_HOP_SKIP = 1;

  interface PendingEvent {
    /** Created at the attack, so its spectra can land on it whenever they're read. */
    event: DetectedNoteEvent;
    long: number[];
    high: number[];
    peakVolume: number;
    /** Hops elapsed since (and including) the onset hop, per detector. */
    longHops: number;
    highHops: number;
  }
  let pending: PendingEvent | null = null;
  /** Set per window from isBass — see BASS_* above. */
  let bassActive = false;

  const median = (xs: number[]): number => {
    if (xs.length === 0) return 0;
    const sorted = [...xs].sort((a, b) => a - b);
    return sorted[sorted.length >> 1];
  };

  /** Same register guard as the live path: the short window may only speak for
   *  high notes, and only when the long window agrees or has nothing to say. */
  const pickRegisterAware = (longEstimates: number[], highEstimates: number[]): number => {
    const longMedian = median(longEstimates);
    const highMedian = median(highEstimates);
    const longIsHighOrSilent = longMedian === 0 || longMedian >= HIGH_STRING_MIN_FREQ;
    if (highMedian >= HIGH_STRING_MIN_FREQ && longIsHighOrSilent) return highMedian;
    return longMedian;
  };

  const commitPending = () => {
    const buf = targets.noteEventsRef?.current;
    if (!pending || !buf) { pending = null; return; }
    const { event } = pending;
    event.pitchHz = pickRegisterAware(pending.long, pending.high);
    event.peakVolume = pending.peakVolume;
    buf.push(event);
    if (buf.length > EVENT_BUFFER_MAX) buf.splice(0, buf.length - EVENT_BUFFER_MAX);
    pending = null;
  };

  return function process(inputBuffer: Float32Array) {
    const len = inputBuffer.length;
    const gain = getGain();
    bassActive = !!pitchBassDetector && !!isBass?.();
    if (!normalizedBuf || normalizedBuf.length !== len) normalizedBuf = new Float32Array(len);
    // Ungained, like the web path's analyser, which taps the source directly.
    // Before the silence gate, so a chord read after a pause isn't stale audio.
    spectrum?.push(inputBuffer);
    const blockStart = samplesIn;
    samplesIn += len;
    attackTap?.push(inputBuffer);
    targets.inputTapRef?.current?.(inputBuffer, sampleRate);

    // 1. Apply gain and calculate RMS volume + peak from gained signal
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < len; i++) {
      const s = inputBuffer[i] * gain;
      sum += s * s;
      const abs = Math.abs(s);
      if (abs > peak) peak = abs;
    }
    const rms = Math.sqrt(sum / len);
    const volume = Math.max(0, Math.min(1, rms * 10));
    // Raw RMS without gain — gain-independent signal presence indicator
    const rawRms = gain > 0 ? rms / gain : rms;
    const rawVolume = Math.max(0, Math.min(1, rawRms * 10));
    targets.rawVolumeRef.current = rawVolume;

    const nowMs = Date.now();
    // Before the silence gate: an attack out of silence is the one it must not miss.
    const isLowAttack = detectLowAttack(inputBuffer, nowMs);
    recentAudio?.push(inputBuffer, nowMs);

    // 1b. Silence gate — with no signal there is nothing to detect. Skipping the
    // aubio calls (yinfft pitch + 2 onset detectors, 4 hops each ≈ 12 WASM FFT
    // passes per window) keeps the main thread idle-cheap while the mic is on
    // but the user isn't playing. The first silent window still runs the full
    // DSP so decaying signals finish cleanly; when sound returns the detectors
    // see the fresh transient and fire normally.
    if (rms <= VOLUME_THRESHOLD) {
      if (++silentWindows >= 2) {
        // Signal stopped — whatever attack was still resolving is over.
        commitPending();
        lastFrequencies = [];
        prevTickRms = rms;
        targets.frequencyRef.current  = 0;
        targets.volumeRef.current     = volume;
        targets.confidenceRef.current = 0;
        // Confirmed silence (2+ windows) — a clean read of the ambient floor,
        // not a note's decay tail. Slow EMA (0.05) so a single unusually-quiet
        // or unusually-loud silent window can't swing the gate on its own.
        targets.noiseFloorRef.current = targets.noiseFloorRef.current === 0
          ? rawVolume
          : targets.noiseFloorRef.current * 0.95 + rawVolume * 0.05;
        if (onActive && nowMs - lastStateUpdate >= 100) {
          lastStateUpdate = nowMs;
          onActive();
        }
        return;
      }
    } else {
      silentWindows = 0;
    }

    // 2. Normalize gained buffer for aubio — scale to peak=0.9 so the pitch
    //    detector always receives a strong signal regardless of input level.
    const scale = peak > 0.0001 ? 0.9 / peak : 0;
    for (let i = 0; i < len; i++) {
      normalizedBuf[i] = inputBuffer[i] * gain * scale;
    }

    // 3. Detect onset & pitch in hop-size chunks (512 samples)
    let isOnset = false;
    let isTick = false;
    let pitchConfidence = 0;
    hopFrequencies.length = 0;
    hopFrequenciesHigh.length = 0;
    const totalHops = Math.ceil(len / HOP);
    const hopMs = (HOP / sampleRate) * 1000;
    let hopIndex = 0;
    for (let offset = 0; offset < len; offset += HOP, hopIndex++) {
      const chunk = normalizedBuf.subarray(offset, offset + HOP);

      if (onsetDetector.do(chunk)) {
        isOnset = true;
        // nowMs stamps the END of the block; walk back to this hop, then
        // back again by the detector's own one-window reporting lag.
        const onsetMs = nowMs - (totalHops - 1 - hopIndex) * hopMs - ONSET_REPORT_LAG_MS;
        if (targets.lastAttackMsRef) targets.lastAttackMsRef.current = onsetMs;
        if (targets.noteEventsRef) {
          commitPending(); // a new attack ends the previous one, resolved or not
          const event: DetectedNoteEvent = { onsetMs, pitchHz: 0, peakVolume: rawVolume, attack: attackTap ? "reading" : null };
          // The same instant in samples: this hop's end, back by the detector's window.
          attackTap?.mark(blockStart + (hopIndex + 1) * HOP - ONSET_WINDOW, (spectra) => { event.attack = spectra; });
          pending = {
            event,
            long: [], high: [], peakVolume: rawVolume, longHops: 0, highHops: 0,
          };
        }
      }
      if (tickDetector.do(chunk)) isTick = true;

      // Both run on every hop — each keeps its own sliding window of the signal.
      const guitarFreq = refineLow(pitchDetector.do(chunk), pitchLowDetector ? pitchLowDetector.do(chunk) : 0);
      const hopFreq = bassActive ? refineBass(guitarFreq, pitchBassDetector.do(chunk)) : guitarFreq;
      pitchConfidence = pitchDetector.getConfidence();
      if (hopFreq > 20) hopFrequencies.push(hopFreq);
      if (pending && ++pending.longHops > ONSET_HOP_SKIP && hopFreq > 20) {
        pending.long.push(hopFreq);
      }

      if (pitchHighDetector) {
        for (let sub = offset; sub < offset + HOP; sub += HOP_HIGH) {
          const hf = pitchHighDetector.do(normalizedBuf.subarray(sub, sub + HOP_HIGH));
          if (hf > 20) hopFrequenciesHigh.push(hf);
          if (pending && ++pending.highHops > ONSET_HOP_SKIP * (HOP / HOP_HIGH) && hf > 20) {
            pending.high.push(hf);
          }
        }
      }
    }

    if (pending) {
      pending.peakVolume = Math.max(pending.peakVolume, rawVolume);
      const settled = pending.long.length >= (bassActive ? BASS_EVENT_MIN_ESTIMATES : EVENT_MIN_ESTIMATES)
        || pending.high.length >= EVENT_MIN_ESTIMATES * 2;
      if (settled || nowMs - pending.event.onsetMs >= EVENT_RESOLVE_TIMEOUT_MS) commitPending();
    }

    if (isOnset) {
      targets.lastOnsetTimeRef.current = nowMs;
    }

    // 4. Threshold & median stabilization
    let stabilizedFreq = 0;
    // Ignore attack phase for pitch (transients cause random pitch jumps)
    const isAttackPhase = isOnset || nowMs - targets.lastOnsetTimeRef.current < 30;

    if (rms > VOLUME_THRESHOLD && hopFrequencies.length > 0 && !isAttackPhase) {
      // Feed every hop's estimate into the median, not just the window's last one.
      // The 5-slot median then spans ~53ms of history instead of ~213ms, so a new
      // note dominates it within a single window (~43ms) rather than after ~3
      // windows — cutting ~90ms off the felt detection latency. A lone glitchy
      // hop still gets rejected by the median.
      for (const hopFreq of hopFrequencies) {
        lastFrequencies.push(hopFreq);
        if (lastFrequencies.length > 5) lastFrequencies.shift();
      }
      const sorted = [...lastFrequencies].sort((a, b) => a - b);
      stabilizedFreq = sorted[Math.floor(sorted.length / 2)];
    } else if (rms <= VOLUME_THRESHOLD) {
      lastFrequencies = [];
    } else if (lastFrequencies.length > 0) {
      // Either a momentary confidence dip mid-note, or the attack-phase window
      // itself (which — since a window is ~43ms and the attack guard is only
      // 30ms — is *every* window containing a fresh onset). Hold the last
      // stable estimate without feeding this window's possibly-noisy (or
      // absent) reading into the median. This used to zero the reported pitch
      // for the entire attack-phase window instead, which meant a freshly
      // attacked note couldn't register a hit until the window *after* its
      // own onset — an extra ~43-85ms of felt detection latency on every
      // single note attack, on top of whatever getLatencyMs() already
      // compensates for.
      const sorted = [...lastFrequencies].sort((a, b) => a - b);
      stabilizedFreq = sorted[Math.floor(sorted.length / 2)];
    }

    // High-register fast path — see HIGH_RES_* above. Two guards keep this from
    // ever inventing a reading the long window disagrees with:
    //   • only inside the post-onset settle window, where the 2048 path is either
    //     silent or still holding the previous note;
    //   • only when BOTH detectors are in the high register (or the long one has
    //     nothing at all). A low note under a 1024-sample window can alias an
    //     octave or two up; requiring the settled reading to be high as well means
    //     a low run can never be hijacked by that alias.
    if (pitchHighDetector && hopFrequenciesHigh.length > 0 && rms > VOLUME_THRESHOLD) {
      const recent = hopFrequenciesHigh.slice(-HIGH_RES_RECENT_HOPS).sort((a, b) => a - b);
      const highMedian = recent[recent.length >> 1];
      const longWindowIsHighOrSilent = stabilizedFreq === 0 || stabilizedFreq >= HIGH_STRING_MIN_FREQ;
      if (highMedian >= HIGH_STRING_MIN_FREQ
          && longWindowIsHighOrSilent
          && nowMs - targets.lastOnsetTimeRef.current <= HIGH_RES_SETTLE_MS) {
        stabilizedFreq = highMedian;
      }
    }

    targets.frequencyRef.current = stabilizedFreq;
    targets.volumeRef.current = volume;
    targets.confidenceRef.current = stabilizedFreq > 0 ? pitchConfidence : 0;

    // Percussive-tick detection for muted/dead notes. Refractory period (60ms)
    // blocks double-triggers within a single attack envelope.
    const rmsDelta = rms - prevTickRms;
    prevTickRms = rms;
    const isRmsTransient = rmsDelta > 0.006 && rms > 0.004;
    const tickCandidate = isTick || isOnset || isRmsTransient || isLowAttack;
    if (tickCandidate && nowMs - lastTickFire > 60) {
      lastTickFire = nowMs;
      targets.lastTickTimeRef.current = nowMs;
    }

    // Throttle the "is active" callback to ~10Hz for slow-changing UI state.
    if (onActive && nowMs - lastStateUpdate >= 100) {
      lastStateUpdate = nowMs;
      onActive();
    }
  };
}

/** Build the aubio detectors with the app's tuned parameters. */
export function createGuitarDetectors(aubio: any, sampleRate: number): GuitarDetectors {
  const pitch = new aubio.Pitch("yinfft", 2048, 512, sampleRate);
  pitch.setTolerance(0.7);

  const onset = new aubio.Onset("hfc", 2048, 512, sampleRate);
  onset.setThreshold(0.3);

  // specflux reacts to broadband spectral change — fires on muted/dead notes
  // that hfc misses. Lower threshold for smaller-magnitude percussive hits.
  const tick = new aubio.Onset("specflux", 2048, 512, sampleRate);
  tick.setThreshold(0.15);

  // Half-length window for the high register — see the HIGH_RES_* block above.
  const pitchHigh = new aubio.Pitch("yinfft", 1024, 256, sampleRate);
  pitchHigh.setTolerance(0.7);

  // The plain YIN, for the low register only — see LOW_REFINE_* above.
  const pitchLow = new aubio.Pitch("yinfast", 2048, 512, sampleRate);

  // The deep YIN for bass — idle unless the processor is told it's on bass.
  // Sized by time, not samples: half of it has to hold a ~43 ms period (B0 at
  // 23 Hz with margin), 4096 at 44.1/48 kHz and 8192 at 96 kHz.
  const bassWindow = 2 ** Math.ceil(Math.log2(sampleRate / 12));
  const pitchBass = new aubio.Pitch("yinfast", bassWindow, 512, sampleRate);

  return { pitch, onset, tick, pitchHigh, pitchLow, pitchBass };
}
