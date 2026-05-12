
import { useCallback,useEffect, useMemo, useRef, useState } from "react";
import { computeChromagram } from "utils/audio/noteUtils";

interface AudioAnalyzerState {
  isListening: boolean;
  error: string | null;
  inputGain: number;
}

export interface AudioRefs {
  frequencyRef: React.MutableRefObject<number>;
  volumeRef: React.MutableRefObject<number>;
  /** RMS-based volume without gain applied — use this for silence detection
   *  so the threshold is independent of the user's sensitivity setting. */
  rawVolumeRef: React.MutableRefObject<number>;
  lastOnsetTimeRef: React.MutableRefObject<number>;
  /** Timestamp of the most recent *percussive* onset (muted/dead-note friendly:
   *  fires on broadband transients like tick/thud even when pitch is absent). */
  lastTickTimeRef: React.MutableRefObject<number>;
  confidenceRef: React.MutableRefObject<number>;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  /** Chromagram snapshot taken at the most recent onset — cleaner than live FFT */
  onsetChromaRef: React.MutableRefObject<Float32Array | null>;
}

const GAIN_STORAGE_KEY = "audio_input_gain";
const DEFAULT_GAIN = 3.0;

function loadPersistedGain(): number {
  try {
    const stored = localStorage.getItem(GAIN_STORAGE_KEY);
    if (stored !== null) {
      const val = parseFloat(stored);
      if (!isNaN(val) && val >= 0.5 && val <= 10.0) return val;
    }
  } catch { /* ignore */ }
  return DEFAULT_GAIN;
}

// Runs in AudioWorkletGlobalScope — accumulates 128-sample quanta into
// 2048-sample buffers and posts them to the main thread for aubio processing.
const WORKLET_CODE = `
class GuitarInputProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buf = new Float32Array(2048);
    this._pos = 0;
  }
  process(inputs) {
    const ch = inputs[0]?.[0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this._buf[this._pos++] = ch[i];
      if (this._pos === 2048) {
        this.port.postMessage(this._buf.slice());
        this._pos = 0;
      }
    }
    return true;
  }
}
registerProcessor('guitar-input-processor', GuitarInputProcessor);
`;

