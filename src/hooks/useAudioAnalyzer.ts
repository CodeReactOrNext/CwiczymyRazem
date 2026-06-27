
import { useCallback,useEffect, useMemo, useRef, useState } from "react";

import { createGuitarBufferProcessor, createGuitarDetectors } from "./guitarBufferProcessor";

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
  const resumeHandlerRef = useRef<(() => void) | null>(null);

  // Real-time refs for fast access without triggering re-renders.
  // (Smoothing/throttle state now lives inside the shared buffer processor.)
  const frequencyRef = useRef<number>(0);
  const volumeRef = useRef<number>(0);
  const rawVolumeRef = useRef<number>(0);
  const confidenceRef = useRef<number>(0);
  const lastOnsetTimeRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(0);

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
      // Pin the analysis sample rate to 48 kHz. External interfaces (e.g. Arturia
      // Minifuse) may run the device at 96/176.4/192 kHz; at those rates aubio's
      // fixed 2048-sample yinfft window covers <2 periods of low guitar notes, so
      // pitch detection silently returns 0 even though volume/onset still work.
      // Browsers resample the device input to the requested rate. Fall back to the
      // device default if the constructor rejects the option (rare/old engines).
      let audioContext: AudioContext;
      try {
        audioContext = new AudioContextClass({ sampleRate: 48000 });
      } catch {
        audioContext = new AudioContextClass();
      }
      audioContextRef.current = audioContext;

      // After `await getUserMedia` the browser often considers the user gesture
      // consumed, so the freshly-created AudioContext starts in "suspended" state.
      // A suspended context never runs the AudioWorklet's process() → no buffers
      // are posted → volume/frequency stay 0 (mic appears dead even though
      // permission was granted). Resume it explicitly, like every other audio
      // path in the app does. This is why the issue was intermittent and only
      // cleared up after switching browsers (fresh autoplay/activation state).
      if (audioContext.state === "suspended") {
        try { await audioContext.resume(); } catch { /* ignore */ }
      }

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

      const detectors = createGuitarDetectors(aubio, audioContext.sampleRate);
      pitchDetectorRef.current = detectors.pitch;
      onsetDetectorRef.current = detectors.onset;
      tickDetectorRef.current = detectors.tick;

      // AudioWorklet: accumulates 128-sample quanta → 2048-sample buffers on main thread.
      // Avoids deprecated ScriptProcessorNode and runs audio collection off the main thread.
      const blob = new Blob([WORKLET_CODE], { type: "application/javascript" });
      const workletUrl = URL.createObjectURL(blob);
      await audioContext.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      const workletNode = new AudioWorkletNode(audioContext, "guitar-input-processor");
      workletNodeRef.current = workletNode;

      const process = createGuitarBufferProcessor({
        detectors,
        getGain: () => inputGainRef.current,
        analyser: analyserNodeRef, // chromagram-at-onset snapshots (web path)
        targets: {
          frequencyRef, volumeRef, rawVolumeRef, confidenceRef,
          lastOnsetTimeRef, lastTickTimeRef, onsetChromaRef,
        },
        onActive: () => {
          setState(prev =>
            prev.isListening === true && prev.error === null
              ? prev
              : { ...prev, isListening: true, error: null }
          );
        },
      });

      workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
        process(event.data);
      };

      source.connect(workletNode);
      // Route through a silent gain node to keep the audio graph active
      // without feeding the microphone signal back to the speakers.
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      workletNode.connect(silentGain);
      silentGain.connect(audioContext.destination);

      // Safety net: the context can be re-suspended mid-session (tab backgrounded,
      // OS audio-device switch, autoplay policy) — which silently kills the mic
      // signal until the page is reloaded. Resume it on the next user interaction
      // or when the tab becomes visible again.
      const resumeIfSuspended = () => {
        const ctx = audioContextRef.current;
        if (ctx && ctx.state === "suspended") ctx.resume().catch(() => { /* ignore */ });
      };
      resumeHandlerRef.current = resumeIfSuspended;
      document.addEventListener("pointerdown", resumeIfSuspended);
      document.addEventListener("keydown", resumeIfSuspended);
      document.addEventListener("visibilitychange", resumeIfSuspended);

      setState(prev => ({ ...prev, isListening: true, error: null }));

    } catch (err: any) {
      console.error("Error initializing audio analyzer:", err);
      setState(prev => ({ ...prev, error: err.message || "Microphone access denied" }));
    }
  }, []);

  const close = useCallback(() => {
    if (resumeHandlerRef.current) {
      document.removeEventListener("pointerdown", resumeHandlerRef.current);
      document.removeEventListener("keydown", resumeHandlerRef.current);
      document.removeEventListener("visibilitychange", resumeHandlerRef.current);
      resumeHandlerRef.current = null;
    }
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
    onsetChromaRef.current = null;
    frequencyRef.current = 0;
    volumeRef.current = 0;
    rawVolumeRef.current = 0;
    confidenceRef.current = 0;
    lastOnsetTimeRef.current = 0;
    lastTickTimeRef.current = 0;

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
