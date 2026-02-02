
import { useEffect, useRef, useState, useCallback } from "react";

interface AudioAnalyzerState {
  frequency: number;
  confidence: number;
  volume: number;
  isOnset: boolean;
  isListening: boolean;
  error: string | null;
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

  const init = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        "default",
        2048,
        512,
        audioContext.sampleRate
      );
      pitchDetectorRef.current = pitchDetector;
      const onsetDetector = new (aubio.Onset as any)(
        "default",
        2048,
        512,
        audioContext.sampleRate
      );
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

        // 4. Threshold & Stabilization
        const VOLUME_THRESHOLD = 0.015;
        let stabilizedFreq = 0;

        if (rms > VOLUME_THRESHOLD && frequency > 50) {
          lastFrequenciesRef.current.push(frequency);
          if (lastFrequenciesRef.current.length > 3) {
            lastFrequenciesRef.current.shift();
          }

          // Simple smoothing: average of last 3 frames
          stabilizedFreq = lastFrequenciesRef.current.reduce((a, b) => a + b, 0) / lastFrequenciesRef.current.length;
        } else {
          lastFrequenciesRef.current = [];
        }

        setState(prev => ({
          ...prev,
          frequency: stabilizedFreq,
          volume: volume,
          isOnset: !!isOnset,
          confidence: stabilizedFreq > 0 ? 1 : 0,
          isListening: true,
          error: null
        }));
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

    setState(prev => ({ ...prev, isListening: false, frequency: 0, volume: 0, isOnset: false }));
  }, []);

  useEffect(() => {
    return () => {
      close();
    };
  }, [close]);

  return {
    ...state,
    init,
    close,
  };
};