export const useAudioAnalyzer = () => {
  const [state, setState] = useState<AudioAnalyzerState>({
    isListening: false,
    error: null,
    inputGain: loadPersistedGain(),
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const onsetChromaRef = useRef<Float32Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const inputGainRef = useRef<number>(loadPersistedGain());
  const pitchDetectorRef = useRef<any>(null);
  const onsetDetectorRef = useRef<any>(null);
  const tickDetectorRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastFrequenciesRef = useRef<number[]>([]);

  // Real-time refs for fast access without triggering re-renders
  const frequencyRef = useRef<number>(0);
  const volumeRef = useRef<number>(0);
  const rawVolumeRef = useRef<number>(0);
  const confidenceRef = useRef<number>(0);
  const lastOnsetTimeRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(0);
  const lastStateUpdateRef = useRef<number>(0);
  const prevTickRmsRef = useRef<number>(0);
  const lastTickFireRef = useRef<number>(0);

  const init = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 8192;
      analyser.smoothingTimeConstant = 0.1; // fast decay → cleaner onset snapshots
      source.connect(analyser);
      analyserNodeRef.current = analyser;

      // @ts-ignore
      const AubioModule = await import("aubiojs");
      const Aubio = AubioModule.default || AubioModule;
      const aubio = await Aubio();

      // yinfft is O(N log N) via FFT. Reverting to 2048 for faster transient response
      const pitchDetector = new aubio.Pitch("yinfft", 2048, 512, audioContext.sampleRate);
      (pitchDetector as any).setTolerance(0.7);
      pitchDetectorRef.current = pitchDetector;

      const onsetDetector = new (aubio.Onset as any)("hfc", 2048, 512, audioContext.sampleRate);
      onsetDetector.setThreshold(0.3);
      onsetDetectorRef.current = onsetDetector;

      // specflux reacts to broadband spectral change — fires on muted/dead notes
      // that hfc misses. Lower threshold for smaller-magnitude percussive hits.
      const tickDetector = new (aubio.Onset as any)("specflux", 2048, 512, audioContext.sampleRate);
      tickDetector.setThreshold(0.15);
      tickDetectorRef.current = tickDetector;

      // AudioWorklet: accumulates 128-sample quanta → 2048-sample buffers on main thread.
      // Avoids deprecated ScriptProcessorNode and runs audio collection off the main thread.
      const blob = new Blob([WORKLET_CODE], { type: "application/javascript" });
      const workletUrl = URL.createObjectURL(blob);
      await audioContext.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      const workletNode = new AudioWorkletNode(audioContext, "guitar-input-processor");
      workletNodeRef.current = workletNode;

      const normalizedBuf = new Float32Array(2048);

      workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
        const inputBuffer = event.data;
        const gain = inputGainRef.current;

        // 1. Apply gain and calculate RMS volume + peak from gained signal
        let sum = 0;
        let peak = 0;
        for (let i = 0; i < inputBuffer.length; i++) {
          const s = inputBuffer[i] * gain;
          sum += s * s;
          const abs = Math.abs(s);
          if (abs > peak) peak = abs;
        }
        const rms = Math.sqrt(sum / inputBuffer.length);
        const volume = Math.max(0, Math.min(1, rms * 10));
        // Raw RMS without gain — gain-independent signal presence indicator
        const rawRms = gain > 0 ? rms / gain : rms;
        rawVolumeRef.current = Math.max(0, Math.min(1, rawRms * 10));

        // 2. Normalize gained buffer for aubio — scale to peak=0.9 so the pitch
        //    detector always receives a strong signal regardless of mic input level.
        const scale = peak > 0.0001 ? 0.9 / peak : 0;
        for (let i = 0; i < inputBuffer.length; i++) {
          normalizedBuf[i] = inputBuffer[i] * gain * scale;
        }

        // 3. Detect onset & pitch in hop-size chunks (512 samples)
        let isOnset = false;
        let isTick = false;
        let frequency = 0;
        let pitchConfidence = 0;
        const HOP = 512;
        for (let offset = 0; offset < 2048; offset += HOP) {
          const chunk = normalizedBuf.subarray(offset, offset + HOP);
          if (onsetDetector.do(chunk)) isOnset = true;
          if (tickDetector.do(chunk)) isTick = true;
          frequency = pitchDetector.do(chunk);
          pitchConfidence = (pitchDetector as any).getConfidence();
        }

        const nowMs = Date.now();

        if (isOnset) {
          lastOnsetTimeRef.current = nowMs;
          // Snapshot chromagram at onset — smoothingTimeConstant=0.1 means this
          // frame already reflects ~90% of the new attack.
          const snap = computeChromagram(analyser);
          if (snap) onsetChromaRef.current = snap;
        }

        // 4. Threshold & median stabilization
        const VOLUME_THRESHOLD = 0.001; // Lowered to catch low E string on mics with high-pass filters
        let stabilizedFreq = 0;
        
        // Ignore attack phase for pitch (transients cause random pitch jumps)
        const isAttackPhase = isOnset || (nowMs - lastOnsetTimeRef.current < 30);

        if (rms > VOLUME_THRESHOLD && frequency > 20 && !isAttackPhase) {
          lastFrequenciesRef.current.push(frequency);
          if (lastFrequenciesRef.current.length > 5) lastFrequenciesRef.current.shift();
          const sorted = [...lastFrequenciesRef.current].sort((a, b) => a - b);
          stabilizedFreq = sorted[Math.floor(sorted.length / 2)];
        } else {
          if (rms <= VOLUME_THRESHOLD) {
            lastFrequenciesRef.current = [];
          } else if (!isAttackPhase && lastFrequenciesRef.current.length > 0) {
            // Keep previous pitch if Aubio momentarily loses confidence but string is still ringing
            const sorted = [...lastFrequenciesRef.current].sort((a, b) => a - b);
            stabilizedFreq = sorted[Math.floor(sorted.length / 2)];
          }
        }

        frequencyRef.current = stabilizedFreq;
        volumeRef.current = volume;
        confidenceRef.current = stabilizedFreq > 0 ? pitchConfidence : 0;

        // Percussive-tick detection for muted/dead notes. Refractory period (60ms)
        // blocks double-triggers within a single attack envelope.
        const rmsDelta = rms - prevTickRmsRef.current;
        prevTickRmsRef.current = rms;
        const isRmsTransient = rmsDelta > 0.006 && rms > 0.004;
        const tickCandidate = isTick || isOnset || isRmsTransient;
        if (tickCandidate && nowMs - lastTickFireRef.current > 60) {
          lastTickFireRef.current = nowMs;
          lastTickTimeRef.current = nowMs;
        }

        // Throttle React state updates to ~10Hz
        // Throttle React state updates to ~10Hz for slow-changing UI state
        const now = Date.now();
        if (now - lastStateUpdateRef.current >= 100) {
          lastStateUpdateRef.current = now;
          
          setState(prev => {
            if (prev.isListening === true && prev.error === null) {
              return prev; 
            }
            return {
              ...prev,
              isListening: true,
              error: null,
            };
          });
        }
      };

      source.connect(workletNode);
      // Route through a silent gain node to keep the audio graph active
      // without feeding the microphone signal back to the speakers.
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      workletNode.connect(silentGain);
      silentGain.connect(audioContext.destination);

      setState(prev => ({ ...prev, isListening: true, error: null }));

    } catch (err: any) {
      console.error("Error initializing audio analyzer:", err);
      setState(prev => ({ ...prev, error: err.message || "Microphone access denied" }));
    }
  }, []);

  const close = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.port.onmessage = null;
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (analyserNodeRef.current) {
      analyserNodeRef.current.disconnect();
      analyserNodeRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    pitchDetectorRef.current = null;
    onsetDetectorRef.current = null;
    tickDetectorRef.current = null;
    lastFrequenciesRef.current = [];
    onsetChromaRef.current = null;
    frequencyRef.current = 0;
    volumeRef.current = 0;
    rawVolumeRef.current = 0;
    confidenceRef.current = 0;
    lastOnsetTimeRef.current = 0;
    lastTickTimeRef.current = 0;
    prevTickRmsRef.current = 0;
    lastTickFireRef.current = 0;

    setState(prev => ({ ...prev, isListening: false }));
  }, []);

  useEffect(() => {
    return () => {
      close();
    };
  }, [close]);

  const setInputGain = useCallback((value: number) => {
    const clamped = Math.max(0.5, Math.min(10.0, value));
    inputGainRef.current = clamped;
    try {
      localStorage.setItem(GAIN_STORAGE_KEY, String(clamped));
    } catch { /* ignore */ }
    setState(prev => ({ ...prev, inputGain: clamped }));
  }, []);

  const getLatencyMs = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return 120;
    const bufferLatency = (2048 / ctx.sampleRate) * 1000; // ~46ms at 44100Hz
    const baseLatency = ((ctx as any).baseLatency || 0) * 1000;
    const outputLatency = ((ctx as any).outputLatency || 0) * 1000;
    return baseLatency + outputLatency + bufferLatency + 30;
  }, []);

  const audioRefs: AudioRefs = { frequencyRef, volumeRef, rawVolumeRef, lastOnsetTimeRef, lastTickTimeRef, confidenceRef, analyserRef: analyserNodeRef, onsetChromaRef };

  return useMemo(() => ({
    ...state,
    init,
    close,
    audioRefs,
    getLatencyMs,
    setInputGain,
  }), [state, init, close, audioRefs, getLatencyMs, setInputGain]);
};
