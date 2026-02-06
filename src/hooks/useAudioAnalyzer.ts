
import { useEffect, useRef, useState, useCallback } from "react";

interface AudioAnalyzerState {
  frequency: number;
  confidence: number;
  volume: number;
  isOnset: boolean;
  isListening: boolean;
  error: string | null;
}

export interface AudioRefs {
  frequencyRef: React.MutableRefObject<number>;
  volumeRef: React.MutableRefObject<number>;
  lastOnsetTimeRef: React.MutableRefObject<number>;
  confidenceRef: React.MutableRefObject<number>;
}

export const useAudioAnalyzer = () => {
  const [state, setState] = useState<AudioAnalyzerState>({
    frequency: 0,
    confidence: 0,
    volume: 0,
    isOnset: false,
    isListening: false,
    error: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const pitchDetectorRef = useRef<any>(null);
  const onsetDetectorRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastFrequenciesRef = useRef<number[]>([]);

  // Real-time refs for fast access without triggering re-renders
  const frequencyRef = useRef<number>(0);
  const volumeRef = useRef<number>(0);
  const confidenceRef = useRef<number>(0);
  const lastOnsetTimeRef = useRef<number>(0);
  const lastStateUpdateRef = useRef<number>(0);
  const prevVolumeRef = useRef<number>(0);

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

      // ScriptProcessor is deprecated but still widely supported for this use case.
      // Ideally we would use AudioWorklet but for simplicity and aubiojs compatibility we use ScriptProcessor.
      const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      // @ts-ignore
      const AubioModule = await import("aubiojs");
      const Aubio = AubioModule.default || AubioModule;
      const aubio = await Aubio();
      const pitchDetector = new aubio.Pitch(
        "yinfft",
        2048,
        512,
        audioContext.sampleRate
      );
      (pitchDetector as any).setTolerance(0.7);
      pitchDetectorRef.current = pitchDetector;
      const onsetDetector = new (aubio.Onset as any)(
        "hfc",
        2048,
        512,
        audioContext.sampleRate
      );
      onsetDetector.setThreshold(0.3);
      onsetDetectorRef.current = onsetDetector;

      scriptProcessor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer.getChannelData(0);

        // 1. Calculate Volume (RMS)
        let sum = 0;
        for (let i = 0; i < inputBuffer.length; i++) {
          sum += inputBuffer[i] * inputBuffer[i];
        }
        const rms = Math.sqrt(sum / inputBuffer.length);
        const volume = Math.max(0, Math.min(1, rms * 10)); // Scale to 0-1 range

        // 2. Detect Onset (Attack)
        const isOnset = onsetDetector.do(inputBuffer);

        // 3. Detect Pitch
        const frequency = pitchDetector.do(inputBuffer);
        const pitchConfidence = (pitchDetector as any).getConfidence();

        // 4. Threshold & Stabilization
        const VOLUME_THRESHOLD = 0.008;
        let stabilizedFreq = 0;

        if (rms > VOLUME_THRESHOLD && frequency > 50 && pitchConfidence > 0.5) {
          lastFrequenciesRef.current.push(frequency);
          if (lastFrequenciesRef.current.length > 5) {
            lastFrequenciesRef.current.shift();
          }

          // Median filter: rejects outlier spikes while preserving true pitch
          const sorted = [...lastFrequenciesRef.current].sort((a, b) => a - b);
          stabilizedFreq = sorted[Math.floor(sorted.length / 2)];
        } else {
          lastFrequenciesRef.current = [];
        }

        // Update refs immediately for real-time access
        frequencyRef.current = stabilizedFreq;
        volumeRef.current = volume;
        confidenceRef.current = stabilizedFreq > 0 ? pitchConfidence : 0;

        // Track onset timestamps — combine aubio onset with volume-delta detection
        const volumeDelta = volume - prevVolumeRef.current;
        prevVolumeRef.current = volume;
        const isSoftOnset = volumeDelta > 0.025 && volume > 0.025;

        if (isOnset || isSoftOnset) {
          lastOnsetTimeRef.current = Date.now();
        }

        // Throttle React state updates to ~10Hz (every ~100ms)
        const now = Date.now();
        if (now - lastStateUpdateRef.current >= 100) {
          lastStateUpdateRef.current = now;
          setState(prev => ({
            ...prev,
            frequency: stabilizedFreq,
            volume: volume,
            isOnset: !!isOnset,
            confidence: stabilizedFreq > 0 ? pitchConfidence : 0,
            isListening: true,
            error: null
          }));
        }
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

      setState(prev => ({ ...prev, isListening: true, error: null }));

    } catch (err: any) {
      console.error("Error initializing audio analyzer:", err);
      setState(prev => ({ ...prev, error: err.message || "Microphone access denied" }));
    }
  }, []);

  const close = useCallback(() => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current.onaudioprocess = null;
      scriptProcessorRef.current = null;
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

    // We don't necessarily destroy the pitchDetector instance as it's just a WASM wrapper,
    // but we lose the reference.
    pitchDetectorRef.current = null;
    onsetDetectorRef.current = null;
    lastFrequenciesRef.current = [];
    frequencyRef.current = 0;
    volumeRef.current = 0;
    confidenceRef.current = 0;
    lastOnsetTimeRef.current = 0;

    setState(prev => ({ ...prev, isListening: false, frequency: 0, volume: 0, isOnset: false }));
  }, []);

  useEffect(() => {
    return () => {
      close();
    };
  }, [close]);

  const getLatencyMs = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return 120;
    const bufferLatency = (2048 / ctx.sampleRate) * 1000; // ~46ms at 44100Hz
    const baseLatency = ((ctx as any).baseLatency || 0) * 1000;
    const outputLatency = ((ctx as any).outputLatency || 0) * 1000;
    return baseLatency + outputLatency + bufferLatency + 30; // +30ms for processing overhead
  }, []);

  const audioRefs: AudioRefs = { frequencyRef, volumeRef, lastOnsetTimeRef, confidenceRef };

  return {
    ...state,
    init,
    close,
    audioRefs,
    getLatencyMs,
  };
};
