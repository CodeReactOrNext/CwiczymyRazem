import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { NativeAudioDevice, NativeAudioStreamInfo } from "types/nativeAudio";
import { createGuitarBufferProcessor, createGuitarDetectors } from "./guitarBufferProcessor";
import type { AudioRefs } from "./useAudioAnalyzer";

// Mirrors useAudioAnalyzer's public contract so PracticeSession is agnostic to
// the input source. The difference: PCM comes from a native low-latency stream
// (ASIO / WASAPI) via the Electron bridge instead of getUserMedia.

const GAIN_STORAGE_KEY = "audio_input_gain"; // shared with the web path
const DEVICE_STORAGE_KEY = "native_audio_device_id";
const DEFAULT_GAIN = 3.0;
const WINDOW_SIZE = 2048; // aubio analysis window — must match createGuitarDetectors

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

function loadPersistedDeviceId(): number | null {
  try {
    const stored = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (stored !== null) {
      const val = parseInt(stored, 10);
      if (!isNaN(val)) return val;
    }
  } catch { /* ignore */ }
  return null;
}

interface NativeAnalyzerState {
  isListening: boolean;
  error: string | null;
  inputGain: number;
  /** Available native input devices (populated on init). */
  devices: NativeAudioDevice[];
  /** Active audio API reported by the driver, e.g. "ASIO". */
  api: string | null;
  /** Negotiated stream info incl. measured capture latency. */
  streamInfo: NativeAudioStreamInfo | null;
}

