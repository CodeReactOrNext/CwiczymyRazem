// Shared guitar DSP: turns a window of mono Float32 PCM into the realtime refs
// (frequency / volume / onset / tick / chroma) consumed by PracticeSession.
//
// Used by BOTH input paths so they stay byte-for-byte identical:
//   • useAudioAnalyzer       — browser getUserMedia → AudioWorklet (web build)
//   • useNativeAudioAnalyzer — Electron native ASIO/WASAPI capture (desktop)
//
// The only difference between paths is *where the buffer comes from*; the math
// below is the single source of truth.
import { computeChromagram } from "utils/audio/noteUtils";

export interface GuitarDetectors {
  /** aubio Pitch ("yinfft", 2048, 512, sampleRate), tolerance 0.7 */
  pitch: any;
  /** aubio Onset ("hfc", 2048, 512, sampleRate), threshold 0.3 */
  onset: any;
  /** aubio Onset ("specflux", 2048, 512, sampleRate), threshold 0.15 */
  tick: any;
}

export interface ProcessorTargets {
  frequencyRef: React.MutableRefObject<number>;
  volumeRef: React.MutableRefObject<number>;
  rawVolumeRef: React.MutableRefObject<number>;
  confidenceRef: React.MutableRefObject<number>;
  lastOnsetTimeRef: React.MutableRefObject<number>;
  lastTickTimeRef: React.MutableRefObject<number>;
  onsetChromaRef: React.MutableRefObject<Float32Array | null>;
}

export interface BufferProcessorOptions {
  detectors: GuitarDetectors;
  targets: ProcessorTargets;
  /** Current input gain multiplier (read fresh each call). */
  getGain: () => number;
  /** Optional AnalyserNode for chromagram snapshots (web path only). */
  analyser?: React.MutableRefObject<AnalyserNode | null> | null;
  /** Called (already throttled to ~10Hz) the first time signal is flowing. */
  onActive?: () => void;
}

/**
 * Creates a stateful processor. Call the returned function with each fixed-size
 * window (2048 samples, matching the aubio buffer size). Internal smoothing
 * state persists across calls.
 */
export function createGuitarBufferProcessor(opts: BufferProcessorOptions) {
  const { detectors, targets, getGain, analyser, onActive } = opts;
  const { pitch: pitchDetector, onset: onsetDetector, tick: tickDetector } = detectors;

  let lastFrequencies: number[] = [];
  let prevTickRms = 0;
  let lastTickFire = 0;
  let lastStateUpdate = 0;
  let silentWindows = 0;
  // Reused across calls — windows have a fixed size, so allocating per call
  // (~23×/s) only produced GC churn on the main thread.
  let normalizedBuf: Float32Array | null = null;

  const HOP = 512;
  const VOLUME_THRESHOLD = 0.001; // catches low E on mics with high-pass filters

  return function process(inputBuffer: Float32Array) {
    const len = inputBuffer.length;
    const gain = getGain();
    if (!normalizedBuf || normalizedBuf.length !== len) normalizedBuf = new Float32Array(len);

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
    targets.rawVolumeRef.current = Math.max(0, Math.min(1, rawRms * 10));

    const nowMs = Date.now();

    // 1b. Silence gate — with no signal there is nothing to detect. Skipping the
    // aubio calls (yinfft pitch + 2 onset detectors, 4 hops each ≈ 12 WASM FFT
    // passes per window) keeps the main thread idle-cheap while the mic is on
    // but the user isn't playing. The first silent window still runs the full
    // DSP so decaying signals finish cleanly; when sound returns the detectors
    // see the fresh transient and fire normally.
    if (rms <= VOLUME_THRESHOLD) {
      if (++silentWindows >= 2) {
        lastFrequencies = [];
        prevTickRms = rms;
        targets.frequencyRef.current  = 0;
        targets.volumeRef.current     = volume;
        targets.confidenceRef.current = 0;
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
    let frequency = 0;
    let pitchConfidence = 0;
    for (let offset = 0; offset < len; offset += HOP) {
      const chunk = normalizedBuf.subarray(offset, offset + HOP);
      if (onsetDetector.do(chunk)) isOnset = true;
      if (tickDetector.do(chunk)) isTick = true;
      frequency = pitchDetector.do(chunk);
      pitchConfidence = pitchDetector.getConfidence();
    }

    if (isOnset) {
      targets.lastOnsetTimeRef.current = nowMs;
      // Snapshot chromagram at onset (web path only — native has no AnalyserNode).
      const node = analyser?.current;
      if (node) {
        const snap = computeChromagram(node);
        if (snap) targets.onsetChromaRef.current = snap;
      }
    }

    // 4. Threshold & median stabilization
    let stabilizedFreq = 0;
    // Ignore attack phase for pitch (transients cause random pitch jumps)
    const isAttackPhase = isOnset || nowMs - targets.lastOnsetTimeRef.current < 30;

    if (rms > VOLUME_THRESHOLD && frequency > 20 && !isAttackPhase) {
      lastFrequencies.push(frequency);
      if (lastFrequencies.length > 5) lastFrequencies.shift();
      const sorted = [...lastFrequencies].sort((a, b) => a - b);
      stabilizedFreq = sorted[Math.floor(sorted.length / 2)];
    } else {
      if (rms <= VOLUME_THRESHOLD) {
        lastFrequencies = [];
      } else if (!isAttackPhase && lastFrequencies.length > 0) {
        // Keep previous pitch if Aubio momentarily loses confidence but string rings
        const sorted = [...lastFrequencies].sort((a, b) => a - b);
        stabilizedFreq = sorted[Math.floor(sorted.length / 2)];
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
    const tickCandidate = isTick || isOnset || isRmsTransient;
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

/** Build the three aubio detectors with the app's tuned parameters. */
export function createGuitarDetectors(aubio: any, sampleRate: number): GuitarDetectors {
  const pitch = new aubio.Pitch("yinfft", 2048, 512, sampleRate);
  pitch.setTolerance(0.7);

  const onset = new aubio.Onset("hfc", 2048, 512, sampleRate);
  onset.setThreshold(0.3);

  // specflux reacts to broadband spectral change — fires on muted/dead notes
  // that hfc misses. Lower threshold for smaller-magnitude percussive hits.
  const tick = new aubio.Onset("specflux", 2048, 512, sampleRate);
  tick.setThreshold(0.15);

  return { pitch, onset, tick };
}