export const useNativeAudioAnalyzer = () => {
  const [state, setState] = useState<NativeAnalyzerState>({
    isListening: false,
    error: null,
    inputGain: loadPersistedGain(),
    devices: [],
    api: null,
    streamInfo: null,
  });

  const inputGainRef = useRef<number>(loadPersistedGain());
  const selectedDeviceIdRef = useRef<number | null>(loadPersistedDeviceId());
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Realtime refs (same shape the rest of the app consumes)
  const frequencyRef = useRef<number>(0);
  const volumeRef = useRef<number>(0);
  const rawVolumeRef = useRef<number>(0);
  const confidenceRef = useRef<number>(0);
  const lastOnsetTimeRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(0);
  const onsetChromaRef = useRef<Float32Array | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null); // always null here (no Web Audio graph)

  // Accumulator: native blocks (e.g. 256 frames) → 2048-sample analysis windows
  const windowBufRef = useRef<Float32Array>(new Float32Array(WINDOW_SIZE));
  const windowPosRef = useRef<number>(0);
  const streamInfoRef = useRef<NativeAudioStreamInfo | null>(null);

  const init = useCallback(async () => {
    const native = window.nativeAudio;
    if (!native) {
      setState(prev => ({ ...prev, error: "Native audio bridge unavailable" }));
      return;
    }

    try {
      const { api, devices } = await native.listDevices();
      const inputDevices = devices.filter(d => d.inputChannels > 0);

      // Pick: persisted choice → default input → first available input device.
      // Re-read storage so a device picked elsewhere (e.g. the amp panel) applies.
      const persisted = loadPersistedDeviceId() ?? selectedDeviceIdRef.current;
      const chosen =
        inputDevices.find(d => d.id === persisted) ||
        inputDevices.find(d => d.isDefaultInput) ||
        inputDevices[0];

      if (!chosen) {
        setState(prev => ({ ...prev, api, devices: inputDevices, error: "No input devices found" }));
        return;
      }
      selectedDeviceIdRef.current = chosen.id;

      // aubio detectors at the device sample rate.
      // @ts-ignore — aubiojs has no types
      const AubioModule = await import("aubiojs");
      const Aubio = AubioModule.default || AubioModule;
      const aubio = await Aubio();
      const sampleRate = chosen.preferredSampleRate || 48000;
      const detectors = createGuitarDetectors(aubio, sampleRate);

      const process = createGuitarBufferProcessor({
        detectors,
        getGain: () => inputGainRef.current,
        analyser: null, // no AnalyserNode in the native path → no chroma snapshots
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

      // Reset accumulator
      windowBufRef.current = new Float32Array(WINDOW_SIZE);
      windowPosRef.current = 0;

      // Subscribe to PCM blocks: reinterpret raw bytes as FLOAT32, fill 2048
      // windows, then run the shared DSP on each full window.
      unsubscribeRef.current = native.onFrame((bytes: Uint8Array) => {
        // Reinterpret raw bytes as FLOAT32. Float32Array requires a 4-byte
        // aligned offset; IPC buffers usually are, but copy if not.
        let samples: Float32Array;
        if (bytes.byteOffset % 4 === 0) {
          samples = new Float32Array(bytes.buffer as ArrayBuffer, bytes.byteOffset, Math.floor(bytes.byteLength / 4));
        } else {
          const copy = new Uint8Array(bytes.byteLength);
          copy.set(bytes);
          samples = new Float32Array(copy.buffer, 0, Math.floor(copy.byteLength / 4));
        }
        const win = windowBufRef.current;
        let pos = windowPosRef.current;
        for (let i = 0; i < samples.length; i++) {
          win[pos++] = samples[i];
          if (pos === WINDOW_SIZE) {
            process(win);
            pos = 0;
          }
        }
        windowPosRef.current = pos;
      });

      // Open the low-latency stream. Small frameSize → minimal capture latency.
      const info = await native.start({
        deviceId: chosen.id,
        channel: 0,
        sampleRate,
        frameSize: 256,
      });
      streamInfoRef.current = info;

      setState(prev => ({
        ...prev,
        isListening: true,
        error: null,
        devices: inputDevices,
        api,
        streamInfo: info,
      }));
    } catch (err: any) {
      console.error("Error initializing native audio analyzer:", err);
      setState(prev => ({ ...prev, error: err?.message || "Native audio init failed" }));
    }
  }, []);

  const close = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    window.nativeAudio?.stop().catch(() => { /* ignore */ });

    windowPosRef.current = 0;
    streamInfoRef.current = null;
    frequencyRef.current = 0;
    volumeRef.current = 0;
    rawVolumeRef.current = 0;
    confidenceRef.current = 0;
    lastOnsetTimeRef.current = 0;
    lastTickTimeRef.current = 0;
    onsetChromaRef.current = null;

    setState(prev => ({ ...prev, isListening: false, streamInfo: null }));
  }, []);

  useEffect(() => {
    return () => { close(); };
  }, [close]);

  const setInputGain = useCallback((value: number) => {
    const clamped = Math.max(0.5, Math.min(10.0, value));
    inputGainRef.current = clamped;
    try {
      localStorage.setItem(GAIN_STORAGE_KEY, String(clamped));
    } catch { /* ignore */ }
    setState(prev => ({ ...prev, inputGain: clamped }));
  }, []);

  /** Switch the active input device (e.g. user picks their interface/channel).
   *  Restarts the stream if currently listening. */
  const selectDevice = useCallback(async (deviceId: number) => {
    selectedDeviceIdRef.current = deviceId;
    try { localStorage.setItem(DEVICE_STORAGE_KEY, String(deviceId)); } catch { /* ignore */ }
    if (state.isListening) {
      close();
      await init();
    }
  }, [state.isListening, close, init]);

  const getLatencyMs = useCallback(() => {
    const info = streamInfoRef.current;
    const sr = info?.sampleRate || 48000;
    const captureMs = info?.latencyMs ?? 0;     // hardware → app (ASIO ≈ few ms)
    const windowMs = (WINDOW_SIZE / sr) * 1000; // DSP analysis window
    return captureMs + windowMs;
  }, []);

  const audioRefs: AudioRefs = {
    frequencyRef, volumeRef, rawVolumeRef, lastOnsetTimeRef,
    lastTickTimeRef, confidenceRef, analyserRef, onsetChromaRef,
  };

  return useMemo(() => ({
    ...state,
    init,
    close,
    audioRefs,
    getLatencyMs,
    setInputGain,
    selectDevice,
  }), [state, init, close, audioRefs, getLatencyMs, setInputGain, selectDevice]);
};
